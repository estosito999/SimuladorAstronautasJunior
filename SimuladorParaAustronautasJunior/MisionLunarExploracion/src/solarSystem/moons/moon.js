import * as THREE from 'three';
import { MOON_CENTER, MOON_RADIUS } from '../spaceScale.js';

export function createMoon(
  scene,
  { moonTexture, moonCenter = MOON_CENTER }
) {
  const moonRadius = MOON_RADIUS;
  const localMoonCenter = moonCenter.clone();

  const rotationGroup = new THREE.Group();
  rotationGroup.name = 'MoonRotationGroup';
  rotationGroup.position.copy(localMoonCenter);
  scene.add(rotationGroup);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(moonRadius, 64, 64),
    new THREE.MeshPhongMaterial({
      shininess: 1,
      specular: 0x000000,
      map: moonTexture,
    })
  );
  moon.rotation.z = Math.PI / 2;
  moon.receiveShadow = true;
  rotationGroup.add(moon);

  return {
    moon,
    rotationGroup,
    surface: {
      center: new THREE.Vector3(),
      radius: moonRadius,
      roverHeight: 0.62
    }
  };
}

export function updateMoon(moonModel, dt) {
  moonModel.rotationGroup.rotateY(dt * 0.04);
}
