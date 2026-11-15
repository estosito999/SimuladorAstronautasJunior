import { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { useMission } from '../hooks/useMission.js';
import { Btn, Tag } from '../components/UI.jsx';
import { SceneBoundary, webglAvailable } from '../components/WorldView.jsx';
import { moonData } from '../data/moonData.js';
import { marsData } from '../data/marsData.js';
import { sfx } from '../audio/audio.js';

const PlanetPreview = lazy(() => import('../scenes/PlanetPreview.jsx'));
const LV = { LOW: 'good', MEDIUM: 'warn', HIGH: 'warn', CRITICAL: 'bad' };

function Card({ d, onPick, picked, other }) {
  const [hov, setHov] = useState(false);
  const mars = d.id === 'mars';
  return (
    <motion.button type="button" onClick={() => onPick(d.id)} onMouseEnter={() => { setHov(true); sfx.hover(); }} onMouseLeave={() => setHov(false)} onFocus={() => setHov(true)} onBlur={() => setHov(false)}
      animate={picked ? { scale: 1.06, zIndex: 5 } : other ? { opacity: 0, scale: 0.9 } : { scale: 1 }} whileHover={{ y: -6 }} transition={{ duration: 0.5 }}
      className={`group relative flex flex-1 flex-col overflow-hidden rounded-3xl border-2 bg-space-900/90 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 ${mars ? 'border-[#ff8c50]/50 hover:border-[#ff8c50]' : 'border-[#bad6f5]/40 hover:border-[#bad6f5]'}`}
      aria-label={`Select ${d.name}`}>
      <div className="relative h-44 w-full sm:h-56">
        {webglAvailable() ? <SceneBoundary><Suspense fallback={null}><PlanetPreview kind={d.id} hovered={hov} /></Suspense></SceneBoundary> : <div className="grid h-full place-items-center text-7xl">{d.icon}</div>}
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-space-900 to-transparent`} />
      </div>
      <div className="space-y-3 p-4 pt-0">
        <div className="flex items-end justify-between gap-2"><h2 className="font-display text-3xl font-black tracking-widest">{d.icon} {d.name}</h2><Tag tone={mars ? 'bad' : 'warn'}>{d.difficulty}</Tag></div>
        <p className="text-base text-white/80">{d.tagline}</p>
        <div className="flex flex-wrap gap-1.5">{d.challenges.map((c) => <Tag key={c} tone="info">{c}</Tag>)}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-wider text-white/70">
          {Object.entries(d.levels).slice(0, 4).map(([k, v]) => (<div key={k} className="flex justify-between"><span>{k}</span><Tag tone={LV[v]}>{v}</Tag></div>))}
        </div>
        <p className="text-sm text-white/70"><b className="text-white">Primary challenge:</b> {d.primary}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-white/50">Mission length: {d.avgDuration}</p>
        <div className={`mt-1 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl font-display text-sm font-bold uppercase tracking-widest ${mars ? 'bg-[#ff8c50] text-space-950' : 'bg-[#bad6f5] text-space-950'}`}>Select {d.name} →</div>
      </div>
    </motion.button>
  );
}

export default function DestinationSelect() {
  const { go, setPrefs } = useMission();
  const [picked, setPicked] = useState(null);
  const pick = (id) => {
    if (picked) return;
    sfx.select(); setPicked(id); setPrefs((p) => ({ lastSetup: { ...p.lastSetup, destination: id } }));
    setTimeout(() => go('setup'), 900);
  };
  return (
    <div className="hud-grid h-full overflow-y-auto bg-space-950">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">Select destination</p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-widest">Where will you build?</h1>
        <div className="mt-6 flex flex-col gap-5 md:flex-row">
          <Card d={moonData} onPick={pick} picked={picked === 'moon'} other={picked === 'mars'} />
          <Card d={marsData} onPick={pick} picked={picked === 'mars'} other={picked === 'moon'} />
        </div>
        <div className="mt-6"><Btn variant="ghost" onClick={() => go('briefing')}>← Back</Btn></div>
      </div>
    </div>
  );
}
