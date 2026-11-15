import { lazy, Suspense, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMission } from '../hooks/useMission.js';
import { Btn, Tag } from '../components/UI.jsx';
import { SceneBoundary, webglAvailable } from '../components/WorldView.jsx';
import { SoundToggle } from '../components/AudioControl.jsx';

const HeroScene = lazy(() => import('../scenes/HeroScene.jsx'));

const STEPS = [
  ['🌍', 'Pick a world', 'Choose the Moon or Mars. Each one fights back differently.'],
  ['🏗️', 'Build your outpost', 'Spend a limited budget on power, life support, shielding and science.'],
  ['⚠️', 'Face hazards', 'Dust storms, radiation and failures force real trade-offs.'],
  ['🎓', 'Learn from results', 'Every decision has a consequence — and a real NASA connection.'],
];

export default function Home() {
  const { go, saved, resume, scores, prefs, setPrefs } = useMission();
  const [how, setHow] = useState(false);
  return (
    <div className="relative h-full overflow-y-auto">
      <div className="absolute inset-0 -z-0">
        {webglAvailable() && <SceneBoundary><Suspense fallback={null}><HeroScene /></Suspense></SceneBoundary>}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/30 to-space-950/70" />
        <div className="hud-grid pointer-events-none absolute inset-0 opacity-40" />
      </div>
      <main className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center px-5 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <Tag tone="info">NASA Space Apps Challenge • Team 55 CANCRI E</Tag>
          <h1 className="mt-4 font-display text-5xl font-black tracking-[0.1em] text-white drop-shadow-[0_0_28px_rgb(var(--accent)/.55)] sm:text-7xl">GESTIÓN<span className="text-accent"> DE </span>HÁBITAT</h1>
          <p className="mt-2 font-display text-sm font-bold uppercase tracking-[0.25em] text-accent sm:text-base">Misión de Planificación y Supervivencia Planetaria</p>
          <p className="mt-4 text-2xl font-bold sm:text-3xl">Planifica. Sobrevive. Explora.</p>
          <p className="mx-auto mt-3 max-w-md text-lg text-white/80">¿Puedes mantener con vida un asentamiento humano en la Luna o en Marte?</p>
        </motion.div>
        <motion.div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Btn onClick={() => go('briefing')} className="sm:min-w-[14rem]">🚀 Iniciar Misión</Btn>
          {saved && <Btn variant="warm" onClick={resume}>{saved.missionStatus !== 'active' ? '📄 Último informe' : `▶ Continuar (${saved.destination === 'mars' ? 'Marte' : 'Luna'} • C${saved.cycle})`}</Btn>}
          <Btn variant="ghost" onClick={() => setHow(true)}>Cómo funciona</Btn>
        </motion.div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs">
          <SoundToggle />
          <button type="button" onClick={() => go('nasa')} className="min-h-[44px] rounded-xl border border-white/15 bg-space-800/70 px-4 font-display text-[11px] font-bold uppercase tracking-widest hover:border-accent">🛰 Ciencia y Datos NASA</button>
          {scores.best > 0 && <Tag tone="good" className="min-h-[44px]">🏆 Mejor puntaje {scores.best}</Tag>}
        </div>
        {!prefs.sound.enabled && <p className="mt-3 text-xs text-white/50">Sound is optional and starts only after you enable it.</p>}
      </main>
      <AnimatePresence>
        {how && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHow(false)} role="dialog" aria-modal="true" aria-label="How it works">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-accent/40 bg-space-900 p-5" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-display text-xl font-bold uppercase tracking-widest text-accent">How it works</h2>
              <p className="mt-1 font-display text-xs uppercase tracking-widest text-white/60">Decision → Consequence → Learning</p>
              <ol className="mt-4 space-y-3">
                {STEPS.map(([i, t, d]) => (<li key={t} className="flex gap-3 rounded-xl bg-space-800/80 p-3"><span className="text-2xl" aria-hidden>{i}</span><div><div className="font-display text-sm font-bold uppercase tracking-wider">{t}</div><div className="text-sm text-white/75">{d}</div></div></li>))}
              </ol>
              <div className="mt-4 flex justify-end"><Btn onClick={() => setHow(false)}>Got it</Btn></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
