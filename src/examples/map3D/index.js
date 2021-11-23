import * as THREE from "three";
import * as d3 from "d3";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const geo = require("./geo.json");

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
    this.camera.position.set(0, 0, 80);
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
    const projection = d3
      .geoMercator()
      .center([104.0, 37.5])
      .scale(80)
      .translate([0, 0]);

    geo.features.forEach((feature) => {
      feature.geometry.coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon) => {
          const depth = 5;
          const shape = new THREE.Shape();
          const lineGeo = new THREE.BufferGeometry();
          const lineMaterial = new THREE.LineBasicMaterial({ color: "#fff" });
          const lineVertices = [];
          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = projection(polygon[i]);
            if (i === 0) shape.moveTo(x, -y);
            shape.lineTo(x, -y);
            lineVertices.push(new THREE.Vector3(x, -y, depth));
          }
          lineGeo.setFromPoints(lineVertices);
          const line = new THREE.Line(lineGeo, lineMaterial);
          this.scene.add(line);

          const geo = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: false,
          });
          const material = new THREE.MeshPhongMaterial({
            transparent: true,
            opacity: 0.8,
            color: "#f00",
          });
          const mesh = new THREE.Mesh(geo, material);
          this.scene.add(mesh);
        });
      });
    });
  }
}
