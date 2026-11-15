import { pad2 } from '../utils/calculations.js';
import { getDest } from '../data/destinations.js';

export default function MissionTimer({ mission }) {
  const d = getDest(mission.destination);
  return (
    <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest" aria-label={`Cycle ${mission.cycle} of ${mission.duration}`}>
      <span className="text-accent">CYCLE {pad2(mission.cycle)}</span><span className="text-white/40">/ {mission.duration}</span>
      <span className="hidden text-white/50 sm:inline">• {d.unitLabel} {pad2(mission.cycle)}</span>
    </div>
  );
}
