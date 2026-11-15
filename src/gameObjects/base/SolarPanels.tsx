import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { ModuleId, State } from '../../simulation/types';

const WHITE = '#e9e6df';
const METAL = '#8e9aab';
const MINT = '#8ff0c8';
const ORANGE = '#ff9c52';

interface SolarPanelsProps {
  state: State;
  selected: ModuleId;
  onSelect: (id: ModuleId) => void;
}

function Panel({ state, offset }: { state: State; offset: number }) {
  const tilt = useRef<THREE.Group>(null);
  const broom = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (tilt.current) {
      tilt.current.rotation.x = THREE.MathUtils.damp(
        tilt.current.rotation.x,
        (-state.panelAngle * Math.PI) / 180,
        5,
        dt
      );
    }
    if (broom.current) {
      broom.current.visible = state.cleaning;
      broom.current.position.z = Math.sin(state.elapsed * 3) * 0.95;
    }
  });

  return (
    <group position={[0, 0, offset]}>
      {/* Base de soporte */}
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.18, 1.2]} />
        <meshStandardMaterial color="#424957" roughness={0.9} />
      </mesh>
      {/* Mástil principal */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.18, 1.6, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Matriz fotovoltaica orientable */}
      <group ref={tilt} position={[0, 1.8, 0]} rotation={[(-state.panelAngle * Math.PI) / 180, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[3.45, 0.12, 2.35]} />
          <meshStandardMaterial color={WHITE} roughness={0.6} metalness={0.25} />
        </mesh>
        {/* Celdas de silicio fotovoltaicas (6x4) */}
        {Array.from({ length: 6 }, (_, column) =>
          Array.from({ length: 4 }, (_, row) => (
            <mesh key={`${column}-${row}`} position={[-1.385 + column * 0.555, 0.076, -0.85 + row * 0.565]}>
              <boxGeometry args={[0.52, 0.018, 0.53]} />
              <meshStandardMaterial
                color={state.solarOn ? '#245ca6' : '#263c5e'}
                roughness={0.35}
                metalness={0.35}
                emissive="#173d78"
                emissiveIntensity={state.solarOn ? 0.13 : 0}
              />
            </mesh>
          ))
        )}
        {/* Capa de atenuación por polvo de regolito */}
        <mesh position={[0, 0.096, 0]}>
          <boxGeometry args={[3.27, 0.01, 2.22]} />
          <meshStandardMaterial
            color="#b9a59d"
            transparent
            opacity={(state.dust / 100) * 0.72}
            roughness={1}
            depthWrite={false}
          />
        </mesh>
        {/* Partículas de polvo de regolito acumuladas */}
        {Array.from({ length: 18 }, (_, index) => (
          <mesh
            key={index}
            position={[-1.5 + ((index * 0.69) % 3), 0.11, -1 + ((index * 0.37) % 2)]}
            scale={0.03 + state.dust / 1800}
            visible={state.dust > index * 5}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#b7aaa3" roughness={1} />
          </mesh>
        ))}
        {/* Barra emisora del Escudo Electrodinámico (EDS) */}
        <mesh ref={broom} position={[0, 0.15, 0]} visible={state.cleaning}>
          <boxGeometry args={[3.4, 0.06, 0.12]} />
          <meshStandardMaterial color={MINT} emissive={MINT} emissiveIntensity={0.5} />
        </mesh>
        {/* Indicador LED de estado del panel */}
        <mesh position={[1.55, 0.12, 1.03]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshBasicMaterial color={state.solarOn ? MINT : ORANGE} />
        </mesh>
      </group>
    </group>
  );
}

export function SolarPanels({ state, selected, onSelect }: SolarPanelsProps) {
  const isSelected = selected === 'solar';

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect('solar');
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = '';
  };

  return (
    <group
      position={[-7, 0, -2]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Anillo de selección */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[4.6, 4.6 + (isSelected ? 0.09 : 0.035), 64]} />
          <meshBasicMaterial
            color={isSelected ? ORANGE : '#b7c7de'}
            transparent
            opacity={isSelected ? 0.95 : 0.23}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Tres paneles fotovoltaicos alineados */}
      {[-3.2, 0, 3.2].map((offset) => (
        <Panel key={offset} state={state} offset={offset} />
      ))}

      {/* Caja de control e inversor de potencia */}
      <mesh position={[2.2, 0.4, 2.4]} castShadow>
        <boxGeometry args={[0.65, 0.8, 0.7]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      <mesh position={[2.2, 0.55, 2.765]}>
        <boxGeometry args={[0.4, 0.12, 0.02]} />
        <meshBasicMaterial color={state.solarOn ? MINT : ORANGE} />
      </mesh>
    </group>
  );
}
