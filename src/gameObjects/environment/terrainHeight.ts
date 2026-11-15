/**
 * Generador Determinista de Terreno Lunar y Cráteres
 * Modelo matemático de relieve para Three.js y cinemática física.
 */

function mulberry32(a: number): [number, number] {
  let t = (a + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, t];
}

function rng(seed: number) {
  let s = seed;
  return () => {
    const [v, n] = mulberry32(s);
    s = n;
    return v;
  };
}

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface Crater {
  x: number;
  z: number;
  r: number;
  depth: number;
}

export function makeTerrain(kind: 'moon' | 'mars' = 'moon') {
  const r = rng(kind === 'moon' ? 11 : 23);
  const craters: Crater[] = [];
  const n = kind === 'moon' ? 16 : 9;

  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = 21 + r() * 32;
    craters.push({
      x: Math.cos(a) * d,
      z: Math.sin(a) * d,
      r: 3.5 + r() * (kind === 'moon' ? 8 : 6),
      depth: 0.8 + r() * 1.5,
    });
  }

  const amp = kind === 'moon' ? 1 : 1.35;
  const height = (x: number, z: number): number => {
    let h =
      amp *
      (0.9 * Math.sin(x * 0.13) * Math.cos(z * 0.11) +
        0.5 * Math.sin(x * 0.31 + 1.3) * Math.sin(z * 0.27) +
        0.22 * Math.sin(x * 0.7) * Math.cos(z * 0.63));

    for (const c of craters) {
      const d = Math.hypot(x - c.x, z - c.z) / c.r;
      if (d < 1) h -= c.depth * (1 - d * d);
      h += c.depth * 0.38 * Math.exp(-((d - 1.05) ** 2) * 18);
    }

    return h * smooth(8, 17, Math.hypot(x, z));
  };

  return { height, craters };
}

const lunarTerrain = makeTerrain('moon');

/** Altura determinista del suelo lunar en metros para coordenadas (x, z) */
export function groundHeight(x: number, z: number): number {
  const distanceFromStation = Math.max(Math.abs(x) / 17, Math.abs(z - 2) / 17);
  const outer = smooth(0.9, 1.45, distanceFromStation);
  return lunarTerrain.height(x, z) * outer;
}

export const lunarGroundHeight = groundHeight;
