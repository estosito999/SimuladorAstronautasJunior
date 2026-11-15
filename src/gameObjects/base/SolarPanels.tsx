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
  const plasmaPlane = useRef<THREE.Mesh>(null);

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
      broom.current.visible = state.cleaning || (state.edsResonance > 80 && state.dust > 0);
      // Onda viajera electrodinámica trifásica barriendo la celda
      broom.current.position.z = -0.95 + ((state.elapsed * 3.5) % 1.9);
    }
    if (plasmaPlane.current) {
      plasmaPlane.current.visible = state.cleaning || (state.edsResonance > 75 && state.dust > 0);
    }
  });

  const isResonant = state.edsResonance >= 75;
  const isHighFreq = state.edsFrequency >= 50;

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

        {/* Manto de Plasma Electrodinámico de Resonancia */}
        <mesh ref={plasmaPlane} position={[0, 0.11, 0]} visible={state.cleaning}>
          <boxGeometry args={[3.32, 0.015, 2.24]} />
          <meshStandardMaterial
            color={isResonant ? '#00f2fe' : '#a855f7'}
            emissive={isResonant ? '#00f2fe' : '#9333ea'}
            emissiveIntensity={state.cleaning ? 0.75 : 0.3}
            transparent
            opacity={state.cleaning ? 0.42 : 0.2}
            depthWrite={false}
          />
        </mesh>

        {/* Partículas dinámicas de regolito en levitación electrostática */}
        {Array.from({ length: 28 }, (_, index) => {
          const baseCol = (index % 7) - 3;
          const baseRow = Math.floor(index / 7) - 1.5;
          const jitter = state.cleaning || (state.edsResonance > 50 && state.dust > 0)
            ? Math.sin(state.elapsed * 24 + index * 1.5) * (isResonant ? 0.045 : 0.02)
            : 0;
          const levitation = state.cleaning ? 0.05 + Math.sin(state.elapsed * 6 + index) * 0.08 : 0;
          const posX = baseCol * 0.45 + jitter;
          const posY = 0.11 + levitation;
          const posZ = baseRow * 0.52 + (state.cleaning ? -0.15 : 0);

          return (
            <mesh
              key={index}
              position={[posX, posY, posZ]}
              scale={0.032 + state.dust / 1900}
              visible={state.dust > index * 3}
            >
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color={state.cleaning && isResonant ? '#38bdf8' : '#b7aaa3'}
                emissive={state.cleaning && isResonant ? '#0284c7' : '#000000'}
                emissiveIntensity={state.cleaning ? 0.5 : 0}
                roughness={1}
              />
            </mesh>
          );
        })}

        {/* Barra emisora y electrodo de onda viajera EDS */}
        <mesh ref={broom} position={[0, 0.14, 0]} visible={state.cleaning}>
          <boxGeometry args={[3.38, 0.05, 0.1]} />
          <meshStandardMaterial
            color={isResonant ? '#38bdf8' : MINT}
            emissive={isResonant ? '#00e5ff' : MINT}
            emissiveIntensity={isResonant ? 0.9 : 0.5}
          />
        </mesh>

        {/* Destello de celda impecable cuando dust = 0 */}
        {state.dust === 0 && (
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )}

        {/* Indicador LED de estado del panel */}
        <mesh position={[1.55, 0.12, 1.03]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshBasicMaterial color={state.solarOn ? (isHighFreq ? '#38bdf8' : MINT) : ORANGE} />
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
