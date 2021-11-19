import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

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
