import { motion } from 'framer-motion';
import { sfx } from '../audio/audio.js';

export default function DecisionCard({ choice, letter, disabledReason, onPick, delay = 0 }) {
  const disabled = !!disabledReason;
  return (
    <motion.button type="button" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileTap={disabled ? undefined : { scale: 0.98 }}
      onMouseEnter={() => !disabled && sfx.hover()} onClick={() => { if (!disabled) { sfx.select(); onPick(choice.id); } }} aria-disabled={disabled}
      className={`flex min-h-[72px] w-full items-start gap-3 rounded-xl border-2 bg-space-800/90 p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${disabled ? 'border-white/10 opacity-50' : 'border-white/15 hover:border-accent hover:bg-space-700'}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent font-display text-base font-black text-space-950" aria-hidden>{letter}</span>
      <span>
        <span className="block font-display text-[13px] font-bold uppercase leading-tight tracking-wider">{choice.label}</span>
        <span className="mt-1 block text-sm leading-snug text-white/75">→ {choice.sub}</span>
        {disabledReason && <span className="mt-1 block text-xs font-bold uppercase text-bad">⛔ {disabledReason}</span>}
      </span>
    </motion.button>
  );
}
