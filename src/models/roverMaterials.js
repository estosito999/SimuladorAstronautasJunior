import * as THREE from 'three';

export function enableShadows(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

export function createMaterial(options = {}) {
  // Integrated hosts may deliberately omit optional textures. Passing an
  // undefined map to Three.js emits a warning; keep its normal material default.
  const supplied = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
  return new THREE.MeshPhongMaterial({
    shininess: 45,
    specular: 0x444444,
    ...supplied
  });
}
