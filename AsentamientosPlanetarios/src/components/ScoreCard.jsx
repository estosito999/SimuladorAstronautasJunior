import { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';

export default function ScoreCard({ score, grade, title, categories, labels }) {
  const [n, setN] = useState(0);
  useEffect(() => { const c = animate(0, score, { duration: 1.6, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) }); return () => c.stop(); }, [score]);
  return (
    <div className="rounded-2xl border border-accent/40 bg-space-900/85 p-5">
      <div className="flex items-center gap-5">
        <div className="text-center"><div className="font-display text-6xl font-black tabular-nums text-accent">{n}</div><div className="text-[11px] font-bold uppercase tracking-widest text-white/60">/ 100</div></div>
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1.2, type: 'spring' }} className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-accent font-display text-5xl font-black text-accent" aria-label={`Grade ${grade}`}>{grade}</motion.div>
        <div className="font-display text-sm font-bold uppercase leading-tight tracking-widest">{title}</div>
      </div>
      <div className="mt-4 space-y-2">
        {Object.entries(labels).map(([k, label]) => (
          <div key={k}>
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest"><span>{label}</span><span className="tabular-nums">{Math.round(categories[k])}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-space-600"><motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${categories[k]}%` }} transition={{ duration: 1.1, delay: 0.3 }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
