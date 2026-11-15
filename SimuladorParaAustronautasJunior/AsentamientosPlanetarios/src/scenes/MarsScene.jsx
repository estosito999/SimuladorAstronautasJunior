import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { makeTerrain } from './terrain.js';
import { Terrain, Rocks, Ridges, Dust, WeatherRig, SkyDome } from './parts.jsx';
import MarsBase, { MARS_PALETTE } from './MarsBase.jsx';
import { Controls } from './SpaceEnvironment.jsx';

const FOG = { color: '#d9a070', near: 55, far: 170 };
const STORM = { color: '#7a3d22', near: 6, far: 52 };

/** Mars world: orange sky, rust terrain, drifting dust. `storm` (0..1) thickens dust, dims the sun and fogs the view. */
export default function MarsScene({ mission, selected, onSelect, storm = 0, autoRotate = true, interactive = true }) {
  const terrain = useMemo(() => makeTerrain('mars'), []);
  const weather = useRef({ level: 0 }), sun = useRef(), amb = useRef(), sky = useRef();
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: [17, 10, 19], fov: 46, near: 0.1, far: 400 }} onPointerMissed={() => onSelect?.(null)} gl={{ antialias: true }}>
      <WeatherRig weather={weather} target={storm} fog={FOG} stormFog={STORM} sunRef={sun} ambRef={amb} sunBase={2.1} ambBase={0.75} skyRef={sky} />
      <SkyDome top="#c9764a" bottom="#f0c293" innerRef={sky} />
      <ambientLight ref={amb} intensity={0.75} color="#ffbe94" />
      <directionalLight ref={sun} position={[26, 24, 10]} intensity={2.1} color="#ffd9aa" castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-28} shadow-camera-right={28} shadow-camera-top={28} shadow-camera-bottom={-28} shadow-camera-near={1} shadow-camera-far={110} shadow-bias={-0.0006} />
      <Terrain kind="mars" palette={MARS_PALETTE} terrain={terrain} />
      <Rocks terrain={terrain} color="#8a4527" seed={8} />
      <Ridges color="#8f4a2e" tall={13} radius={80} />
      <Dust weather={weather} color="#f0b985" base={0.2} count={1100} speed={1.6} size={0.2} />
      <MarsBase mission={mission} terrain={terrain} selected={selected} onSelect={(id) => onSelect?.(id)} />
      <Controls autoRotate={autoRotate} interactive={interactive} />
    </Canvas>
  );
}
