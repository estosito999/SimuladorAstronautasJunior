export const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
export const round = (v, d = 0) => { const p = 10 ** d; return Math.round(v * p) / p; };

/** Deterministic PRNG (mulberry32). Returns [value in 0..1, nextSeed]. Keeps missions save/load-safe. */
export function mulberry32(seed) {
  const t = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t];
}

export const radiationLevel = (v) => (v < 30 ? 'LOW' : v < 55 ? 'MEDIUM' : v < 80 ? 'HIGH' : 'CRITICAL');
export const gradeFor = (s) => (s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F');
export const titleFor = (s) =>
  s >= 90 ? 'EXCELLENT MISSION COMMANDER' : s >= 80 ? 'SKILLED MISSION COMMANDER' : s >= 70 ? 'CAPABLE COMMANDER' : s >= 60 ? 'ROOKIE COMMANDER' : 'CADET IN TRAINING';
export const pad2 = (n) => String(n).padStart(2, '0');
