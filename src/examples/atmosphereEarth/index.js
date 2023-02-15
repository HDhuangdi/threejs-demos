import * as THREE from "three";
import { MeshPhongMaterial, ShaderMaterial } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.initScene();
    this.initCamera();
    this.initLight();
    this.initRenderer();
    this.initObject();
    this.initEffect();
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
    this.camera.position.set(200, -50, 0);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff, 0.4); // white light
    this.light.position.set(100, 100, 100);
    this.scene.add(this.light);
  }

  render() {
    this.composer.render();
    this.earth.rotateZ(Math.PI / 2000)
    const deltaTime = this.clock.getDelta();
    this.atmosphereMaterial.uniforms.time.value += deltaTime;
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.lightHelper = new THREE.PointLightHelper(this.light, 50, 0xff00ff);
    this.scene.add(this.axesHelper);
    this.scene.add(this.lightHelper);
  }

  initObject() {
    this.earth = new THREE.Group()
    this.scene.add(this.earth);
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
    const ball = new THREE.Mesh(earthGeo, earthMaterial);
    this.earth.add(ball)

    const atmosphereGeo = new THREE.SphereGeometry(50.1, 50, 50);
    const atmosphereTexture = textureLoader.load(
      require("@/assets/images/clouds-alpha.png")
    );
    atmosphereTexture.wrapS = THREE.RepeatWrapping;
    atmosphereTexture.wrapT = THREE.RepeatWrapping;
    this.atmosphereMaterial = new ShaderMaterial({
      uniforms: {
        mapPic: {
          value: atmosphereTexture,
        },
        time: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D mapPic;
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec2 newUv = vUv + vec2(0.02, 0) * time;
          gl_FragColor = texture2D(mapPic, newUv);
          gl_FragColor.a *= 0.5;
        }
      `,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, this.atmosphereMaterial);
    this.earth.add(atmosphere)

    const glowGeo = new THREE.SphereGeometry(52, 50, 50);
    const glowMaterial = new ShaderMaterial({
      uniforms: {
        lightPosition: {
          value: new THREE.Vector3(
            this.light.position.x,
            this.light.position.y,
            this.light.position.z
          ).normalize(),
        },
        lightColor: { value: this.light.color },
      },
      vertexShader: `
        uniform vec3 lightPosition;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 lightPosition;
        uniform vec3 lightColor;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vec3 dist = cameraPosition - vPosition; // 计算顶点到相机中心点的距离
          float alpha = dot(normalize(dist) , vNormal) ; // 归一化距离并和顶点的法向量做点积

          float start = 0.28;
          float end = 0.0;
          float max = 0.8;
          float distance = start - end;
          
          if(alpha > start) { 
            alpha = 0.0;
          }
          if(alpha == 0.5) {
            alpha = max;
          } else if(alpha < 0.5) {
            float diff = start - alpha;
            float ratio = diff / distance;
            alpha = max - ratio;
          }

          vec3 color = vec3(0.376 + alpha * (0.776 - 0.376), 0.478 + alpha * (1.0 - 0.478), 1.0 + alpha * (1.0 - 1.0));
          float dot = dot(lightPosition, normalize(vNormal));

          gl_FragColor = vec4(color, alpha * dot);
        }
      `,
      transparent: true,
    });

    1, 1, 1;
    0.376, 0.478, 1;
    const glow = new THREE.Mesh(glowGeo, glowMaterial);
    this.scene.add(glow)
  }

  initEffect() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    const unrealBloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,
      0.2,
      0
    );
    const shaderPass = new ShaderPass(
      {
        uniforms: {
          bloomTexture: { value: this.composer.renderTarget2.texture },
          baseTexture: { value: null },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            gl_FragColor = (texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv));
          }
        `,
      },
      "baseTexture"
    );

    this.composer.addPass(renderPass);
    this.composer.addPass(unrealBloomPass), this.composer.addPass(shaderPass);
  }
}
