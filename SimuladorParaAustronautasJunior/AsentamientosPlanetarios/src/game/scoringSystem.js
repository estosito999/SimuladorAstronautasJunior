import { clamp, gradeFor, titleFor, round } from '../utils/calculations.js';
import { MODULES } from '../data/modules.js';

export const WEIGHTS = { crew: 25, power: 15, resources: 15, radiation: 10, science: 15, hazard: 10, infra: 5, completion: 5 };
const QV = { best: 1, ok: 0.6, poor: 0.15 };

export function scienceTarget(difficultyBase, duration) {
  return Math.min(65, Math.round(difficultyBase * Math.pow(duration / 20, 0.7)));
}

export function categories(s) {
  const h = s.history.length ? s.history : [{ ...s.resources }];
  const n = h.length;
  const avg = (k) => h.reduce((a, x) => a + x[k], 0) / n;
  const crew = clamp(0.6 * avg('crewHealth') + 0.4 * s.resources.crewHealth);
  const power = clamp(0.5 * (100 - (s.lowPowerCycles / n) * 150) + 0.5 * clamp(avg('power') * 1.3));
  const resources = clamp(((avg('oxygen') + avg('water') + avg('food')) / 3) * 1.1 - (s.lowResCycles / n) * 60);
  const radiation = clamp(100 - s.resources.radiation * 1.05);
  const science = clamp((s.resources.science / Math.max(1, s.scienceTarget)) * 100);
  const hazard = s.decisions.length ? clamp((s.decisions.reduce((a, d) => a + QV[d.quality], 0) / s.decisions.length) * 100) : 80;
  const types = new Set(s.modules.map((m) => m.type)).size;
  const cond = s.modules.length ? s.modules.reduce((a, m) => a + m.condition, 0) / s.modules.length : 0;
  const infra = clamp((types / Object.keys(MODULES).length) * 60 + cond * 0.4);
  const completion = clamp(((s.cyclesDone || 0) / s.duration) * 100);
  return { crew, power, resources, radiation, science, hazard, infra, completion };
}

export function totalScore(s) {
  const c = categories(s);
  let total = Object.keys(WEIGHTS).reduce((a, k) => a + (c[k] * WEIGHTS[k]) / 100, 0);
  if (s.missionStatus === 'failure') total = Math.min(total * 0.6, 50);
  return clamp(Math.round(total));
}

export function report(s) {
  const score = totalScore(s);
  return { score, grade: gradeFor(score), title: titleFor(score), categories: categories(s) };
}

export function lessons(s) {
  const out = [];
  const n = Math.max(1, s.history.length);
  const c = categories(s);
  if (s.lowPowerCycles / n > 0.15) out.push('Increasing power generation alone is not enough. Storage, consumption, environmental conditions and redundancy all affect reliability — your batteries ran low in several cycles.');
  else out.push('You kept energy generation, storage and consumption in balance — the core of reliable surface power.');
  if (c.radiation < 55) out.push('Radiation exposure builds up over time. Shields and shelters cost build points, but unshielded exposure costs crew health later.');
  else out.push('Your shielding kept cumulative radiation exposure under control.');
  if (s.lowResCycles / n > 0.2) out.push('Oxygen, water and food are linked to power and to each other. When one system slipped, the others followed.');
  if (c.science < 50 && s.missionStatus !== 'failure') out.push('Science is the reason for the mission, but only a stable outpost can afford it. Plan science for quiet cycles.');
  if (c.science >= 80) out.push('You balanced survival with exploration — the heart of mission planning.');
  const poor = s.decisions.filter((d) => d.quality === 'poor').length;
  if (poor >= 2) out.push('Several choices were high-risk. Think about what a decision costs later, not only right now.');
  if (s.modules.every((m) => m.type !== 'comms')) out.push('Without a Comm Relay you had no hazard forecasts. Early warning gives you time to prepare.');
  if (!s.hazardsEncountered.length) out.push('Quiet missions are lucky ones. Real mission planners prepare for hazards that may never come.');
  return out.slice(0, 5);
}

export { round };
