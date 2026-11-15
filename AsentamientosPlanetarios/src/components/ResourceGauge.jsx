import { useEffect, useRef, useState } from 'react';
import { animate, AnimatePresence, motion } from 'framer-motion';
import { radiationLevel } from '../utils/calculations.js';

export function AnimatedNumber({ value }) {
  const [d, setD] = useState(Math.round(value));
  const from = useRef(value);
  useEffect(() => {
    const c = animate(from.current, value, { duration: 0.7, ease: 'easeOut', onUpdate: (v) => setD(Math.round(v)) });
    from.current = value;
    return () => c.stop();
  }, [value]);
  return <>{d}</>;
}

function toneFor(value, invert) {
  const v = invert ? 100 - value : value;
  if (v < 12) return { name: 'CRITICAL', icon: '⛔', bar: 'bg-bad', text: 'text-bad', pulse: true };
  if (v < 30) return { name: 'LOW', icon: '⚠', bar: 'bg-warn', text: 'text-warn', pulse: false };
  if (v < 50) return { name: 'FAIR', icon: '◐', bar: 'bg-warn/80', text: 'text-warn', pulse: false };
  return { name: 'OK', icon: '✔', bar: 'bg-good', text: 'text-good', pulse: false };
}

/** Animated HUD gauge. Never color-only: icon + word status + number. */
export default function ResourceGauge({ id, label, icon, value, invert = false, highlight = false, compact = false, hint, neutral = false }) {
  const prev = useRef(value);
  const [delta, setDelta] = useState(null);
  useEffect(() => {
    const d = Math.round(value - prev.current);
    prev.current = value;
    if (Math.abs(d) >= 1) {
      setDelta({ d, k: Math.random() });
      const t = setTimeout(() => setDelta(null), 1600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [value]);

  const tone = neutral ? { name: 'PTS', icon: '★', bar: 'bg-accent', text: 'text-accent', pulse: false } : toneFor(value, invert);
  const status = invert ? radiationLevel(value) : tone.name;
  const good = invert ? delta?.d < 0 : delta?.d > 0;

  return (
    <div id={`gauge-${id}`} title={hint || label}
      className={`relative rounded-xl border bg-space-900/80 px-3 py-2 backdrop-blur-sm transition-shadow ${highlight ? 'animate-ring border-accent shadow-[0_0_24px_rgb(var(--accent)/.6)]' : 'border-white/10'} ${tone.pulse ? 'border-bad/70' : ''}`}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1.5"><span aria-hidden className="text-base">{icon}</span>{label}</span>
        <span className={`flex items-center gap-1 ${tone.text}`}><span aria-hidden>{tone.icon}</span>{!compact && <span>{status}</span>}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-space-600/70" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className={`h-full rounded-full ${tone.bar} ${tone.pulse ? 'animate-pulse' : ''}`} animate={{ width: `${Math.max(2, value)}%` }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} />
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 9px, rgba(4,6,13,.55) 9px 10px)' }} />
        </div>
        <span className="w-9 text-right font-display text-sm font-bold tabular-nums"><AnimatedNumber value={value} /></span>
      </div>
      <AnimatePresence>
        {delta && (
          <motion.span key={delta.k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0 }}
            className={`pointer-events-none absolute right-2 top-0 font-display text-xs font-black ${good ? 'text-good' : 'text-bad'}`}>
            {delta.d > 0 ? '▲ +' : '▼ '}{delta.d} {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
