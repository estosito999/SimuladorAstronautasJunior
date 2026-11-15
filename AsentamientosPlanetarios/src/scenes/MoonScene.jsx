import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { makeTerrain } from './terrain.js';
import { Terrain, Rocks, Ridges, Dust, WeatherRig, Earth } from './parts.jsx';
import MoonBase, { MOON_PALETTE } from './MoonBase.jsx';
import { Controls, StarField } from './SpaceEnvironment.jsx';

/** Moon world: black sky, bright Earth, hard sunlight, long shadows. `darkness` (0..1) dims the sun (Extended Darkness). */
export default function MoonScene({ mission, selected, onSelect, darkness = 0, autoRotate = true, interactive = true }) {
  const terrain = useMemo(() => makeTerrain('moon'), []);
  const weather = useRef({ level: 0 }), sun = useRef(), amb = useRef();
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: [17, 10, 19], fov: 46, near: 0.1, far: 400 }} onPointerMissed={() => onSelect?.(null)} gl={{ antialias: true }}>
      <WeatherRig weather={weather} target={darkness} fog={null} sunRef={sun} ambRef={amb} sunBase={2.7} ambBase={0.38} sunDrop={1.15} />
      <ambientLight ref={amb} intensity={0.38} color="#b7c8ff" />
      <directionalLight ref={sun} position={[30, 20, 12]} intensity={2.7} color="#fff7ea" castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-28} shadow-camera-right={28} shadow-camera-top={28} shadow-camera-bottom={-28} shadow-camera-near={1} shadow-camera-far={110} shadow-bias={-0.0006} />
      <StarField />
      <Earth />
      <Terrain kind="moon" palette={MOON_PALETTE} terrain={terrain} />
      <Rocks terrain={terrain} color="#80848f" />
      <Ridges color="#5d616c" tall={7} />
      <Dust weather={weather} color="#d7dae3" base={0.12} count={320} speed={0.15} size={0.1} height={9} />
      <MoonBase mission={mission} terrain={terrain} selected={selected} onSelect={(id) => onSelect?.(id)} />
      <Controls autoRotate={autoRotate} interactive={interactive} />
    </Canvas>
  );
}
