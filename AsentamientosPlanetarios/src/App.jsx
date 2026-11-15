import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameProvider, useMission } from './hooks/useMission.js';
import { AstronautProvider } from './components/Astronaut.jsx';
import { SoundToggle } from './components/AudioControl.jsx';
import { unlock } from './audio/audio.js';
import { useSceneAudio } from './hooks/useAudio.js';
import Home from './pages/Home.jsx';
import Briefing from './pages/Briefing.jsx';
import DestinationSelect from './pages/DestinationSelect.jsx';
import MissionSetup from './pages/MissionSetup.jsx';
import Loading from './pages/Loading.jsx';
import NASAData from './pages/NASAData.jsx';

const OutpostBuilder = lazy(() => import('./pages/OutpostBuilder.jsx'));
const Launch = lazy(() => import('./pages/Launch.jsx'));
const MissionControl = lazy(() => import('./pages/MissionControl.jsx'));
const MissionReport = lazy(() => import('./pages/MissionReport.jsx'));

const SCREENS = { home: Home, briefing: Briefing, destination: DestinationSelect, setup: MissionSetup, loading: Loading, builder: OutpostBuilder, launch: Launch, control: MissionControl, report: MissionReport, nasa: NASAData };

function Shell() {
  const { screen, mission } = useMission();
  const Screen = SCREENS[screen] || Home;
  useSceneAudio(['builder', 'launch', 'control'].includes(screen) && mission ? mission.destination : 'menu');
  useEffect(() => {
    const u = () => unlock();
    window.addEventListener('pointerdown', u);
    window.addEventListener('keydown', u);
    return () => { window.removeEventListener('pointerdown', u); window.removeEventListener('keydown', u); };
  }, []);
  return (
    <div className="relative h-full w-full overflow-hidden bg-space-950 text-white">
      <AnimatePresence mode="wait">
        <motion.div key={screen} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <Suspense fallback={<div className="grid h-full place-items-center font-display text-xs uppercase tracking-widest text-white/70">Loading…</div>}>
            <Screen />
          </Suspense>
        </motion.div>
      </AnimatePresence>
      {['home', 'briefing', 'destination', 'setup', 'nasa'].includes(screen) && <SoundToggle className="fixed right-3 top-3 z-30" />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AstronautProvider>
        <Shell />
      </AstronautProvider>
    </GameProvider>
  );
}
