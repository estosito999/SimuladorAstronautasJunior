import { Outpost } from './Modules.jsx';
import Rover from './Rover.jsx';

export const MARS_PALETTE = { ground: '#b8582f', groundHi: '#e48f55', groundLo: '#69301d', rock: '#7c3b23', rockLight: '#a8562f', trim: '#ff7a45' };

/** Mars outpost: modules + rover + landing pad + flag. */
export default function MarsBase({ mission, terrain, selected, onSelect }) {
  const busy = (mission.activeScience?.length || 0) > 0;
  return (
    <group>
      <mesh position={[0, terrain.height(0, 14) + 0.04, 14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[3.2, 20]} /><meshStandardMaterial color="#6a3a2a" /></mesh>
      <group position={[3, terrain.height(3, 14), 14]}>
        <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.03, 0.03, 2.4, 6]} /><meshStandardMaterial color="#f1e6dd" /></mesh>
        <mesh position={[0.45, 2.1, 0]}><boxGeometry args={[0.9, 0.55, 0.03]} /><meshStandardMaterial color="#fff3e6" emissive="#ff7a45" emissiveIntensity={0.35} /></mesh>
      </group>
      <Outpost mission={mission} terrain={terrain} selected={selected} onSelect={onSelect} palette={MARS_PALETTE} />
      <Rover terrain={terrain} busy={busy} selected={selected === 'rover'} onSelect={onSelect} />
    </group>
  );
}
