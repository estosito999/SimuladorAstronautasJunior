import { validateMission } from '../game/missionSystem.js';

const K = { mission: 'zerog.mission', prefs: 'zerog.prefs', scores: 'zerog.scores', completed: 'zerog.completed' };

const read = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};

export const DEFAULT_PREFS = {
  introSeen: false, tutorial: true, tutorialDone: false,
  sound: { enabled: false, master: 0.7, music: 0.5, sfx: 0.8 },
  lastSetup: { destination: 'moon', crewSize: 4, duration: 20, difficulty: 'commander' },
};

export function saveMission(state) { return state ? write(K.mission, state) : false; }
export function loadMission() {
  const raw = read(K.mission, null);
  const m = validateMission(raw);
  if (raw && !m) resetMission();
  return m;
}
export function resetMission() { try { localStorage.removeItem(K.mission); } catch { /* ignore */ } }

export function loadPrefs() {
  const p = read(K.prefs, {});
  return { ...DEFAULT_PREFS, ...p, sound: { ...DEFAULT_PREFS.sound, ...(p.sound || {}) }, lastSetup: { ...DEFAULT_PREFS.lastSetup, ...(p.lastSetup || {}) } };
}
export const savePrefs = (p) => write(K.prefs, p);

export const loadScores = () => read(K.scores, { best: 0, bestByDest: {} });
export function saveHighScore(score, destination) {
  const s = loadScores();
  s.best = Math.max(s.best || 0, score);
  s.bestByDest = { ...s.bestByDest, [destination]: Math.max(s.bestByDest?.[destination] || 0, score) };
  write(K.scores, s);
  return s;
}
export const loadCompleted = () => read(K.completed, []);
export function recordCompleted(entry) {
  const list = loadCompleted();
  list.unshift(entry);
  write(K.completed, list.slice(0, 30));
  return list;
}
