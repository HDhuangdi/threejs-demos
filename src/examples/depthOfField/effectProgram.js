import * as THREE from "three";
import { initAttribBuffer, initIndexBuffer, initProgram } from "../helpers";
import Program from "./program";
import { mat4 } from "gl-matrix";

const vs = `
attribute vec3 position;

varying vec4 vPosition;
varying vec2 vUv;

void main() {
  gl_Position = vec4(position, 1.0);
  vPosition = vec4(position, 1.0);
  vUv = vec2((position.x + 1.0) / 2.0, (position.y + 1.0) / 2.0);
}
`;
const fs = `
precision mediump float;

uniform sampler2D depthTexture;
uniform sampler2D sceneTexture;
uniform float sceneWidth;
uniform float sceneHeight;

varying vec4 vPosition;
varying vec2 vUv;

const float radius = 10.0;

vec4 getBlurColor (vec2 pos, sampler2D texture, float textureWidth, float textureHeight) {
  vec4 color = vec4(0); // 初始颜色
  float sum = 0.0; // 总权重
  // 卷积过程
  for (float r = -radius; r <= radius; r++) { // 水平方向
    for (float c = -radius; c <= radius; c++) { // 垂直方向
      vec2 target = pos + vec2(r / textureWidth, c / textureHeight); // 目标像素位置
      float weight = (radius - abs(r)) * (radius - abs(c)); // 计算权重
      color += texture2D(texture, target) * weight; // 累加颜色
      sum += weight; // 累加权重
    }
  }
  color /= sum; // 求出平均值
  return color;
}

float unpackDepth(const in vec4 rgbaDepth) {
  const vec4 bitShift = vec4(1.0, 1.0 / 256.0, 1.0 / (256.0 * 256.0), 1.0 / (256.0 * 256.0 * 256.0));
  float depth = dot(rgbaDepth, bitShift);
  return depth;
}

void main() {
  vec3 depthCoord = (vPosition.xyz / vPosition.w) / 2.0 + 0.5;
  vec4 rgbaDepth = texture2D(depthTexture, depthCoord.xy);
  float depth = rgbaDepth.r;

  float coc = 0.0;
  float focusDepth = 0.1;
  float diff = focusDepth - depth;
  float nearRange = focusDepth - 0.0;
  float farRange = 1.0 - focusDepth;
  
  if (diff < 0.0) {
    // 物体在远焦面
    coc = abs(diff) / farRange;
  } else {
    // 物体在近焦面
    coc = abs(diff) / nearRange;
  }

  vec4 blurColor = getBlurColor(vUv, sceneTexture, sceneWidth, sceneHeight);
  vec4 color = texture2D(sceneTexture, vUv);

  coc = clamp(0.0, 1.0, coc);

  gl_FragColor = mix(color, blurColor, coc);
  // gl_FragColor = color;
  // gl_FragColor = blurColor;
  // gl_FragColor = texture2D(depthTexture, vUv);
}
`;

export default class EffectProgram extends Program {
  constructor(gl, sceneWidth, sceneHeight, textureWidth, textureHeight, sceneFBO, depthFBO) {
    super(gl, sceneWidth, sceneHeight, textureWidth, textureHeight);
    this.sceneFBO = sceneFBO
    this.depthFBO = depthFBO
  }

  initMatrix() {}

  initScene() {
    this.plane = new THREE.PlaneGeometry(2, 2)
  }

  getLocations() {
    this.locations.position = this.gl.getAttribLocation(
      this.program,
      "position"
    );
    this.locations.depthTexture = this.gl.getUniformLocation(
      this.program,
      "depthTexture"
    );
    this.locations.sceneTexture = this.gl.getUniformLocation(
      this.program,
      "sceneTexture"
    );
    this.locations.sceneWidth = this.gl.getUniformLocation(
      this.program,
      "sceneWidth"
    );
    this.locations.sceneHeight = this.gl.getUniformLocation(
      this.program,
      "sceneHeight"
    );
  }

  render() {
    this.program = initProgram(this.gl, vs, fs);
    this.getLocations();
    this.draw()
  }

  draw() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.sceneWidth, this.sceneHeight);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthFBO.texture);
    this.gl.uniform1i(this.locations.depthTexture, 0)

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.sceneFBO.texture);
    this.gl.uniform1i(this.locations.sceneTexture, 1)

    this.gl.uniform1f(this.locations.sceneWidth, this.sceneWidth)
    this.gl.uniform1f(this.locations.sceneHeight, this.sceneHeight)
    initAttribBuffer(
      this.gl,
      this.gl.STATIC_DRAW,
      this.plane.attributes.position.array,
      this.locations.position,
      3
    );
    initIndexBuffer(this.gl, new Uint8Array(this.plane.index.array));
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.plane.index.array.length,
      this.gl.UNSIGNED_BYTE,
      0
    );
  }
}