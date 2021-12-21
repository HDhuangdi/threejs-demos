import * as THREE from "three";
import { MeshPhongMaterial } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.center = new THREE.Vector3(0, 0, 0);
    this.radius = 50;
    this.clock = new THREE.Clock();
    this.flyLineAnimationDuration = 3000; // ms
    this.flyLineAnimationNowPercent = 0; // 当前飞线头部运行到总曲线长度的百分比
    this.flyLineLengthPercent = 0.2; // 飞线占总曲线长度的百分比

    this.initScene();
    this.initCamera();
    this.initLight();
    this.initRenderer();
    this.initObject();
    // this.initDevHelpers();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

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
    let delta = this.clock.getDelta();
    delta *= 1000;
    this.flyLineAnimationNowPercent += delta / this.flyLineAnimationDuration;
    if (this.flyLineAnimationNowPercent >= 1) {
      this.flyLineAnimationNowPercent = 0;
    }
    this.curveGroup.children.forEach((mesh) => {
      mesh.material.uniforms.flyLineAnimationNowPercent.value = this.flyLineAnimationNowPercent;
    });
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

    this.addCurve([2.2, 48.5], [116.2, 39.55]);
    this.addCurve([-0.05, 51.36], [-75.42, 45.27]);

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
    const startVec3 = this.lnglat2Vector3(start);
    const endVec3 = this.lnglat2Vector3(end);
    const angle = startVec3.angleTo(endVec3);

    const hLen = Math.pow(angle < 1 ? 1 : angle, 2) * 80; // 法线的长度
    const cLen = angle * 30; // 控制点线

    const centerVec = getVCenter(startVec3, endVec3); // 两点的中点
    const normal = new THREE.Ray(this.earth.position, centerVec); // 法线
    const headPoint = normal.at(
      hLen / centerVec.distanceTo(this.earth.position),
      centerVec
    ); // 法线头部点
    const controlPoint1 = getLenVec(startVec3, headPoint, cLen);
    const controlPoint2 = getLenVec(endVec3, headPoint, cLen);
    const curve = new THREE.CubicBezierCurve3(
      startVec3,
      controlPoint1,
      controlPoint2,
      endVec3
    );
    const points = curve.getPoints(500);
    const percents = new Float32Array(points.length);
    for (let index = 0; index < points.length; index++) {
      percents[index] = index / points.length;
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute("percents", new THREE.BufferAttribute(percents, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        flyLineAnimationNowPercent: {
          value: this.flyLineAnimationNowPercent,
        },
        flyLineLengthPercent: {
          value: this.flyLineLengthPercent,
        },
        color: {
          value: new THREE.Color("#FB5431"),
        },
      },
      vertexShader: `
        attribute float percents;
        uniform float flyLineAnimationNowPercent;
        uniform float flyLineLengthPercent;
        varying float alpha;
        void main() {
          float head = flyLineAnimationNowPercent;
          float tail = flyLineAnimationNowPercent - flyLineLengthPercent;
          if(percents <= head && percents >= tail) {
            gl_PointSize = 10.0 * (1.0 - (head - percents) / (head - tail));
            alpha = gl_PointSize;
          } else {
            gl_PointSize = 0.0;
          }
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,

      fragmentShader: `
        varying float alpha;
        uniform vec3 color;
        void main() {
          if(alpha == 0.0) {
            discard;
          }
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    const curveObject = new THREE.Points(geometry, material);
    this.curveGroup.add(curveObject);

    return {
      curve,
      mesh: curveObject,
    };
  }

  lnglat2Vector3(lnglat) {
    const lng = lnglat[0];
    const lat = lnglat[1];

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 90) * (Math.PI / 180);
    const spherical = new THREE.Spherical(this.radius, phi, theta);
    const vec = new THREE.Vector3();
    vec.setFromSpherical(spherical);
    vec.add(this.center);
    return vec;
  }
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
