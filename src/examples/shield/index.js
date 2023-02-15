import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.flyLineAnimationDuration = 2000
    this.flyLineAnimationNowPercent = 0; // 当前飞线头部运行到总曲线长度的百分比
    this.flyLineLengthPercent = 0.5; // 飞线占总曲线长度的百分比

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
      10000
    );
    this.camera.position.set(0, 20, 300);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff, 0.8); // white light
    this.light.position.set(100, 100, 100);
    this.scene.add(this.light);
  }

  render() {
    let delta = this.clock.getDelta();
    delta *= 1000;
    this.flyLineAnimationNowPercent += delta / this.flyLineAnimationDuration;
    if (this.flyLineAnimationNowPercent >= 1) {
      this.flyLineAnimationNowPercent = 0;
    }
    this.mat.uniforms.flyLineAnimationNowPercent.value = this.flyLineAnimationNowPercent;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.axesHelper);
  }

  initObject() {
    const center = new THREE.Vector3(90, 0, 0);
    const radius = 40;

    const startVec3 = new THREE.Vector3(0, 0, 0);
    const endVec3 = new THREE.Vector3(100, 0, 0);
    const curve = new THREE.QuadraticBezierCurve3(
      startVec3,
      new THREE.Vector3(50, 100, 0),
      endVec3
    );

    const points = curve.getPoints(500);
    const percents = new Float32Array(points.length);
    for (let index = 0; index < points.length; index++) {
      percents[index] = index / points.length;
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute("percents", new THREE.BufferAttribute(percents, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        flyLineAnimationNowPercent: {
          value: this.flyLineAnimationNowPercent,
        },
        flyLineLengthPercent: {
          value: this.flyLineLengthPercent,
        },
        center: {
          value: center,
        },
        radius: {
          value: radius,
        },
      },
      transparent: true,
      vertexShader: `
        attribute float percents;

        uniform vec3 center; 
        uniform float flyLineAnimationNowPercent;
        uniform float flyLineLengthPercent;

        varying float dist;
        varying float alpha;
        void main() {
          float head = flyLineAnimationNowPercent;
          float tail = flyLineAnimationNowPercent - flyLineLengthPercent;
          if(percents <= head && percents >= tail) {
            gl_PointSize = 5.0 * (1.0 - (head - percents) / (head - tail));
            alpha = gl_PointSize;
          } else {
            gl_PointSize = 0.0;
          }
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          dist = distance(position, center);
        }
      `,
      fragmentShader: `
        uniform float radius; 

        varying float dist;
        varying float alpha;

        void main() {
          float d = distance(gl_PointCoord, vec2(0.5, 0.5));

          if (dist <= radius || alpha == 0.0 || d > 0.5) {
            discard;
          }
          gl_FragColor = vec4(1.0, 0.0, 0.0, alpha);
        }
      `,
    });

    const line = new THREE.Points(geometry, this.mat);
    this.scene.add(line);

    const geometry2 = new THREE.SphereGeometry(
      radius,
      32,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    // 创建基础材质
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    // 创建实体
    const sphere = new THREE.Mesh(geometry2, material);
    sphere.position.copy(center);
    this.scene.add(sphere);
  }
}
