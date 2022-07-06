import * as THREE from "three";
import Particle from "./particle";
import frag from './shaders/frag.glsl'
import vert from './shaders/vert.glsl'

export default class Emitter {
  constructor(params) {
    this.frameId = null
    this.clock = new THREE.Clock();
    this.pausing = false;

    this.setParams(params);
    this.initGeoMetry()
    this.createParticles();
  }

  setParams(params) {
    this.sizeTween = null;
    this.colorTween = null;
    this.opacityTween = null;

    this.particlesPerSecond = 100;
    this.particleDeathAge = 3;

    this.positionRange = [new THREE.Vector3(0, 0, 0), 20];

    this.directionRange = [
      [-Math.PI/ 10, Math.PI/ 10], // phi
      [0, Math.PI * 2], // theta
    ];

    this.speedRange = [5, 150];
    this.sizeRange = [20, 50];
    this.colorRange = [
      new THREE.Vector3(0, 0, 0),
      1,
    ];
    this.opacityRange = [0.5, 1];

    this.blendMode = THREE.NormalBlending;
    this.texture = null

    Object.assign(this, params);

    this.particleCount = this.particlesPerSecond * this.particleDeathAge;
    this.particles = new Array(this.particleCount);
  }

  createParticles() {
    const len = this.particles.length
    for (let i = 0; i < len; i++) {
      this.particles[i] = new Particle(this);
    }
    this.geo.setFromPoints(new Float32Array(new Array(len)))
    this.geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(new Array(len * 3)), 3))
    this.geo.setAttribute('opacity', new THREE.BufferAttribute(new Float32Array(new Array(len)), 1))
    this.geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(new Array(len)), 1))
  }

  initGeoMetry() {
    this.geo = new THREE.BufferGeometry()
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        'u_texture': {
          value: this.texture
        },
        'u_opacity': {
          value: 0
        },
      },
      vertexShader: vert(),
      fragmentShader: frag(),
      transparent: true,
      depthTest: false,
      blending: this.blendMode,
    })
    this.mesh = new THREE.Points(this.geo, this.material)
  }

  pause() {
    this.pausing = true
    cancelAnimationFrame(this.frameId)
  }

  play() {
    this.pausing = false
    this.update(true);
  }

  fire() {
    this.pausing = false
    this.update();
  }

  update(isContinue) {
    let delta = this.clock.getDelta();
    if (isContinue) delta = 0.016
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]
      particle.move(delta)

      const opacityAttri = this.geo.attributes.opacity
      opacityAttri.array[i] = particle.opacity
      opacityAttri.needsUpdate = true

      const posAttri = this.geo.attributes.position
      posAttri.array[i * 3] = particle.position.x
      posAttri.array[i * 3 + 1] = particle.position.y
      posAttri.array[i * 3 + 2] = particle.position.z
      posAttri.needsUpdate = true

      const colorAttri = this.geo.attributes.color
      colorAttri.array[i * 3] = particle.color.x
      colorAttri.array[i * 3 + 1] = particle.color.y
      colorAttri.array[i * 3 + 2] = particle.color.z
      colorAttri.needsUpdate = true

      const sizeAttri = this.geo.attributes.size
      sizeAttri.array[i] = particle.size
      sizeAttri.needsUpdate = true

    }

    this.frameId = requestAnimationFrame(this.update.bind(this));
  }
}
