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
    this.renderer.setClearColor(0xffffff, 1);
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
    this.camera.position.set(200, 200, 200);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  initLight() {
    this.light = new THREE.PointLight(0xffffff, 0.8); // white light
    this.am = new THREE.AmbientLight(0xffffff, 1);
    this.light.position.set(100, 200, 100);
    this.scene.add(this.light);
    this.scene.add(this.am);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.axesHelper);
  }

  initObject() {
    const shape = new THREE.Shape();
    const linePoints = [0, 0, 40, 30, 30, 60, 60, 40, 50, 10];
    for (let i = 0; i < linePoints.length; i += 2) {
      const x = linePoints[i];
      const y = linePoints[i + 1];
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }

    const extrudeSettings = {
      depth: 100,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const vertices = geometry.attributes.position.array;
    const uv = this.genUv(vertices, linePoints);
    const uvAttri = new THREE.BufferAttribute(new Float32Array(uv), 2);
    geometry.setAttribute("uv", uvAttri);
    const textureLoader = new THREE.TextureLoader();
    const material = new THREE.MeshPhongMaterial({
      map: textureLoader.load(require("@/assets/images/building.png")),
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotateX(-Math.PI / 2);
    this.scene.add(mesh);
  }

  genUv(vertices, linePoints) {
    const distances = [];
    let fullLen = 0;
    let prevVector = null;
    let height = 0;
    // 列出同x同y坐标点的集合
    const map = new Map();
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];
      let key = x + "," + y;
      if (map.has(key)) {
        const v = map.get(key);
        v.push([x, y, z]);
      } else {
        map.set(key, [[x, y, z]]);
      }
    }
    // 集合中同x同y坐标按照z从小到大排序，并找出所有的底面坐标
    const bottomCoords = [];
    for (const [_, val] of map) {
      val.sort((a, b) => a[2] - b[2]);
      if (!height) height = val[val.length - 1][2] - val[val.length - 1][1];
      bottomCoords.push(val[0][0], val[0][1], val[0][2]);
    }
    // 获得计算uv时所需的变量
    for (let i = 0; i < linePoints.length; i += 2) {
      const x = linePoints[i];
      const y = linePoints[i + 1];
      let z = 0;
      for (let j = 0; j < bottomCoords.length; j += 3) {
        const bottomCoordx = bottomCoords[j];
        const bottomCoordy = bottomCoords[j + 1];
        const bottomCoordz = bottomCoords[j + 2];
        if (bottomCoordx === x && bottomCoordy === y) {
          z = bottomCoordz;
          break;
        }
      }
      if (i === 0) {
        prevVector = [x, y, z];
        continue;
      }
      const curVector = [x, y, z];
      const distance = this.distance(curVector, prevVector);
      fullLen += distance;
      distances.push(distance);
      prevVector = [x, y, z];
    }

    const uvInfos = [{ point: [linePoints[0], linePoints[1], 0], uv: [0, 0] }];
    let acc = 0;
    // 计算底面的uv坐标
    for (let i = 0; i < distances.length; i++) {
      const distance = distances[i];
      acc += distance;
      const point = [linePoints[(i + 1) * 2], linePoints[(i + 1) * 2 + 1], 0];
      uvInfos.push({
        point,
        uv: [acc / fullLen, 0],
      });
    }
    // 计算同x同y坐标的uv
    for (let i = 0; i < linePoints.length; i += 2) {
      const x = linePoints[i];
      const y = linePoints[i + 1];
      let u = 0;
      for (const uvInfo of uvInfos) {
        if (x === uvInfo.point[0] && y === uvInfo.point[1]) {
          u = uvInfo.uv[0];
          break;
        }
      }
      const key = x + "," + y;
      const coords = map.get(key);
      let startZ = coords[0][2];
      for (let j = 1; j < coords.length; j++) {
        const coord = coords[j];
        const x = coord[0];
        const y = coord[1];
        const z = coord[2];
        const v = (z - startZ) / height;
        uvInfos.push({
          point: [x, y, z],
          uv: [u, v],
        });
      }
    }
    const uv = [];
    for (let i = 0; i < vertices.length; i += 3) {
      const vertexX = vertices[i];
      const vertexY = vertices[i + 1];
      const vertexZ = vertices[i + 2];
      for (const uvInfo of uvInfos) {
        const point = uvInfo.point;
        const x = point[0];
        const y = point[1];
        const z = point[2];
        if (x === vertexX && y === vertexY && z === vertexZ) {
          uv.push(uvInfo.uv[0], uvInfo.uv[1]);
          break;
        }
      }
    }
    return uv;
  }

  distance(vector1, vector2) {
    const dx = vector1[0] - vector2[0],
      dy = vector1[1] - vector2[1],
      dz = vector1[2] - vector2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
