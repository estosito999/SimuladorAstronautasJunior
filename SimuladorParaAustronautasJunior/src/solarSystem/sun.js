import * as THREE from 'three';
import { SUN_POSITION, SUN_RADIUS, SUN_FROM_EARTH_DIRECTION } from './spaceScale.js';

const SUN_SHADOW_DISTANCE = 900;
const SUN_SHADOW_BOX_SIZE = 12;

export function createSun(scene) {

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.08);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 2.7);
  sunLight.position.copy(SUN_FROM_EARTH_DIRECTION).normalize().multiplyScalar(SUN_SHADOW_DISTANCE);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.bias = -0.000005;
  sunLight.shadow.normalBias = 0.002;

  sunLight.shadow.camera.near = SUN_SHADOW_DISTANCE - 120;
  sunLight.shadow.camera.far = SUN_SHADOW_DISTANCE + 120;
  sunLight.shadow.camera.left = -SUN_SHADOW_BOX_SIZE;
  sunLight.shadow.camera.right = SUN_SHADOW_BOX_SIZE;
  sunLight.shadow.camera.top = SUN_SHADOW_BOX_SIZE;
  sunLight.shadow.camera.bottom = -SUN_SHADOW_BOX_SIZE;

  const sunTarget = new THREE.Object3D();
  scene.add(sunTarget);
  sunLight.target = sunTarget;

  scene.add(sunLight);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS, 40, 40),
    new THREE.MeshBasicMaterial({ color: 0xffcc33 })
  );
  sun.position.copy(SUN_POSITION);
  scene.add(sun);

  return {
    ambientLight,
    sunLight,
    sunTarget,
    sun
  };
}
