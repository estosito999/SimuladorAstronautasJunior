import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMission } from '../hooks/useMission.js';
import { useAstronaut } from '../components/Astronaut.jsx';
import ScoreCard from '../components/ScoreCard.jsx';
import { Btn, Panel, Tag } from '../components/UI.jsx';
import { report, lessons } from '../game/scoringSystem.js';
import { getDest } from '../data/destinations.js';
import { sfx } from '../audio/audio.js';

const LABELS = { crew: 'Crew Safety', power: 'Power Management', resources: 'Resource Usage', radiation: 'Radiation Protection', science: 'Science', hazard: 'Hazard Response', infra: 'Outpost Infrastructure', completion: 'Mission Completion' };
const RESULT = { success: ['🏆', 'SUCCESS', 'good'], partial: ['🟡', 'PARTIAL SUCCESS', 'warn'], failure: ['💥', 'FAILURE', 'bad'], active: ['⏳', 'IN PROGRESS', 'info'] };
const LINES = [['power', '#facc15'], ['oxygen', '#67e8f9'], ['water', '#60a5fa'], ['food', '#4ade80'], ['crewHealth', '#f472b6'], ['radiation', '#fb923c']];

export default function MissionReport() {
  const { mission, go, prefs, setPrefs } = useMission();
  const { say } = useAstronaut();
  const rep = useMemo(() => (mission ? report(mission) : null), [mission]);
  useEffect(() => {
    if (!mission) { go('home'); return undefined; }
    const ok = mission.missionStatus === 'success';
    say({ mood: mission.missionStatus === 'failure' ? 'failed' : ok ? 'celebrating' : 'explaining', lines: ok ? ['Mission report is ready!', 'Take a look at what worked.'] : mission.missionStatus === 'failure' ? ['Review what went wrong.', 'That is how real teams improve.'] : ['Good effort, Commander.', 'See what to improve next time.'], auto: 2600 });
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!mission || !rep) return null;
  const d = getDest(mission.destination);
  const [ricon, rlabel, rtone] = RESULT[mission.missionStatus] || RESULT.active;
  const r = mission.resources;
  const best = mission.decisions.filter((x) => x.quality === 'best');
  const poor = mission.decisions.filter((x) => x.quality === 'poor');
  const L = lessons(mission);
  const again = () => { setPrefs((p) => ({ lastSetup: { ...p.lastSetup, destination: mission.destination } })); go('setup'); };

  return (
    <div className="hud-grid h-full overflow-y-auto bg-space-950">
      <div className="mx-auto max-w-4xl px-4 py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">Mission report • {mission.missionId}</p>
          <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-widest sm:text-4xl">{ricon} {rlabel}</h1>
          {mission.failReason && <p className="mt-1 text-bad">⚠ {mission.failReason}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs"><Tag tone="info">{d.icon} {d.name}</Tag><Tag tone="info">👩‍🚀 Crew {mission.crewSize}</Tag><Tag tone="info">⏱ {mission.cyclesDone}/{mission.duration} cycles</Tag><Tag tone="info">{mission.difficulty.toUpperCase()}</Tag><Tag tone={rtone}>{rlabel}</Tag></div>
        </motion.div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ScoreCard score={rep.score} grade={rep.grade} title={rep.title} categories={rep.categories} labels={LABELS} />
          <div className="space-y-4">
            <Panel className="p-4">
              <h2 className="font-display text-xs font-bold uppercase tracking-widest text-accent">Final status</h2>
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-semibold">
                <li>⚡ Power {Math.round(r.power)}%</li><li>O₂ Oxygen {Math.round(r.oxygen)}%</li><li>💧 Water {Math.round(r.water)}%</li><li>🍎 Food {Math.round(r.food)}%</li><li>❤️ Crew health {Math.round(r.crewHealth)}%</li><li>☢️ Radiation {Math.round(r.radiation)}%</li>
              </ul>
            </Panel>
            <Panel className="p-4">
              <h2 className="font-display text-xs font-bold uppercase tracking-widest text-accent">Science completed ({mission.completedScience.length})</h2>
              <ul className="mt-2 space-y-1 text-sm">{mission.completedScience.map((s, i) => <li key={i}>🔬 {s.name} <span className="text-white/50">• cycle {s.cycle} • +{s.points}</span></li>)}{!mission.completedScience.length && <li className="text-white/60">None this mission.</li>}</ul>
            </Panel>
            <Panel className="p-4">
              <h2 className="font-display text-xs font-bold uppercase tracking-widest text-accent">Hazards encountered ({mission.hazardsEncountered.length})</h2>
              <ul className="mt-2 space-y-1 text-sm">{mission.hazardsEncountered.map((h, i) => <li key={i}>⚠ {h.title} <span className="text-white/50">• cycle {h.cycle}</span></li>)}{!mission.hazardsEncountered.length && <li className="text-white/60">A quiet mission.</li>}</ul>
            </Panel>
          </div>
        </div>

        <Panel className="mt-4 p-4">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-accent">Mission timeline</h2>
          <div className="mt-2 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mission.history.map((h) => ({ ...h, power: Math.round(h.power), oxygen: Math.round(h.oxygen), water: Math.round(h.water), food: Math.round(h.food), crewHealth: Math.round(h.crewHealth), radiation: Math.round(h.radiation) }))} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" /><XAxis dataKey="cycle" stroke="#9aa7bd" fontSize={11} /><YAxis domain={[0, 100]} stroke="#9aa7bd" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0e1629', border: '1px solid #22315a', borderRadius: 8 }} /><Legend wrapperStyle={{ fontSize: 11 }} />
                {LINES.map(([k, c]) => <Line key={k} type="monotone" dataKey={k} stroke={c} dot={false} strokeWidth={2} strokeDasharray={k === 'radiation' ? '5 4' : undefined} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Panel className="p-4"><h2 className="font-display text-xs font-bold uppercase tracking-widest text-good">✅ Best decisions</h2><ul className="mt-2 space-y-1.5 text-sm">{best.map((x, i) => <li key={i}><b>{x.title}</b> — {x.label} <span className="text-white/50">(cycle {x.cycle})</span></li>)}{!best.length && <li className="text-white/60">No standout decisions this time.</li>}</ul></Panel>
          <Panel className="p-4"><h2 className="font-display text-xs font-bold uppercase tracking-widest text-bad">⚠ Risky decisions</h2><ul className="mt-2 space-y-1.5 text-sm">{poor.map((x, i) => <li key={i}><b>{x.title}</b> — {x.label} <span className="text-white/50">(cycle {x.cycle})</span></li>)}{!poor.length && <li className="text-white/60">None — well played.</li>}</ul></Panel>
        </div>

        <Panel className="mt-4 border-accent/40 p-4">
          <h2 className="font-display text-sm font-black uppercase tracking-widest text-accent">What you learned</h2>
          <ul className="mt-2 space-y-2 leading-snug">{L.map((l) => <li key={l}>🎓 {l}</li>)}</ul>
        </Panel>

        <div className="mt-6 flex flex-wrap gap-3"><Btn onClick={() => { sfx.select(); again(); }}>↻ Play again</Btn><Btn variant="ghost" onClick={() => go('home')}>Main menu</Btn><Btn variant="ghost" onClick={() => go('nasa')}>🛰 NASA Data & Science</Btn></div>
      </div>
    </div>
  );
}
