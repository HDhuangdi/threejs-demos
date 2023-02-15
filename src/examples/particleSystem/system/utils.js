import * as THREE from "three";

export const randomNum = (min, max) => min + Math.random() * (max - min);


export const randomVector3 = (origin, radius, phiRange, thetaRange) => {
  const phi = randomNum(...phiRange) // 绕x轴夹角
  const theta = randomNum(...thetaRange) // 绕y轴夹角
  const _radius = randomNum(0, radius)
  const spherical = new THREE.Spherical(_radius, phi, theta)
  const vec = new THREE.Vector3().setFromSpherical(spherical)
  return origin.clone().add(vec)
};
