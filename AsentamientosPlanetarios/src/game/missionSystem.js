import { MODULES, REQUIRED_TO_LAUNCH } from '../data/modules.js';
import { SCIENCE } from '../data/scienceMissions.js';
import { clamp, pad2 } from '../utils/calculations.js';
import { DIFFICULTY, counts, batteryCapacity, labCount, powerForecast } from './resourceSystem.js';
import { rollHazard } from './hazardSystem.js';
import { scienceTarget, totalScore } from './scoringSystem.js';

export const SCHEMA = 3;
export const CREW_OPTIONS = [2, 4, 6];
export const DURATION_OPTIONS = [10, 20, 30];

export function createMission({ destination = 'moon', crewSize = 4, duration = 20, difficulty = 'commander', missionNumber = 1, seed } = {}) {
  const diff = DIFFICULTY[difficulty] || DIFFICULTY.commander;
  const s = {
    schema: SCHEMA,
    missionId: `ZERO-G-${pad2(missionNumber)}`,
    destination: destination === 'mars' ? 'mars' : 'moon',
    crewSize: CREW_OPTIONS.includes(crewSize) ? crewSize : 4,
    duration: DURATION_OPTIONS.includes(duration) ? duration : 20,
    difficulty: DIFFICULTY[difficulty] ? difficulty : 'commander',
    phase: 'build', // 'build' -> 'play'
    cycle: 1, cyclesDone: 0,
    seed: seed ?? Math.floor(Math.random() * 2 ** 31),
    resources: { power: 100, oxygen: diff.startRes, water: diff.startRes, food: diff.startRes, crewHealth: 100, radiation: 10, science: 0 },
    buildPoints: diff.build + (crewSize - 4) * 9, startBuildPoints: diff.build + (crewSize - 4) * 9,
    modules: [], nextUid: 1,
    activeScience: [], completedScience: [], scienceTarget: scienceTarget(diff.sciBase, duration),
    effects: [], dust: 10, conserve: false, cleanedCycle: 0,
    pendingEvent: null, nextEvent: null, lastOutcome: null, lastHazardId: null, lastEventCycle: 0,
    hazardsEncountered: [], decisions: [], history: [], log: [],
    lowPowerStreak: 0, lowPowerCycles: 0, lowResCycles: 0,
    missionScore: 0, missionStatus: 'active', failReason: null,
    signals: { seq: 0, items: [] },
  };
  s.nextEvent = rollHazard(s, 2);
  return s;
}

/** Validate / sanitize a loaded mission. Returns null if unusable. */
export function validateMission(m) {
  try {
    if (!m || typeof m !== 'object' || m.schema !== SCHEMA) return null;
    if (!['moon', 'mars'].includes(m.destination) || !DIFFICULTY[m.difficulty]) return null;
    if (!Array.isArray(m.modules) || !m.resources || !Array.isArray(m.history)) return null;
    for (const k of Object.keys(m.resources)) m.resources[k] = clamp(Number(m.resources[k]));
    m.modules = m.modules.filter((x) => MODULES[x.type]).map((x) => ({ ...x, condition: clamp(x.condition, 5, 100) }));
    m.dust = clamp(m.dust);
    m.cycle = Math.max(1, Math.min(m.duration, Math.floor(m.cycle) || 1));
    m.buildPoints = Math.max(0, m.buildPoints || 0);
    m.effects = (m.effects || []).filter((e) => e && e.remaining > 0);
    m.activeScience = m.activeScience || [];
    m.completedScience = m.completedScience || [];
    m.decisions = m.decisions || [];
    m.hazardsEncountered = m.hazardsEncountered || [];
    m.log = m.log || [];
    m.signals = { seq: 0, items: [] };
    return m;
  } catch { return null; }
}

// ---------- build ----------
export function canBuild(s, type) {
  const def = MODULES[type];
  if (!def) return 'Unknown module';
  if (s.missionStatus !== 'active') return 'Mission is over';
  if ((counts(s)[type] || 0) >= def.max) return `Maximum ${def.max} reached`;
  if (s.buildPoints < def.cost) return `Need ${def.cost} build points`;
  return null;
}
export function buildModule(state, type) {
  if (canBuild(state, type)) return state;
  const s = structuredClone(state);
  const uid = `m${s.nextUid++}`;
  s.modules.push({ uid, type, condition: 100, builtCycle: s.cycle, fresh: true });
  s.buildPoints -= MODULES[type].cost;
  s.signals = { seq: state.signals.seq + 1, items: [{ kind: 'built', type, uid }] };
  s.log.unshift({ cycle: s.cycle, tone: 'good', text: `Built ${MODULES[type].name}` });
  return s;
}
export function sellModule(state, uid) {
  if (state.phase !== 'build') return state;
  const s = structuredClone(state);
  const m = s.modules.find((x) => x.uid === uid);
  if (!m) return state;
  s.modules = s.modules.filter((x) => x.uid !== uid);
  s.buildPoints += MODULES[m.type].cost;
  s.signals = { seq: state.signals.seq + 1, items: [{ kind: 'sold', type: m.type }] };
  return s;
}
export function missingForLaunch(s) {
  const c = counts(s);
  return REQUIRED_TO_LAUNCH.filter((t) => !c[t]).map((t) => MODULES[t].name);
}
export function launch(state) {
  if (missingForLaunch(state).length) return state;
  const s = structuredClone(state);
  s.phase = 'play';
  s.modules.forEach((m) => { m.fresh = false; });
  s.log.unshift({ cycle: 1, tone: 'good', text: 'Landing complete. Mission underway.' });
  return s;
}

// ---------- upkeep ----------
export function canRepair(s, uid) {
  const m = s.modules.find((x) => x.uid === uid);
  if (!m) return 'No module';
  if (m.condition >= 99) return 'Already in good condition';
  if (s.buildPoints < MODULES[m.type].repair) return `Need ${MODULES[m.type].repair} build points`;
  return null;
}
export function repairModule(state, uid) {
  if (canRepair(state, uid)) return state;
  const s = structuredClone(state);
  const m = s.modules.find((x) => x.uid === uid);
  s.buildPoints -= MODULES[m.type].repair;
  m.condition = 100;
  s.signals = { seq: state.signals.seq + 1, items: [{ kind: 'repair', type: m.type }] };
  s.log.unshift({ cycle: s.cycle, tone: 'good', text: `Repaired ${MODULES[m.type].name}` });
  return s;
}
export const CLEAN_COST_UNITS = 4;
export function canClean(s) {
  if (!(counts(s).solar > 0)) return 'No solar arrays';
  if (s.dust < 15) return 'Panels are already clean';
  if (s.cleanedCycle === s.cycle) return 'Already cleaned this cycle';
  if (s.phase !== 'play') return 'Available once the mission starts';
  return null;
}
export function cleanPanels(state) {
  if (canClean(state)) return state;
  const s = structuredClone(state);
  s.resources.power = clamp(s.resources.power - (CLEAN_COST_UNITS / batteryCapacity(s)) * 100);
  s.dust = 8; s.cleanedCycle = s.cycle;
  s.signals = { seq: state.signals.seq + 1, items: [{ kind: 'clean' }] };
  s.log.unshift({ cycle: s.cycle, tone: 'good', text: 'Cleaned solar panels' });
  return s;
}
export function toggleConserve(state) {
  if (state.phase !== 'play' || state.missionStatus !== 'active') return state;
  const s = structuredClone(state);
  s.conserve = !s.conserve;
  s.log.unshift({ cycle: s.cycle, tone: 'info', text: s.conserve ? 'Power conservation ON — science paused' : 'Power conservation OFF' });
  return s;
}

// ---------- science ----------
export const crewFree = (s) => s.crewSize - s.activeScience.reduce((a, x) => a + x.crew, 0);
export function scienceList(s) { return SCIENCE[s.destination] || []; }
export function canStartScience(s, id) {
  const def = scienceList(s).find((x) => x.id === id);
  if (!def) return 'Unknown mission';
  if (s.phase !== 'play') return 'Available once the mission starts';
  if (s.missionStatus !== 'active') return 'Mission is over';
  if (!labCount(s)) return 'Build a Science Lab first';
  if (s.activeScience.length >= labCount(s)) return 'All labs are busy';
  if (s.activeScience.some((x) => x.id === id)) return 'Already running';
  if (crewFree(s) < def.crew) return `Needs ${def.crew} free crew`;
  if (s.conserve) return 'Conservation mode: science paused';
  if (s.cycle + def.cycles - 1 > s.duration) return 'Not enough cycles left';
  return null;
}
export function startScience(state, id) {
  if (canStartScience(state, id)) return state;
  const def = scienceList(state).find((x) => x.id === id);
  const s = structuredClone(state);
  s.activeScience.push({ id, name: def.name, icon: def.icon, crew: def.crew, power: def.power, cycles: def.cycles, progress: 0 });
  s.signals = { seq: state.signals.seq + 1, items: [{ kind: 'scienceStart', name: def.name }] };
  s.log.unshift({ cycle: s.cycle, tone: 'info', text: `Started: ${def.name}` });
  return s;
}

export function evaluateEnd(s) {
  const r = s.resources;
  const done = s.completedScience.length;
  const diff = DIFFICULTY[s.difficulty];
  const minRes = Math.min(r.oxygen, r.water, r.food) >= 10;
  s.missionScore = totalScore(s);
  if (r.crewHealth > 0 && minRes && done >= diff.minScience && s.missionScore >= 60) return 'success';
  return 'partial';
}
export { powerForecast };
