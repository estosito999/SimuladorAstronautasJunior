import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMission } from '../hooks/useMission.js';
import { Btn, Panel } from '../components/UI.jsx';
import { DIFFICULTY } from '../game/resourceSystem.js';
import { CREW_OPTIONS, DURATION_OPTIONS } from '../game/missionSystem.js';
import { getDest } from '../data/destinations.js';

function Group({ label, hint, children }) {
  return (<fieldset className="mt-5"><legend className="font-display text-xs font-bold uppercase tracking-widest text-white/70">{label}</legend>{hint && <p className="text-xs text-white/50">{hint}</p>}<div className="mt-2 flex flex-wrap gap-2">{children}</div></fieldset>);
}
function Choice({ on, onClick, children, sub }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`min-h-[56px] min-w-[96px] flex-1 rounded-xl border-2 px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${on ? 'border-accent bg-accent/15' : 'border-white/10 bg-space-800/70 hover:border-white/40'}`}>
      <div className="font-display text-sm font-bold uppercase tracking-widest">{on ? '✔ ' : ''}{children}</div>{sub && <div className="text-xs text-white/60">{sub}</div>}
    </button>
  );
}

export default function MissionSetup() {
  const { go, prefs, newMission } = useMission();
  const [cfg, setCfg] = useState({ ...prefs.lastSetup, tutorial: prefs.tutorial && !prefs.tutorialDone });
  const d = getDest(cfg.destination);
  const set = (k) => (v) => setCfg((c) => ({ ...c, [k]: v }));
  return (
    <div className="hud-grid h-full overflow-y-auto bg-space-950">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">{d.icon} {d.title}</p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-widest">Mission setup</h1>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Panel className="mt-4 p-4">
            <Group label="Crew size" hint="More crew means more science capacity — and more oxygen, water, food and housing needed.">
              {CREW_OPTIONS.map((n) => <Choice key={n} on={cfg.crewSize === n} onClick={() => set('crewSize')(n)} sub={`${n} astronauts`}>{n}</Choice>)}
            </Group>
            <Group label="Mission duration" hint="Longer missions mean more hazards.">
              {DURATION_OPTIONS.map((n) => <Choice key={n} on={cfg.duration === n} onClick={() => set('duration')(n)} sub="cycles">{n}</Choice>)}
            </Group>
            <Group label="Difficulty" hint="Changes starting resources, hazard frequency, consumption and score requirements.">
              {Object.values(DIFFICULTY).map((x) => <Choice key={x.id} on={cfg.difficulty === x.id} onClick={() => set('difficulty')(x.id)} sub={x.blurb}>{x.label}</Choice>)}
            </Group>
            <label className="mt-5 flex min-h-[44px] cursor-pointer items-center gap-3 text-sm font-semibold">
              <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={cfg.tutorial} onChange={(e) => set('tutorial')(e.target.checked)} /> Guided tutorial with the astronaut
            </label>
          </Panel>
        </motion.div>
        <div className="mt-6 flex gap-3"><Btn variant="ghost" onClick={() => go('destination')}>← Back</Btn><Btn onClick={() => { newMission({ ...cfg }); go('loading'); }}>Begin deployment →</Btn></div>
      </div>
    </div>
  );
}
