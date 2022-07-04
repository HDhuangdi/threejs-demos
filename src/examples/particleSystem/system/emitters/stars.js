import * as THREE from "three";
import Emitter from "../emitter";

export default class Stars extends Emitter {
  constructor(center) {
    super({
      particlesPerSecond: 100,
      particleDeathAge: 3,
      positionRange: [
        new THREE.Vector3(0, 0, 0).add(center || new THREE.Vector3(0, 0, 0)),
        20,
        [Math.PI / 2, Math.PI / 2], // phi 绕x轴角度
        [0, Math.PI * 2], // phi 绕y轴角度
      ],
      directionRange: [
        [-Math.PI / 10, Math.PI / 10], // phi 绕x轴角度
        [0, Math.PI * 2], // phi 绕y轴角度
      ],
      speedRange: [5, 150],
      sizeRange: [20, 70],
      colorRange: [new THREE.Vector3(0, 0, 0), 1],
      opacityRange: [0.5, 1],
      blendMode: THREE.AdditiveBlending,
      texture: new THREE.TextureLoader().load(
        require("../../images/spikey.png")
      ),
    });
  }
}
