import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import shadowVertexShader from "./shaders/shadow.vertex";
import shadowFragmentShader from "./shaders/shadow.frag";
import depthVertexShader from "./shaders/depth.vertex";
import depthFragmentShader from "./shaders/depth.frag";
import planeVertexShader from "./shaders/plane.vertex";
import planeFragmentShader from "./shaders/plane.frag";
import blurXFragmentShader from "./shaders/blur_x.frag";
import blurYFragmentShader from "./shaders/blur_y.frag";

/**
 * 在光源视角下渲染一张图，该贴图用于记录在光源坐标系下所有片元的深度值
 * 在渲染真实场景时，对每个片元取以下操作：
 * 计算当前片元在光源坐标系下深度值，记为深度值1
 * 寻找当前片元的裁剪坐标在深度贴图上的rgb值，也就是深度值，记为深度值2
 * 比较深度值1和深度值2，如果深度值1小于深度值2，则说明当前片元处于阴影之中
 */

let SCENE_WIDTH = window.innerWidth;
let SCENE_HEIGHT = Math.max(window.innerHeight - 130, 200);

export default class Render {
  constructor() {
    this.lightRenderTarget = new THREE.WebGLRenderTarget(
      SCENE_WIDTH * 2,
      SCENE_HEIGHT * 2
    );
    this.shadowTarget = new THREE.WebGLRenderTarget(
      SCENE_WIDTH * 2,
      SCENE_HEIGHT * 2
    );
    this.blurXTarget = new THREE.WebGLRenderTarget(
      SCENE_WIDTH * 2,
      SCENE_HEIGHT * 2
    );
    this.blurYTarget = new THREE.WebGLRenderTarget(
      SCENE_WIDTH * 2,
      SCENE_HEIGHT * 2
    );
    this.sceneTarget = new THREE.WebGLRenderTarget(
      SCENE_WIDTH * 2,
      SCENE_HEIGHT * 2
    );
    this.initScene();
    this.initLight();
    this.initCamera();
    this.initRenderer();
    this.initObject();
    this.initDevHelpers();

    this.controls = new OrbitControls(
      this.sceneCamera,
      this.renderer.domElement
    );
    this.clock = new THREE.Clock();
    this.render();
  }

  initScene() {
    this.shadowScene = new THREE.Scene();
    this.lightScene = new THREE.Scene();
    this.scene = new THREE.Scene();
    this.blurXScene = new THREE.Scene();
    this.blurYScene = new THREE.Scene();
    this.planeScene = new THREE.Scene();
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
    this.sceneCamera = new THREE.PerspectiveCamera(
      55,
      SCENE_WIDTH / SCENE_HEIGHT,
      0.1,
      100000
    );
    this.lightCamera = new THREE.PerspectiveCamera(
      55,
      SCENE_WIDTH / SCENE_HEIGHT,
      0.1,
      100000
    );
    this.planeCamera = new THREE.OrthographicCamera(
      SCENE_WIDTH / -2,
      SCENE_WIDTH / 2,
      SCENE_HEIGHT / 2,
      SCENE_HEIGHT / -2,
      1,
      1000
    );

    this.sceneCamera.position.set(
      624,
      329,
      -37
    );
    this.sceneCamera.lookAt(new THREE.Vector3(0, 0, 0));

    this.lightCamera.position.copy(this.light.position);
    this.lightCamera.lookAt(new THREE.Vector3(0, 0, 0));

    this.planeCamera.position.set(0, 100, 0);
    this.planeCamera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff, 0.5); // white light
    this.light.position.set(
      429.59183431572825,
      429.59183431572825,
      429.59183431572825
    );
    this.shadowScene.add(this.light);

    this.lightHelper = new THREE.PointLightHelper(this.light, 50, 0xff00ff);
    this.shadowScene.add(this.lightHelper);
  }

  render() {
    this.renderer.setRenderTarget(this.lightRenderTarget);
    this.renderer.render(this.lightScene, this.lightCamera);

    this.renderer.setRenderTarget(this.shadowTarget);
    this.renderer.render(this.shadowScene, this.sceneCamera);

    this.renderer.setRenderTarget(this.sceneTarget);
    this.renderer.render(this.scene, this.sceneCamera);

    this.renderer.setRenderTarget(this.blurXTarget);
    this.renderer.render(this.blurXScene, this.planeCamera);
    this.renderer.setRenderTarget(this.blurYTarget);
    this.renderer.render(this.blurYScene, this.planeCamera);

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.planeScene, this.planeCamera);
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.axesHelper);
  }

  initObject() {
    this.initScenePlane();
    this.initBars();
    this.initBlurXPlane();
    this.initBlurYPlane();
    this.initPlane()
  }

  initScenePlane() {
    const geo = new THREE.PlaneGeometry(10000, 10000);
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        u_color: { value: new THREE.Color("#C9D2D3") },
        u_depth_texture: { value: this.lightRenderTarget.texture },
        u_light_view_matrix: { value: this.lightCamera.matrixWorldInverse },
        u_light_proj_matrix: { value: this.lightCamera.projectionMatrix },
      },
      fragmentShader: shadowFragmentShader,
      vertexShader: shadowVertexShader,
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotateX(Math.PI / 2);
    this.shadowScene.add(plane);

    const mat2 = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      fragmentShader: depthFragmentShader,
      vertexShader: depthVertexShader,
    });

    const plane2 = new THREE.Mesh(geo, mat2);
    plane2.rotateX(Math.PI / 2);
    this.lightScene.add(plane2);

    const mat3 = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: '#C9D2D3'
    });

    const plane3 = new THREE.Mesh(geo, mat3);
    plane3.rotateX(-Math.PI / 2);
    this.scene.add(plane3);
  }

  initBars() {
    const shadowBars = new THREE.Group();
    const lightBars = new THREE.Group();
    const sceneBars = new THREE.Group();

    /**计算阴影 */
    // 标准坐标系下的
    const height1 = 250
    const width = 30
    const barG1 = new THREE.BoxGeometry(width, height1, width);
    const shadowBarM1 = new THREE.ShaderMaterial({
      uniforms: {
        u_color: { value: new THREE.Color("#DB0031") },
        u_depth_texture: { value: this.lightRenderTarget.texture },
        u_light_view_matrix: { value: this.lightCamera.matrixWorldInverse },
        u_light_proj_matrix: { value: this.lightCamera.projectionMatrix },
      },
      vertexShader: shadowVertexShader,
      fragmentShader: shadowFragmentShader,
    });

    const shadowBar1 = new THREE.Mesh(barG1, shadowBarM1);
    shadowBar1.position.set(100, 0, 100);
    shadowBar1.translateY(height1 / 2)
    shadowBars.add(shadowBar1);
    // 光源坐标系下的
    const lightBarM1 = new THREE.ShaderMaterial({
      vertexShader: depthVertexShader,
      fragmentShader: depthFragmentShader,
    });
    const lightBar1 = new THREE.Mesh(barG1, lightBarM1);
    lightBar1.position.set(100, 0, 100);
    lightBar1.translateY(height1 / 2)
    lightBars.add(lightBar1);

    /**标准场景绘制 */
    const barM1 = new THREE.MeshBasicMaterial({ color: "#DB0031" });
    const bar1 = new THREE.Mesh(barG1, barM1);
    bar1.position.set(100, 0, 100);
    bar1.translateY(height1 / 2)
    sceneBars.add(bar1);

    /**计算阴影 */
    // 标准坐标系下的
    const height2 = 200
    const barG2 = new THREE.BoxGeometry(width, height2, width);
    const shadowBarM2 = new THREE.ShaderMaterial({
      uniforms: {
        u_color: { value: new THREE.Color("#F3CB86") },
        u_depth_texture: { value: this.lightRenderTarget.texture },
        u_light_view_matrix: { value: this.lightCamera.matrixWorldInverse },
        u_light_proj_matrix: { value: this.lightCamera.projectionMatrix },
      },
      vertexShader: shadowVertexShader,
      fragmentShader: shadowFragmentShader,
    });
    const shadowBar2 = new THREE.Mesh(barG2, shadowBarM2);
    shadowBar2.position.set(50, 0, 40);
    shadowBar2.translateY(height2 / 2)
    shadowBars.add(shadowBar2);
    // 光源坐标系下的
    const lightBarM2 = new THREE.ShaderMaterial({
      vertexShader: depthVertexShader,
      fragmentShader: depthFragmentShader,
    });
    const lightBar2 = new THREE.Mesh(barG2, lightBarM2);
    lightBar2.position.set(50, 0, 40);
    lightBar2.translateY(height2 / 2)
    lightBars.add(lightBar2);

    /**标准场景绘制 */
    const barM2 = new THREE.MeshBasicMaterial({ color: "#F3CB86" });
    const bar2 = new THREE.Mesh(barG2, barM2);
    bar2.position.set(50, 0, 40);
    bar2.translateY(height2 / 2)
    sceneBars.add(bar2);

    this.shadowScene.add(shadowBars);
    this.lightScene.add(lightBars);
    this.scene.add(sceneBars);
  }

  initBlurXPlane() {
    const geo = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_HEIGHT);
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        u_texture: { value: this.shadowTarget.texture },
        u_texture_width: { value: SCENE_WIDTH / 2 },
        u_texture_height: { value: SCENE_HEIGHT / 2 },
        u_blur_radius: { value: 10 },
      },
      fragmentShader: blurXFragmentShader,
      vertexShader: planeVertexShader,
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotateX(-Math.PI / 2);
    this.blurXScene.add(plane);
  }

  initBlurYPlane() {
    const geo = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_HEIGHT);
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        u_blur_x_texture: { value: this.blurXTarget.texture },
        u_texture_width: { value: SCENE_WIDTH / 2 },
        u_texture_height: { value: SCENE_HEIGHT / 2 },
        u_blur_radius: { value: 10 },
      },
      fragmentShader: blurYFragmentShader,
      vertexShader: planeVertexShader,
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotateX(-Math.PI / 2);
    this.blurYScene.add(plane);
  }

  initPlane() {
    const geo = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_HEIGHT);
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        u_shadow_texture: { value: this.blurYTarget.texture },
        u_scene_texture: { value: this.sceneTarget.texture },
      },
      fragmentShader: planeFragmentShader,
      vertexShader: planeVertexShader,
      transparent: true
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotateX(-Math.PI / 2);
    this.planeScene.add(plane);
  }
}
