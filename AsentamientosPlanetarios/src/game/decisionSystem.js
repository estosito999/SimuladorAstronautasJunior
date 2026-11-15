import { getHazard } from '../data/hazards.js';
import { clamp } from '../utils/calculations.js';
import { counts, shieldFraction } from './resourceSystem.js';

const KEYS = ['power', 'oxygen', 'water', 'food', 'crewHealth', 'radiation', 'science'];

export function choiceAvailable(state, choice) {
  const bp = choice.cost?.buildPoints || 0;
  return state.buildPoints >= bp;
}

/** Resolve a player's choice for the pending event. Pure: returns new state. */
export function resolveChoice(state, choiceId) {
  const pending = state.pendingEvent;
  if (!pending || state.missionStatus !== 'active') return state;
  const h = getHazard(pending.id);
  const choice = h?.choices.find((c) => c.id === choiceId);
  if (!choice || !choiceAvailable(state, choice)) return state;
  const s = structuredClone(state);
  const before = { ...s.resources, buildPoints: s.buildPoints };
  const q = typeof choice.q === 'function' ? choice.q(s) : choice.q;

  const missing = choice.requires && !(counts(s)[choice.requires] > 0);
  const delta = missing ? choice.else || {} : choice.delta || {};
  for (const [k, v] of Object.entries(delta)) {
    if (k === 'radiation' && !missing && choice.requires) s.resources.radiation = clamp(s.resources.radiation + v);
    else if (k === 'radiation') s.resources.radiation = clamp(s.resources.radiation + v * (1 - shieldFraction(s)));
    else if (KEYS.includes(k)) s.resources[k] = clamp(s.resources[k] + v);
  }
  if (choice.cost?.buildPoints) s.buildPoints -= choice.cost.buildPoints;
  if (choice.effect && !missing) s.effects.push({ ...structuredClone(choice.effect), remaining: choice.effect.duration });
  if (choice.setConserve) s.conserve = true;
  if (choice.setDust != null) s.dust = choice.setDust;
  if (choice.repair != null && pending.damaged) {
    const m = s.modules.find((x) => x.uid === pending.damaged.uid);
    if (m) m.condition = clamp(m.condition + pending.damaged.amount * choice.repair, 5, 100);
  }

  const changes = [];
  for (const k of KEYS) {
    const d = Math.round(s.resources[k] - before[k]);
    if (d) changes.push({ key: k, amount: d });
  }
  const dbp = s.buildPoints - before.buildPoints;
  if (dbp) changes.push({ key: 'buildPoints', amount: dbp });

  s.decisions.push({ cycle: s.cycle, hazardId: h.id, title: h.title, choiceId, label: choice.label, quality: q });
  s.lastOutcome = {
    hazardId: h.id, title: h.title, icon: h.icon, choiceLabel: choice.label, quality: q,
    what: missing && choice.elseWhat ? choice.elseWhat : choice.what, changes, why: h.why, real: h.real,
  };
  s.pendingEvent = null;
  s.signals = { seq: (state.signals?.seq || 0) + 1, items: [{ kind: q === 'best' ? 'good' : q === 'poor' ? 'concern' : 'ok', quality: q, changes }] };
  s.log.unshift({ cycle: s.cycle, tone: q === 'poor' ? 'bad' : 'good', text: `${h.title}: ${choice.label}` });
  s.log = s.log.slice(0, 60);
  return s;
}
