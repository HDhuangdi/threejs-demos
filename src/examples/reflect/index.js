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
    this.camera.position.set(0, 300, 0);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.camera2 = new THREE.PerspectiveCamera(
      45,
      SCENE_WIDTH / SCENE_HEIGHT,
      0.1,
      10000
    );
    this.camera2.matrixAutoUpdate = false;
    this.camera2.matrixWorldAutoUpdate = false;
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff, 0.8); // white light
    this.light.position.set(100, 100, 100);
    this.scene.add(this.light);
  }

  render() {
    this.camera2.matrixWorld.copy(this.camera.matrixWorld.clone());
    // this.camera2.updateMatrixWorld();
    this.camera2.matrixWorldInverse.elements[6] *= 2000;
    this.camera2.matrixWorldInverse.elements[9] *= 2000;
    this.camera2.matrixWorldInverse.elements[13] *= 2000;
    this.camera2.matrixWorldInverse.elements[14] *= 2000;
    console.log(this.camera2.matrixWorldInverse.elements[6]);
    console.log(this.camera2.matrixWorldInverse.elements);
    this.renderer.render(this.scene, this.camera2);
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.axesHelper);
  }

  initObject() {
    this.initGeo();
    this.initPlane();
  }

  initGeo() {
    const geo = new THREE.BoxGeometry(20, 20, 20);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        vm: { value: this.camera2.matrixWorldInverse },
      },
      vertexShader: `
      uniform mat4 vm;
        void main() {
          gl_Position = projectionMatrix * vm * modelMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 100, 0);
    this.scene.add(mesh);
  }
  initPlane() {
    const geo = new THREE.PlaneGeometry(200, 200);
    const mat = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: "grey",
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotateX(Math.PI / 2);
    this.scene.add(mesh);
  }
}
