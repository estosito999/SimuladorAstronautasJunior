import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { ModuleId, State } from '../../simulation/types';
import { metrics } from '../../simulation/engine';

const WHITE = '#e9e6df';
const INK = '#28313f';
const MINT = '#8ff0c8';
const ORANGE = '#ff9c52';

interface CommunicationsDishProps {
  state: State;
  selected: ModuleId;
  onSelect: (id: ModuleId) => void;
}

export function CommunicationsDish({ state, selected, onSelect }: CommunicationsDishProps) {
  const dish = useRef<THREE.Group>(null);
  const waves = useRef<THREE.Group>(null);
  const { signal, powered } = metrics(state);
  const isSelected = selected === 'comms';

  const geometry = useMemo(
    () =>
      new THREE.LatheGeometry(
        Array.from({ length: 15 }, (_, i) => {
          const radius = (i / 14) * 1.65;
          return new THREE.Vector2(radius, radius * radius * 0.24);
        }),
        32
      ),
    []
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }, dt) => {
    if (dish.current) {
      dish.current.rotation.z = THREE.MathUtils.damp(
        dish.current.rotation.z,
        (-state.antennaAngle * Math.PI) / 180,
        5,
        dt
      );
    }
    waves.current?.children.forEach((wave, index) => {
      const progress = (clock.elapsedTime * 0.45 + index / 3) % 1;
      wave.position.y = 1.1 + progress * 3;
      wave.scale.setScalar(0.35 + progress * 1.15);
      ((wave as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
        (1 - progress) * Math.min(signal / 100, 0.65);
    });
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect('comms');
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
      position={[7, 0, -2]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Anillo de selección */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[2.7, 2.7 + (isSelected ? 0.09 : 0.035), 64]} />
          <meshBasicMaterial
            color={isSelected ? ORANGE : '#b7c7de'}
            transparent
            opacity={isSelected ? 0.95 : 0.23}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Base circular de la torre */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.4, 0.34, 8]} />
        <meshStandardMaterial color="#4f5767" roughness={0.8} />
      </mesh>
      {/* Columna soporte */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.28, 2.6, 10]} />
        <meshStandardMaterial color={WHITE} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Caja de aviónica y transmisor RF */}
      <mesh position={[0.6, 0.65, 0.45]} castShadow>
        <boxGeometry args={[0.85, 1, 0.65]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      <mesh position={[0.6, 0.85, 0.79]}>
        <boxGeometry args={[0.5, 0.2, 0.03]} />
        <meshBasicMaterial color={state.antennaOn && powered ? MINT : ORANGE} />
      </mesh>

      {/* Plato parabólico orientable */}
      <group ref={dish} position={[0, 2.8, 0]} rotation={[0.15, 0, (-state.antennaAngle * Math.PI) / 180]}>
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial color={WHITE} roughness={0.5} metalness={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.65, 0]}>
          <torusGeometry args={[1.65, 0.035, 6, 40]} />
          <meshStandardMaterial color={ORANGE} />
        </mesh>
        <mesh position={[0, 1.48, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.2, 0.3, 10]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        <mesh position={[0, 1.65, 0]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshBasicMaterial color={signal > 20 ? MINT : ORANGE} />
        </mesh>

        {/* Ondas electromagnéticas de radiofrecuencia hacia el espacio */}
        <group ref={waves} visible={state.antennaOn && powered && signal > 5}>
          {[0, 1, 2].map((index) => (
            <mesh key={index} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.67, 0.69, 40]} />
              <meshBasicMaterial color={MINT} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
