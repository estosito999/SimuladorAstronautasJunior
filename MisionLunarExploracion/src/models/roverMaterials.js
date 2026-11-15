import * as THREE from 'three';

export function enableShadows(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

export function createMaterial(options) {
  return new THREE.MeshPhongMaterial({
    shininess: 45,
    specular: 0x444444,
    ...options
  });
}
