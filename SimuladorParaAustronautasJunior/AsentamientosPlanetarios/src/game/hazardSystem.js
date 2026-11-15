import { HAZARDS, getHazard } from '../data/hazards.js';
import { mulberry32, clamp } from '../utils/calculations.js';
import { DIFFICULTY, shieldFraction } from './resourceSystem.js';

export function rnd(s) {
  const [v, next] = mulberry32(s.seed);
  s.seed = next;
  return v;
}

/** Decide which hazard (if any) strikes at the start of `forCycle`. Mutates seed only. */
export function rollHazard(s, forCycle) {
  const diff = DIFFICULTY[s.difficulty] || DIFFICULTY.commander;
  const pool = HAZARDS.filter((h) => h.dest.includes(s.destination) && h.minCycle <= forCycle && h.id !== s.lastHazardId);
  if (!pool.length || forCycle > s.duration) return null;
  let chance = diff.hazard;
  if (s.lastEventCycle === forCycle - 1) chance *= 0.3;
  if ((s.hazardsEncountered || []).length === 0 && forCycle > s.duration * 0.5) chance = 0.85;
  if (rnd(s) > chance) return null;
  const total = pool.reduce((a, h) => a + h.weight, 0);
  let t = rnd(s) * total;
  for (const h of pool) { t -= h.weight; if (t <= 0) return h.id; }
  return pool[pool.length - 1].id;
}

/** Apply the immediate effects of a hazard when it appears. Mutates s. */
export function presentHazard(s, id) {
  const h = getHazard(id);
  if (!h) return;
  const st = h.start || {};
  const lines = [];
  if (st.effect) { s.effects.push({ ...structuredClone(st.effect), remaining: st.effect.duration }); lines.push(st.effect.label); }
  if (st.dust) { s.dust = clamp(s.dust + st.dust); lines.push('Panel dust +' + st.dust); }
  if (st.radiation) {
    const add = st.shieldable ? st.radiation * (1 - shieldFraction(s)) : st.radiation;
    s.resources.radiation = clamp(s.resources.radiation + add);
    lines.push('Radiation +' + Math.round(add));
  }
  if (st.delta) for (const [k, v] of Object.entries(st.delta)) s.resources[k] = clamp(s.resources[k] + v);
  let damaged = null;
  if (st.damage && s.modules.length) {
    const pick = s.modules[Math.floor(rnd(s) * s.modules.length)];
    const before = pick.condition;
    pick.condition = clamp(pick.condition - st.damage, 5, 100);
    damaged = { uid: pick.uid, type: pick.type, amount: before - pick.condition };
    lines.push('Module damaged');
  }
  s.pendingEvent = { id, damaged, lines, cycle: s.cycle };
  s.lastHazardId = id;
  s.lastEventCycle = s.cycle;
  s.hazardsEncountered.push({ id, title: h.title, cycle: s.cycle });
}
