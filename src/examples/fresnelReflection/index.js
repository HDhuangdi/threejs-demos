import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { getRandomNum, getRandomColor } from "../helpers";

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.initScene();
    this.initCamera();
    this.initLight();
    this.initRenderer();
    this.initObject();
    // this.initDevHelpers();
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
      1000000
    );
    this.camera.position.set(-132, -757, -767);
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
    for (let index = 1; index < 100; index++) {
      const geo = new THREE.SphereGeometry(100, 50, 50);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          baseColor: {
            type: "vec3",
            value: new THREE.Color(getRandomColor()),
          },
        },
        transparent: true,
        vertexShader: `
          varying float intensity;
          void main() {
            vec3 normalCamera = normalize(normalMatrix * cameraPosition);
            vec3 viewNormal = normalize(normalMatrix * normal);
            intensity = 1.0 - dot(viewNormal, normalCamera);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 baseColor;
          varying float intensity;
          void main() {
            gl_FragColor = vec4(intensity * baseColor, 0.9);
          }
        `,
      });
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(
        getRandomNum(100 * index, 300 * index),
        getRandomNum(100 * index, 300 * index),
        getRandomNum(100 * index, 300 * index)
      );
      this.scene.add(mesh);
    }
  }
}
