// Headless balance test for the engine: node scripts/simulate.mjs
import * as E from '../src/game/gameEngine.js';
import { getHazard } from '../src/data/hazards.js';

const BUILDS = {
  smart: ['habitat', 'lifeSupport', 'solar', 'solar', 'solar', 'battery', 'recycler', 'greenhouse', 'lab', 'shield', 'lifeSupport', 'comms', 'shield', 'battery', 'recycler', 'shelter', 'solar'],
  naive: ['habitat', 'lifeSupport', 'solar', 'lab'],
};
function play(dest, diff, crew, dur, policy, seed) {
  let s = E.createMission({ destination: dest, crewSize: crew, duration: dur, difficulty: diff, seed });
  for (const t of BUILDS[policy]) { if (E.canBuild(s, t)) break; s = E.buildModule(s, t); }
  s = E.launch(s);
  let guard = 0;
  while (s.missionStatus === 'active' && guard++ < 200) {
    if (policy === 'smart') { const f = E.powerForecast(s); if (f.net < 0 && s.resources.power < 60 && !E.canBuild(s, 'solar')) s = E.buildModule(s, 'solar'); else if (s.crewSize > E.housing(s) && !E.canBuild(s, 'habitat')) s = E.buildModule(s, 'habitat'); else if (s.resources.water < 50 && !E.canBuild(s, 'recycler') ) s = E.buildModule(s, 'recycler'); }
    { const have = {}; for (const t of BUILDS[policy]) { have[t] = (have[t] || 0) + 1; const n = s.modules.filter((m) => m.type === t).length; if (n < have[t]) { if (!E.canBuild(s, t)) s = E.buildModule(s, t); break; } } }
    if (policy === 'smart') {
      if (!E.canClean(s)) s = E.cleanPanels(s);
      for (const m of s.modules) if (m.condition < 60 && !E.canRepair(s, m.uid)) s = E.repairModule(s, m.uid);
      for (const d of E.scienceList(s)) if (!E.canStartScience(s, d.id)) { s = E.startScience(s, d.id); break; }
    }
    if (s.pendingEvent) {
      const h = getHazard(s.pendingEvent.id);
      const order = policy === 'smart' ? ['best', 'ok', 'poor'] : ['poor'];
      let pick = h.choices.find((c) => E.choiceAvailable(s, c) && order.includes(typeof c.q === 'function' ? c.q(s) : c.q)) || h.choices[0];
      if (policy === 'smart') { const sc = h.choices.filter((c) => E.choiceAvailable(s, c)).sort((a, b) => ['best', 'ok', 'poor'].indexOf(typeof a.q === 'function' ? a.q(s) : a.q) - ['best', 'ok', 'poor'].indexOf(typeof b.q === 'function' ? b.q(s) : b.q)); pick = sc[0]; }
      s = E.resolveChoice(s, pick.id);
      s.lastOutcome = null;
    }
    s = E.advanceCycle(s);
    s.lastOutcome = null;
  }
  return s;
}
for (const dest of ['moon', 'mars']) for (const diff of ['cadet', 'commander', 'specialist']) for (const policy of ['smart', 'naive']) {
  const res = { success: 0, partial: 0, failure: 0 }; let sc = 0; const N = 40;
  for (let i = 0; i < N; i++) { const s = play(dest, diff, 4, 20, policy, 1000 + i * 77); res[s.missionStatus]++; sc += s.missionScore; }
  console.log(dest.padEnd(5), diff.padEnd(10), policy.padEnd(6), JSON.stringify(res), 'avg score', (sc / N).toFixed(0));
}
for (const dur of [10, 30]) { const res = { success: 0, partial: 0, failure: 0 }; for (let i = 0; i < 30; i++) res[play('mars', 'commander', 4, dur, 'smart', 5 + i * 31).missionStatus]++; console.log('mars commander smart dur', dur, JSON.stringify(res)); }
const s6 = { success: 0, partial: 0, failure: 0 }; for (let i = 0; i < 30; i++) s6[play('moon', 'commander', 6, 20, 'smart', 9 + i * 13).missionStatus]++; console.log('moon crew6 smart', JSON.stringify(s6));
if (process.env.DEBUG) {
  const reasons = {};
  for (let i = 0; i < 40; i++) { const s = play('moon', 'commander', 4, 20, 'smart', 1000 + i * 77); const k = s.failReason || s.missionStatus; reasons[k] = (reasons[k] || 0) + 1; if (i === 0) console.log(s.history.map((h) => [h.cycle, h.power | 0, h.oxygen | 0, h.water | 0, h.food | 0, h.crewHealth | 0, h.radiation | 0].join(' ')).join('\n'), s.modules.map(m=>m.type).join(','), s.completedScience.length); }
  console.log(reasons);
}
if (process.env.DEBUG2) {
  const [dest, diff] = process.env.DEBUG2.split(',');
  const reasons = {};
  for (let i = 0; i < 40; i++) { const s = play(dest, diff, 4, 20, 'smart', 1000 + i * 77); const k = s.failReason || s.missionStatus; reasons[k] = (reasons[k] || 0) + 1; if (i === 1) console.log(s.history.map((h) => [h.cycle, h.power | 0, h.oxygen | 0, h.water | 0, h.food | 0, h.crewHealth | 0, h.radiation | 0].join(' ')).join('\n'), s.modules.map(m=>m.type).join(','), s.completedScience.length, s.hazardsEncountered.map(h=>h.id+'@'+h.cycle).join(' ')); }
  console.log(reasons);
}
if (process.env.DEBUG3) {
  const [dest, diff] = process.env.DEBUG3.split(',');
  const s = play(dest, diff, 4, 20, 'smart', 1000 + 77);
  console.log(s.missionStatus, s.missionScore, E.categories(s), 'sci', s.completedScience.map(x=>x.id+'@'+x.cycle).join(' '), 'target', s.scienceTarget, 'mods', s.modules.map(m=>m.type+(m.condition|0)).join(','), 'bp', s.buildPoints);
  console.log(s.history.map((h) => [h.cycle, h.power | 0, h.oxygen | 0, h.water | 0, h.food | 0, h.crewHealth | 0, h.radiation | 0].join(' ')).join('\n'));
}
