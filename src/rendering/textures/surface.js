import { createSeededRandom } from '../../random.js';
import * as THREE from 'three';

export function makeCanvasTexture(base, spots, count) {
  const size = 128;
  const [canvas, ctx] = createCanvas(size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 6 + 1;
    ctx.fillStyle = spots;
    ctx.globalAlpha = 0.25 + Math.random() * 0.35;
    fillCircle(ctx, x, y, r);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeNoiseMap(base, spots, size, count, seed) {
  const random = createSeededRandom(seed);
  const [canvas, ctx] = createCanvas(size);
  ctx.fillStyle = `rgb(${base}, ${base}, ${base})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 1 + random() * 7;
    const shade = Math.floor(THREE.MathUtils.lerp(base, spots, random()));
    ctx.globalAlpha = 0.18 + random() * 0.28;
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    fillCircle(ctx, x, y, radius);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  return texture;
}

function createCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  return [canvas, canvas.getContext('2d')];
}

function fillCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

