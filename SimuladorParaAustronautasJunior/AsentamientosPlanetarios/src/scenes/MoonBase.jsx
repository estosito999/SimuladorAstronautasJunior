import { Outpost } from './Modules.jsx';
import Rover from './Rover.jsx';

export const MOON_PALETTE = { ground: '#8d919c', groundHi: '#cfd2da', groundLo: '#4c4f59', rock: '#6c707b', rockLight: '#9c9fab', trim: '#6aa7ff' };

/** Moon outpost: modules + rover + landing pad + flag. */
export default function MoonBase({ mission, terrain, selected, onSelect }) {
  const busy = (mission.activeScience?.length || 0) > 0;
  return (
    <group>
      <mesh position={[0, terrain.height(0, 14) + 0.04, 14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[3.2, 20]} /><meshStandardMaterial color="#5c606b" /></mesh>
      <group position={[3, terrain.height(3, 14), 14]}>
        <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.03, 0.03, 2.4, 6]} /><meshStandardMaterial color="#e5e9f2" /></mesh>
        <mesh position={[0.45, 2.1, 0]}><boxGeometry args={[0.9, 0.55, 0.03]} /><meshStandardMaterial color="#e8f0ff" emissive="#3b6fd8" emissiveIntensity={0.35} /></mesh>
      </group>
      <Outpost mission={mission} terrain={terrain} selected={selected} onSelect={onSelect} palette={MOON_PALETTE} />
      <Rover terrain={terrain} busy={busy} selected={selected === 'rover'} onSelect={onSelect} />
    </group>
  );
}
