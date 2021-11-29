import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import * as d3 from "d3";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
const geo = require("./geo.json");

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.fps = 60;

    this.clock = new THREE.Clock();
    this.RADIUS = 100;
    this.center = new THREE.Vector3(0, 0, 0);
    this.raycaster = new THREE.Raycaster();
    this.animationInfo = { opacity: 0 };
    this.mapAnimateDuration = 0.5;
    this.mapCenter = [104.0, 37.5];
    this.textureLoader = new THREE.TextureLoader();

    this.initScene();
    this.initCamera();
    this.initLight();
    this.initRenderer();
    this.initObject();
    // this.initDevHelpers();
    this.initEvent();
    this.initEffect();

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
    this.camera.position.set(290, 0, -150);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff, 0.8); // white light
    this.light.position.set(100, 100, 100);

    this.scene.add(this.light);
  }

  render() {
    this.composer.render();
    TWEEN.update();
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
    const dayEarthGeo = new THREE.SphereGeometry(this.RADIUS, 50, 50);
    const dayEarthMat = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      uniforms: {
        dayTexture: {
          type: "sampler2D",
          value: this.textureLoader.load(
            require("@/assets/images/earth-day.png")
          ),
        },
        nightTexture: {
          type: "sampler2D",
          value: this.textureLoader.load(
            require("@/assets/images/earth-night.jpg")
          ),
        },
        lightPos: {
          type: "vec3",
          value: this.light.position,
        },
      },
      vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `,
      fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D dayTexture;
          uniform sampler2D nightTexture;
          uniform vec3 lightPos;
          varying vec3 vNormal;
          void main() {
            vec3 dayColor = vec3(texture2D(dayTexture, vUv).rgb);
            vec3 nightColor = vec3(texture2D(nightTexture, vUv).rgb);
            vec3 color = dayColor;
            float angle = dot(normalize(lightPos), vNormal);
            gl_FragColor = vec4(dayColor, angle);
          }
        `,
    });
    const dayEarth = new THREE.Mesh(dayEarthGeo, dayEarthMat);
    this.scene.add(dayEarth);

    const nightEarthGeo = new THREE.SphereGeometry(this.RADIUS, 50, 50);
    const nightEarthMat = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      uniforms: {
        dayTexture: {
          type: "sampler2D",
          value: this.textureLoader.load(
            require("@/assets/images/earth-day.png")
          ),
        },
        nightTexture: {
          type: "sampler2D",
          value: this.textureLoader.load(
            require("@/assets/images/earth-night.jpg")
          ),
        },
        lightPos: {
          type: "vec3",
          value: this.light.position,
        },
      },
      vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `,
      fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D dayTexture;
          uniform sampler2D nightTexture;
          uniform vec3 lightPos;
          varying vec3 vNormal;
          void main() {
            vec3 dayColor = vec3(texture2D(dayTexture, vUv).rgb);
            vec3 nightColor = vec3(texture2D(nightTexture, vUv).rgb);
            vec3 color = dayColor;
            float angle = dot(normalize(lightPos), vNormal);
            gl_FragColor = vec4(nightColor, 1.0 - angle);
          }
        `,
    });
    const nightEarth = new THREE.Mesh(nightEarthGeo, nightEarthMat);
    this.scene.add(nightEarth);
  }

  initMap() {
    const depth = 5;
    const projection = d3
      .geoMercator()
      .center(this.mapCenter)
      .scale(80)
      .translate([0, 0]);

    this.map = new THREE.Group();
    this.map.name = "map";
    geo.features.forEach((feature) => {
      feature.geometry.coordinates.forEach((multiPolygon) => {
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
          opacity: 0,
          transparent: true,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        this.map.add(line);

        const mapChunkMat = new THREE.MeshPhongMaterial({
          transparent: true,
          opacity: 0,
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
    this.map.position.copy(this.lnglat2Vector(...this.mapCenter));

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
    container.addEventListener("mousemove", this.eventHandler.bind(this));
  }

  eventHandler(e) {
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
        this.showMap();
      } else {
        this.hideMap();
      }
    } else {
      this.hideMap();
    }
  }

  showMap() {
    if (!this.map) return;
    this.mapOpacityAnimation("show");
    this.mapPositionAnimation("show");
  }

  hideMap() {
    if (
      !this.map ||
      this.map.children.every((mesh) => mesh.material.opacity === 0)
    )
      return;
    this.mapOpacityAnimation("hide");
    this.mapPositionAnimation("hide");
  }

  // 透明度动画
  mapOpacityAnimation(type) {
    if (!this.map) return;
    if (type === "show" && this.mapHideOpacityAnimation)
      this.mapHideOpacityAnimation.stop();
    if (type === "hide" && this.mapShowOpacityAnimation)
      this.mapShowOpacityAnimation.stop();

    const tween = new TWEEN.Tween(this.animationInfo)
      .to(
        {
          opacity: type === "show" ? 1 : 0,
        },
        this.mapAnimateDuration * 1000
      )
      .easing(TWEEN.Easing.Quadratic[type === "show" ? "In" : "Out"])
      .onUpdate(() => {
        this.map.children.forEach((mesh) => {
          mesh.material.opacity = this.animationInfo.opacity;
        });
      })
      .start();

    if (type === "show") {
      this.mapShowOpacityAnimation = tween;
    } else if (type === "hide") {
      this.mapHideOpacityAnimation = tween;
    }
  }

  // 位置动画
  mapPositionAnimation(type) {
    if (!this.map) return;
    if (type === "show" && this.mapHidePositionAnimation)
      this.mapHidePositionAnimation.stop();
    if (type === "hide" && this.mapShowPositionAnimation)
      this.mapShowPositionAnimation.stop();
    const endPos = this.lnglat2Vector(...this.mapCenter);
    const startPos = new THREE.Vector3();
    const ray = new THREE.Ray(this.center, endPos.clone().normalize());
    ray.at(this.RADIUS * 0.9, startPos);
    if (!this.transLateInfo) {
      this.transLateInfo = {
        x: type === "show" ? startPos.x : endPos.x,
        y: type === "show" ? startPos.y : endPos.y,
        z: type === "show" ? startPos.z : endPos.z,
      };
    }
    const tween = new TWEEN.Tween(this.transLateInfo)
      .to(
        {
          x: type === "show" ? endPos.x : startPos.x,
          y: type === "show" ? endPos.y : startPos.y,
          z: type === "show" ? endPos.z : startPos.z,
        },
        this.mapAnimateDuration * 1000
      )
      .easing(TWEEN.Easing.Quadratic[type === "show" ? "In" : "Out"])
      .onUpdate(() => {
        this.map.position.set(
          this.transLateInfo.x,
          this.transLateInfo.y,
          this.transLateInfo.z
        );
      })
      .start();
    if (type === "show") {
      this.mapShowPositionAnimation = tween;
    } else if (type === "hide") {
      this.mapHidePositionAnimation = tween;
    }
  }
  initEffect() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    const unrealBloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4,
      1,
      0.5
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
