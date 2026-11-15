import * as THREE from 'three';
import {
  SUN_POSITION,
  SUN_DISTANCE_FROM_EARTH,
  MERCURY_POSITION,
  MERCURY_RADIUS,
  VENUS_POSITION,
  VENUS_RADIUS,
  MARS_POSITION,
  MARS_RADIUS,
  JUPITER_POSITION,
  JUPITER_RADIUS,
  SATURN_POSITION,
  SATURN_RADIUS,
  URANUS_POSITION,
  URANUS_RADIUS,
  NEPTUNE_POSITION,
  NEPTUNE_RADIUS
} from '../spaceScale.js';

function createPlanet(scene, settings, textures) {
  const [name, position, radius, orbitScale, rotationSpeed] = settings;
  const orbitGroup = new THREE.Group();
  orbitGroup.position.copy(SUN_POSITION);
  scene.add(orbitGroup);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 40, 40),
    new THREE.MeshPhongMaterial({
      shininess: 45,
      specular: 0x444444,
      map: textures[name + 'Texture']
    })
  );

  planet.name = name[0].toUpperCase() + name.slice(1);
  planet.castShadow = false;
  planet.receiveShadow = false;
  orbitGroup.add(planet);

  const initialOffset = position.clone().sub(SUN_POSITION);

  return {
    planet,
    orbit: {
      radius: SUN_DISTANCE_FROM_EARTH * orbitScale,
      angle: Math.atan2(initialOffset.z, initialOffset.x),
      angularSpeed: 0.012 / orbitScale
    },
    rotationSpeed
  };
}

function updateOrbitPosition(model) {
  const { orbit, planet } = model;
  planet.position.set(
    Math.cos(orbit.angle) * orbit.radius,
    0,
    Math.sin(orbit.angle) * orbit.radius
  );
}

function createSaturnRingGeometry(innerRadius, outerRadius, segments) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    positions.push(innerRadius * cos, 0, innerRadius * sin);
    positions.push(outerRadius * cos, 0, outerRadius * sin);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(0, i / segments, 1, i / segments);
  }

  for (let i = 0; i < segments; i += 1) {
    const innerA = i * 2;
    const outerA = innerA + 1;
    const innerB = innerA + 2;
    const outerB = innerA + 3;
    indices.push(innerA, outerA, innerB, outerA, outerB, innerB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();
  return geometry;
}

export function createPlanets(scene, textures) {
  const settings = [
    ['mercury', MERCURY_POSITION, MERCURY_RADIUS, 0.45, 0.55],
    ['venus', VENUS_POSITION, VENUS_RADIUS, 0.72, -0.32],
    ['mars', MARS_POSITION, MARS_RADIUS, 1.35, 0.42],
    ['jupiter', JUPITER_POSITION, JUPITER_RADIUS, 1.85, 0.75],
    ['saturn', SATURN_POSITION, SATURN_RADIUS, 2.45, 0.62],
    ['uranus', URANUS_POSITION, URANUS_RADIUS, 3, -0.38],
    ['neptune', NEPTUNE_POSITION, NEPTUNE_RADIUS, 3.55, 0.36]
  ];
  const planets = {};
  for (const planet of settings) {
    planets[planet[0]] = createPlanet(scene, planet, textures);
  }

  const saturnRings = new THREE.Mesh(
    createSaturnRingGeometry(SATURN_RADIUS * 1.18, SATURN_RADIUS * 2.25, 128),
    new THREE.MeshPhongMaterial({
      shininess: 45,
      specular: 0x444444,
      map: textures.saturnRingTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      alphaTest: 0.03,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  saturnRings.rotation.x = Math.PI * 0.38;
  saturnRings.renderOrder = 2;
  saturnRings.castShadow = false;
  saturnRings.receiveShadow = false;
  planets.saturn.planet.add(saturnRings);

  for (const planet of Object.values(planets)) updateOrbitPosition(planet);
  return planets;
}

export function updatePlanets(planets, dt) {
  for (const model of Object.values(planets)) {
    model.planet.rotation.y += dt * model.rotationSpeed;
    model.orbit.angle += dt * model.orbit.angularSpeed;
    updateOrbitPosition(model);
  }
}
