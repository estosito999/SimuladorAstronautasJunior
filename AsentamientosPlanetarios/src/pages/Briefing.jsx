import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMission } from '../hooks/useMission.js';
import { useAstronaut } from '../components/Astronaut.jsx';
import { Btn, Panel } from '../components/UI.jsx';

const OBJECTIVES = [
  ['🧑‍🚀', 'Keep the crew alive'], ['🫁', 'Maintain oxygen'], ['💧', 'Maintain water'], ['🍎', 'Maintain food'],
  ['⚡', 'Manage power'], ['☢️', 'Reduce radiation exposure'], ['🔬', 'Complete science objectives'], ['🌪️', 'Survive environmental hazards'],
];

export default function Briefing() {
  const { go, prefs, setPrefs } = useMission();
  const { say, dismiss } = useAstronaut();
  useEffect(() => {
    if (!prefs.introSeen) {
      say({
        sticky: true, mood: 'welcome', sound: 'select',
        lines: ['Hey, Commander! 👋', 'Welcome to ZERO-G.', 'Your mission is simple...', 'Keep your crew alive.', 'But remember...', 'Every decision has a consequence.', 'Ready for launch?'],
        actions: [
          { label: "Let's go", primary: true, onClick: () => { setPrefs({ introSeen: true, tutorial: false }); go('destination'); } },
          { label: 'Tutorial', onClick: () => { setPrefs({ introSeen: true, tutorial: true, tutorialDone: false }); go('destination'); } },
        ],
      });
    }
    return () => dismiss();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="hud-grid h-full overflow-y-auto bg-space-950">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-xs font-bold uppercase tracking-[0.3em] text-accent">Mission briefing</motion.p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-widest sm:text-4xl">You are the mission commander</h1>
        <Panel className="mt-5 p-5 text-lg leading-relaxed text-white/90">
          <p>Your crew has landed on an extreme world.</p>
          <p className="mt-2">You have limited <b className="text-accent">power, water, food, construction capacity and time</b>.</p>
          <p className="mt-2">Keep the crew alive while completing scientific objectives.</p>
        </Panel>
        <h2 className="mt-6 font-display text-sm font-bold uppercase tracking-widest text-white/70">Objectives</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {OBJECTIVES.map(([i, t], k) => (
            <motion.li key={t} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + k * 0.05 }} className="flex items-center gap-3 rounded-xl border border-white/10 bg-space-800/80 px-3 py-2.5 font-semibold"><span className="text-xl" aria-hidden>{i}</span>{t}</motion.li>
          ))}
        </ul>
        <div className="mt-7 flex gap-3"><Btn variant="ghost" onClick={() => go('home')}>← Back</Btn><Btn onClick={() => go('destination')}>Choose destination →</Btn></div>
      </div>
    </div>
  );
}
