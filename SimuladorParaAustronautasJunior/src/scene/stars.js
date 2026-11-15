import { createSeededRandom } from '../random.js';
import * as THREE from 'three';

function createStarSpriteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.22, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.62, 'rgba(255, 255, 255, 0.86)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStars(scene) {
  const random = createSeededRandom(24022025);
  const positions = [];
  const colors = [];
  const starRadius = 18000;

  for (let i = 0; i < 3500; i += 1) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.lerp(-1, 1, random()));
    const radius = starRadius * THREE.MathUtils.lerp(0.82, 1, random());

    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );

    const brightness = THREE.MathUtils.lerp(0.9, 1, random());
    const warmth = random();
    colors.push(
      brightness,
      brightness * THREE.MathUtils.lerp(0.88, 1, warmth),
      brightness * THREE.MathUtils.lerp(0.82, 1, 1 - warmth)
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    map: createStarSpriteTexture(),
    size: 4.2,
    sizeAttenuation: false,
    vertexColors: true,
    depthWrite: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
    alphaTest: 0.005,
    toneMapped: false
  });

  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false;
  stars.renderOrder = -100;
  stars.onBeforeRender = (renderer, renderedScene, camera) => {
    stars.position.copy(camera.position);
  };

  scene.add(stars);
  return stars;
}
