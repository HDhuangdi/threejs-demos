import * as THREE from "three";

export default class Tween {
  constructor(times, values) {
    this.times = times || [];
    this.values = values || [];

  }

  smoothstep(tikTok) {
    if (!this.times.length || !this.values.length) return;
    if (tikTok > this.times[this.times.length - 1]) {
      return this.values[this.values.length - 1];
    }

    let index = 0;
    while (tikTok > this.times[index]) {
      index++;
    }
    if (index === 0) return this.values[0];
    if (index === this.times.length) return this.values[this.values.length - 1];

    const prevValue = this.values[index - 1];
    const nextValue = this.values[index];
    const deltaValue = nextValue - prevValue;
    const ratio =
      (tikTok - this.times[index - 1]) /
      (this.times[index] - this.times[index - 1]);

    if (prevValue instanceof THREE.Vector3) {
      return prevValue.clone().lerp(nextValue, ratio);
    } else {
      return prevValue + deltaValue * ratio;
    }
  }
}
