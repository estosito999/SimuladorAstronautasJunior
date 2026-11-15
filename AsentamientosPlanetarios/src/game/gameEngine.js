import { clamp } from '../utils/calculations.js';
import { getDest } from '../data/destinations.js';
import { SCIENCE } from '../data/scienceMissions.js';
import { stepResources, fxMods, powerForecast, BUILD_INCOME } from './resourceSystem.js';
import { rnd, rollHazard, presentHazard } from './hazardSystem.js';
import { evaluateEnd } from './missionSystem.js';
import { totalScore } from './scoringSystem.js';

export * from './missionSystem.js';
export { resolveChoice, choiceAvailable } from './decisionSystem.js';
export * from './resourceSystem.js';
export * from './scoringSystem.js';

const LABEL = { power: 'Power', oxygen: 'Oxygen', water: 'Water', food: 'Food', crewHealth: 'Crew health' };

function alertsFor(prev, s) {
  const out = [];
  const r = s.resources;
  for (const k of ['power', 'oxygen', 'water', 'food']) {
    if (prev[k] >= 12 && r[k] < 12) out.push({ kind: 'critical', resource: k, text: `${LABEL[k]} is critical!` });
    else if (prev[k] >= 30 && r[k] < 30) out.push({ kind: 'warn', resource: k, text: `${LABEL[k]} is getting low.` });
  }
  if (prev.crewHealth >= 25 && r.crewHealth < 25) out.push({ kind: 'critical', resource: 'crewHealth', text: 'Crew health is critical!' });
  else if (prev.crewHealth >= 50 && r.crewHealth < 50) out.push({ kind: 'warn', resource: 'crewHealth', text: 'Crew health is dropping.' });
  if (prev.radiation < 80 && r.radiation >= 80) out.push({ kind: 'critical', resource: 'radiation', text: 'Radiation exposure is critical!' });
  else if (prev.radiation < 55 && r.radiation >= 55) out.push({ kind: 'warn', resource: 'radiation', text: 'Radiation exposure is rising.' });
  const p = out.find((a) => a.resource === 'power');
  if (p) {
    const f = powerForecast(s);
    if (Number.isFinite(f.cyclesLeft)) p.detail = `Battery reserves will last approximately ${Math.max(1, Math.ceil(f.cyclesLeft))} more cycle${Math.ceil(f.cyclesLeft) > 1 ? 's' : ''}.`;
  }
  return out;
}

/** Advance the mission by one cycle. Pure: returns new state. */
export function advanceCycle(state) {
  if (state.missionStatus !== 'active' || state.phase !== 'play' || state.pendingEvent || state.lastOutcome) return state;
  const s = structuredClone(state);
  const prev = { ...s.resources };
  const c = s.cycle;
  const fx = fxMods(s);
  const items = [];

  const rep = stepResources(s);

  // science progress
  if (!s.conserve && fx.sci > 0) {
    const finished = [];
    for (const a of s.activeScience) {
      a.progress += fx.sci;
      if (a.progress >= a.cycles - 1e-6) finished.push(a);
    }
    for (const a of finished) {
      const def = (SCIENCE[s.destination] || []).find((x) => x.id === a.id);
      s.activeScience = s.activeScience.filter((x) => x !== a);
      const chance = def.chance * (s.resources.crewHealth < 40 ? 0.8 : 1);
      if (rnd(s) <= chance) {
        const repeats = s.completedScience.filter((x) => x.id === a.id).length;
        const pts = Math.round(def.points * (repeats ? 0.5 : 1));
        s.resources.science = clamp(s.resources.science + pts);
        if (def.reward) for (const [k, v] of Object.entries(def.reward)) s.resources[k] = clamp(s.resources[k] + v);
        s.completedScience.push({ id: a.id, name: def.name, cycle: c, points: pts });
        s.log.unshift({ cycle: c, tone: 'good', text: `Science complete: ${def.name} (+${pts})` });
        items.push({ kind: 'science', name: def.name, points: pts, real: def.real });
      } else {
        s.log.unshift({ cycle: c, tone: 'bad', text: `${def.name} failed — samples lost. You can try again.` });
        items.push({ kind: 'sciFail', name: def.name });
      }
    }
  }

  // effects tick
  s.effects = s.effects.map((e) => ({ ...e, remaining: e.remaining - 1 })).filter((e) => e.remaining > 0);

  // trackers
  const r = s.resources;
  s.lowPowerStreak = r.power <= 4 ? s.lowPowerStreak + 1 : 0;
  if (r.power < 20) s.lowPowerCycles += 1;
  if (Math.min(r.oxygen, r.water, r.food) < 25) s.lowResCycles += 1;
  s.cyclesDone = c;
  s.history.push({ cycle: c, power: r.power, oxygen: r.oxygen, water: r.water, food: r.food, crewHealth: r.crewHealth, radiation: r.radiation, science: r.science });

  const note = rep.reasons[0];
  s.log.unshift({ cycle: c, tone: note ? 'bad' : 'info', text: `Cycle ${c}: power ${rep.net >= 0 ? '+' : ''}${rep.net.toFixed(0)}/cycle${note ? ` — ${note}` : ''}` });

  items.push(...alertsFor(prev, s).map((a) => ({ ...a })));

  // failure checks
  let fail = null;
  if (r.oxygen <= 0) fail = 'Oxygen ran out.';
  else if (r.water <= 0) fail = 'Water ran out.';
  else if (r.crewHealth <= 0) fail = 'The crew did not survive.';
  else if (s.lowPowerStreak >= 3) fail = 'Power stayed critically low for too long and life support shut down.';

  if (fail) {
    s.missionStatus = 'failure'; s.failReason = fail; s.missionScore = totalScore(s);
    items.push({ kind: 'fail', text: fail });
  } else if (c >= s.duration) {
    s.missionStatus = evaluateEnd(s);
    items.push({ kind: s.missionStatus === 'success' ? 'success' : 'partial' });
  } else {
    s.cycle = c + 1;
    s.buildPoints += s.duration >= 30 ? BUILD_INCOME + 1 : BUILD_INCOME;
    s.cleanedCycle = 0;
    const id = s.nextEvent;
    s.nextEvent = null;
    if (id) { presentHazard(s, id); items.push({ kind: 'event', hazardId: id }); }
    s.nextEvent = rollHazard(s, s.cycle + 1);
    s.missionScore = totalScore(s);
  }

  s.signals = { seq: state.signals.seq + 1, items };
  s.log = s.log.slice(0, 60);
  return s;
}

/** Whether a hazard forecast is visible (requires comm relay + decent link). */
export function forecastFor(s) {
  return s.nextEvent && s.phase === 'play' ? s.nextEvent : null;
}
export const destinationOf = (s) => getDest(s.destination);
