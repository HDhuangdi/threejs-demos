import * as THREE from "three";
import { MeshPhongMaterial } from "three";
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
    // this.initDevHelpers();

    this.radius = 50;
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
      preserveDrawingBuffer: true,
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
    this.camera.position.set(200, -50, 0);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  initLight() {
    // this.light = new THREE.PointLight(0xffffff, 0.8); // white light
    this.ambient = new THREE.AmbientLight(new THREE.Color("#fff"));
    // this.light.position.set(100, 100, 100);
    // this.scene.add(this.light);
    this.scene.add(this.ambient);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    // this.lightHelper = new THREE.PointLightHelper(this.light, 50, 0xff00ff);
    this.scene.add(this.axesHelper);
    // this.scene.add(this.lightHelper);
  }

  initObject() {
    const textureLoader = new THREE.TextureLoader();
    const earthGeo = new THREE.SphereGeometry(50, 50, 50);
    const earthMaterial = new MeshPhongMaterial({
      map: textureLoader.load(require("@/assets/images/earth-day.png")),
      normalMap: textureLoader.load(
        require("@/assets/images/earth-normal.png")
      ),
      specularMap: textureLoader.load(
        require("@/assets/images/earth-spec.png")
      ),
    });
    this.earth = new THREE.Mesh(earthGeo, earthMaterial);
    this.scene.add(this.earth);
    this.group = new THREE.Group();
    this.pointGroup = new THREE.Group();
    this.curveGroup = new THREE.Group();

    let firstPoint;
    for (let index = 0; index < 30; index++) {
      this.addPoint();
      if (index === 0) {
        firstPoint = this.pointGroup.children[0];
        continue;
      }
      this.addCurve(
        firstPoint.position,
        this.pointGroup.children[index].position
      );
    }

    // for (let index = 1; index < this.pointGroup.children.length; index += 2) {
    //   const cur = this.pointGroup.children[index];
    //   const prev = this.pointGroup.children[index - 1];
    //   this.addCurve(cur.position, prev.position);
    // }

    this.group.add(this.pointGroup);
    this.group.add(this.curveGroup);
    this.scene.add(this.group);
  }

  addPoint() {
    const dotGeo = new THREE.SphereGeometry(0.5, 5, 5);
    const dotMaterial = new MeshPhongMaterial({ color: "#f00" });
    const dot = new THREE.Mesh(dotGeo, dotMaterial);
    const { x, y, z } = getPos(this.earth.position, 50);

    dot.position.set(x, y, z);

    this.pointGroup.add(dot);
  }

  addCurve(start, end) {
    const angle = start.angleTo(end);

    const hLen = Math.pow(angle < 1 ? 1 : angle, 2) * 80; // 法线的长度
    const cLen = angle * 30; // 控制点线

    const centerVec = getVCenter(start, end); // 两点的中点
    const normal = new THREE.Ray(this.earth.position, centerVec); // 法线
    const headPoint = normal.at(
      hLen / centerVec.distanceTo(this.earth.position),
      centerVec
    ); // 法线头部点
    const controlPoint1 = getLenVec(start, headPoint, cLen);
    const controlPoint2 = getLenVec(end, headPoint, cLen);
    const curve = new THREE.CubicBezierCurve3(
      start,
      controlPoint1,
      controlPoint2,
      end
    );
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({ color: 0x80a6de });
    const curveObject = new THREE.Line(geometry, material);
    this.curveGroup.add(curveObject);

    return {
      curve,
      mesh: curveObject,
    };
  }
}

function getPos(center, radius) {
  const a = Math.PI * 2 * Math.random();
  const b = Math.PI * 2 * Math.random();
  const x = radius * Math.sin(a) * Math.cos(b);
  const y = radius * Math.sin(a) * Math.sin(b);
  const z = radius * Math.cos(a);
  return { x: center.x + x, y: center.y + y, z: center.z + z };
}

function getVCenter(v1, v2) {
  let v = v1.clone().add(v2.clone());
  return v.divideScalar(2);
}

function getLenVec(v1, v2, len) {
  const _v1 = v1.clone();
  let dist = _v1.distanceTo(v2);
  return _v1.lerp(v2, len / dist);
}
