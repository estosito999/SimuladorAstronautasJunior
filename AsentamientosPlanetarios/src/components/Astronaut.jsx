import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sfx } from '../audio/audio.js';

const AstroCtx = createContext(null);
export const useAstronaut = () => useContext(AstroCtx);

const FACES = {
  welcome: { eyes: 'dots', brows: 0, mouth: 'M44 78 Q60 92 76 78' },
  explaining: { eyes: 'dots', brows: 0, mouth: 'M48 80 Q60 88 72 80' },
  warning: { eyes: 'wide', brows: -1, mouth: 'M50 84 Q60 76 70 84' },
  thinking: { eyes: 'side', brows: 0, mouth: 'M50 82 L70 82' },
  happy: { eyes: 'arcs', brows: 0, mouth: 'M42 76 Q60 98 78 76 Z' },
  celebrating: { eyes: 'arcs', brows: 0, mouth: 'M40 74 Q60 104 80 74 Z' },
  concerned: { eyes: 'dots', brows: 1, mouth: 'M48 84 Q60 76 72 84' },
  failed: { eyes: 'dots', brows: 1, mouth: 'M46 86 Q60 74 74 86' },
  complete: { eyes: 'arcs', brows: 0, mouth: 'M42 76 Q60 98 78 76 Z' },
};
const MOTION = {
  warning: { x: [0, -5, 5, -4, 4, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.8 } },
  celebrating: { y: [0, -16, 0], rotate: [0, -6, 6, 0], transition: { duration: 0.7, repeat: Infinity } },
  complete: { y: [0, -14, 0], transition: { duration: 0.7, repeat: Infinity } },
  happy: { y: [0, -8, 0], transition: { duration: 0.6, repeat: 2 } },
  concerned: { rotate: [0, -5, 0, -5, 0], transition: { duration: 2.4, repeat: Infinity } },
  failed: { rotate: [-4, -4], y: [4, 4], transition: { duration: 0.4 } },
  thinking: { rotate: [0, 5, 0], transition: { duration: 2.2, repeat: Infinity } },
  default: { y: [0, -5, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
};

export function AstronautFigure({ mood = 'welcome', size = 96 }) {
  const f = FACES[mood] || FACES.welcome;
  const eyeY = 62;
  return (
    <motion.svg width={size} height={size * 1.15} viewBox="0 0 120 140" role="img" aria-label={`Astronaut guide, ${mood}`} animate={MOTION[mood] || MOTION.default} style={{ overflow: 'visible' }}>
      <ellipse cx="60" cy="134" rx="30" ry="5" fill="rgba(0,0,0,.35)" />
      <rect x="22" y="76" width="22" height="42" rx="9" fill="#9aa7bd" />
      <rect x="40" y="82" width="42" height="42" rx="16" fill="#f4f7fb" stroke="#c3cee0" strokeWidth="2" />
      <rect x="50" y="92" width="22" height="14" rx="4" fill="#1d2b4a" />
      <circle cx="57" cy="99" r="2.4" fill="#4ade80" /><circle cx="65" cy="99" r="2.4" fill="rgb(var(--warm))" />
      <rect x="40" y="116" width="14" height="16" rx="6" fill="#e6ecf6" /><rect x="68" y="116" width="14" height="16" rx="6" fill="#e6ecf6" />
      <circle cx="36" cy="100" r="8" fill="#e6ecf6" stroke="#c3cee0" strokeWidth="2" />
      <motion.g animate={mood === 'welcome' || mood === 'celebrating' || mood === 'complete' ? { rotate: [0, -35, 0, -35, 0] } : { rotate: 0 }} style={{ originX: '86px', originY: '92px' }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.2 }}>
        <circle cx="86" cy="100" r="8" fill="#e6ecf6" stroke="#c3cee0" strokeWidth="2" />
      </motion.g>
      <circle cx="60" cy="56" r="40" fill="#f4f7fb" stroke="#c3cee0" strokeWidth="3" />
      <rect x="22" y="44" width="76" height="46" rx="23" fill="#14213d" />
      <rect x="22" y="44" width="76" height="46" rx="23" fill="url(#visor)" />
      <defs><linearGradient id="visor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="rgb(var(--accent))" stopOpacity=".5" /><stop offset="1" stopColor="#14213d" stopOpacity="0" /></linearGradient></defs>
      <path d="M32 52 Q40 46 52 48" stroke="#fff" strokeOpacity=".6" strokeWidth="3" fill="none" strokeLinecap="round" />
      {f.eyes === 'dots' && (<><circle cx="46" cy={eyeY} r="5" fill="#fff" /><circle cx="74" cy={eyeY} r="5" fill="#fff" /></>)}
      {f.eyes === 'wide' && (<><circle cx="46" cy={eyeY} r="7" fill="#fff" /><circle cx="74" cy={eyeY} r="7" fill="#fff" /><circle cx="46" cy={eyeY} r="2.5" fill="#14213d" /><circle cx="74" cy={eyeY} r="2.5" fill="#14213d" /></>)}
      {f.eyes === 'side' && (<><circle cx="46" cy={eyeY} r="5" fill="#fff" /><circle cx="74" cy={eyeY} r="5" fill="#fff" /><circle cx="49" cy={eyeY - 1} r="2" fill="#14213d" /><circle cx="77" cy={eyeY - 1} r="2" fill="#14213d" /></>)}
      {f.eyes === 'arcs' && (<><path d="M40 66 Q46 56 52 66" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M68 66 Q74 56 80 66" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" /></>)}
      {f.brows === 1 && (<><path d="M38 52 L52 56" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><path d="M82 52 L68 56" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></>)}
      {f.brows === -1 && (<><path d="M38 56 L52 50" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><path d="M82 56 L68 50" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></>)}
      <path d={f.mouth} stroke="#fff" strokeWidth="3.5" fill={f.mouth.endsWith('Z') ? '#fff' : 'none'} strokeLinecap="round" strokeLinejoin="round" transform="translate(0,-8)" />
      <circle cx="60" cy="14" r="4" fill="rgb(var(--warm))" /><rect x="58" y="14" width="4" height="8" fill="#c3cee0" />
    </motion.svg>
  );
}

/** Provider renders the docked astronaut + speech bubble. say({mood, lines, actions, auto, sticky}) */
export function AstronautProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const stickyRef = useRef(false);
  const timer = useRef(null);

  const dismiss = useCallback(() => { stickyRef.current = false; setMsg(null); }, []);
  const say = useCallback((m) => {
    if (stickyRef.current && !m.sticky && !m.force) return;
    stickyRef.current = !!m.sticky;
    setIdx(0); setTyped(''); setDone(false);
    setMsg({ mood: 'explaining', auto: m.actions || m.sticky ? 0 : 2400, ...m, id: Math.random() });
    if (m.sound) sfx[m.sound]?.();
  }, []);

  const line = msg?.lines?.[idx] ?? '';
  // typewriter
  useEffect(() => {
    if (!msg) return undefined;
    setTyped(''); setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i += 1; setTyped(line.slice(0, i));
      if (i % 3 === 0) sfx.talk();
      if (i >= line.length) { clearInterval(t); setDone(true); }
    }, 18);
    return () => clearInterval(t);
  }, [msg, idx, line]);

  const last = msg ? idx >= msg.lines.length - 1 : false;
  const advance = useCallback(() => {
    if (!msg) return;
    if (!done) { setTyped(line); setDone(true); return; }
    if (!last) setIdx((i) => i + 1);
    else if (!msg.actions && !msg.sticky) { dismiss(); msg.onDone?.(); }
  }, [msg, done, last, line, dismiss]);

  // auto-advance for ambient lines
  useEffect(() => {
    clearTimeout(timer.current);
    if (msg && done && msg.auto) timer.current = setTimeout(() => (last ? (dismiss(), msg.onDone?.()) : setIdx((i) => i + 1)), msg.auto + line.length * 25);
    return () => clearTimeout(timer.current);
  }, [msg, done, last, line, dismiss]);

  return (
    <AstroCtx.Provider value={{ say, dismiss, active: !!msg }}>
      {children}
      <div className="astro-dock pointer-events-none fixed left-2 z-40 flex items-end gap-1 sm:left-4" style={{ maxWidth: 'calc(100vw - 1rem)' }}>
        <AnimatePresence>
          {msg && (
            <motion.div key={msg.id} initial={{ y: 220, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 220, opacity: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 17 }} className="flex items-end gap-1">
              <div className="pointer-events-auto shrink-0 scale-[0.78] origin-bottom-left sm:scale-100"><AstronautFigure mood={msg.mood} /></div>
              <motion.div
                role="status" aria-live="polite" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25 }}
                className="pointer-events-auto relative -ml-5 mb-8 w-[min(18rem,calc(100vw-6.5rem))] cursor-pointer rounded-2xl rounded-bl-sm border-2 border-accent/70 bg-space-900/95 p-3 text-sm text-white shadow-[0_0_30px_-8px_rgb(var(--accent))] sm:ml-0 sm:w-80"
                onClick={advance}
              >
                <div className="min-h-[2.6rem] text-[15px] font-semibold leading-snug">{typed}<span className="opacity-0">{line.slice(typed.length)}</span></div>
                {done && !last && <div className="mt-1 text-right text-[10px] font-bold uppercase tracking-widest text-accent">tap ▸</div>}
                {done && last && msg.actions && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.actions.map((a) => (
                      <button key={a.label} type="button" onClick={(e) => { e.stopPropagation(); sfx.click(); a.onClick?.(); if (!a.keep) dismiss(); }}
                        className={`min-h-[44px] rounded-lg px-3 font-display text-[11px] font-bold uppercase tracking-widest focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${a.primary ? 'bg-accent text-space-950' : 'border border-white/25 bg-space-700 text-white'}`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AstroCtx.Provider>
  );
}
