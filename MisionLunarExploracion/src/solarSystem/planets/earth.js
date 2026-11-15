import * as THREE from 'three';
import {
  EARTH_POSITION,
  EARTH_RADIUS,
  SUN_POSITION,
  SUN_DISTANCE_FROM_EARTH
} from '../spaceScale.js';

export function createEarth(scene, { earthTexture, earthNightTexture }) {
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, 40, 40),
    new THREE.MeshPhongMaterial({
      shininess: 12,
      specular: 0x222222,
      map: earthTexture,
      emissive: 0xffffff,
      emissiveMap: earthNightTexture,
      emissiveIntensity: 0.8,
    })
  );

  earth.castShadow = false;
  earth.receiveShadow = false;

  scene.add(earth);

  const initialOffset = EARTH_POSITION.clone().sub(SUN_POSITION);

  const model = {
    earth,
    orbit: {
      radius: SUN_DISTANCE_FROM_EARTH,
      angle: Math.atan2(initialOffset.z, initialOffset.x),
      angularSpeed: 0.012
    }
  };

  updateEarthOrbit(model);
  return model;
}

function updateEarthOrbit(earthModel) {
  const orbit = earthModel.orbit;

  earthModel.earth.position.set(
    SUN_POSITION.x + Math.cos(orbit.angle) * orbit.radius,
    SUN_POSITION.y,
    SUN_POSITION.z + Math.sin(orbit.angle) * orbit.radius
  );
}

export function updateEarth(earthModel, dt) {
  earthModel.earth.rotation.y += dt * 0.25;
  earthModel.orbit.angle += dt * earthModel.orbit.angularSpeed;
  updateEarthOrbit(earthModel);
}
