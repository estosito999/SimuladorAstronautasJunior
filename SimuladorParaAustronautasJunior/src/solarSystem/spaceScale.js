import * as THREE from 'three';

export const MOON_RADIUS = 55;
export const MOON_CENTER = new THREE.Vector3(0, -MOON_RADIUS, 0);

export const EARTH_RADIUS = MOON_RADIUS * 3.4;
export const SUN_RADIUS = MOON_RADIUS * 5.5;
export const MERCURY_RADIUS = MOON_RADIUS * 0.55;
export const VENUS_RADIUS = MOON_RADIUS * 0.95;
export const MARS_RADIUS = MOON_RADIUS * 0.75;
export const JUPITER_RADIUS = MOON_RADIUS * 3.8;
export const SATURN_RADIUS = MOON_RADIUS * 3.2;
export const URANUS_RADIUS = MOON_RADIUS * 1.6;
export const NEPTUNE_RADIUS = MOON_RADIUS * 1.6;

const EARTH_DISTANCE_FROM_MOON = MOON_RADIUS * 12;
export const SUN_DISTANCE_FROM_EARTH = MOON_RADIUS * 110;
const EARTH_FROM_MOON_DIRECTION = new THREE.Vector3(0.30, 0.20, -0.90).normalize();
export const SUN_FROM_EARTH_DIRECTION = EARTH_FROM_MOON_DIRECTION.clone();

export const EARTH_POSITION = MOON_CENTER
  .clone()
  .add(EARTH_FROM_MOON_DIRECTION.clone().multiplyScalar(EARTH_DISTANCE_FROM_MOON));

export const SUN_POSITION = EARTH_POSITION
  .clone()
  .add(SUN_FROM_EARTH_DIRECTION.clone().multiplyScalar(SUN_DISTANCE_FROM_EARTH));

function planetPosition(x, y, z, distance) {
  const direction = new THREE.Vector3(x, y, z).normalize();
  return MOON_CENTER.clone().add(direction.multiplyScalar(MOON_RADIUS * distance));
}

export const MERCURY_POSITION = planetPosition(-0.70, 0.16, -0.42, 28);
export const VENUS_POSITION = planetPosition(-0.28, 0.24, -0.77, 38);
export const MARS_POSITION = planetPosition(0.82, 0.12, -0.36, 52);
export const JUPITER_POSITION = planetPosition(-0.58, 0.10, 0.72, 82);
export const SATURN_POSITION = planetPosition(0.38, 0.16, 0.86, 108);
export const URANUS_POSITION = planetPosition(-0.86, 0.20, 0.20, 134);
export const NEPTUNE_POSITION = planetPosition(0.74, 0.18, 0.45, 160);
