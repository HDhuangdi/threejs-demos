import * as THREE from "three";

export default class FullScreenQuad {
  constructor(width, height, material) {
    this._scene = new THREE.Scene();
    this._geo = new THREE.PlaneGeometry(width, height);
    this._mesh = new THREE.Mesh(this._geo, material);
    this._scene.add(this._mesh);

    this._camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000
    );
    this._camera.position.set(0, 0, 300);
    this._camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  dispose() {
    this._mesh.geometry.dispose();
  }

  render(renderer) {
    renderer.render(this._mesh, this._camera);
  }
}
