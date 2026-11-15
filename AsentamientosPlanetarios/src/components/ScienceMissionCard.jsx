import { Btn } from './UI.jsx';

export default function ScienceMissionCard({ def, reason, onStart, doneCount, active }) {
  return (
    <div className={`rounded-xl border p-3 ${active ? 'border-accent bg-accent/10' : 'border-white/10 bg-space-800/80'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-xs font-bold uppercase tracking-wider"><span aria-hidden>{def.icon}</span> {def.name}</div>
          <p className="mt-1 text-xs leading-snug text-white/75">{def.desc}</p>
        </div>
        {doneCount > 0 && <span className="shrink-0 rounded-md border border-good/60 px-1.5 py-0.5 text-[10px] font-bold text-good">✔ ×{doneCount}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
        <span>⏱ {def.cycles} cycle{def.cycles > 1 ? 's' : ''}</span><span>⚡ {def.power}/cycle</span><span>👩‍🚀 {def.crew} crew</span><span>🧪 +{doneCount ? Math.round(def.points / 2) : def.points}</span>
        {def.reward?.water && <span>💧 +{def.reward.water}</span>}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-warn">{active ? 'IN PROGRESS' : reason || `${Math.round(def.chance * 100)}% success`}</span>
        <Btn small variant="primary" disabled={!!reason || active} onClick={onStart}>Start</Btn>
      </div>
    </div>
  );
}
