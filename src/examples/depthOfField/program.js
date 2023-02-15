import * as THREE from "three";
import { initAttribBuffer, initIndexBuffer, initProgram } from "../helpers";
import { mat4, vec4 } from "gl-matrix";

export default class Program {
  constructor(gl, sceneWidth, sceneHeight, textureWidth, textureHeight) {
    this.gl = gl;
    this.sceneWidth = sceneWidth;
    this.sceneHeight = sceneHeight;
    this.textureWidth = textureWidth;
    this.textureHeight = textureHeight;
    this.locations = {};

    this.fbo = this.initFramebuffer();

    this.initScene();
    this.initMatrix();
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
      this.textureWidth,
      this.textureHeight,
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
      this.textureWidth,
      this.textureHeight
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

  getLocations() {
    this.locations.position = this.gl.getAttribLocation(
      this.program,
      "position"
    );
    this.locations.normal = this.gl.getAttribLocation(this.program, "normal");
    this.locations.projectionMatrix = this.gl.getUniformLocation(
      this.program,
      "projectionMatrix"
    );
    this.locations.viewMatrix = this.gl.getUniformLocation(
      this.program,
      "viewMatrix"
    );
    this.locations.modelMatrix = this.gl.getUniformLocation(
      this.program,
      "modelMatrix"
    );
    this.locations.normalMatrix = this.gl.getUniformLocation(
      this.program,
      "normalMatrix"
    );
  }

  initMatrix() {
    if (!this.projectionMatrix) {
      this.projectionMatrix = mat4.perspective(
        [],
        45,
        this.sceneWidth / this.sceneHeight,
        0.1,
        2000
      );
    }
    if (!this.viewMatrix) {
      const cameraPosition = [300, 100, 100];
      const lookAt = [0, 0, 0];
      this.viewMatrix = mat4.lookAt([], cameraPosition, lookAt, [0, 1, 0]);
    }
  }

  initScene() {
    if (!this.box1) {
      let modelMatrix1 = mat4.translate([], mat4.create(), [170, 0, 0]);
      this.box1 = new THREE.BoxGeometry(50, 50, 50);
      this.box1.modelMatrix = modelMatrix1;
      const invertModel = mat4.invert([], modelMatrix1);
      this.box1.normalMatrix = mat4.transpose([], invertModel);
    }

    if (!this.box2) {
      let modelMatrix2 = mat4.translate([], mat4.create(), [-1550, 0, 0]);
      this.box2 = new THREE.BoxGeometry(100, 200, 100);
      this.box2.modelMatrix = modelMatrix2;
      const invertModel = mat4.invert([], modelMatrix2);
      this.box2.normalMatrix = mat4.transpose([], invertModel);
    }
  }

  draw() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.viewport(0, 0, this.textureWidth, this.textureHeight);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    mat4.rotateX(this.box1.modelMatrix, this.box1.modelMatrix, Math.PI / 300)
    let invertModel = mat4.invert([], this.box1.modelMatrix);
    this.box1.normalMatrix = mat4.transpose([], invertModel);
    mat4.rotateX(this.box2.modelMatrix, this.box2.modelMatrix, -Math.PI / 300)
    invertModel = mat4.invert([], this.box2.modelMatrix);
    this.box2.normalMatrix = mat4.transpose([], invertModel);
    this.gl.uniformMatrix4fv(
      this.locations.projectionMatrix,
      false,
      this.projectionMatrix
    );
    this.gl.uniformMatrix4fv(this.locations.viewMatrix, false, this.viewMatrix);
    this.gl.uniformMatrix4fv(
      this.locations.modelMatrix,
      false,
      this.box1.modelMatrix
    );
    if (this.locations.normalMatrix) {
      this.gl.uniformMatrix4fv(
        this.locations.normalMatrix,
        false,
        this.box1.normalMatrix
      );
    }
    if (this.locations.normal !== -1) {
      initAttribBuffer(
        this.gl,
        this.gl.STATIC_DRAW,
        this.box1.attributes.normal.array,
        this.locations.normal,
        3
      );
    }

    initAttribBuffer(
      this.gl,
      this.gl.STATIC_DRAW,
      this.box1.attributes.position.array,
      this.locations.position,
      3
    );
    initIndexBuffer(this.gl, new Uint8Array(this.box1.index.array));
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.box1.index.array.length,
      this.gl.UNSIGNED_BYTE,
      0
    );
    this.gl.uniformMatrix4fv(
      this.locations.modelMatrix,
      false,
      this.box2.modelMatrix
    );
    if (this.locations.normalMatrix) {
      this.gl.uniformMatrix4fv(
        this.locations.normalMatrix,
        false,
        this.box2.normalMatrix
      );
    }
    initAttribBuffer(
      this.gl,
      this.gl.STATIC_DRAW,
      this.box2.attributes.position.array,
      this.locations.position,
      3
    );
    if (this.locations.normal !== -1) {
      initAttribBuffer(
        this.gl,
        this.gl.STATIC_DRAW,
        this.box2.attributes.normal.array,
        this.locations.normal,
        3
      );
    }
    initIndexBuffer(this.gl, new Uint8Array(this.box2.index.array));
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.box2.index.array.length,
      this.gl.UNSIGNED_BYTE,
      0
    );
  }
}
