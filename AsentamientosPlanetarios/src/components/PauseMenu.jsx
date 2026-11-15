import { useState } from 'react';
import { motion } from 'framer-motion';
import { Btn } from './UI.jsx';
import ResourcePanel from './ResourcePanel.jsx';
import NASAFactCard from './NASAFactCard.jsx';
import { AudioSettings } from './AudioControl.jsx';
import { FACT_CARDS } from '../data/nasaSources.js';
import { powerForecast } from '../game/resourceSystem.js';
import { useMission } from '../hooks/useMission.js';

const OBJ = ['Keep the crew alive', 'Maintain oxygen, water and food', 'Manage power (generation, storage, use)', 'Keep radiation exposure low', 'Complete science objectives', 'Survive environmental hazards', 'Finish all cycles'];

export default function PauseMenu({ mission, onClose }) {
  const { restart, exit, abandon } = useMission();
  const [view, setView] = useState('main');
  const [confirm, setConfirm] = useState(null);
  const f = powerForecast(mission);
  const items = [['objectives', '🎯 Mission objectives'], ['resources', '📊 Resource status'], ['facts', '🛰 NASA facts'], ['settings', '⚙ Settings & audio']];
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="dialog" aria-modal="true" aria-label="Pause menu">
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-accent/50 bg-space-900 p-4">
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-black uppercase tracking-[0.25em] text-accent">{view === 'main' ? 'Paused' : view}</h2>{view !== 'main' && <Btn small variant="ghost" onClick={() => setView('main')}>← Back</Btn>}</div>
        {view === 'main' && (
          <div className="mt-3 flex flex-col gap-2">
            <Btn onClick={onClose}>▶ Resume mission</Btn>
            {items.map(([k, l]) => <Btn key={k} variant="ghost" onClick={() => setView(k)}>{l}</Btn>)}
            {confirm ? (
              <div className="rounded-xl border border-bad/60 p-3 text-sm"><p className="font-semibold">{confirm === 'restart' ? 'Restart this mission? Progress will be lost.' : 'Exit to main menu? Your mission is saved.'}</p>
                <div className="mt-2 flex gap-2"><Btn small variant="danger" onClick={confirm === 'restart' ? restart : exit}>Yes</Btn><Btn small variant="ghost" onClick={() => setConfirm(null)}>Cancel</Btn></div></div>
            ) : (<><Btn variant="ghost" onClick={() => setConfirm('restart')}>↻ Restart mission</Btn><Btn variant="ghost" onClick={() => setConfirm('exit')}>⏏ Exit to main menu</Btn></>)}
            <button type="button" onClick={abandon} className="min-h-[44px] text-xs font-bold uppercase tracking-widest text-white/40 underline">Abandon mission & clear save</button>
          </div>
        )}
        {view === 'objectives' && <ul className="mt-3 space-y-2">{OBJ.map((o) => <li key={o} className="rounded-lg bg-space-800 p-2.5 font-semibold">▸ {o}</li>)}<li className="rounded-lg bg-space-800 p-2.5 text-sm text-white/70">Science needed to succeed: {mission.completedScience.length} done • goal {mission.scienceTarget} pts (now {Math.round(mission.resources.science)})</li></ul>}
        {view === 'resources' && (<div className="mt-3"><ResourcePanel mission={mission} ids={['power', 'oxygen', 'water', 'food', 'crewHealth', 'radiation', 'science', 'comm']} />
          <p className="mt-3 rounded-lg bg-space-800 p-2.5 text-sm">⚡ Generating <b>{f.gen.toFixed(1)}</b> • using <b>{f.dem.toFixed(1)}</b> • net <b className={f.net < 0 ? 'text-bad' : 'text-good'}>{f.net >= 0 ? '+' : ''}{f.net.toFixed(1)}</b> per cycle{f.net < 0 && Number.isFinite(f.cyclesLeft) ? ` — batteries last about ${Math.ceil(f.cyclesLeft)} cycles` : ''}.</p></div>)}
        {view === 'facts' && <div className="mt-3 space-y-2">{FACT_CARDS.map((c) => <NASAFactCard key={c.fact} {...c} />)}</div>}
        {view === 'settings' && <div className="mt-3"><AudioSettings /></div>}
      </motion.div>
    </motion.div>
  );
}
