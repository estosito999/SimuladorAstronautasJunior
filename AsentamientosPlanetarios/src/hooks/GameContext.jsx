import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as G from '../game/gameEngine.js';
import { loadMission, saveMission, resetMission, loadPrefs, savePrefs, saveHighScore, recordCompleted, loadCompleted, loadScores } from '../utils/storage.js';
import { configure as configureAudio, sfx } from '../audio/audio.js';

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

export function GameProvider({ children }) {
  const [screen, setScreen] = useState('home');
  const [prefs, setPrefsState] = useState(loadPrefs);
  const [mission, setMissionState] = useState(null);
  const [saved, setSaved] = useState(() => loadMission());
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlight, setHighlight] = useState(null);
  const [scores, setScores] = useState(loadScores);
  const recorded = useRef(null);

  // Audio settings follow prefs
  useEffect(() => { configureAudio(prefs.sound); }, [prefs.sound]);

  const setPrefs = useCallback((patch) => {
    setPrefsState((p) => { const n = { ...p, ...(typeof patch === 'function' ? patch(p) : patch) }; savePrefs(n); return n; });
  }, []);

  // Theme follows destination (but only once chosen)
  const theme = screen === 'setup' ? prefs.lastSetup.destination : mission && ['loading', 'builder', 'launch', 'control', 'report'].includes(screen) ? mission.destination : 'space';
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { document.body.dataset.hud = screen === 'control' ? 'control' : screen === 'builder' ? 'builder' : ''; }, [screen]);

  const setMission = useCallback((updater) => {
    setMissionState((m) => {
      const n = typeof updater === 'function' ? updater(m) : updater;
      if (n && n !== m) saveMission(n);
      return n;
    });
  }, []);

  // Record finished missions once
  useEffect(() => {
    if (mission && mission.missionStatus !== 'active' && recorded.current !== mission.missionId + mission.seed) {
      recorded.current = mission.missionId + mission.seed;
      setScores(saveHighScore(mission.missionScore, mission.destination));
      recordCompleted({ id: mission.missionId, destination: mission.destination, score: mission.missionScore, status: mission.missionStatus, at: Date.now() });
    }
  }, [mission]);

  const go = useCallback((s) => { setMenuOpen(false); setScreen(s); }, []);

  const api = useMemo(() => ({
    newMission: (cfg) => {
      resetMission();
      const n = loadCompleted().length + 1;
      setPrefs((p) => ({ lastSetup: { destination: cfg.destination, crewSize: cfg.crewSize, duration: cfg.duration, difficulty: cfg.difficulty }, tutorial: cfg.tutorial ?? p.tutorial, tutorialDone: cfg.tutorial ? false : p.tutorialDone }));
      setMission(G.createMission({ ...cfg, missionNumber: n }));
      setSaved(null);
    },
    resume: () => { if (saved) { setMissionState(saved); setScreen(saved.missionStatus !== 'active' ? 'report' : saved.phase === 'build' ? 'builder' : 'control'); } },
    build: (type) => { sfx.build(); setMission((m) => G.buildModule(m, type)); },
    sell: (uid) => { sfx.click(); setMission((m) => G.sellModule(m, uid)); },
    repair: (uid) => { sfx.build(); setMission((m) => G.repairModule(m, uid)); },
    clean: () => { sfx.click(); setMission((m) => G.cleanPanels(m)); },
    conserve: () => { sfx.click(); setMission((m) => G.toggleConserve(m)); },
    science: (id) => { sfx.select(); setMission((m) => G.startScience(m, id)); },
    launch: () => setMission((m) => G.launch(m)),
    advance: () => setMission((m) => G.advanceCycle(m)),
    choose: (id) => setMission((m) => G.resolveChoice(m, id)),
    dismissOutcome: () => setMission((m) => (m ? { ...m, lastOutcome: null } : m)),
    exit: () => { setMenuOpen(false); setScreen('home'); setSaved(loadMission()); },
    abandon: () => { resetMission(); setMissionState(null); setSaved(null); setScreen('home'); setMenuOpen(false); },
    restart: () => {
      if (!mission) return;
      const cfg = { destination: mission.destination, crewSize: mission.crewSize, duration: mission.duration, difficulty: mission.difficulty };
      resetMission();
      setMission(G.createMission({ ...cfg, missionNumber: loadCompleted().length + 1 }));
      setMenuOpen(false); setScreen('builder');
    },
  }), [mission, saved, setMission, setPrefs]);

  const value = { screen, go, prefs, setPrefs, mission, saved, menuOpen, setMenuOpen, highlight, setHighlight, scores, ...api };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
