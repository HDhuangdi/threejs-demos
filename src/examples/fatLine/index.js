import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

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
    this.camera.position.set(0, 0, 10);
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
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(2, 0.5, 0),
      new THREE.Vector3(3, 3, 0),
    ];
    const fatLinePoints = this.extrudeLine(points, 10 / 100);

    const shape = new THREE.Shape()
    for (let i = 0; i < fatLinePoints.length; i++) {
      const points = fatLinePoints[i];
      if (i === 0) {
        shape.moveTo(points.x, points.y)
      } else {
        shape.lineTo(points.x, points.y)
      }
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0,
      bevelEnabled: false,
    });
    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      color: "#f00",
    });
    const mesh = new THREE.Mesh(geo, material);
    this.scene.add(mesh);
  }

  extrudeLine(points, width) {
    const clockwise90 = new THREE.Matrix4().makeRotationZ(-Math.PI / 2);
    const antiClockwise90 = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
    const raduis = width / 2;

    const len = points.length;
    const downPoints = new Array(len);

    const upPoints = new Array(len);

    for (let i = 0; i < len; i++) {
      const cur = points[i];
      let prev = points[i - 1];
      let next = points[i + 1];
      if (i === 0) {
        prev = cur;
      } else if (i === len - 1) {
        next = cur;
      }

      let dir1 = cur
        .clone()
        .sub(prev)
        .normalize();
      let dir2 = next
        .clone()
        .sub(cur)
        .normalize();

      const avg = dir1
        .clone()
        .add(dir2)
        .normalize();
      const rotatedAvg1 = avg.clone().applyMatrix4(clockwise90);
      const rotatedAvg2 = avg.clone().applyMatrix4(antiClockwise90);
      const ray1 = new THREE.Ray(cur, rotatedAvg1);
      const ray2 = new THREE.Ray(cur, rotatedAvg2);
      const cosA = dir1.dot(rotatedAvg1);
      const sinA = Math.sqrt(1 - Math.pow(cosA, 2));
      const dist = raduis / sinA;
      downPoints[i] = ray1.at(dist, new THREE.Vector3());
      upPoints[i] = ray2.at(dist, new THREE.Vector3());
    }

    const res = upPoints.concat(downPoints.reverse());

    // const geo = new THREE.BufferGeometry().setFromPoints(res);
    // const mat = new THREE.LineBasicMaterial();
    // const line = new THREE.Line(geo, mat);
    // this.scene.add(line);

    // const geo2 = new THREE.BufferGeometry().setFromPoints(points)
    // const mat2 = new THREE.LineBasicMaterial({color: 'yellow'})
    // const line2 = new THREE.Line(geo2, mat2)
    // this.scene.add(line2)
    return res;
  }
}
