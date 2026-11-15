import type { State } from '../../simulation/types';

const WHITE = '#e9e6df';
const MINT = '#8ff0c8';
const ORANGE = '#ff9c52';

interface ChargingDockProps {
  state: State;
}

export function ChargingDock({ state }: ChargingDockProps) {
  const isCharging = state.roverMode === 'charging';

  return (
    <group position={[0, 0.015, 5]}>
      {/* Plataforma circular de acoplamiento */}
      <mesh receiveShadow>
        <cylinderGeometry args={[2.15, 2.35, 0.06, 32]} />
        <meshStandardMaterial color="#555f6c" roughness={0.95} />
      </mesh>
      {/* Anillo de inducción electromagnética */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[1.9, 1.98, 48]} />
        <meshBasicMaterial
          color={isCharging ? MINT : '#cbd6df'}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Guías tácticas de alineación para las ruedas del rover */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.5, 0.05, 0]}>
          <boxGeometry args={[0.17, 0.025, 2.5]} />
          <meshStandardMaterial color={ORANGE} roughness={0.7} />
        </mesh>
      ))}

      {/* Poste terminal de carga y telemetría de plataforma */}
      <mesh position={[2, 0.48, 0]} castShadow>
        <boxGeometry args={[0.5, 0.9, 0.7]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      <mesh position={[2, 0.7, 0.36]}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshBasicMaterial color={isCharging ? MINT : ORANGE} />
      </mesh>
    </group>
  );
}
