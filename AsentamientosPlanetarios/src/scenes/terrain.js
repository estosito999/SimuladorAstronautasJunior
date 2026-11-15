import { mulberry32 } from '../utils/calculations.js';

export function rng(seed) {
  let s = seed;
  return () => { const [v, n] = mulberry32(s); s = n; return v; };
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Deterministic cartoon terrain: gentle rolling hills + stylized craters, flat around the base. */
export function makeTerrain(kind) {
  const r = rng(kind === 'moon' ? 11 : 23);
  const craters = [];
  const n = kind === 'moon' ? 16 : 9;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = 21 + r() * 32;
    craters.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: 3.5 + r() * (kind === 'moon' ? 8 : 6), depth: 0.8 + r() * 1.5 });
  }
  const amp = kind === 'moon' ? 1 : 1.35;
  const height = (x, z) => {
    let h = amp * (0.9 * Math.sin(x * 0.13) * Math.cos(z * 0.11) + 0.5 * Math.sin(x * 0.31 + 1.3) * Math.sin(z * 0.27) + 0.22 * Math.sin(x * 0.7) * Math.cos(z * 0.63));
    for (const c of craters) {
      const d = Math.hypot(x - c.x, z - c.z) / c.r;
      if (d < 1) h -= c.depth * (1 - d * d);
      h += c.depth * 0.38 * Math.exp(-((d - 1.05) ** 2) * 18);
    }
    return h * smooth(8, 17, Math.hypot(x, z));
  };
  return { height, craters };
}
