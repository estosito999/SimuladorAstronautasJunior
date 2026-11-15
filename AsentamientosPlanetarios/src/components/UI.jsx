import { motion } from 'framer-motion';
import { sfx } from '../audio/audio.js';

/** Game button with hover + click sound, 44px touch target. */
export function Btn({ children, onClick, variant = 'primary', className = '', disabled, title, small, ...rest }) {
  const base = 'relative inline-flex items-center justify-center gap-2 rounded-xl font-display uppercase tracking-widest select-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 disabled:cursor-not-allowed';
  const size = small ? 'min-h-[44px] px-3 text-[11px]' : 'min-h-[48px] px-5 text-xs sm:text-sm';
  const styles = {
    primary: 'bg-accent text-space-950 font-bold hover:brightness-110 shadow-[0_0_24px_-6px_rgb(var(--accent)/0.8)]',
    ghost: 'bg-space-800/70 text-white border border-white/15 hover:border-accent/70 hover:bg-space-700/80',
    danger: 'bg-bad/90 text-space-950 font-bold hover:brightness-110',
    warm: 'bg-warm text-space-950 font-bold hover:brightness-110',
  };
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { y: -1 }}
      type="button" title={title} disabled={disabled}
      onMouseEnter={() => !disabled && sfx.hover()}
      onClick={(e) => { if (disabled) return; sfx.click(); onClick?.(e); }}
      className={`${base} ${size} ${styles[variant]} ${className}`} {...rest}
    >
      {children}
    </motion.button>
  );
}

export function Tag({ children, tone = 'info', className = '' }) {
  const t = { info: 'border-accent/50 text-accent', good: 'border-good/60 text-good', warn: 'border-warn/60 text-warn', bad: 'border-bad/60 text-bad', fact: 'border-sky-300/60 text-sky-300', sim: 'border-warm/60 text-warm' }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${t} ${className}`}>{children}</span>;
}

export function Panel({ children, className = '' }) {
  return <div className={`rounded-2xl border border-white/10 bg-space-900/80 backdrop-blur-sm ${className}`}>{children}</div>;
}

export const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};
