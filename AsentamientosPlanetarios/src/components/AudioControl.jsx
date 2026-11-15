import { useState } from 'react';
import { useMission } from '../hooks/useMission.js';
import { sfx, audioSupported } from '../audio/audio.js';

export function SoundToggle({ className = '' }) {
  const { prefs, setPrefs } = useMission();
  const on = prefs.sound.enabled;
  const toggle = () => { setPrefs((p) => ({ sound: { ...p.sound, enabled: !p.sound.enabled } })); setTimeout(() => sfx.select(), 80); };
  if (!audioSupported()) return null;
  return (
    <button type="button" onClick={toggle} aria-pressed={on} aria-label={on ? 'Sound on. Click to mute' : 'Sound off. Click to enable'}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-space-800/80 px-3 font-display text-[11px] font-bold uppercase tracking-widest hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${className}`}>
      <span aria-hidden>{on ? '🔊' : '🔇'}</span><span className="hidden sm:inline">{on ? 'Sound ON' : 'Enable sound'}</span>
    </button>
  );
}

export function AudioSettings() {
  const { prefs, setPrefs } = useMission();
  const [, force] = useState(0);
  const set = (k) => (e) => { setPrefs((p) => ({ sound: { ...p.sound, [k]: Number(e.target.value) } })); force((x) => x + 1); };
  const rows = [['master', 'Master volume'], ['music', 'Music & ambience'], ['sfx', 'Sound effects']];
  return (
    <div className="space-y-3">
      <SoundToggle />
      {rows.map(([k, label]) => (
        <label key={k} className="block text-xs font-bold uppercase tracking-widest">
          {label} <span className="text-accent">{Math.round(prefs.sound[k] * 100)}%</span>
          <input type="range" min="0" max="1" step="0.05" value={prefs.sound[k]} onChange={set(k)} onPointerUp={() => sfx.click()} className="mt-1 h-8 w-full accent-[rgb(var(--accent))]" />
        </label>
      ))}
      <p className="text-[11px] text-white/50">All sounds are generated in your browser — no audio files, and none are from commercial games.</p>
    </div>
  );
}
