import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";

export function loadImg(src) {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.src = src;
    img.onload = () => {
      resolve(img);
    };
  });
}

export function loadObj(src) {
  return new Promise((resolve) => {
    const loader = new OBJLoader();
    loader.load(src, (obj) => {
      resolve(obj);
    });
  });
}

export function getRandomNum(min, max) {
  return min + Math.random() * (max - min);
}

export function getRandomColor() {
  var hex = Math.floor(Math.random() * 16777216).toString(16); //生成ffffff以内16进制数
  while (hex.length < 6) {
    //while循环判断hex位数，少于6位前面加0凑够6位
    hex = "0" + hex;
  }
  return "#" + hex; //返回‘#'开头16进制颜色
}

export function rotateByPivot(vector3, axis, angle, obj) {
  const mat = new THREE.Matrix4();
  const mat2 = new THREE.Matrix4();
  const mat3 = new THREE.Matrix4();

  mat.makeTranslation(vector3.x, vector3.y, vector3.z);
  switch (axis) {
    case "x":
      mat2.makeRotationX(angle);
      break;
    case "y":
      mat2.makeRotationY(angle);
      break;
    case "z":
      mat2.makeRotationZ(angle);
      break;
    default:
      return obj;
  }
  mat3.makeTranslation(-vector3.x, -vector3.y, -vector3.z);

  obj.applyMatrix4(mat.multiply(mat2).multiply(mat3));
  return obj;
}

export const initAttribBuffer = (gl, mode, array, location, size) => {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, array, mode);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(location);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return buffer;
};

export const initIndexBuffer = (gl, array) => {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
  return indexBuffer;
};

export const loadShader = (gl, type, source) => {
  const shader = gl.createShader(type);
 
  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
      var error = gl.getShaderInfoLog(shader);
      console.error("Failed to compile shader: " + error);
      gl.deleteShader(shader);
      return null;
  }

  return shader;
};

export const initProgram = (gl, vshader, fshader) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
      const error = gl.getProgramInfoLog(program);
      console.error("Failed to link program: " + error);
      gl.deleteProgram(program);
      gl.deleteShader(fragShader);
      gl.deleteShader(vertexShader);
      return null;
  }

  gl.useProgram(program);

  return program;
};
