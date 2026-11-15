import ResourceGauge from './ResourceGauge.jsx';
import { radiationLevel } from '../utils/calculations.js';
import { commLevel } from '../game/resourceSystem.js';

export const DEF = {
  power: { label: 'Power', icon: '⚡' }, oxygen: { label: 'Oxygen', icon: 'O₂' }, water: { label: 'Water', icon: '💧' }, food: { label: 'Food', icon: '🍎' },
  crewHealth: { label: 'Crew health', icon: '❤️' }, radiation: { label: 'Radiation', icon: '☢️', invert: true }, science: { label: 'Science', icon: '🔬', neutral: true }, comm: { label: 'Comms', icon: '📡' },
};

export default function ResourcePanel({ mission, ids = ['power', 'oxygen', 'water', 'food', 'crewHealth'], highlight = [], className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {ids.map((id) => {
        const d = DEF[id];
        const value = id === 'comm' ? commLevel(mission) : mission.resources[id];
        return <ResourceGauge key={id} id={id} {...d} value={value} highlight={highlight?.includes(`gauge-${id}`)} />;
      })}
    </div>
  );
}

/** Compact mobile chip: icon + number + status glyph (not color-only). */
export function GaugeChip({ id, mission, onClick, highlight }) {
  const d = DEF[id];
  const v = id === 'comm' ? commLevel(mission) : mission.resources[id];
  const bad = d.invert ? 100 - v : v;
  const glyph = d.neutral ? '★' : bad < 12 ? '⛔' : bad < 30 ? '⚠' : '✔';
  const tone = d.neutral ? 'border-accent/50' : bad < 12 ? 'border-bad text-bad' : bad < 30 ? 'border-warn text-warn' : 'border-white/15';
  return (
    <button type="button" onClick={onClick} id={`gauge-${id}`} aria-label={`${d.label} ${Math.round(v)} percent${d.invert ? ', ' + radiationLevel(v) : ''}`}
      className={`flex min-h-[44px] min-w-[58px] flex-1 flex-col items-center justify-center rounded-xl border bg-space-900/85 px-1 py-0.5 backdrop-blur-sm ${tone} ${highlight ? 'animate-ring border-accent' : ''}`}>
      <span className="text-sm leading-none" aria-hidden>{d.icon}</span>
      <span className="font-display text-xs font-bold tabular-nums">{Math.round(v)}<span aria-hidden className="ml-0.5 text-[9px]">{glyph}</span></span>
    </button>
  );
}
