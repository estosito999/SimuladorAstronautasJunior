import * as THREE from 'three';
import { makeCanvasTexture, makeNoiseMap } from './textures/surface.js';

export function createProjectTextures() {
  const loader = new THREE.TextureLoader();

  function load(file) {
    const texture = loader.load('./assets/' + file);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 8;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const spaceTexture = load('stars_milky_way.jpg');
  spaceTexture.mapping = THREE.EquirectangularReflectionMapping;

  return {
    spaceTexture,
    moonTexture: load('moon.jpg'),
    metalTexture: makeCanvasTexture('#b8bcc5', '#6b7280', 120),
    wheelTexture: makeCanvasTexture('#202020', '#444444', 100),
    wheelBumpMap: makeNoiseMap(120, 230, 128, 220, 4307),
    earthTexture: load('earth_daymap.jpg'),
    earthNightTexture: load('earth_nightmap.jpg'),
    mercuryTexture: load('mercury.jpg'),
    venusTexture: load('venus.jpg'),
    marsTexture: load('mars.jpg'),
    jupiterTexture: load('jupiter.jpg'),
    saturnTexture: load('saturn.jpg'),
    uranusTexture: load('uranus.jpg'),
    saturnRingTexture: load('saturn_ring.png'),
    neptuneTexture: load('neptune.jpg')
  };
}
