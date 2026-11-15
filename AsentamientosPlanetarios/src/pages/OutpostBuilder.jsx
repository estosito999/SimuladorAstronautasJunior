import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMission } from '../hooks/useMission.js';
import { useAstronaut } from '../components/Astronaut.jsx';
import WorldView from '../components/WorldView.jsx';
import OutpostModule from '../components/OutpostModule.jsx';
import ResourcePanel, { GaugeChip } from '../components/ResourcePanel.jsx';
import { Btn, Tag } from '../components/UI.jsx';
import { MODULE_LIST, MODULES } from '../data/modules.js';
import { canBuild, missingForLaunch, powerForecast, counts } from '../game/gameEngine.js';
import { getDest } from '../data/destinations.js';

const QUOTES = {
  solar: ['Nice!', 'That should keep the lights on.'], battery: ['Battery online.', 'Stored energy gets you through the dark.'], lifeSupport: ['Life support online.', 'Fresh air, Commander!'],
  recycler: ['Water recycler running.', 'Every drop counts out here.'], greenhouse: ['Greenhouse built!', 'Fresh food — if we have the water and power.'], shield: ['Radiation shield up.', 'That should protect the crew.'],
  habitat: ['Habitat ready.', 'Home sweet home.'], lab: ['Science lab built!', 'Remember: it uses power even when idle.'], comms: ['Comm relay online.', 'Now we can see hazard forecasts.'], shelter: ['Storm shelter ready.', 'A safe place when radiation spikes.'],
};

const TUT = [
  { lines: ["First, let's check our power."], hl: ['gauge-power'], mood: 'welcome' },
  { lines: ['Power keeps your habitat alive.', 'Panels make it. Batteries store it. Everything else spends it.'], hl: ['gauge-power'], mood: 'explaining' },
  { lines: ["Now let's build a Solar Array.", 'Tap the highlighted button.'], hl: ['mod-solar'], wait: (m) => counts(m).solar > 0, mood: 'explaining' },
  { lines: ['Nice! That will generate power.'], hl: [], mood: 'happy' },
  { lines: ['Now we need life support.', 'Build the highlighted module.'], hl: ['mod-lifeSupport'], wait: (m) => counts(m).lifeSupport > 0, mood: 'explaining' },
  { lines: ['Keep an eye on Oxygen, Water and Food.', 'They all depend on power.'], hl: ['gauge-oxygen', 'gauge-water', 'gauge-food'], mood: 'explaining' },
  { lines: ["You're ready, Commander!", 'Add a Habitat and a Water Recycler, then launch.'], hl: [], mood: 'celebrating', last: true },
];

function Tutorial({ active, onEnd }) {
  const { mission, setHighlight } = useMission();
  const { say, dismiss } = useAstronaut();
  const [step, setStep] = useState(0);
  const s = TUT[step];
  useEffect(() => {
    if (!active) return;
    setHighlight(s.hl);
    say({ sticky: true, mood: s.mood, lines: s.lines, actions: s.wait ? undefined : [{ label: s.last ? 'Got it' : 'Next ▸', primary: true, onClick: () => (s.last ? onEnd() : setStep((x) => x + 1)) }] });
  }, [step, active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (active && s.wait?.(mission)) setStep((x) => x + 1); }, [mission, active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { setHighlight(null); dismiss(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function OutpostBuilder() {
  const { mission, build, sell, go, launch, exit, prefs, setPrefs, highlight } = useMission();
  const { say } = useAstronaut();
  const [selected, setSelected] = useState(null);
  const [tut, setTut] = useState(prefs.tutorial && !prefs.tutorialDone);
  const seq = useRef(mission.signals.seq);
  const d = getDest(mission.destination);
  const f = powerForecast(mission);
  const missing = missingForLaunch(mission);
  const c = counts(mission);

  useEffect(() => {
    if (mission.signals.seq === seq.current) return;
    seq.current = mission.signals.seq;
    const it = mission.signals.items[0];
    if (it?.kind === 'built') say({ mood: 'happy', lines: QUOTES[it.type] || ['Module added.'] });
  }, [mission.signals.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  const endTut = () => { setTut(false); setHighlight2(); setPrefs({ tutorialDone: true }); };
  const { setHighlight } = useMission();
  const setHighlight2 = () => setHighlight(null);

  const tryLaunch = () => {
    if (missing.length) { say({ mood: 'concerned', lines: ['Not yet, Commander.', `We still need: ${missing.join(', ')}.`], auto: 3200 }); return; }
    if (mission.buildPoints > 0 && !c.greenhouse && !c.recycler) { /* soft hint only */ }
    go('launch');
  };
  const sel = mission.modules.find((m) => m.uid === selected);

  return (
    <div className="relative h-full overflow-hidden bg-space-950">
      <div className="absolute inset-0"><WorldView mission={mission} selected={selected} onSelect={setSelected} autoRotate={!selected} /></div>
      <Tutorial active={tut} onEnd={endTut} />
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2 sm:p-3">
        <div className="pointer-events-auto rounded-xl border border-white/10 bg-space-900/85 px-3 py-2 backdrop-blur-sm"><div className="font-display text-[10px] font-bold uppercase tracking-widest text-white/60">{d.icon} {d.title} • Outpost builder</div><div className="font-display text-lg font-black text-accent">🧱 {mission.buildPoints} <span className="text-xs text-white/60">build points</span></div></div>
        <div className="pointer-events-auto flex gap-2">{tut && <Btn small variant="ghost" onClick={() => { endTut(); }}>Skip tutorial</Btn>}<Btn small variant="ghost" onClick={exit}>☰ Menu</Btn></div>
      </header>

      {sel && (
        <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-xl border border-accent/60 bg-space-900/95 px-3 py-2 text-center text-sm shadow-lg">
          <b>{MODULES[sel.type].icon} {MODULES[sel.type].name}</b>
          <div className="mt-1 flex items-center justify-center gap-2"><Btn small variant="ghost" onClick={() => { sell(sel.uid); setSelected(null); }}>Remove (+{MODULES[sel.type].cost} BP)</Btn><Btn small variant="ghost" onClick={() => setSelected(null)}>✕</Btn></div>
        </div>
      )}

      {/* Desktop side panels */}
      <aside className="absolute bottom-3 left-3 top-20 z-10 hidden w-72 flex-col gap-2 overflow-y-auto pr-1 scroll-thin md:flex" aria-label="Modules">
        {MODULE_LIST.map((m) => <OutpostModule key={m.id} def={m} count={c[m.id] || 0} reason={canBuild(mission, m.id)} onBuild={build} highlight={highlight?.includes(`mod-${m.id}`)} />)}
      </aside>
      <aside className="absolute right-3 top-20 z-10 hidden w-64 flex-col gap-2 md:flex">
        <ResourcePanel mission={mission} highlight={highlight} ids={['power', 'oxygen', 'water', 'food']} />
        <div className="rounded-xl border border-white/10 bg-space-900/85 p-3 text-sm backdrop-blur-sm">
          <div className="font-display text-[11px] font-bold uppercase tracking-widest text-white/60">Power per cycle</div>
          <div className="mt-1">⚡ +{f.gen.toFixed(0)} generated • −{f.dem.toFixed(0)} used</div>
          <div className={`font-bold ${f.net < 0 ? 'text-bad' : 'text-good'}`}>{f.net < 0 ? '⚠ Net ' : '✔ Net +'}{f.net.toFixed(0)} {f.net < 0 ? '— batteries will drain' : 'surplus'}</div>
          <div className="mt-2 font-display text-[11px] font-bold uppercase tracking-widest text-white/60">Required to launch</div>
          <ul className="mt-1 space-y-0.5">{['habitat', 'lifeSupport', 'solar'].map((t) => <li key={t} className={c[t] ? 'text-good' : 'text-white/70'}>{c[t] ? '✔' : '○'} {MODULES[t].name}</li>)}</ul>
        </div>
        <Btn onClick={tryLaunch} className="w-full">🚀 Launch mission</Btn>
      </aside>

      {/* Mobile layout */}
      <div className="absolute inset-x-0 bottom-0 z-10 md:hidden">
        <div className="mb-1 flex gap-1 px-2">{['power', 'oxygen', 'water', 'food'].map((id) => <GaugeChip key={id} id={id} mission={mission} highlight={highlight?.includes(`gauge-${id}`)} />)}</div>
        <div className="mx-2 mb-1 flex items-center justify-between rounded-lg bg-space-900/85 px-2 py-1 text-[11px] font-bold">
          <span>⚡ +{f.gen.toFixed(0)} / −{f.dem.toFixed(0)}</span><span className={f.net < 0 ? 'text-bad' : 'text-good'}>{f.net < 0 ? '⚠' : '✔'} net {f.net >= 0 ? '+' : ''}{f.net.toFixed(0)}</span>
          <Tag tone={missing.length ? 'warn' : 'good'}>{missing.length ? `Need ${missing.length} more` : 'Ready'}</Tag>
        </div>
        <div className="safe-b flex gap-2 overflow-x-auto bg-space-900/90 px-2 pt-2 scroll-thin" aria-label="Modules">
          {MODULE_LIST.map((m) => <OutpostModule key={m.id} compact def={m} count={c[m.id] || 0} reason={canBuild(mission, m.id)} onBuild={build} highlight={highlight?.includes(`mod-${m.id}`)} />)}
          <Btn onClick={tryLaunch} className="sticky right-0 shrink-0">🚀 Launch</Btn>
        </div>
      </div>
    </div>
  );
}
