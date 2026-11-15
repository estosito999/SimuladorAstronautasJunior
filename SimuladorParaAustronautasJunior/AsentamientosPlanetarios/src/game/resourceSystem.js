import { MODULES } from '../data/modules.js';
import { getDest } from '../data/destinations.js';
import { clamp } from '../utils/calculations.js';
import { dustEfficiencyAtCoverage, calculateSolarGeneration, calculatePowerDemand, advancePowerStore } from './powerModel.js';

// GAME SIMULATION VALUES — difficulty changes starting resources, hazard frequency, consumption and score requirements.
export const DIFFICULTY = {
  cadet: { id: 'cadet', label: 'CADET', blurb: 'Roomy budget, gentle hazards.', build: 100, startRes: 100, consume: 0.85, hazard: 0.24, radMult: 0.85, sciBase: 30, minScience: 1 },
  commander: { id: 'commander', label: 'COMMANDER', blurb: 'A balanced challenge.', build: 85, startRes: 92, consume: 1, hazard: 0.34, radMult: 1, sciBase: 45, minScience: 2 },
  specialist: { id: 'specialist', label: 'MISSION SPECIALIST', blurb: 'Tight budget, frequent hazards.', build: 70, startRes: 82, consume: 1.2, hazard: 0.44, radMult: 1.2, sciBase: 60, minScience: 3 },
};
export const BUILD_INCOME = 2; // supply credits per cycle

export const counts = (s) => s.modules.reduce((a, m) => ((a[m.type] = (a[m.type] || 0) + 1), a), {});
export const eff = (s, type) => s.modules.filter((m) => m.type === type).reduce((a, m) => a + m.condition / 100, 0);

export function fxMods(s) {
  const m = { solar: 1, demand: 1, rad: 1, comm: 0, sci: 1, ls: 1 };
  for (const e of s.effects || []) {
    for (const [k, v] of Object.entries(e.mods || {})) {
      if (k === 'comm') m.comm += v; else m[k] = (m[k] ?? 1) * v;
    }
  }
  return m;
}

export const batteryCapacity = (s) => 50 + MODULES.battery.storage * eff(s, 'battery');
export const housing = (s) => (counts(s).habitat || 0) * MODULES.habitat.housing;
export const labCount = (s) => counts(s).lab || 0;

export function lightFactor(dest, cycle) {
  const D = getDest(dest).sim;
  if (D.lightPattern) return D.lightPattern[(cycle - 1) % D.lightPattern.length];
  return D.solarBase * (1 + 0.1 * Math.sin((cycle / D.seasonLen) * Math.PI * 2));
}
export const dustEfficiency = (s) => dustEfficiencyAtCoverage(s.dust);
export function solarOutput(s, cycle = s.cycle) {
  return calculateSolarGeneration({ arrays: eff(s, 'solar'), ratedPower: MODULES.solar.gen,
    light: lightFactor(s.destination, cycle), dustEfficiency: dustEfficiency(s), effects: fxMods(s).solar });
}
export function shieldFraction(s) {
  const c = counts(s);
  return Math.min(0.8, MODULES.shield.shield * eff(s, 'shield') + (c.habitat ? 0.1 : 0));
}
export function commLevel(s) {
  const D = getDest(s.destination).sim;
  const hasRelay = (counts(s).comms || 0) > 0;
  return clamp(D.commBase + (hasRelay ? 30 : 0) + fxMods(s).comm);
}
export const sciencePowerActive = (s) => !s.conserve && fxMods(s).sci > 0;

export function powerDemand(s) {
  const D = getDest(s.destination).sim;
  const fx = fxMods(s);
  let base = D.baseLoad;
  for (const m of s.modules) {
    const d = MODULES[m.type].demand || 0;
    if (!d) continue;
    if (s.conserve) base += m.type === 'lab' ? 0 : m.type === 'comms' ? d * 0.5 : d * 0.92;
    else base += d;
  }
  let science = 0;
  if (sciencePowerActive(s)) science = (s.activeScience || []).reduce((a, x) => a + (x.power || 0), 0);
  return calculatePowerDemand({ base, science, multiplier: fx.demand });
}

/** Projected per-cycle power net (for HUD and warnings). */
export function powerForecast(s) {
  const gen = solarOutput(s);
  const dem = powerDemand(s).total;
  const cap = batteryCapacity(s);
  const units = (clamp(s.resources.power) / 100) * cap;
  const net = gen - dem;
  return { gen, dem, net, cap, units, cyclesLeft: net < 0 ? units / -net : Infinity };
}

/** Advance resource simulation by one cycle (mutates s). Returns a report. */
export function stepResources(s) {
  const D = getDest(s.destination).sim;
  const diff = DIFFICULTY[s.difficulty] || DIFFICULTY.commander;
  const fx = fxMods(s);
  const c = counts(s);
  const crew = s.crewSize;
  const cm = diff.consume;
  const r = s.resources;

  // POWER
  const cap = batteryCapacity(s);
  const stored = (clamp(r.power) / 100) * cap;
  const gen = solarOutput(s);
  const dem = powerDemand(s);
  const { stored: nextStored, ratio } = advancePowerStore({ capacity: cap, stored, generation: gen, demand: dem.total });
  r.power = clamp((nextStored / cap) * 100);
  const pf = ratio >= 1 ? 1 : 0.2 + 0.8 * ratio; // brownout penalty on powered systems

  // OXYGEN / WATER / FOOD
  const o2Prod = eff(s, 'lifeSupport') * MODULES.lifeSupport.oxygen * pf * fx.ls + eff(s, 'greenhouse') * MODULES.greenhouse.oxygen * pf;
  const o2Use = crew * 1.5 * cm;
  const waterProd = eff(s, 'recycler') * MODULES.recycler.water * pf;
  const waterUse = crew * 1.2 * cm + (c.greenhouse || 0) * MODULES.greenhouse.waterUse + (c.lifeSupport || 0) * 0.5;
  const ghFactor = r.water < 5 ? 0.4 : 1;
  const foodProd = eff(s, 'greenhouse') * MODULES.greenhouse.food * pf * ghFactor;
  const foodUse = crew * 1.3 * cm;
  r.oxygen = clamp(r.oxygen + o2Prod - o2Use);
  r.water = clamp(r.water + waterProd - waterUse);
  r.food = clamp(r.food + foodProd - foodUse);

  // RADIATION (cumulative exposure)
  const radRate = (D.radiationTotal / s.duration) * diff.radMult * fx.rad * (1 - shieldFraction(s));
  r.radiation = clamp(r.radiation + radRate);

  // CREW HEALTH
  let dh = 0;
  const reasons = [];
  if (r.oxygen < 8) { dh -= 10; reasons.push('Oxygen is dangerously low'); } else if (r.oxygen < 20) { dh -= 4; reasons.push('Oxygen is low'); }
  if (r.water < 20) { dh -= r.water <= 2 ? 6 : 3; reasons.push('Water is low'); }
  if (r.food < 20) { dh -= r.food <= 2 ? 6 : 3; reasons.push('Food is low'); }
  if (r.radiation >= 60) { dh -= (r.radiation - 55) / 8; reasons.push('Radiation exposure is harming the crew'); }
  if (crew > housing(s)) { dh -= 3; reasons.push('Habitat is overcrowded'); }
  if (ratio < 0.6) { dh -= 3; reasons.push('Power shortage: heating and life support strained'); }
  if (!reasons.length) dh += (counts(s).habitat ? 2.5 : 1);
  r.crewHealth = clamp(r.crewHealth + dh);

  // wear & dust
  s.dust = clamp(s.dust + D.dustRate);
  for (const m of s.modules) m.condition = clamp(m.condition - 1, 5, 100);

  return { gen, demand: dem.total, ratio, net: gen - dem.total, reasons, cap };
}
