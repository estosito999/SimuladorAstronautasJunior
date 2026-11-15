import { Component, lazy, Suspense, useMemo } from 'react';

const MoonScene = lazy(() => import('../scenes/MoonScene.jsx'));
const MarsScene = lazy(() => import('../scenes/MarsScene.jsx'));

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
}

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.warn('3D scene failed:', err); }
  render() { return this.state.failed ? <Fallback dest={this.props.dest} /> : this.props.children; }
}

export function Fallback({ dest }) {
  return (
    <div className={`absolute inset-0 grid place-items-center ${dest === 'mars' ? 'bg-gradient-to-b from-[#7a3d22] to-[#d9a070]' : 'bg-gradient-to-b from-[#05070f] to-[#454a57]'}`}>
      <div className="max-w-xs rounded-xl border border-white/20 bg-space-900/80 p-4 text-center text-sm">
        <div className="text-3xl" aria-hidden>{dest === 'mars' ? '🔴' : '🌑'}</div>
        <p className="mt-2 font-semibold">3D view unavailable on this device.</p>
        <p className="text-white/70">Gameplay still works — use the panels below to run your mission.</p>
      </div>
    </div>
  );
}

/** Hosts the Moon or Mars 3D scene with graceful fallback. */
export default function WorldView({ mission, selected, onSelect, storm = 0, darkness = 0, interactive = true, autoRotate = true }) {
  const ok = useMemo(webglAvailable, []);
  if (!ok) return <Fallback dest={mission.destination} />;
  const Scene = mission.destination === 'mars' ? MarsScene : MoonScene;
  return (
    <Boundary dest={mission.destination} key={mission.destination}>
      <Suspense fallback={<div className="absolute inset-0 grid place-items-center font-display text-xs uppercase tracking-widest text-white/70">Loading environment…</div>}>
        <Scene mission={mission} selected={selected} onSelect={onSelect} storm={storm} darkness={darkness} interactive={interactive} autoRotate={autoRotate} />
      </Suspense>
    </Boundary>
  );
}
export { Boundary as SceneBoundary };
