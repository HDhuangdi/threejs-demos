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
