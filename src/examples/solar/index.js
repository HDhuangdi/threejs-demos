import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.earthPos = new THREE.Vector3(0, 0, 0)
    this.earthRadius = 100

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
    this.camera.position.set(300, 300, 300);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff); // white light
    this.light.position.set(1000, 1000, 1000);
    this.scene.add(this.light);

    this.am = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(this.am);
  }

  render() {
    this.ball.rotateZ(Math.PI / 1000)
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.axesHelper);
  }

  initObject() {
    this.initEarth();
    this.initMask()
  }

  initEarth() {
    const loader = new THREE.TextureLoader();
    const geo = new THREE.SphereGeometry(this.earthRadius, 100, 100);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        base_texture: {
          value: loader.load(require("./images/earth-day.jpeg")),
        },
        bump_texture: {
          value: loader.load(require("./images/earth-bump.jpeg")),
        },
        light_pos: {
          value: this.light.position,
        },
        light_color: {
          value: new THREE.Color(0xffffff),
        },
        ambient_light_color: {
          value: this.am.color.multiplyScalar(this.am.intensity)
        }
      },
      transparent: true,
      vertexShader: `
        varying vec2 v_uv;
        varying vec3 v_normal;
        varying vec3 v_position;
        
        void main() {
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
          v_uv = uv;
          v_normal = normal;
          v_position = position;
        }
      `,
      fragmentShader: `
        varying vec2 v_uv;
        varying vec3 v_normal;
        varying vec3 v_position;

        uniform sampler2D base_texture;
        uniform vec3 light_pos;
        uniform vec3 light_color;
        uniform vec3 ambient_light_color;

        void main() {
          vec3 dir = light_pos - v_position;
          vec3 light_direction = normalize(dir);

          float dot = dot(light_direction, normalize(v_normal));
          
          vec4 texture_color = texture2D(base_texture, v_uv);
          vec4 base_color = vec4(ambient_light_color, 1.0) * texture_color;
          vec4 reflected_color = vec4(light_color, 1.0) * texture_color * dot;
          reflected_color = max(reflected_color, vec4(0.0, 0.0, 0.0, 0.0));

          vec4 color = reflected_color + base_color;
          
          gl_FragColor = vec4(color.rgb, 1.0);
        }
      `,
    });

    this.ball = new THREE.Mesh(geo, mat);
    this.scene.add(this.ball);
  }


  initMask() {
    const geo = new THREE.SphereGeometry(this.earthRadius + 0.2, 100, 100);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        color: {value: new THREE.Vector4(
          0.5490196078431373, 
          0.7176470588235294,
          0.996078431372549,
          1)},
        light_pos: {
          value: this.light.position,
        },
        light_color: {
          value: new THREE.Color(0xffffff),
        },
        ambient_light_color: {
          value: this.am.color.multiplyScalar(this.am.intensity)
        },
        camera_position: {
          value: this.camera.position
        }
      },
      vertexShader: `
        varying vec3 v_normal;
        varying vec3 v_position;

        void main() {
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
          v_normal = normal;
          v_position = position;
        }
      `,
      fragmentShader: `
        varying vec3 v_normal;
        varying vec3 v_position;
        
        uniform vec4 color;
        uniform vec3 light_pos;
        uniform vec3 light_color;
        uniform vec3 ambient_light_color;
        uniform vec3 camera_position;

        void main() {
          vec3 dir = light_pos - v_position;
          vec3 light_direction = normalize(dir);
          vec3 normal = normalize(v_normal);

          float dot1 = dot(light_direction, normal);
          
          vec4 base_color = vec4(ambient_light_color, 1.0) * color;
          vec4 reflected_color = vec4(light_color, 1.0) * color * dot1;
          reflected_color = max(reflected_color, vec4(0.0, 0.0, 0.0, 0.0));

          vec3 sub = camera_position - v_position;
          float dot2 = dot(normalize(sub), normal);

          vec4 fcolor = reflected_color + base_color;

          gl_FragColor = reflected_color;
          gl_FragColor.a *= 1.0 - dot2;
        }
      `,
      blending: THREE.NormalBlending
    })
    const mesh = new THREE.Mesh(geo, mat)
    this.scene.add(mesh)
  }
}
