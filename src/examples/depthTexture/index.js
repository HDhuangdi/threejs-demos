import { mat4 } from "gl-matrix";
import { initAttribBuffer, initIndexBuffer, initProgram } from "../helpers";

const offscreenVs = `
 attribute vec4 a_Position;

 uniform mat4 u_MvpMatrix;

 void main() {
   gl_Position = u_MvpMatrix * a_Position;
 }
`;
const offscreenFs = `
 precision mediump float;

 void main() {
  // const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
  // const vec4 bitMask = vec4(1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0, 0.0);
  // vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);
  // rgbaDepth -= rgbaDepth.gbaa * bitMask;
  gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);
 }
`;

const vs = `
 attribute vec4 a_Position;

 uniform mat4 u_MvpMatrix;
 uniform mat4 u_LightMvpMatrix;
 uniform vec3 u_LightPos;

 varying vec4 v_PosFromLightWorld;
 varying vec3 v_Normal;
 varying vec4 v_Pos;
 varying vec4 v_LightPos;

 void main() {
   gl_Position = u_MvpMatrix * a_Position;
   v_PosFromLightWorld = u_LightMvpMatrix * a_Position;
   v_Normal = vec3(0.0, 1.0, 0.0);
   v_Pos = u_MvpMatrix * a_Position;
   v_LightPos = u_MvpMatrix * vec4(u_LightPos.xyz, 1.0);
 }
`;
const fs = `
 precision mediump float;

 uniform sampler2D u_DepthTexture;
 

 varying vec4 v_PosFromLightWorld;
 varying vec3 v_Normal;
 varying vec4 v_Pos;
 varying vec4 v_LightPos;

 float unpackDepth(const in vec4 rgbaDepth) {
  const vec4 bitShift = vec4(1.0, 1.0 / 256.0, 1.0 / (256.0 * 256.0), 1.0 / (256.0 * 256.0 * 256.0));
  float depth = dot(rgbaDepth, bitShift);
  return depth;
 }

 void main() {
  vec3 shadowCoord = (v_PosFromLightWorld.xyz/v_PosFromLightWorld.w)/2.0 + 0.5;
  vec4 rgbaDepth = texture2D(u_DepthTexture, shadowCoord.xy);
  float depth = rgbaDepth.r;

  vec4 dir = normalize(v_LightPos + v_Pos);
  float cosA = dot(vec4(v_Normal, 1.0), dir);
 
  float factor = (shadowCoord.z > depth + 0.005) ? 0.4 : 1.0;
  if (shadowCoord.x > 1.0 || shadowCoord.x < -1.0 || shadowCoord.y > 1.0 || shadowCoord.y < -1.0 ) { // 处于光的视锥之外
    factor = 1.0;
  }
  gl_FragColor = vec4(1.0 * factor * cosA, 1.0 * factor * cosA, 1.0 * factor * cosA, 1.0);
 }
`;
const LIGHT_X = 0,
  LIGHT_Y = 7,
  LIGHT_Z = 2;

export default class DepthTexture {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.offscreenWidth = 2048;
    this.offscreenHeight = 2048;
    this.width = width;
    this.height = height;
    this.gl = canvas.getContext("webgl", {antialias: true});
    this.offscreenLocations = {};
    this.screenLocations = {};

    this.gl.enable(this.gl.DEPTH_TEST);
    this.fbo = this.initFramebuffer();

    this.rorateMatrix = mat4.rotateY([], mat4.create(), Math.PI / 500);
    this.render();
  }

  render() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.viewport(0, 0, this.offscreenWidth, this.offscreenHeight);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.offscreenProgram = initProgram(this.gl, offscreenVs, offscreenFs);
    this.initOffscreenMatrix();
    this.getOffscreenLocation();

    const osPmvp = this.getOsPlaneMvpMatrix();
    this.gl.uniformMatrix4fv(
      this.offscreenLocations.u_MvpMatrix,
      false,
      osPmvp
    );
    this.drawPlane();

    const osTmvp = this.getOsTriangleMvpMatrix();
    this.gl.uniformMatrix4fv(
      this.offscreenLocations.u_MvpMatrix,
      false,
      osTmvp
    );
    this.drawTriangle();

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.width, this.height);
    this.gl.clearColor(0.2, 0.2, 0.4, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.activeTexture(this.gl.TEXTURE0); // Set a texture object to the texture unit
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.fbo.texture);

    this.screenProgram = initProgram(this.gl, vs, fs);
    this.initScreenMatrix();
    this.getScreenLocation();

    this.gl.uniform1i(this.screenLocations.u_DepthTexture, 0);
    this.gl.uniform3f(this.screenLocations.u_LightPos, LIGHT_X, LIGHT_Y, LIGHT_Z);

    const sPmvp = this.getSPlaneMatrix();
    this.gl.uniformMatrix4fv(this.screenLocations.u_MvpMatrix, false, sPmvp);
    this.gl.uniformMatrix4fv(
      this.screenLocations.u_LightMvpMatrix,
      false,
      osPmvp
    );
    this.drawPlane();
    const sTmvp = this.getSTriangleMatrix();
    this.gl.uniformMatrix4fv(this.screenLocations.u_MvpMatrix, false, sTmvp);
    this.gl.uniformMatrix4fv(
      this.screenLocations.u_LightMvpMatrix,
      false,
      osTmvp
    );
    this.drawTriangle();
    requestAnimationFrame(this.render.bind(this));
  }

  drawTriangle() {
    this.bindTriangleAttribLocations();
    this.draw(this.triangleIndices);
  }

  drawPlane() {
    this.bindPlaneAttribLocations();
    this.draw(this.planeIndices);
  }

  initOffscreenMatrix() {
    this.osProjMatrix = mat4.create();
    mat4.perspective(
      this.osProjMatrix,
      45,
      this.offscreenWidth / this.offscreenHeight,
      0.1,
      100
    );

    this.osViewMatrix = mat4.create();
    const eyePos = [LIGHT_X, LIGHT_Y, LIGHT_Z];
    const center = [0, 0, 0];
    mat4.lookAt(this.osViewMatrix, eyePos, center, [0, 1, 0]);
  }

  initScreenMatrix() {
    this.sProjMatrix = mat4.create();
    mat4.perspective(
      this.sProjMatrix,
      45,
      this.width / this.height,
      0.1,
      100
    );

    this.sViewMatrix = mat4.create();
    const eyePos = [-5, LIGHT_Y + 3, 1];
    const center = [0, 0, 0];
    mat4.lookAt(this.sViewMatrix, eyePos, center, [0, 1, 0]);
  }

  getOffscreenLocation() {
    this.offscreenLocations.a_Position = this.gl.getAttribLocation(
      this.offscreenProgram,
      "a_Position"
    );
    this.offscreenLocations.u_MvpMatrix = this.gl.getUniformLocation(
      this.offscreenProgram,
      "u_MvpMatrix"
    );
  }

  getScreenLocation() {
    this.screenLocations.a_Position = this.gl.getAttribLocation(
      this.screenProgram,
      "a_Position"
    );
    this.screenLocations.u_LightPos = this.gl.getUniformLocation(
      this.screenProgram,
      "u_LightPos"
    );
    this.screenLocations.u_MvpMatrix = this.gl.getUniformLocation(
      this.screenProgram,
      "u_MvpMatrix"
    );
    this.screenLocations.u_LightMvpMatrix = this.gl.getUniformLocation(
      this.screenProgram,
      "u_LightMvpMatrix"
    );
    this.screenLocations.u_DepthTexture = this.gl.getUniformLocation(
      this.screenProgram,
      "u_DepthTexture"
    );
  }

  getOsPlaneMvpMatrix() {
    if (!this.modelMatrix) {
      this.modelMatrix = mat4.create();
    }
    let mvpMatrix = [];
    mat4.multiply(mvpMatrix, this.osProjMatrix, this.osViewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.modelMatrix);
    return mvpMatrix;
  }

  getOsTriangleMvpMatrix() {
    if (!this.tmodelMatrix) {
      this.tmodelMatrix = mat4.create();
    } else {
      mat4.multiply(this.tmodelMatrix, this.tmodelMatrix, this.rorateMatrix);
    }
    let mvpMatrix = [];
    mat4.multiply(mvpMatrix, this.osProjMatrix, this.osViewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.tmodelMatrix);
    return mvpMatrix;
  }

  getSPlaneMatrix() {
    if (!this.modelMatrix) {
      this.modelMatrix = mat4.create();
    }
    let mvpMatrix = [];
    mat4.multiply(mvpMatrix, this.sProjMatrix, this.sViewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.modelMatrix);
    return mvpMatrix;
  }

  getSTriangleMatrix() {
    if (!this.tmodelMatrix) {
      this.tmodelMatrix = mat4.create();
    } else {
      mat4.multiply(this.tmodelMatrix, this.tmodelMatrix, this.rorateMatrix);
    }
    let mvpMatrix = [];
    mat4.multiply(mvpMatrix, this.sProjMatrix, this.sViewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.tmodelMatrix);
    return mvpMatrix;
  }

  bindOffscreenUniformLocation() {}

  bindScreenUniformLocation() {}

  bindTriangleAttribLocations() {
    var vertices = new Float32Array([
      -0.8,
      3.5,
      0.0,
      0.8,
      3.5,
      0.0,
      0.0,
      3.5,
      1.8,
    ]);
    var indices = new Uint8Array([0, 1, 2]);

    initAttribBuffer(
      this.gl,
      this.gl.STATIC_DRAW,
      vertices,
      this.offscreenLocations.a_Position,
      3
    );
    initIndexBuffer(this.gl, indices);
    this.triangleIndices = indices.length;
  }

  bindPlaneAttribLocations() {
    var vertices = new Float32Array([
      3.0,
      -1.7,
      2.5,
      -3.0,
      -1.7,
      2.5,
      -3.0,
      -1.7,
      -2.5,
      3.0,
      -1.7,
      -2.5, // v0-v1-v2-v3
    ]);
    var indices = new Uint8Array([0, 1, 2, 0, 2, 3]);

    initAttribBuffer(
      this.gl,
      this.gl.STATIC_DRAW,
      vertices,
      this.offscreenLocations.a_Position,
      3
    );
    initIndexBuffer(this.gl, indices);
    this.planeIndices = indices.length;
  }

  initFramebuffer() {
    // 帧缓冲区
    const framebuffer = this.gl.createFramebuffer();

    // 纹理对象
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.offscreenWidth,
      this.offscreenHeight,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );
    framebuffer.texture = texture;

    // 渲染缓冲区
    const depthBuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER,
      this.gl.DEPTH_COMPONENT16,
      this.offscreenWidth,
      this.offscreenHeight
    );

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

    // 关联纹理对象
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );
    // 关联渲染缓冲区
    this.gl.framebufferRenderbuffer(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.RENDERBUFFER,
      depthBuffer
    );

    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error(status);
      return;
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);

    return framebuffer;
  }

  draw(counts) {
    this.gl.drawElements(this.gl.TRIANGLES, counts, this.gl.UNSIGNED_BYTE, 0);
  }
}
