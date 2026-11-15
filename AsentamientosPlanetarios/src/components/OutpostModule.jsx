import { motion } from 'framer-motion';
import { sfx } from '../audio/audio.js';

/** Build-menu card for one module type. */
export default function OutpostModule({ def, count, reason, onBuild, highlight, compact }) {
  const disabled = !!reason;
  return (
    <motion.button
      id={`mod-${def.id}`} type="button" whileTap={disabled ? undefined : { scale: 0.96 }}
      onMouseEnter={() => !disabled && sfx.hover()} onClick={() => !disabled && onBuild(def.id)}
      aria-disabled={disabled} title={`${def.name}: ${def.benefit}. Trade-off: ${def.tradeoff}${reason ? ` (${reason})` : ''}`}
      className={`group relative shrink-0 rounded-xl border bg-space-800/90 p-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${compact ? 'w-[8.5rem]' : 'w-full'} ${highlight ? 'animate-ring border-accent' : 'border-white/10 hover:border-accent/70'} ${disabled ? 'opacity-55' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xl" aria-hidden>{def.icon}</span>
        <span className="rounded-md bg-accent/15 px-1.5 py-0.5 font-display text-[11px] font-bold text-accent">{def.cost} BP</span>
      </div>
      <div className="mt-1 font-display text-[11px] font-bold uppercase leading-tight tracking-wider">{def.name}</div>
      {!compact && <div className="mt-1 text-xs leading-snug text-white/70">{def.benefit}</div>}
      {!compact && <div className="mt-1 text-[11px] leading-snug text-warn/90">⚖ {def.tradeoff}</div>}
      <div className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/60">
        <span>{def.demand ? `⚡ −${def.demand}` : def.gen ? `⚡ +${def.gen}` : 'No power use'}</span>
        <span>{count}/{def.max}</span>
      </div>
      {disabled && <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-bad">{reason}</div>}
    </motion.button>
  );
}
