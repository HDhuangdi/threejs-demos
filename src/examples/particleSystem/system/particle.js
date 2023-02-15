import * as THREE from "three";
import * as utils from "./utils";

export default class Particle {
  constructor(emitter) {
    this.emitter = emitter;
    this.tikTok = 0;
    this.delayCounter = 0;

    this.initParams();
  }

  initParams() {
    this.position = utils.randomVector3(...this.emitter.positionRange);
    this.originPosition = this.position.clone();

    this.speed = utils.randomNum(...this.emitter.speedRange);

    const phi = utils.randomNum(...this.emitter.directionRange[0]);
    const theta = utils.randomNum(...this.emitter.directionRange[1]);
    const spherical = new THREE.Spherical(1, phi, theta);
    this.direction = new THREE.Vector3().setFromSpherical(spherical);
    this.ray = new THREE.Ray(this.position.clone(), this.direction);

    this.delay = utils.randomNum(0, this.emitter.particleDeathAge);
    this.visible = false;

    this.originOpacity = this.emitter.opacityTween
      ? null
      : utils.randomNum(...this.emitter.opacityRange);
    this.opacity = 0;
    this.size = this.emitter.sizeTween
      ? null
      : utils.randomNum(...this.emitter.sizeRange);
    this.color = this.emitter.colorTween
      ? null
      : utils.randomVector3(
          ...this.emitter.colorRange,
          [0, Math.PI / 2],
          [0, Math.PI / 2]
        );
  }

  checkVisible(delta) {
    if (this.delayCounter <= this.delay) {
      this.tikTok = 0;
      this.delayCounter += delta;
      this.visible = false;
    } else if (!this.visible) {
      this.visible = true;
    }
  }

  recycle() {
    this.tikTok = 0;
    this.position = this.originPosition.clone();
  }

  move(delta) {
    if (this.tikTok > this.emitter.particleDeathAge) {
      this.recycle();
    }
    this.tikTok += delta;
    this.checkVisible(delta);

    if (this.emitter.opacityTween) {
      this.originOpacity = this.emitter.opacityTween.smoothstep(this.tikTok);
    }
    this.opacity = this.visible ? this.originOpacity : 0;
    if (this.emitter.sizeTween) {
      this.size = this.emitter.sizeTween.smoothstep(this.tikTok);
    }
    if (this.emitter.colorTween) {
      this.color = this.emitter.colorTween.smoothstep(this.tikTok);
    }

    const dist = this.tikTok * this.speed;
    this.ray.at(dist, this.position);
  }
}
