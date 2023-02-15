import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Quad from "./Quad";

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.upLevel = new THREE.Group();
    this.textureMatrix = new THREE.Matrix4();

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initObject();
    this.initMirrorCamera();
    this.initDevHelpers();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.clock = new THREE.Clock();
    this.render();
  }

  initScene() {
    this.mirrorScene = new THREE.Scene();
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

    this.mirrorTarget = new THREE.WebGLRenderTarget(SCENE_WIDTH, SCENE_HEIGHT);
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

  initMirrorCamera() {
    this.mirrorCamera = new THREE.PerspectiveCamera();

    this.updateMirrorCamera();
  }

  updateMirrorCamera() {
    const mirrorWorldPosition = new THREE.Vector3();
    const cameraWorldPosition = new THREE.Vector3();
    const rotationMatrix = new THREE.Matrix4(); // 镜像平面、镜像相机的旋转矩阵
    const lookAtPosition = new THREE.Vector3(0, 0, -1);
    const normal = new THREE.Vector3();
    const view = new THREE.Vector3(); // 镜像相机的世界位置
    const target = new THREE.Vector3(); // 镜像相机的视点位置

    // 计算镜像相机的世界位置
    mirrorWorldPosition.setFromMatrixPosition(this.mirror.matrixWorld); // 得到镜面的世界位置
    cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld); // 得到相机的世界位置
    rotationMatrix.extractRotation(this.mirror.matrixWorld); // 获取镜面的旋转矩阵

    // 定义一个默认的法向量，乘以上一步得到的镜面的旋转向量得到：镜面现在的法向量
    normal.set(0, 0, 1);
    normal.applyMatrix4(rotationMatrix);
    // 计算 从相机位置到镜面位置 的向量
    view.subVectors(mirrorWorldPosition, cameraWorldPosition);
    // 得到反射向量的反向量
    view.reflect(normal).negate();
    // 反向量加上该镜面的世界位置，得到镜面相机的世界位置
    view.add(mirrorWorldPosition);

    // 计算镜像相机的视点位置，原理同上
    rotationMatrix.extractRotation(this.camera.matrixWorld);
    lookAtPosition.set(0, 0, -1);
    lookAtPosition.applyMatrix4(rotationMatrix);
    lookAtPosition.add(cameraWorldPosition);

    target.subVectors(mirrorWorldPosition, lookAtPosition);
    target.reflect(normal).negate();
    target.add(mirrorWorldPosition);

    // 设置镜面相机参数
    this.mirrorCamera.position.copy(view);
    this.mirrorCamera.up.set(0, 1, 0);
    this.mirrorCamera.up.applyMatrix4(rotationMatrix);
    this.mirrorCamera.up.reflect(normal);
    this.mirrorCamera.lookAt(target);

    this.mirrorCamera.far = this.camera.far;

    this.mirrorCamera.updateMatrixWorld();
    this.mirrorCamera.projectionMatrix.copy(this.camera.projectionMatrix);
    this.updateTextureMatrix();
  }

  updateTextureMatrix() {
    // 这是初始化的矩阵主要是为了把屏幕坐标和[-1, 1]映射到[0, 1]的纹理坐标
    // prettier-ignore
    this.textureMatrix.set(
      0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0
    );

    this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix); // 投影矩阵
    this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse); // 视图矩阵
    this.textureMatrix.multiply(this.mirror.matrixWorld); // 模型矩阵
  }

  render() {
    this.updateMirrorCamera();
    this.renderer.setRenderTarget(this.mirrorTarget);
    this.renderer.render(this.mirrorScene, this.mirrorCamera);

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.axesHelper);
  }

  initObject() {
    this.initMirrorObjects();
    this.initMirror();
  }

  initMirrorObjects() {
    const geo = new THREE.BoxGeometry(20, 100, 20);
    const mat = new THREE.MeshBasicMaterial({ color: "blue" });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 50, 0);
    // this.scene.add(mesh);
    this.mirrorScene.add(mesh.clone());
  }

  initMirror() {
    const geo = new THREE.PlaneGeometry(200, 200);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        u_reflection_texture: { value: this.mirrorTarget.texture },
        u_texture_matrix: { value: this.textureMatrix },
        u_color: { value: new THREE.Color("rgb(31, 45, 51)") },
      },
      vertexShader: `
        varying vec4 v_uv;
        uniform mat4 u_texture_matrix;

        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          v_uv = u_texture_matrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform sampler2D u_reflection_texture;
        uniform vec3 u_color;
        varying vec4 v_uv;

        void main() {
          vec4 mirror_color = texture2D(u_reflection_texture, v_uv.xy / v_uv.w);
          gl_FragColor = vec4(u_color, 1.0) + mirror_color; 
        }
      `,
      side: THREE.BackSide,
    });
    this.mirror = new THREE.Mesh(geo, mat);
    this.mirror.rotateX(Math.PI / 2);
    this.scene.add(this.mirror);
  }
}
