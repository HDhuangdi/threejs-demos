import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { points, indexes, height, u_matrix } from "./vertex";

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
      100000
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
    requestAnimationFrame(this.render.bind(this));
  }

  initDevHelpers() {
    this.axesHelper = new THREE.AxesHelper(10000);
    this.scene.add(this.axesHelper);
  }

  initObject() {
    let lineVertices = [];
    const uv = this.genUv(points, height);
    for (let i = 0; i < points.length; i += 4) {
      const x = points[i];
      const y = points[i + 1];
      lineVertices.push(new THREE.Vector3(x, y, 0));
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setFromPoints(lineVertices);
    lineGeo.setAttribute(
      "a_height",
      new THREE.BufferAttribute(new Float32Array(height), 1)
    );
    lineGeo.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(uv), 2)
    );
    lineGeo.index = new THREE.BufferAttribute(new Uint16Array(indexes), 1);
    const lineMat = new THREE.ShaderMaterial({
      uniforms: {
        texturePic: {
          type: "sampler2D",
          value: new THREE.TextureLoader().load(
            // require("@/assets/images/earth-day.png")
            require("@/assets/images/building5.png")
          ),
        },
        u_height_t: {
          value: 0.0,
        },
        u_lightDirection: {
          value: this.light.position.normalize(),
        },
        u_lightColor: {
          value: this.light.color,
        },
      },
      vertexShader: `
        attribute float a_height;
        varying float height;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          height = a_height;
          vec3 pos_nx = floor(position.xyz * 0.5);
          height = max(0.0, height);

          float t = position.x - 2.0 * pos_nx.x;
          float z = t > 0.0 ? height : 0.0;

          vec3 p = vec3(pos_nx.xy, z);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D texturePic;
        void main() {
          float u = fract(vUv.x);
          vec2 uv = vec2(u, vUv.y);
          vec4 color = texture2D(texturePic, uv);
          gl_FragColor = vec4(color.rgb, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const line = new THREE.Mesh(lineGeo, lineMat);
    line.scale.set(1.0, 1.0, 10.0);
    line.rotateX(-Math.PI / 2);
    this.scene.add(line);
  }

  genUv(points, heightArray) {
    let vectices = [];
    for (let i = 0; i < points.length; i += 4) {
      vectices.push([points[i], points[i + 1], 0]);
    }
    /**
     * 获取当前瓦片里的建筑物
     */
    // let prevHeight = heightArray[0];
    // let buildings = [];
    // for (let i = 0; i < heightArray.length; i++) {
    //   if(heightArray[i] === 0) continue
    //   if (!vectices[i]) {
    //     break;
    //   }
    //   let prevBuilding = buildings.length
    //     ? buildings[buildings.length - 1]
    //     : null;
    //   if (prevHeight == heightArray[i]) {
    //     if (!prevBuilding) {
    //       buildings.push([vectices[i]]);
    //     } else {
    //       prevBuilding.push(vectices[i]);
    //     }
    //   } else {
    //     buildings.push([vectices[i]]);
    //   }
    //   prevHeight = heightArray[i];
    // }
    const uv = this.genBuildingUV(vectices);
    // for (const building of buildings) {
      // 每一栋建筑物都单独算uv坐标，将每个building的uv concat起来就是uvArray
      
    // }
    return uv;
  }

  genBuildingUV(buildingVertices) {
    /**
     * uv坐标算法思路：
     * 1. 保存uv坐标时，同时需要保存当前uv对应的顶点坐标
     * 2. 遍历当前建筑物的顶点，判断当前坐标是处于顶面还是底面，如果为顶面，v为1；如果是底面，v为0。收集底面
     * 3. 将底面根据斜率进行排序
     * 4. 遍历排序后的底面顶点，计算当前坐标(以底面为准)和下一个坐标的distance，并累加
     * 5. 根据累加的结果，可以计算出当前底面顶点的u坐标和顶面的u坐标
     * 6. 根据顶点数组的顺序，生成uv数组
     */
    const uvArray = new Array(buildingVertices.length * 2);
    const uvInfoMap = new Map();
    
    for (let i = 0; i < buildingVertices.length; i += 1) {
      let uv = [0, 0];
      const vector = buildingVertices[i];
      // 1
      if (this.isRoof(vector[0])) {
        uv[1] = 1;
      } else {
        uv[1] = 0;
      }
      // 2
      uvInfoMap.set(vector, uv);
    }

    // 3
    let count = 1;
    let buildingContinuousVertices = new Map();
    buildingContinuousVertices.set(buildingVertices[0], 1);
    buildingContinuousVertices.set(buildingVertices[1], 1);

    for (let i = 2; i < buildingVertices.length;) {
      const curVector = buildingVertices[i];
      const nextVector = buildingVertices[i + 1];
      if (!nextVector) break;
      if (this.isGroup(curVector, nextVector)) {
        i += 2;
        const uvfloor = uvInfoMap.get(curVector);
        uvfloor[0] = count;
        const uvroof = uvInfoMap.get(nextVector);
        uvroof[0] = count;
        buildingContinuousVertices.set(curVector, 1);
        buildingContinuousVertices.set(nextVector, 1);
        count++;
      } else {
        i += 1;
      }
    }

    // 对非连续的顶点，获取相近坐标的uv
    for (let i = 2; i < buildingVertices.length; i += 1) {
      let vector = buildingVertices[i];
      if (buildingContinuousVertices.has(vector)) continue;
      const value = this.sampling(uvInfoMap, vector)
      uvInfoMap.set(vector, value)
    }

    let index = 0
    for (const [key, value] of uvInfoMap) {
      uvArray[index] = value[0]
      uvArray[index + 1] = value[1]
      index += 2
    }
    console.log(uvInfoMap);
    return uvArray;
  }

  isRoof(x) {
    // 判断是顶面还是底面的规则：x坐标是奇数，顶面；偶数，底面
    return Math.abs(x % 2) > 0;
  }

  distance(vector1, vector2) {
    const dx = vector1[0] - vector2[0],
      dy = vector1[1] - vector2[1],
      dz = vector1[2] - vector2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  isGroup(vector1, vector2) {
    return Math.abs(vector1[0] - vector2[0]) === 1;
  }

  sampling(map, vector) {
    const key0 = [vector[0], vector[1]];
    const key1 = [vector[0] - 1, vector[1]];
    const key2 = [vector[0] + 1, vector[1]];
    const key3 = [vector[0], vector[1] - 1];
    const key4 = [vector[0], vector[1] - 1];

    let val = [0, 0];
    for (const [key, value] of map) {
      if (
        this.sameArrayKey(key, key0) ||
        this.sameArrayKey(key, key1) ||
        this.sameArrayKey(key, key2) ||
        this.sameArrayKey(key, key3) ||
        this.sameArrayKey(key, key4)
      ) {
        val = value;
        break;
      }
    }

    return val;
  }

  sameArrayKey(key1, key2) {
    return key1[0] === key2[0] && key1[1] === key2[1];
  }
}
