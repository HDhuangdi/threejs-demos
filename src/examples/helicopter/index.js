import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import config from "@/config";
import { loadObj, rotateByPivot } from "../helpers";

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
    this.initEvent();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.clock = new THREE.Clock();
    this.maxMovingAngle = Math.PI / 6;
    this.rotateInfo = {
      x: 0,

      y: 0,

      z: 0,
    };
    this.lastFrameRotateInfo = {
      x: 0,
      y: 0,
      z: 0,
    };
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
    this.camera.position.set(0, 30, -0);
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
    TWEEN.update();
    if (this.propeller) {
      rotateByPivot(
        new THREE.Vector3(0, 0, -0.7),
        "y",
        Math.PI / 30,
        this.propeller
      );
    }
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.axesHelper);
  }

  async initObject() {
    this.helicopter = new THREE.Group();
    let obj = await loadObj(config.baseUrl + "/helicopter.obj");
    obj.children.splice(3, 1);
    const geos = obj.children.map((mesh) => mesh.geometry);
    geos.forEach((geo) => {
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.1,
        linewidth: 1,
      });
      const mesh = new THREE.Line(geo, material);
      this.helicopter.add(mesh);
    });
    // 螺旋桨
    let [propeller] = this.helicopter.children.splice(1, 1);

    let propeller2 = propeller.clone();
    rotateByPivot(new THREE.Vector3(0, 0, -0.7), "y", -Math.PI / 2, propeller);
    this.propeller = new THREE.Group();
    this.propeller.add(propeller);
    this.propeller.add(propeller2);

    this.helicopter.add(this.propeller);
    this.helicopter.position.set(0, 0, 0);
    this.scene.add(this.helicopter);
  }

  initEvent() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        this.moveForward();
      }
    });
    window.addEventListener("keyup", () => {
      this.tween.stop();
    });
  }

  moveForward() {
    this.tween = new TWEEN.Tween(this.rotateInfo)
      .to(
        {
          ...this.rotateInfo,
          x: this.rotateInfo.x + this.maxMovingAngle,
        },
        2000
      )
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        this.helicopter.rotateX(this.rotateInfo.x - this.lastFrameRotateInfo.x);
        this.lastFrameRotateInfo.x = this.rotateInfo.x;
      })
      .start();
  }
}
