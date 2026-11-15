import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMission } from '../hooks/useMission.js';
import { useAstronaut } from '../components/Astronaut.jsx';
import WorldView from '../components/WorldView.jsx';
import MissionHUD from '../components/MissionHUD.jsx';
import ResourcePanel, { GaugeChip } from '../components/ResourcePanel.jsx';
import OutpostModule from '../components/OutpostModule.jsx';
import ScienceMissionCard from '../components/ScienceMissionCard.jsx';
import MissionLog from '../components/MissionLog.jsx';
import PauseMenu from '../components/PauseMenu.jsx';
import { DecisionModal, OutcomeModal } from '../components/EventModal.jsx';
import { Btn, Tag } from '../components/UI.jsx';
import { MODULE_LIST, MODULES } from '../data/modules.js';
import { getHazard } from '../data/hazards.js';
import { getDest } from '../data/destinations.js';
import * as G from '../game/gameEngine.js';
import { sfx } from '../audio/audio.js';

const DUST_LABEL = (d) => (d < 25 ? 'LOW' : d < 55 ? 'MEDIUM' : 'HIGH');
const REACT = {
  best: ['Nice call, Commander! 👍', 'That was the smart move.'],
  ok: ['Solid choice, Commander.', 'It could have gone worse.'],
  poor: ['Ouch...', 'That one will cost us. Let’s recover.'],
};

function ModuleInfo({ mission, uid, onClose }) {
  const { repair, clean } = useMission();
  const [more, setMore] = useState(false);
  if (uid === 'rover') {
    const busy = mission.activeScience.length > 0;
    return (<InfoShell title="🚙 Science Rover" onClose={onClose}><p className="text-sm">{busy ? 'Supporting a science mission right now.' : 'Patrolling the outpost. Start a science mission to put it to work.'}</p><p className="mt-1 text-xs text-white/60">Crew free: {G.crewFree(mission)} / {mission.crewSize}</p></InfoShell>);
  }
  const m = mission.modules.find((x) => x.uid === uid);
  if (!m) return null;
  const def = MODULES[m.type];
  const reasonRepair = G.canRepair(mission, uid);
  let stat = def.benefit;
  if (m.type === 'solar') {
    const out = def.gen * (m.condition / 100) * G.lightFactor(mission.destination, mission.cycle) * G.dustEfficiency(mission) * G.fxMods(mission).solar;
    stat = `Power generation: +${out.toFixed(0)} / cycle`;
  } else if (def.demand) stat = `Uses ${def.demand} power / cycle. ${def.benefit}`;
  return (
    <InfoShell title={`${def.icon} ${def.name}`} onClose={onClose}>
      <p className="text-sm font-semibold">{stat}</p>
      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-white/70">Condition: {Math.round(m.condition)}% {m.condition < 55 ? '⚠ DAMAGED' : '✔'}</div>
      {m.type === 'solar' && <div className="text-xs font-bold uppercase tracking-wider text-white/70">Dust: {DUST_LABEL(mission.dust)} ({Math.round(mission.dust)}%)</div>}
      {more && <p className="mt-2 text-xs leading-snug text-white/80">{def.edu}<br /><span className="text-warn">⚖ {def.tradeoff}</span></p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <Btn small variant="ghost" onClick={() => setMore((x) => !x)}>{more ? 'Hide' : 'Inspect'}</Btn>
        <Btn small variant="primary" disabled={!!reasonRepair} title={reasonRepair || ''} onClick={() => repair(uid)}>Repair ({def.repair} BP)</Btn>
        {m.type === 'solar' && <Btn small variant="warm" disabled={!!G.canClean(mission)} title={G.canClean(mission) || ''} onClick={clean}>Clean</Btn>}
      </div>
    </InfoShell>
  );
}
function InfoShell({ title, children, onClose }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pointer-events-auto w-64 rounded-xl border border-accent/60 bg-space-900/95 p-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2"><h3 className="font-display text-xs font-bold uppercase tracking-widest">{title}</h3><button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-white/60 hover:bg-white/10">✕</button></div>
      <div className="mt-1">{children}</div>
    </motion.div>
  );
}

export default function MissionControl() {
  const { mission, advance, choose, dismissOutcome, build, science, conserve, clean, repair, go, menuOpen, setMenuOpen, highlight } = useMission();
  const { say } = useAstronaut();
  const d = getDest(mission.destination);
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState(null);
  const [gaugesOpen, setGaugesOpen] = useState(false);
  const [phase, setPhase] = useState(() => (mission.pendingEvent ? 'decide' : null));
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const seq = useRef(mission.signals.seq);
  const prevRes = useRef(mission.resources);
  const timers = useRef([]);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Mission start greeting
  useEffect(() => {
    if (mission.history.length === 0 && mission.cycle === 1 && !mission.pendingEvent) say({ mood: 'welcome', lines: [...d.welcome, 'Use BUILD, SCIENCE and OPS — then press NEXT CYCLE.'], auto: 2600 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startEvent = useCallback((id) => {
    const h = getHazard(id);
    setPhase('approach'); sfx.event(); setPanel(null);
    if (h?.shake) { setShake(true); setFlash(true); later(() => setShake(false), 1000); later(() => setFlash(false), 1400); }
    say({ mood: 'warning', lines: ['Commander...', "Something's coming.", (h?.title || 'Hazard').toUpperCase()], auto: 1500, force: true, sound: null });
    later(() => setPhase('decide'), 2500);
  }, [say]);

  // React to engine signals
  useEffect(() => {
    if (mission.signals.seq === seq.current) return;
    seq.current = mission.signals.seq;
    for (const it of mission.signals.items) {
      if (it.kind === 'science') { sfx.science(); say({ mood: 'happy', lines: ['Great work!', `${it.name} complete!`, 'Your research data has been added to the mission report.'], auto: 2200 }); }
      else if (it.kind === 'sciFail') { sfx.warn(); say({ mood: 'concerned', lines: [`${it.name} failed.`, 'Samples were lost. We can try again.'], auto: 2200 }); }
      else if (it.kind === 'scienceStart') { say({ mood: 'explaining', lines: ['Science underway!', 'It will use power each cycle.'], auto: 1800 }); }
      else if (it.kind === 'warn') { sfx.warn(); say({ mood: 'concerned', lines: ['Uh-oh...', it.text, it.detail || (it.resource === 'power' ? 'We should conserve energy.' : 'Let’s fix this before it gets worse.')], auto: 2300 }); }
      else if (it.kind === 'critical') { sfx.critical(); setShake(true); later(() => setShake(false), 900); say({ mood: 'warning', lines: ['COMMANDER!', it.text, it.detail || (it.resource === 'oxygen' ? 'Life support needs immediate attention!' : 'Immediate action needed!')], auto: 2600, force: true }); }
      else if (it.kind === 'event') startEvent(it.hazardId);
      else if (it.kind === 'fail') {
        sfx.fail();
        say({ mood: 'failed', sticky: true, lines: ['Mission lost...', it.text, 'But every failed mission teaches us something.', 'Ready to try again?'], actions: [{ label: 'View report', primary: true, onClick: () => go('report') }] });
        later(() => go('report'), 12000);
      } else if (it.kind === 'success' || it.kind === 'partial') {
        sfx.success();
        say({ mood: 'celebrating', sticky: true, lines: it.kind === 'success' ? ['WE DID IT!', 'Mission accomplished, Commander!'] : ['The crew made it home!', 'Not every goal was met — but you can learn from that.'], actions: [{ label: 'View report', primary: true, onClick: () => go('report') }] });
        later(() => go('report'), 12000);
      }
    }
  }, [mission.signals.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!mission.pendingEvent && phase === 'decide') setPhase(null); }, [mission.pendingEvent, phase]);

  // sound for resource changes
  useEffect(() => {
    const p = prevRes.current, r = mission.resources;
    let loss = false, gain = false;
    for (const k of Object.keys(r)) { const diff = r[k] - p[k]; if (Math.abs(diff) < 5) continue; const bad = k === 'radiation' ? diff > 0 : diff < 0; if (k === 'science') { if (diff > 0) gain = true; } else if (bad) loss = true; else gain = true; }
    prevRes.current = r;
    if (loss) sfx.loss(); else if (gain) sfx.gain();
  }, [mission.resources]);

  const onOutcomeContinue = () => { const q = mission.lastOutcome?.quality || 'ok'; dismissOutcome(); say({ mood: q === 'poor' ? 'concerned' : q === 'best' ? 'happy' : 'explaining', lines: REACT[q], auto: 2200, force: true }); };

  const active = mission.missionStatus === 'active';
  const pending = mission.pendingEvent, outcome = mission.lastOutcome;
  const blocked = !!pending || !!outcome || !active;
  const f = G.powerForecast(mission);
  const fxIds = mission.effects.map((e) => e.id);
  const ph = pending ? getHazard(pending.id) : null;
  const storm = Math.max(ph?.storm || 0, fxIds.includes('gstorm') ? 1 : fxIds.includes('storm') ? 0.7 : 0);
  const darkness = fxIds.includes('dark') ? 0.85 : pending?.id === 'darkness' ? 0.6 : 0;
  const forecastId = G.commLevel(mission) >= 50 && (G.counts(mission).comms || 0) > 0 ? G.forecastFor(mission) : null;
  const counts = G.counts(mission);
  const crewFree = G.crewFree(mission);
  const togglePanel = (p) => { sfx.click(); setPanel((x) => (x === p ? null : p)); };

  const tabs = [['build', '🏗', 'Build'], ['science', '🔬', 'Science'], ['ops', '⚙', 'Ops'], ['log', '📜', 'Log']];

  return (
    <div className={`relative h-full overflow-hidden bg-space-950 ${shake ? 'animate-shake' : ''}`}>
      <div className="absolute inset-0"><WorldView mission={mission} selected={selected} onSelect={(id) => { setSelected(id); if (id) sfx.select(); }} storm={storm} darkness={darkness} autoRotate={!selected && !phase} /></div>
      <AnimatePresence>{flash && <motion.div key="flash" className="pointer-events-none absolute inset-0 z-10 bg-orange-500/30" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.2, 0.8, 0] }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} />}</AnimatePresence>
      {(storm > 0.3 || darkness > 0.3) && <div className="pointer-events-none absolute inset-0 z-[5]" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.55))' }} />}

      <MissionHUD mission={mission} onMenu={() => setMenuOpen(true)} />

      {/* status chips */}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-10 flex flex-wrap justify-center gap-1.5 px-14 sm:top-16">
        {phase === 'approach' && <Tag tone="bad" className="animate-pulse bg-space-900/90">⚠ ALERT — HAZARD DETECTED</Tag>}
        {mission.conserve && <Tag tone="warn" className="bg-space-900/90">🔋 CONSERVATION MODE</Tag>}
        {mission.effects.map((e) => <Tag key={e.id + e.remaining} tone="warn" className="bg-space-900/90">{e.label} • {e.remaining}c</Tag>)}
        {forecastId && !pending && <Tag tone="info" className="bg-space-900/90">📡 FORECAST: {getHazard(forecastId)?.title} possible next cycle</Tag>}
        {f.net < 0 && f.cyclesLeft < 4 && !pending && <Tag tone="bad" className="bg-space-900/90">⚠ POWER: ~{Math.max(1, Math.ceil(f.cyclesLeft))} cycles of battery</Tag>}
      </div>

      {/* desktop side HUD */}
      <aside className="pointer-events-auto absolute left-3 top-24 z-10 hidden w-60 md:block"><ResourcePanel mission={mission} highlight={highlight} ids={['power', 'oxygen', 'water', 'food', 'crewHealth']} /></aside>
      <aside className="absolute right-3 top-24 z-10 hidden w-60 flex-col gap-2 md:flex">
        <ResourcePanel mission={mission} ids={['radiation', 'comm', 'science']} />
        <div className="rounded-xl border border-white/10 bg-space-900/80 px-3 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">⚡ {f.gen.toFixed(0)} in • {f.dem.toFixed(0)} out • <span className={f.net < 0 ? 'text-bad' : 'text-good'}>{f.net >= 0 ? '+' : ''}{f.net.toFixed(0)}</span></div>
        <div className="pointer-events-auto flex justify-end"><AnimatePresence>{selected && <ModuleInfo mission={mission} uid={selected} onClose={() => setSelected(null)} />}</AnimatePresence></div>
      </aside>
      {/* mobile selected info */}
      <div className="absolute right-2 top-24 z-10 md:hidden"><AnimatePresence>{selected && <ModuleInfo mission={mission} uid={selected} onClose={() => setSelected(null)} />}</AnimatePresence></div>

      {/* panels */}
      <AnimatePresence>
        {panel && (
          <motion.section key={panel} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="absolute inset-x-2 bottom-[7.7rem] z-20 mx-auto max-h-[46vh] max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-space-900/95 p-3 backdrop-blur-md scroll-thin md:bottom-[4.7rem]" aria-label={`${panel} panel`}>
            <div className="mb-2 flex items-center justify-between"><h2 className="font-display text-xs font-bold uppercase tracking-widest text-accent">{panel}</h2><button type="button" onClick={() => setPanel(null)} aria-label="Close panel" className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10">✕</button></div>
            {panel === 'build' && (
              <div>
                <p className="mb-2 text-xs text-white/70">🧱 {mission.buildPoints} build points • +{mission.duration >= 30 ? 3 : 2} each cycle (supply credits)</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scroll-thin">{MODULE_LIST.map((m) => <OutpostModule key={m.id} compact def={m} count={counts[m.id] || 0} reason={G.canBuild(mission, m.id)} onBuild={(t) => { build(t); setSelected(null); }} />)}</div>
              </div>
            )}
            {panel === 'science' && (
              <div>
                <p className="mb-2 text-xs text-white/70">👩‍🚀 Free crew {crewFree}/{mission.crewSize} • Labs {counts.lab || 0} • Progress {Math.round(mission.resources.science)}/{mission.scienceTarget} pts needed {mission.completedScience.length ? `• ${mission.completedScience.length} done` : ''}</p>
                {mission.activeScience.map((a) => (<div key={a.id} className="mb-2 rounded-lg border border-accent/40 p-2 text-xs font-bold">{a.icon} {a.name} — {Math.min(a.cycles, Math.floor(a.progress))}/{a.cycles} cycles {mission.conserve && <span className="text-warn">(paused)</span>}</div>))}
                {!counts.lab && <p className="mb-2 rounded-lg bg-warn/10 p-2 text-sm text-warn">⚠ Build a Science Lab to unlock science missions.</p>}
                <div className="grid gap-2 sm:grid-cols-2">{G.scienceList(mission).map((s) => <ScienceMissionCard key={s.id} def={s} reason={G.canStartScience(mission, s.id)} active={mission.activeScience.some((a) => a.id === s.id)} doneCount={mission.completedScience.filter((x) => x.id === s.id).length} onStart={() => science(s.id)} />)}</div>
              </div>
            )}
            {panel === 'ops' && (
              <div className="space-y-3 text-sm">
                <div className="rounded-xl bg-space-800 p-3">
                  <div className="font-display text-[11px] font-bold uppercase tracking-widest text-white/60">Power budget</div>
                  <div className="mt-1">☀ Generating <b>{f.gen.toFixed(1)}</b> • ⚡ using <b>{f.dem.toFixed(1)}</b> • net <b className={f.net < 0 ? 'text-bad' : 'text-good'}>{f.net >= 0 ? '+' : ''}{f.net.toFixed(1)}</b></div>
                  <div className="text-xs text-white/70">Battery {Math.round(f.units)}/{Math.round(f.cap)} units • Panel dust {DUST_LABEL(mission.dust)} ({Math.round(mission.dust)}%)</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Btn small variant={mission.conserve ? 'warm' : 'ghost'} onClick={conserve}>🔋 Conservation: {mission.conserve ? 'ON' : 'OFF'}</Btn>
                  <Btn small variant="ghost" disabled={!!G.canClean(mission)} title={G.canClean(mission) || ''} onClick={clean}>🧹 Clean panels (−{G.CLEAN_COST_UNITS} power)</Btn>
                </div>
                <p className="text-xs text-white/60">Conservation pauses science and the lab, and trims other loads. Use it in storms and darkness.</p>
                <ul className="space-y-1.5">
                  {mission.modules.map((m) => (
                    <li key={m.uid} className="flex items-center justify-between gap-2 rounded-lg bg-space-800 px-2.5 py-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider">{MODULES[m.type].icon} {MODULES[m.type].name}</span>
                      <span className="flex items-center gap-2"><span className={`text-xs font-bold ${m.condition < 55 ? 'text-bad' : 'text-good'}`}>{m.condition < 55 ? '⚠' : '✔'} {Math.round(m.condition)}%</span><Btn small variant="ghost" disabled={!!G.canRepair(mission, m.uid)} title={G.canRepair(mission, m.uid) || ''} onClick={() => repair(m.uid)}>Fix {MODULES[m.type].repair}BP</Btn></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {panel === 'log' && <MissionLog log={mission.log} limit={25} />}
          </motion.section>
        )}
      </AnimatePresence>

      {/* mobile gauges */}
      <div className="absolute inset-x-0 bottom-[4.4rem] z-10 md:hidden">
        <AnimatePresence>{gaugesOpen && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-2 mb-1"><ResourcePanel mission={mission} highlight={highlight} ids={['power', 'oxygen', 'water', 'food', 'crewHealth', 'radiation', 'comm', 'science']} className="max-h-[40vh] overflow-y-auto rounded-xl bg-space-950/80 p-1.5 backdrop-blur-sm" /></motion.div>}</AnimatePresence>
        <div className="flex gap-1 px-2">
          {['power', 'oxygen', 'water', 'food', 'crewHealth', 'radiation'].map((id) => <GaugeChip key={id} id={id} mission={mission} highlight={highlight?.includes(`gauge-${id}`)} onClick={() => { sfx.click(); setGaugesOpen((x) => !x); }} />)}
        </div>
      </div>

      {/* action bar */}
      <nav className="safe-b absolute inset-x-0 bottom-0 z-20 flex items-center gap-1.5 bg-gradient-to-t from-space-950 via-space-950/90 to-transparent px-2 pt-2 sm:justify-center sm:gap-2" aria-label="Mission actions">
        {tabs.map(([k, i, l]) => (
          <button key={k} type="button" onMouseEnter={() => sfx.hover()} onClick={() => togglePanel(k)} aria-pressed={panel === k} id={`tab-${k}`}
            className={`min-h-[48px] min-w-[48px] flex-1 rounded-xl border px-1 font-display text-[10px] font-bold uppercase tracking-widest sm:flex-none sm:px-4 sm:text-xs ${panel === k ? 'border-accent bg-accent/20 text-accent' : 'border-white/15 bg-space-800/90 hover:border-accent/60'} ${highlight?.includes(`tab-${k}`) ? 'animate-ring' : ''}`}>
            <span aria-hidden className="block text-base leading-none sm:mr-1 sm:inline">{i}</span>{l}
          </button>
        ))}
        <Btn id="advance" disabled={blocked} onClick={advance} className="min-h-[48px] flex-[1.6] sm:flex-none sm:min-w-[11rem]" title={blocked ? 'Resolve the current event first' : 'Advance to the next cycle'}>
          ▶ {mission.cycle >= mission.duration ? 'Final cycle' : 'Next cycle'}
        </Btn>
      </nav>

      <AnimatePresence>
        {active && pending && phase === 'decide' && !outcome && <DecisionModal key="decision" mission={mission} onChoose={choose} />}
        {outcome && <OutcomeModal key="outcome" outcome={outcome} onContinue={onOutcomeContinue} />}
        {menuOpen && <PauseMenu key="menu" mission={mission} onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
