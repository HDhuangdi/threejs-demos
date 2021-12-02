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
    this.camera.position.set(300, 300, 300);
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
    if (this.mesh) {
      this.mesh.material.uniforms.progress.value += 0.01;
      if (this.mesh.material.uniforms.progress.value > 1) {
        this.mesh.material.uniforms.progress.value = 0;
      }
    }
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.axesHelper);
  }

  initObject() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const centers = [];
    const left = 0;
    const right = 100;
    const top = 100;
    const bottom = 0;
    const stepX = 1;
    const stepY = 1;
    const hStepX = stepX;
    const hStepY = stepY;

    for (let x = left; x < right; x += stepX) {
      for (let y = bottom; y < top; y += stepY) {
        const xL = x;
        const xR = x + hStepX;
        const yT = y + hStepY;
        const yB = y;

        positions.push(xL, yT, 0);
        positions.push(xL, yB, 0);
        positions.push(xR, yB, 0);
        positions.push(xL, yT, 0);
        positions.push(xR, yT, 0);
        positions.push(xR, yB, 0);

        uvs.push(xL / right, yT / top);
        uvs.push(xL / right, yB / top);
        uvs.push(xR / right, yB / top);
        uvs.push(xL / right, yT / top);
        uvs.push(xR / right, yT / top);
        uvs.push(xR / right, yB / top);

        for (let i = 0; i < 3; i += 1) {
          centers.push(xL + (xR - xL) / 4, (yT + yB) / 2, 0);
        }

        for (let i = 0; i < 3; i += 1) {
          centers.push(xR - (xR - xL) / 4, (yT + yB) / 2, 0);
        }
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute(
      "center",
      new THREE.Float32BufferAttribute(centers, 3)
    );

    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        texturePic: {
          type: "sampler2D",
          value: new THREE.TextureLoader().load(
            require("@/assets/images/earth-day.png")
          ),
        },
        progress: {
          value: 1,
        },
        top: {
          value: 0,
        },
        left: {
          value: 0,
        },
        width: {
          value: 100,
        },
        height: {
          value: 100,
        },
      },
      vertexShader: `
      varying vec2 vUv;
      attribute vec3 center;
      uniform float progress;
      uniform float top;
      uniform float left;
      uniform float width;
      uniform float height;

      vec3 rotate_around_z_in_degrees(vec3 vertex, float degree) {
        float alpha = degree * 3.14 / 180.0;
        float sina = sin(alpha);
        float cosa = cos(alpha);
        mat2 m = mat2(cosa, -sina, sina, cosa);
    
        return vec3(m * vertex.xy, vertex.z).xyz;
      }

      void main() {
        vUv = uv;
        vec3 new_position = position;
        vec3 centre = vec3(left + width * 0.5, top + height * 0.5, 0);
        vec3 dist = centre - center;
        float len = length(dist);
        float factor;

        if (progress < 0.5) {
            factor = progress;
        } else {
            factor = (1. - progress);
        }

        float factor1 = len * factor * 10.;
        new_position.x -= sin(dist.x * factor1);
        new_position.y -= sin(dist.y * factor1);
        new_position.z += factor1;
        new_position = rotate_around_z_in_degrees(new_position, progress * 360.);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(new_position, 1.0);
      }
    `,
      fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D texturePic;
      void main() {
        vec4 color = texture2D(texturePic, vUv);
        gl_FragColor = vec4(color.rgb, 1.0);
      }
    `,
    });
    this.mesh = new THREE.Mesh(geometry, mat);
    this.scene.add(this.mesh);
  }
}
