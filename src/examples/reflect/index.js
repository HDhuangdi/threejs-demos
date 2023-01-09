import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Quad from "./Quad";

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.upLevel = new THREE.Group();

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initObject();
    this.initDevHelpers();
    // this.initQuad();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.clock = new THREE.Clock();
    this.render();
  }

  initScene() {
    this.reflectionScene = new THREE.Scene();
    this.reflectionGroup = new THREE.Group();
    this.reflectionScene.add(this.reflectionGroup);

    this.otherScene = new THREE.Scene();
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

    this.reflectionTarget = new THREE.WebGLRenderTarget(
      SCENE_WIDTH,
      SCENE_HEIGHT
    );
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
  }

  render() {
    this.renderer.setRenderTarget(this.reflectionTarget);
    this.reflectionGroup.scale.set(-1, -1, -1);
    this.renderer.clear();
    this.renderer.render(this.reflectionScene, this.camera);

    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.otherScene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.otherScene.add(this.axesHelper);
  }

  initQuad() {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_reflection_texture: { value: this.renderTarget2.texture },
        u_texture: { value: this.renderTarget.texture },
      },
      vertexShader: `
        varying vec2 v_uv;

        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          v_uv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D u_texture;
        uniform sampler2D u_reflection_texture;
        varying vec2 v_uv;

        void main() {
          gl_FragColor = texture2D(u_texture, v_uv);
        }
      `,
      transparent: true,
    });
    this.quad = new Quad(SCENE_WIDTH, SCENE_HEIGHT, material);
  }

  initObject() {
    this.initReflectionObjects();
    this.initOtherObjects();
  }

  initReflectionObjects() {
    const geo = new THREE.BoxGeometry(20, 20, 20);
    const mat = new THREE.MeshBasicMaterial({color: 'blue'});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 100, 0);
    this.otherScene.add(mesh)
    this.reflectionGroup.add(mesh.clone());
  }

  initOtherObjects() {
    const geo = new THREE.PlaneGeometry(200, 200);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        u_reflection_texture: { value: this.reflectionTarget.texture },
      },
      vertexShader: `
        varying vec2 v_uv;

        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          v_uv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D u_reflection_texture;
        varying vec2 v_uv;

        void main() {
          vec2 uv = vec2(v_uv.x, abs(v_uv.y - 1.0));
          gl_FragColor = texture2D(u_reflection_texture, uv);
          // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotateX(Math.PI / 2);
    this.otherScene.add(mesh);
  }
}
