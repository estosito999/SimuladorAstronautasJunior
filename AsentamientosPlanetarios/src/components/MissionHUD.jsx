import { SoundToggle } from './AudioControl.jsx';
import MissionTimer from './MissionTimer.jsx';
import { AnimatedNumber } from './ResourceGauge.jsx';
import { getDest } from '../data/destinations.js';
import { Btn } from './UI.jsx';

export default function MissionHUD({ mission, onMenu }) {
  const d = getDest(mission.destination);
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2 sm:p-3">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/10 bg-space-900/85 px-3 py-2 backdrop-blur-sm">
        <MissionTimer mission={mission} />
        <span className="hidden font-display text-xs font-bold uppercase tracking-widest text-white/70 sm:inline">{d.icon} {d.name}</span>
      </div>
      <div className="pointer-events-auto hidden rounded-xl border border-white/10 bg-space-900/85 px-3 py-2 text-center backdrop-blur-sm sm:block">
        <div className="font-display text-[10px] font-bold uppercase tracking-widest text-white/60">Score</div>
        <div className="font-display text-lg font-black leading-none text-accent tabular-nums"><AnimatedNumber value={mission.missionScore} /></div>
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="rounded-xl border border-white/10 bg-space-900/85 px-2.5 py-2 font-display text-xs font-bold text-accent backdrop-blur-sm sm:hidden" aria-label={`Score ${mission.missionScore}`}>★ {mission.missionScore}</div>
        <div className="rounded-xl border border-white/10 bg-space-900/85 px-2.5 py-2 font-display text-xs font-bold backdrop-blur-sm" title="Build points">🧱 {mission.buildPoints}<span className="hidden text-white/50 sm:inline"> BP</span></div>
        <SoundToggle />
        <Btn small variant="ghost" onClick={onMenu} aria-label="Open menu">☰ <span className="hidden sm:inline">Menu</span></Btn>
      </div>
    </header>
  );
}
