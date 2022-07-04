import * as THREE from "three";
import Tween from "../tween";
import Emitter from "../emitter";

export default class Snow extends Emitter {
  constructor(center) {
    super({
      particlesPerSecond: 10,
      particleDeathAge: 6,
      positionRange: [
        new THREE.Vector3(0, 0, 0).add(center || new THREE.Vector3(0, 0, 0)), 
        150,
        [0, Math.PI * 2], // phi 绕x轴角度
        [0, Math.PI * 2] // phi 绕y轴角度
      ],
      directionRange: [
        [0, Math.PI * 2], // phi 绕x轴角度
        [0, Math.PI * 2], // phi 绕y轴角度
      ],
      speedRange: [5, 5],
      sizeRange: [20, 50],
      colorRange: [new THREE.Vector3(0.30, 1.0, 0.6), 1],
      opacityTween: new Tween([0, 1, 2, 4, 6],[0, 1, 0.2, 1, 0]),
      blendMode: THREE.NormalBlending,
      texture: new THREE.TextureLoader().load(require('../../images/spark.png'))
    });
  }
}
