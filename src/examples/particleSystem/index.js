import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import FireFly from "./system/emitters/firefly";
import Snow from "./system/emitters/snow";
import Flame from "./system/emitters/flame";
import Stars from "./system/emitters/stars";

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.initScene();
    this.initCamera();
    this.initLight();
    this.initRenderer();
    this.initObject();
    this.initDevHelpers();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.clock = new THREE.Clock();
    this.render();
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);
    document
      .getElementById("webgl-container")
      .appendChild(this.renderer.domElement);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      SCENE_WIDTH / SCENE_HEIGHT,
      0.1,
      10000
    );
    this.camera.position.set(400, 400, 400);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff, 0.8); // white light
    this.light.position.set(100, 100, 100);
    this.scene.add(this.light);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.axesHelper);
  }

  initObject() {
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

    this.scene.add(this.stars.mesh);
    this.scene.add(this.flame.mesh);
    this.scene.add(this.snow.mesh);
    this.scene.add(this.firefly.mesh);
    this.stars.fire();
    this.flame.fire();
    this.snow.fire();
    this.firefly.fire();
  }
}
