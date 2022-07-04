import * as THREE from "three";
import Tween from "../tween";
import Emitter from "../emitter";

export default class Flame extends Emitter {
  constructor(center) {
    super({
      particlesPerSecond: 100,
      particleDeathAge: 4,
      positionRange: [
        new THREE.Vector3(0, 0, 0).add(center || new THREE.Vector3(0, 0, 0)),
        0,
        [Math.PI / 2, Math.PI / 2], // phi 绕x轴角度
        [0, Math.PI * 2] // phi 绕y轴角度
      ],
      directionRange: [
        [-Math.PI / 10, Math.PI / 10], // phi 绕x轴角度
        [0, Math.PI * 2], // phi 绕y轴角度
      ],
      speedRange: [20, 70],
      sizeTween: new Tween([0, 1, 2], [80, 150, 0]),
      colorTween: new Tween(
        [0, 1.8, 2],
        [new THREE.Vector3(0.58, 0.376, 0),  new THREE.Vector3(1, 0, 0), new THREE.Vector3(0.458, 0.392, 0)]
      ),
      opacityTween: new Tween([0, 2], [1, 0]),
      blendMode: THREE.AdditiveBlending,
      texture: new THREE.TextureLoader().load(
        require("../../images/smoke.png")
      ),
    });
  }
}
