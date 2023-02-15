import * as THREE from "three";
import Tween from "../tween";
import Emitter from "../emitter";

export default class Snow extends Emitter {
  constructor(center) {
    super({
      particlesPerSecond: 50,
      particleDeathAge: 5,
      positionRange: [
        new THREE.Vector3(0, 0, 0).add(center || new THREE.Vector3(0, 0, 0)), 
        150,
        [Math.PI / 2, Math.PI / 2], // phi 绕x轴角度
        [0, Math.PI * 2] // phi 绕y轴角度
      ],
      directionRange: [
        [Math.PI - Math.PI / 10, Math.PI + Math.PI / 10], // phi 绕x轴角度
        [-Math.PI / 10, Math.PI / 10], // phi 绕y轴角度
      ],
      speedRange: [20, 30],
      sizeRange: [10, 20],
      colorRange: [new THREE.Vector3(1, 1, 1), 0],
      opacityTween: new Tween([0, 5], [1, 0]),
      blendMode: THREE.NormalBlending,
      texture: new THREE.TextureLoader().load(require('../../images/snowflake.png'))
    });
  }
}
