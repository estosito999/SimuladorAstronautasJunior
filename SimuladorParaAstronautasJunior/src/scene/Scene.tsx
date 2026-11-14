import { Component, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { ModuleId, State } from '../simulation/types';
import { CameraRig } from './CameraRig';
import type { CameraCommand } from './CameraRig';
import { Environment } from './Environment';
import { Equipment } from './Equipment';

export interface SceneProps {
  state: State;
  selected: ModuleId;
  onSelect: (id: ModuleId) => void;
  cameraMode: 'overview' | 'follow';
  cameraCommand: CameraCommand;
  quality: 'standard' | 'low';
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function canRender3D() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

function ContextGuard({ onLost }: { onLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return null;
}

function Lighting({ sunlight, low }: { sunlight: number; low: boolean }) {
  return <>
    <ambientLight intensity={0.72} color="#c2c5ed" />
    <hemisphereLight args={['#cbd9ff', '#777186', 0.5]} />
    <directionalLight position={[-12, 24, 10]} intensity={0.15 + sunlight / 100 * 2.85} color="#fff0db" castShadow={!low}
      shadow-mapSize={[1536, 1536]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22}
      shadow-camera-near={1} shadow-camera-far={80} shadow-bias={-0.0004} shadow-normalBias={0.04} />
    <directionalLight position={[14, 8, -14]} intensity={0.7} color="#8198d8" />
  </>;
}

/** The React panel remains usable if WebGL is missing or its context is lost. */
export default function Scene(props: SceneProps) {
  const [supported, setSupported] = useState(canRender3D);
  const [contextLost, setContextLost] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const handleContextLost = useCallback(() => setContextLost(true), []);
  const low = props.quality === 'low';
  const retry = () => { setSupported(canRender3D()); setContextLost(false); setAttempt(value => value + 1); };
  const fallback = <div style={{ minHeight: 440, height: '100%', display: 'grid', placeContent: 'center', gap: 14, padding: 32, textAlign: 'center', color: '#e3eaf5', background: '#121b2b' }}>
    <div style={{ fontSize: 36 }} aria-hidden="true">☾</div>
    <strong>El motor gráfico necesita un breve reinicio</strong>
    <p style={{ maxWidth: 330, margin: 0, lineHeight: 1.6 }}>Puedes seguir explorando los controles y aprendiendo con LUNA. Prueba a abrir de nuevo la estación.</p>
    <button type="button" onClick={retry} style={{ justifySelf: 'center', minHeight: 44, padding: '10px 20px', borderRadius: 12, border: 0, background: '#9de6cb', color: '#172c2b', font: 'inherit', cursor: 'pointer' }}>Reconectar visor espacial</button>
  </div>;
  return <div role="region" aria-label="Entorno orbital de la estación lunar. Selecciona los paneles, el rover o la antena. Arrastra para girar la cámara y usa la rueda para acercarte." style={{ width: '100%', height: '100%', minHeight: 440, background: '#0c1221', overflow: 'hidden' }}>
    {(!supported || contextLost) ? fallback : <SceneBoundary key={attempt} fallback={fallback}>
      <Canvas shadows={!low} dpr={low ? 1 : [1, 1.6]} camera={{ position: [21, 18, 26], fov: 43, near: 0.1, far: 240 }}
        gl={{ antialias: !low, alpha: false, powerPreference: low ? 'low-power' : 'high-performance' }}
        onCreated={({ gl }) => { gl.setClearColor('#0b1120'); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08; }} fallback={fallback}>
        <ContextGuard onLost={handleContextLost} />
        <Lighting sunlight={props.state.sunlight} low={low} />
        <Environment low={low} />
        <Equipment state={props.state} selected={props.selected} onSelect={props.onSelect} />
        <CameraRig state={props.state} mode={props.cameraMode} command={props.cameraCommand} />
      </Canvas>
    </SceneBoundary>}
  </div>;
}
