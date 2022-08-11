import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

let BLUR_RADIUS = 3;
let BLOOM_THRESHOLD = 0;
let BLOOM_EXPOSURE = 1;
let BLOOM_STRENGTH = 1.7;
let BLUR_STEPS = 5;
let BLUR_STEP = 2;

export default class Render {
  constructor() {
    this.clock = new THREE.Clock();
    this.sceneTarget = new THREE.WebGLRenderTarget(SCENE_WIDTH, SCENE_HEIGHT);
    this.highPassTarget = new THREE.WebGLRenderTarget(
      SCENE_WIDTH,
      SCENE_HEIGHT
    );
    this.blurXTarget = new THREE.WebGLRenderTarget(SCENE_WIDTH, SCENE_HEIGHT);
    this.blurYTarget = new THREE.WebGLRenderTarget(SCENE_WIDTH, SCENE_HEIGHT);

    this.blurMaterials = [];

    this.initBlurTarget();
    this.initScene();
    this.initCamera();
    this.initLight();
    this.initRenderer();
    this.initObject();
    this.initDevHelpers();
    this.initGUI();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.render();
  }

  initBlurTarget() {
    for (let i = 0; i < BLUR_STEPS; i++) {
      this[`blurXTarget` + i] = new THREE.WebGLRenderTarget(
        SCENE_WIDTH,
        SCENE_HEIGHT
      );
      this[`blurYTarget` + i] = new THREE.WebGLRenderTarget(
        SCENE_WIDTH,
        SCENE_HEIGHT
      );
      this[`blurXScene` + i] = new THREE.Scene();
      this[`blurYScene` + i] = new THREE.Scene();
    }
  }

  initGUI() {
    const gui = new GUI();
    const params = {
      exposure: BLOOM_EXPOSURE,
      bloomStrength: BLOOM_STRENGTH,
      bloomThreshold: BLOOM_THRESHOLD,
      bloomRadius: BLUR_RADIUS,
    };
    gui
      .add(params, "exposure", 0, 10)
      .step(0.1)
      .onChange((value) => {
        BLOOM_EXPOSURE = Number(value);
        this.bloomPlaneMat.uniforms.u_exposure.value = BLOOM_EXPOSURE;
      });

      gui
      .add(params, "bloomThreshold", 0, 1)
      .step(0.001)
      .onChange((value) => {
        BLOOM_THRESHOLD = Number(value);
        this.highPassMat.uniforms.u_threshold.value = BLOOM_THRESHOLD;
      });

    gui
      .add(params, "bloomStrength", 0, 10)
      .step(0.1)
      .onChange((value) => {
        BLOOM_STRENGTH = Number(value);
        this.bloomPlaneMat.uniforms.u_strength.value = BLOOM_STRENGTH;
      });

    gui
      .add(params, "bloomRadius", 0.0, 15)
      .step(0.1)
      .onChange((value) => {
        BLUR_RADIUS = Number(value);
        this.blurMaterials.forEach((material) => {
          material.uniforms.u_blur_radius.value = BLUR_RADIUS;
        });
      });
  }

  initScene() {
    this.mainScene = new THREE.Scene();
    this.highPassScene = new THREE.Scene();
    this.scene3 = new THREE.Scene();
    this.scene4 = new THREE.Scene();
    this.bloomScene = new THREE.Scene();
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
    this.camera.position.set(222, 125, -149);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.camera2 = new THREE.OrthographicCamera(
      SCENE_WIDTH / -2,
      SCENE_WIDTH / 2,
      SCENE_HEIGHT / 2,
      SCENE_HEIGHT / -2,
      1,
      1000
    );
    this.camera2.position.set(0, 0, 300);
    this.camera2.lookAt(new THREE.Vector3(0, 0, 0));
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff, 0.8); // white light
    this.light.position.set(300, 300, 300);
    this.mainScene.add(this.light);

    this.amLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.mainScene.add(this.amLight);
  }

  render() {
    // scene
    this.renderer.setRenderTarget(this.sceneTarget);
    this.renderer.clear();
    this.renderer.render(this.mainScene, this.camera);

    // 阈值化：提取亮色
    this.renderer.setRenderTarget(this.highPassTarget);
    this.renderer.clear();
    this.renderer.render(this.highPassScene, this.camera2);

    // 高斯模糊
    for (let i = 0; i < BLUR_STEPS; i++) {
      this.renderer.setRenderTarget(this[`blurXTarget` + i]);
      this.renderer.clear();
      this.renderer.render(this[`blurXScene` + i], this.camera2);
      this.renderer.setRenderTarget(this[`blurYTarget` + i]);
      this.renderer.clear();
      this.renderer.render(this[`blurYScene` + i], this.camera2);
    }

    // 辉光
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.bloomScene, this.camera2);

    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.mainScene.add(this.axesHelper);
  }

  initObject() {
    this.initMain();
    this.initHighPassPlane();
    this.initBlurXPlane();
    this.initBlurYPlane();
    this.initBloomPlane();
  }

  initHighPassPlane() {
    const geo = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_HEIGHT);
    this.highPassMat = new THREE.ShaderMaterial({
      uniforms: {
        u_scene_texture: { value: this.sceneTarget.texture },
        u_threshold: { value: BLOOM_THRESHOLD },
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() {
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
          v_uv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D u_scene_texture;
        uniform float u_threshold;
        varying vec2 v_uv;
        void main() {
          vec4 color = texture2D(u_scene_texture, v_uv);
          float grayscale = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
          if (grayscale < u_threshold) {
            discard;
          } else {
            gl_FragColor = color;
          }
        }
      `,
    });
    const mesh = new THREE.Mesh(geo, this.highPassMat);
    this.highPassScene.add(mesh);
  }

  initBlurXPlane() {
    for (let i = 0; i < BLUR_STEPS; i++) {
      const geo = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_HEIGHT);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          u_high_pass_texture: {
            value:
              i === 0
                ? this.highPassTarget.texture
                : this[`blurYTarget` + (i - 1)].texture,
          },
          u_texture_width: { value: Math.round(SCENE_WIDTH / 2) }, // 降采样处理，提高性能
          u_texture_height: { value: Math.round(SCENE_HEIGHT / 2) }, // 降采样处理，提高性能
          u_blur_radius: { value: BLUR_RADIUS + i * BLUR_STEP },
        },
        vertexShader: `
        varying vec2 v_uv;
        void main() {
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
          v_uv = uv;
        }
      `,
        fragmentShader: `
        uniform sampler2D u_high_pass_texture;
        uniform float u_texture_width;
        uniform float u_texture_height;
        uniform float u_blur_radius;
        varying vec2 v_uv;

        float gaussianPdf(in float x, in float sigma) {
          return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;
        }

        vec4 gaussian_blur(vec2 texSize, sampler2D colorTexture, vec2 uv, vec2 direction) {
          vec2 invSize = 1.0 / texSize;
          float fSigma = 4.0;
          float weightSum = gaussianPdf(0.0, fSigma);
          vec4 diffuseSum = texture2D( colorTexture, uv) * weightSum;
          for( float i = 1.0; i < 100.0; i ++ ) {
            if (i > u_blur_radius) { break; }
            float w = gaussianPdf(i, fSigma);
            vec2 uvOffset = direction * invSize * i;
            vec4 sample1 = texture2D( colorTexture, uv + uvOffset);
            vec4 sample2 = texture2D( colorTexture, uv - uvOffset);
            diffuseSum += (sample1 + sample2) * w;
            weightSum += 2.0 * w;
          }
          return diffuseSum / weightSum;
        }

        void main() {
          gl_FragColor = gaussian_blur(vec2(u_texture_width, u_texture_height), u_high_pass_texture, v_uv, vec2(1.0, 0.0));
        }
      `,
      });
      this.blurMaterials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      this[`blurXScene` + i].add(mesh);
    }
  }

  initBlurYPlane() {
    for (let i = 0; i < BLUR_STEPS; i++) {
      const geo = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_HEIGHT);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          u_blurx_texture: {
            value: this[`blurXTarget` + i].texture,
          },
          u_texture_width: { value: Math.round(SCENE_WIDTH / 2) }, // 降采样处理，提高性能
          u_texture_height: { value: Math.round(SCENE_HEIGHT / 2) }, // 降采样处理，提高性能
          u_blur_radius: { value: BLUR_RADIUS + i * BLUR_STEP },
        },
        vertexShader: `
        varying vec2 v_uv;
        void main() {
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
          v_uv = uv;
        }
      `,
        fragmentShader: `
        uniform sampler2D u_blurx_texture;
        uniform float u_texture_width;
        uniform float u_texture_height;
        uniform float u_blur_radius;
        varying vec2 v_uv;

        float gaussianPdf(in float x, in float sigma) {
          return 0.39894 * exp(-0.5 * x * x /(sigma * sigma)) / sigma;
        }

        vec4 gaussian_blur(vec2 texSize, sampler2D colorTexture, vec2 uv, vec2 direction) {
          vec2 invSize = 1.0 / texSize;
          float fSigma = 4.0;
          float weightSum = gaussianPdf(0.0, fSigma);
          vec4 diffuseSum = texture2D( colorTexture, uv) * weightSum;
          for( float i = 1.0; i < 100.0; i ++ ) {
            if (i > u_blur_radius) { break; }
            float w = gaussianPdf(i, fSigma);
            vec2 uvOffset = direction * invSize * i;
            vec4 sample1 = texture2D( colorTexture, uv + uvOffset);
            vec4 sample2 = texture2D( colorTexture, uv - uvOffset);
            diffuseSum += (sample1 + sample2) * w;
            weightSum += 2.0 * w;
          }
          return diffuseSum / weightSum;
        }
        void main() {
          gl_FragColor = gaussian_blur(vec2(u_texture_width, u_texture_height), u_blurx_texture, v_uv, vec2(0.0, 1.0));
        }
      `,
      });
      this.blurMaterials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      this[`blurYScene` + i].add(mesh);
    }
  }

  initBloomPlane() {
    const geo = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_HEIGHT);
    this.bloomPlaneMat = new THREE.ShaderMaterial({
      uniforms: {
        u_blur_texture: {
          value: this[`blurYTarget` + (BLUR_STEPS - 1)].texture,
        },
        u_scene_texture: { value: this.sceneTarget.texture },
        u_exposure: { value: BLOOM_EXPOSURE },
        u_strength: { value: BLOOM_STRENGTH },
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() {
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
          v_uv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D u_blur_texture;
        uniform sampler2D u_scene_texture;
        uniform float u_exposure;
        uniform float u_strength;
        varying vec2 v_uv;

        void main() {
          vec4 blur_color = texture2D(u_blur_texture, v_uv);
          vec4 origin_color = texture2D(u_scene_texture, v_uv);
          vec4 color = blur_color + origin_color;
          vec4 result = vec4(1.0) - exp(-color * u_exposure);
          gl_FragColor = u_strength * result;
        }
      `,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geo, this.bloomPlaneMat);
    this.bloomScene.add(mesh);
  }

  initMain() {
    const geo = new THREE.BoxGeometry(50, 50, 50);
    const mat = new THREE.MeshPhongMaterial({ color: "#fff" });
    const mesh = new THREE.Mesh(geo, mat);
    this.mainScene.add(mesh);

    const geo2 = new THREE.BoxGeometry(50, 50, 50);
    const mat2 = new THREE.MeshPhongMaterial({ color: "#FF3640" });
    const mesh2 = new THREE.Mesh(geo2, mat2);
    mesh2.position.set(100, 0, 0);
    this.mainScene.add(mesh2);

    const geo3 = new THREE.BoxGeometry(50, 50, 50);
    const mat3 = new THREE.MeshPhongMaterial({ color: "#F38E15" });
    const mesh3 = new THREE.Mesh(geo3, mat3);
    mesh3.position.set(0, 0, 100);
    this.mainScene.add(mesh3);
  }
}
