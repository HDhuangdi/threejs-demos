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
