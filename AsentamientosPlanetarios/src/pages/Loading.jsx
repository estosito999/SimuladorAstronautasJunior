import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMission } from '../hooks/useMission.js';
import { sfx } from '../audio/audio.js';

const LINES = ['INITIALIZING ZERO-G...', 'LOADING PLANETARY ENVIRONMENT...', 'CALIBRATING LIFE SUPPORT...', 'SYNCING MISSION SYSTEMS...', 'READY FOR DEPLOYMENT'];

export default function Loading() {
  const { go, mission } = useMission();
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((x) => { if (x < LINES.length) { sfx.hover(); return x + 1; } return x; }), 380);
    const done = setTimeout(() => go(mission ? 'builder' : 'home'), 2300);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [go, mission]);
  return (
    <div className="hud-grid grid h-full place-items-center bg-space-950 p-6">
      <div className="w-full max-w-md">
        <div className="font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">Mission {mission?.missionId}</div>
        <ul className="mt-4 space-y-2 font-display text-sm font-bold tracking-widest" aria-live="polite">
          {LINES.slice(0, n).map((l, i) => (<motion.li key={l} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={i === LINES.length - 1 ? 'text-good' : 'text-white/80'}>{i === n - 1 && n < LINES.length ? '▸ ' : '✔ '}{l}</motion.li>))}
        </ul>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-space-600"><motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.1, ease: 'linear' }} /></div>
      </div>
    </div>
  );
}
