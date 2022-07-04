import * as THREE from "three";
import Stars from "./emitters/stars";
import Flame from "./emitters/flame";
import Snow from "./emitters/snow";
import FireFly from "./emitters/firefly";

export default class System {
  constructor(params) {
    this.stars = new Stars(new THREE.Vector3(0, 0, 0));
    this.flame = new Flame(new THREE.Vector3(100, 0, 0));
    this.snow = new Snow(new THREE.Vector3(300, 200, 0));
    this.firefly = new FireFly(new THREE.Vector3(0, 200, 300));

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        //	浏览器选项卡可见
        this.stars.play();
        this.flame.play();
        this.snow.play();
        this.firefly.play();
      } else {
        this.stars.pause();
        this.flame.pause();
        this.snow.pause();
        this.firefly.pause();
      }
    });

    params.scene.add(this.stars.mesh);
    params.scene.add(this.flame.mesh);
    params.scene.add(this.snow.mesh);
    params.scene.add(this.firefly.mesh);
    this.stars.fire();
    this.flame.fire();
    this.snow.fire();
    this.firefly.fire();
  }
}
