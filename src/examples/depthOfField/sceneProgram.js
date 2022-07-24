import * as THREE from "three";
import { initAttribBuffer, initIndexBuffer, initProgram } from "../helpers";
import Program from "./program";
import { mat4 } from "gl-matrix";

const vs = `
attribute vec3 position;
attribute vec3 normal;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;
uniform vec3 lightPos;

varying vec4 vLightDir;
varying vec4 vPos;
varying vec4 vNormal;
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * vec4(normal, 1.0));
  vLightDir = normalize(vec4(lightPos, 1.0));
}
`;
const fs = `
precision mediump float;

varying vec4 vNormal;
varying vec4 vLightDir;
void main() {
  float cosA = max(dot(vLightDir, vNormal), 0.0);
  cosA *= 1.0;
  gl_FragColor = vec4(0.8, 0.8, 0.8, 1.0);
}
`;

export default class SceneProgram extends Program {
  constructor(gl, sceneWidth, sceneHeight, textureWidth, textureHeight) {
    super(gl, sceneWidth, sceneHeight, textureWidth, textureHeight);
  }

  setupSceneLocations() {
    this.locations.lightPos = this.gl.getUniformLocation(
      this.program,
      "lightPos"
    );
    this.gl.uniform3f(this.locations.lightPos, 200, 100, 300);
  }

  render() {
    this.program = initProgram(this.gl, vs, fs);
    this.initScene();
    this.getLocations();
    this.setupSceneLocations();
    this.draw();
  }
}
