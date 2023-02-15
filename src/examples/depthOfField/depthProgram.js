import * as THREE from "three";
import { initAttribBuffer, initIndexBuffer, initProgram } from "../helpers";
import Program from "./program";
import { mat4 } from "gl-matrix";

const vs = `
attribute vec3 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

varying vec4 pos;
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  pos = gl_Position;
}
`;
const fs = `
precision mediump float;
varying vec4 pos;
void main() {
  // const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
  // const vec4 bitMask = vec4(1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0, 0.0);
  // vec4 rgbaDepth = fract(pow(gl_FragCoord.z, 3005.0) * bitShift);
  float depth = pow(gl_FragCoord.z, 3005.0);
  gl_FragColor = vec4(vec3(depth), 1.0); 
}
`;

export default class DepthProgram extends Program {
  constructor(gl, sceneWidth, sceneHeight, textureWidth, textureHeight) {
    super(gl, sceneWidth, sceneHeight, textureWidth, textureHeight);
  }

  render() {
    this.program = initProgram(this.gl, vs, fs);
    this.getLocations();
    this.draw()
  }
}
