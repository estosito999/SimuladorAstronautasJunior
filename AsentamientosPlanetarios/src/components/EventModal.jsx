import { motion } from 'framer-motion';
import { getHazard } from '../data/hazards.js';
import { choiceAvailable } from '../game/decisionSystem.js';
import DecisionCard from './DecisionCard.jsx';
import { Btn, Tag } from './UI.jsx';

const CH = { power: '⚡ POWER', oxygen: 'O₂ OXYGEN', water: '💧 WATER', food: '🍎 FOOD', crewHealth: '❤️ CREW HEALTH', radiation: '☢️ RADIATION', science: '🔬 SCIENCE', buildPoints: '🧱 BUILD PTS' };
const BAD_WHEN_UP = new Set(['radiation']);
const SEV = { LOW: 'info', MEDIUM: 'warn', HIGH: 'bad', CRITICAL: 'bad' };
const QUAL = { best: ['✅', 'BEST CALL', 'good'], ok: ['➖', 'REASONABLE', 'warn'], poor: ['⚠️', 'RISKY CHOICE', 'bad'] };

function Shell({ children, tone = 'bad', label }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/65 p-2 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="dialog" aria-modal="true" aria-label={label}>
      <motion.div initial={{ y: 60, scale: 0.96 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 18 }}
        className={`my-auto max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border-2 bg-space-900/95 p-4 shadow-2xl sm:p-5 ${tone === 'bad' ? 'border-bad/70 shadow-bad/20' : 'border-accent/60'}`}>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function DecisionModal({ mission, onChoose }) {
  const ev = mission.pendingEvent, h = getHazard(ev.id);
  return (
    <Shell label={h.title}>
      <div className="flex items-center gap-2"><Tag tone={SEV[h.severity]}>⚠ {h.severity}</Tag><Tag tone="info">CYCLE {mission.cycle}</Tag></div>
      <h2 className="mt-2 font-display text-xl font-black uppercase leading-tight tracking-wide sm:text-2xl"><span aria-hidden>{h.icon}</span> {h.title}</h2>
      <p className="mt-2 text-base leading-snug text-white/85">{h.desc}</p>
      {ev.lines?.length > 0 && <ul className="mt-2 flex flex-wrap gap-1.5">{ev.lines.map((l) => <Tag key={l} tone="warn">{l}</Tag>)}</ul>}
      <p className="mt-3 font-display text-xs font-bold uppercase tracking-widest text-accent">Your decision, Commander</p>
      <div className="mt-2 space-y-2">
        {h.choices.map((c, i) => <DecisionCard key={c.id} choice={c} letter={'ABC'[i]} delay={0.1 + i * 0.08} disabledReason={choiceAvailable(mission, c) ? null : `Needs ${c.cost.buildPoints} build points`} onPick={onChoose} />)}
      </div>
    </Shell>
  );
}

export function OutcomeModal({ outcome, onContinue }) {
  const [icon, label, tone] = QUAL[outcome.quality] || QUAL.ok;
  return (
    <Shell tone="accent" label="Decision outcome">
      <div className="flex items-center gap-2"><Tag tone={tone}>{icon} {label}</Tag></div>
      <h2 className="mt-2 font-display text-lg font-black uppercase tracking-wide">{outcome.icon} {outcome.title}</h2>
      <p className="text-sm text-white/60">You chose: <b className="text-white">{outcome.choiceLabel}</b></p>
      <section className="mt-3"><h3 className="font-display text-xs font-bold uppercase tracking-widest text-accent">What happened</h3>
        <p className="mt-1 leading-snug">{outcome.what}</p>
        {outcome.changes.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {outcome.changes.map((c) => { const goodChange = BAD_WHEN_UP.has(c.key) ? c.amount < 0 : c.amount > 0; return <li key={c.key} className={`rounded-md border px-2 py-0.5 font-display text-[11px] font-bold ${goodChange ? 'border-good/60 text-good' : 'border-bad/60 text-bad'}`}>{c.amount > 0 ? '▲ +' : '▼ '}{c.amount} {CH[c.key]}</li>; })}
          </ul>)}
      </section>
      <section className="mt-3"><h3 className="font-display text-xs font-bold uppercase tracking-widest text-accent">Why it happened</h3><p className="mt-1 leading-snug text-white/85">{outcome.why}</p></section>
      <section className="mt-3 rounded-xl border border-sky-300/30 bg-space-800/80 p-3"><h3 className="font-display text-xs font-bold uppercase tracking-widest text-sky-300">Real-world connection</h3><p className="mt-1 leading-snug text-white/85">{outcome.real}</p></section>
      <div className="mt-4 flex justify-end"><Btn onClick={onContinue}>Continue ▸</Btn></div>
    </Shell>
  );
}
