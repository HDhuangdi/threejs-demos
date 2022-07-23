/**
 * 离屏渲染步骤
 * 1. 创建帧缓冲区对象
 * 2. 创建纹理对象并设置参数
 * 3. 创建渲染缓冲对象并绑定、设置参数
 * 4. 将帧缓冲区对象的颜色关联对象指定为刚刚创建的纹理对象
 * 5. 将帧缓冲区的深度关联对象指定为刚刚创建的渲染缓冲对象
 * 7. 检查帧缓冲区是否正确配置
 * 8. 在帧缓冲区中进行绘制
 * 9. 切换绘制目标为颜色缓冲区
 * 10. 使用纹理对象进行绘图
 */
import { mat4 } from "gl-matrix";
import { initAttribBuffer, initIndexBuffer, initProgram } from "../helpers";

const offscreenVs = `
 attribute vec4 a_Position;
 attribute vec4 a_Color;

 uniform mat4 u_ModelMatrix;
 uniform mat4 u_ViewMatrix;
 uniform mat4 u_ProjMatrix;

 varying vec4 v_Color;
 void main() {
   gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
   v_Color = a_Color;
 }
`;
const offscreenFs = `
 precision mediump float;

 varying vec4 v_Color;
 void main() {
   gl_FragColor = v_Color;
 }
`;

const vs = `
 attribute vec4 a_Position;
 attribute vec2 a_Uv;

 uniform mat4 u_ModelMatrix;
 uniform mat4 u_ViewMatrix;
 uniform mat4 u_ProjMatrix;

 varying vec2 v_Uv;
 varying vec4 v_Pos;
 void main() {
   gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
   v_Uv = a_Uv;
   v_Pos = a_Position;
 }
`;
const fs = `
 precision mediump float;

 uniform sampler2D u_Texture;

 varying vec2 v_Uv;
 varying vec4 v_Pos;
 void main() {
   gl_FragColor = texture2D(u_Texture, v_Uv);
  // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
 }
`;

export default class Offscreen {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.offscreenWidth = 512;
    this.offscreenHeight = 512;
    this.width = width;
    this.height = height;
    this.gl = canvas.getContext("webgl", true);
    this.offscreenLocations = {};
    this.screenLocations = {};

    this.drawOffscreen();
    this.drawScreen();
  }

  drawOffscreen() {
    this.offscrenProgram = initProgram(this.gl, offscreenVs, offscreenFs);
    this.initOffscreenMatrix();
    this.getOffscreenLocation();
    this.bindOffscreenUniformLocation();
    this.bindOffscreenAttribLocation();
    this.fbo = this.initFramebuffer();
    this.drawOffscreenBuffer();
  }

  drawScreen() {
    this.screenProgram = initProgram(this.gl, vs, fs);
    this.initScreenMatrix();
    this.getScreenLocation();
    this.bindScreenUniformLocation();
    this.bindScreenAttribLocation();
    this.drawScreenBuffer();
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
      console.error(status.toString());
      return;
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);

    return framebuffer;
  }

  drawOffscreenBuffer() {
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.viewport(0, 0, this.offscreenWidth, this.offscreenHeight);
    this.gl.clearColor(0.2, 0.2, 0.4, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.osIndices,
      this.gl.UNSIGNED_BYTE,
      0
    );
  }

  drawScreenBuffer() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.width, this.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.fbo.texture);

    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.sIndices,
      this.gl.UNSIGNED_BYTE,
      0
    );
  }

  initOffscreenMatrix() {
    this.osProjMatrix = mat4.create();
    mat4.perspective(
      this.osProjMatrix,
      30,
      this.offscreenWidth / this.offscreenHeight,
      1,
      100
    );

    this.osViewMatrix = mat4.create();
    const eyePos = [7.0, 7.0, 7.0];
    const center = [0, 0, 0];
    mat4.lookAt(this.osViewMatrix, eyePos, center, [0, 1, 0]);

    this.osModelMatrix = mat4.create();
  }

  initScreenMatrix() {
    this.sProjMatrix = mat4.create();
    mat4.perspective(this.sProjMatrix, 30, this.width / this.height, 1, 100);

    this.sViewMatrix = mat4.create();
    const eyePos = [0.0, 0.0, 7.0];
    const center = [0, 0, 0];
    mat4.lookAt(this.sViewMatrix, eyePos, center, [0, 1, 0]);

    this.sModelMatrix = mat4.create();
  }

  getOffscreenLocation() {
    this.offscreenLocations.a_Position = this.gl.getAttribLocation(
      this.offscrenProgram,
      "a_Position"
    );
    this.offscreenLocations.a_Color = this.gl.getAttribLocation(
      this.offscrenProgram,
      "a_Color"
    );
    this.offscreenLocations.u_ModelMatrix = this.gl.getUniformLocation(
      this.offscrenProgram,
      "u_ModelMatrix"
    );
    this.offscreenLocations.u_ViewMatrix = this.gl.getUniformLocation(
      this.offscrenProgram,
      "u_ViewMatrix"
    );
    this.offscreenLocations.u_ProjMatrix = this.gl.getUniformLocation(
      this.offscrenProgram,
      "u_ProjMatrix"
    );
  }

  getScreenLocation() {
    this.screenLocations.a_Position = this.gl.getAttribLocation(
      this.screenProgram,
      "a_Position"
    );
    this.screenLocations.a_Uv = this.gl.getAttribLocation(
      this.screenProgram,
      "a_Uv"
    );
    this.screenLocations.u_ModelMatrix = this.gl.getUniformLocation(
      this.screenProgram,
      "u_ModelMatrix"
    );
    this.screenLocations.u_ViewMatrix = this.gl.getUniformLocation(
      this.screenProgram,
      "u_ViewMatrix"
    );
    this.screenLocations.u_ProjMatrix = this.gl.getUniformLocation(
      this.screenProgram,
      "u_ProjMatrix"
    );
    this.screenLocations.u_Texture = this.gl.getUniformLocation(
      this.screenProgram,
      "u_Texture"
    );
  }

  bindOffscreenUniformLocation() {
    this.gl.uniformMatrix4fv(
      this.offscreenLocations.u_ModelMatrix,
      false,
      this.osModelMatrix
    );
    this.gl.uniformMatrix4fv(
      this.offscreenLocations.u_ViewMatrix,
      false,
      this.osViewMatrix
    );
    this.gl.uniformMatrix4fv(
      this.offscreenLocations.u_ProjMatrix,
      false,
      this.osProjMatrix
    );
  }

  bindScreenUniformLocation() {
    this.gl.uniformMatrix4fv(
      this.screenLocations.u_ModelMatrix,
      false,
      this.sModelMatrix
    );
    this.gl.uniformMatrix4fv(
      this.screenLocations.u_ViewMatrix,
      false,
      this.sViewMatrix
    );
    this.gl.uniformMatrix4fv(
      this.screenLocations.u_ProjMatrix,
      false,
      this.sProjMatrix
    );
    this.gl.uniform1i(this.screenLocations.u_Texture, 0);
  }

  bindOffscreenAttribLocation() {
    const vertices = new Float32Array([
      // Vertex coordinates
      1.0,
      1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      1.0, // v0-v1-v2-v3 front
      1.0,
      1.0,
      1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      -1.0,
      1.0,
      1.0,
      -1.0, // v0-v3-v4-v5 right
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      -1.0,
      -1.0,
      1.0,
      -1.0,
      -1.0,
      1.0,
      1.0, // v0-v5-v6-v1 up
      -1.0,
      1.0,
      1.0,
      -1.0,
      1.0,
      -1.0,
      -1.0,
      -1.0,
      -1.0,
      -1.0,
      -1.0,
      1.0, // v1-v6-v7-v2 left
      -1.0,
      -1.0,
      -1.0,
      1.0,
      -1.0,
      -1.0,
      1.0,
      -1.0,
      1.0,
      -1.0,
      -1.0,
      1.0, // v7-v4-v3-v2 down
      1.0,
      -1.0,
      -1.0,
      -1.0,
      -1.0,
      -1.0,
      -1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
      -1.0, // v4-v7-v6-v5 back
    ]);

    const colors = new Float32Array([
      // Colors
      0.4,
      0.4,
      1.0,
      0.4,
      0.4,
      1.0,
      0.4,
      0.4,
      1.0,
      0.4,
      0.4,
      1.0, // v0-v1-v2-v3 front(blue)
      0.4,
      1.0,
      0.4,
      0.4,
      1.0,
      0.4,
      0.4,
      1.0,
      0.4,
      0.4,
      1.0,
      0.4, // v0-v3-v4-v5 right(green)
      1.0,
      0.4,
      0.4,
      1.0,
      0.4,
      0.4,
      1.0,
      0.4,
      0.4,
      1.0,
      0.4,
      0.4, // v0-v5-v6-v1 up(red)
      1.0,
      1.0,
      0.4,
      1.0,
      1.0,
      0.4,
      1.0,
      1.0,
      0.4,
      1.0,
      1.0,
      0.4, // v1-v6-v7-v2 left
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      1.0, // v7-v4-v3-v2 down
      0.4,
      1.0,
      1.0,
      0.4,
      1.0,
      1.0,
      0.4,
      1.0,
      1.0,
      0.4,
      1.0,
      1.0, // v4-v7-v6-v5 back
    ]);
    const indices = new Uint8Array([
      // Indices of the vertices
      0,
      1,
      2,
      0,
      2,
      3, // front
      4,
      5,
      6,
      4,
      6,
      7, // right
      8,
      9,
      10,
      8,
      10,
      11, // up
      12,
      13,
      14,
      12,
      14,
      15, // left
      16,
      17,
      18,
      16,
      18,
      19, // down
      20,
      21,
      22,
      20,
      22,
      23, // back
    ]);

    initAttribBuffer(
      this.gl,
      this.gl.STATIC_DRAW,
      vertices,
      this.offscreenLocations.a_Position,
      3
    );
    initAttribBuffer(
      this.gl,
      this.gl.STATIC_DRAW,
      colors,
      this.offscreenLocations.a_Color,
      3
    );
    initIndexBuffer(this.gl, indices);
    this.osIndices = indices.length;
  }

  bindScreenAttribLocation() {
    const vertices = new Float32Array([
      2.0,
      2.0,
      0.0,
      -2.0,
      2.0,
      0.0,
      -2.0,
      -2.0,
      0.0,
      2.0,
      -2.0,
      0.0, // v0-v1-v2-v3
    ]);
    const uv = new Float32Array([1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0]);
    const indices = new Uint8Array([0, 1, 2, 0, 2, 3]);

    initAttribBuffer(
      this.gl,
      this.gl.STATIC_DRAW,
      vertices,
      this.screenLocations.a_Position,
      3
    );
    initAttribBuffer(
      this.gl,
      this.gl.STATIC_DRAW,
      uv,
      this.screenLocations.a_Uv,
      2
    );
    initIndexBuffer(this.gl, indices);
    this.sIndices = indices.length;
  }
}
