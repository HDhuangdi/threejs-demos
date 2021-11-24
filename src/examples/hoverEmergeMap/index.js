import * as THREE from "three";
import * as d3 from "d3";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { loadImg } from "../helpers";
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
    this.initEvent();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.clock = new THREE.Clock();
    this.RADIUS = 100;
    this.center = new THREE.Vector3(0, 0, 0);
    this.raycaster = new THREE.Raycaster();
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
    this.camera.position.set(0, 0, 200);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff, 0.8); // white light
    this.light.position.set(100, 700, 100);
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

  async initObject() {
    await this.initEarth();
    this.initMap();
  }

  async initEarth() {
    const img = await loadImg(require("../../assets/images/earth.jpg"));
    const canvas = document.createElement("canvas");
    canvas.width = SCENE_WIDTH;
    canvas.height = SCENE_HEIGHT;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const xSteps = 250;
    const ySteps = 250;

    const pointsVertices = [];
    const spherical = new THREE.Spherical(this.RADIUS);
    const position = new THREE.Vector3();
    for (let i = 0; i < xSteps; i++) {
      for (let j = 0; j < ySteps; j++) {
        const xRatio = i / xSteps;
        const yRatio = j / ySteps;
        if (this.isLandByUv(xRatio, yRatio, imgData)) {
          const phi = yRatio * Math.PI;
          const theta = xRatio * Math.PI * 2;
          spherical.phi = phi;
          spherical.theta = theta;
          position.setFromSpherical(spherical);
          pointsVertices.push(position.clone().add(this.center));
        }
      }
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setFromPoints(pointsVertices);
    const pointsMaterial = new THREE.PointsMaterial({ color: 0x888888 });
    const points = new THREE.Points(pointsGeo, pointsMaterial);
    points.rotateY(-Math.PI / 2);
    this.scene.add(points);
  }

  initMap() {
    const mapCenter = [104.0, 37.5];
    const depth = 5;
    const projection = d3
      .geoMercator()
      .center(mapCenter)
      .scale(80)
      .translate([0, 0]);

    this.map = new THREE.Group();
    geo.features.forEach((feature) => {
      feature.geometry.coordinates.forEach((multiPolygon, index) => {
        const shape = new THREE.Shape();
        const lineVertices = [];
        multiPolygon.forEach((polygon) => {
          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = projection(polygon[i]);
            lineVertices.push(new THREE.Vector3(x, -y, depth));
            if (i === 0) shape.moveTo(x, -y);
            shape.lineTo(x, -y);
          }
        });
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setFromPoints(lineVertices);
        const lineMat = new THREE.LineBasicMaterial({
          color: "#fff",
          transparent: true,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        this.map.add(line);

        const mapChunkMat = new THREE.MeshPhongMaterial({
          transparent: true,
          opacity: 1,
          color: "#fff",
        });

        const mapChunkGeo = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: false,
        });
        const mapChunk = new THREE.Mesh(mapChunkGeo, mapChunkMat);
        this.map.add(mapChunk);
      });
    });
    this.map.position.copy(this.lnglat2Vector(mapCenter[0], mapCenter[1]));

    this.map.lookAt(this.center);
    this.map.rotateY(-Math.PI);
    this.scene.add(this.map);
  }

  isLandByUv(xRatio, yRatio, imgData) {
    const x = parseInt(SCENE_WIDTH * xRatio);
    const y = parseInt(SCENE_HEIGHT * yRatio);
    return imgData[4 * (y * SCENE_WIDTH + x)] === 0;
  }

  initEvent() {
    const container = document.getElementById("webgl-container");
    container.addEventListener("click", this.clickHandler.bind(this));
  }

  clickHandler(e) {
    const { clientX, clientY } = e;
    let x = (clientX / SCENE_WIDTH) * 2 - 1;
    let y = -(clientY / SCENE_HEIGHT) * 2 + 1;
    this.raycaster.setFromCamera({ x, y }, this.camera);
    var intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length) {
      const [lng, lat] = this.Vector2Lnglat(intersects[0].point);
      const chinaLngLatRange = [
        [73.33, 135.05],
        [3.51, 53.33],
      ];
      if (
        lng > chinaLngLatRange[0][0] &&
        lng < chinaLngLatRange[0][1] &&
        lat > chinaLngLatRange[1][0] &&
        lat < chinaLngLatRange[1][1]
      ) {
        console.log("中国");
      }
    }
  }

  // 经纬度 => 三维向量
  lnglat2Vector(lng, lat) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 90) * (Math.PI / 180);
    const spherical = new THREE.Spherical(this.RADIUS, phi, theta);
    const vec = new THREE.Vector3();
    vec.setFromSpherical(spherical);
    vec.add(this.center);
    return vec;
  }

  // 三维向量 => 经纬度
  Vector2Lnglat(vector) {
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(vector);
    const theta =
      spherical.theta < 0 ? Math.PI * 2 + spherical.theta : spherical.theta;
    let lng = theta / (Math.PI / 180) - 90;
    lng = lng > 180 ? lng - 360 : lng;
    const lat = 90 - spherical.phi / (Math.PI / 180);
    return [lng, lat];
  }
}
