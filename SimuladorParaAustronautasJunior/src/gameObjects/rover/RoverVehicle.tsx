import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { createRover, updateRover } from './roverModel';
import type { ModuleId, State } from '../../simulation/types';
import { groundHeight } from '../../scene/Environment';
import { LUNAR_ROCKS } from '../../simulation/roverExploration';
import { UnityBridge } from '../unity/UnityBridge';

const ORANGE = '#ff9c52';

interface RoverProps {
  state: State;
  selected: ModuleId;
  onSelect: (id: ModuleId) => void;
}

export function RoverVehicle({ state, selected, onSelect }: RoverProps) {
  const model = useMemo(() => {
    const rover = createRover(new THREE.Group());
    rover.group.rotation.y = -Math.PI / 2; // +X hacia +Z de la estación
    return rover;
  }, []);

  const previous = useRef<[number, number]>([...state.roverPosition]);
  const previousTime = useRef(state.elapsed);
  const lastUnitySync = useRef(0);
  const moving = state.roverMode === 'driving' || state.roverMode === 'returning';
  const isSelected = selected === 'rover';

  useEffect(() => () => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    model.group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(material);
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    model.headlights.leftHeadlight.dispose();
    model.headlights.rightHeadlight.dispose();
  }, [model]);

  useEffect(() => {
    const active = state.roverBattery > 0 && moving && !state.paused;
    model.headlights.leftHeadlight.intensity = active ? 5 : 0;
    model.headlights.rightHeadlight.intensity = active ? 5 : 0;
    model.headlights.leftLensMaterial.emissiveIntensity = active ? 0.8 : 0;
    model.headlights.rightLensMaterial.emissiveIntensity = active ? 0.8 : 0;
  }, [model, state.roverBattery, moving, state.paused]);

  useEffect(() => {
    const held = LUNAR_ROCKS.find((rock) => rock.id === state.heldRockId);
    model.sampleCargo.heldRock.visible = !!held;
    if (held) {
      model.sampleCargo.heldRock.scale.set(held.size * 0.75, held.size * 0.55, held.size * 0.65);
      (model.sampleCargo.heldRock.material as THREE.MeshPhongMaterial).color.set(held.color);
    }
    model.sampleCargo.storedRocks.forEach((stone, index) => {
      const rock = LUNAR_ROCKS.find((candidate) => candidate.id === state.collectedRocks[index]);
      stone.visible = !!rock;
      if (rock) (stone.material as THREE.MeshPhongMaterial).color.set(rock.color);
    });
  }, [model, state.heldRockId, state.collectedRocks]);

  useFrame((_, dt) => {
    const dx = state.roverPosition[0] - previous.current[0];
    const dz = state.roverPosition[1] - previous.current[1];

    if (state.elapsed < previousTime.current) {
      model.wheels.forEach((wheel) => { wheel.rotation.y = 0; });
    } else if (!state.paused) {
      const direction = dx * Math.sin(state.roverHeading) + dz * Math.cos(state.roverHeading) < 0 ? -1 : 1;
      const rotation = -Math.hypot(dx, dz) * direction * 3.5;
      model.wheels.forEach((wheel) => { wheel.rotation.y += rotation; });
    }

    previous.current = [...state.roverPosition];
    previousTime.current = state.elapsed;

    if (!state.paused && state.roverBattery > 0) {
      updateRover(model, {
        panelsOpen: !moving,
        arm: state.roverArm,
      }, Math.min(dt, 0.1));
    }

    // Sincronización continua de telemetría hacia Unity (5 Hz)
    if (state.elapsed - lastUnitySync.current > 0.2) {
      lastUnitySync.current = state.elapsed;
      UnityBridge.syncRoverTelemetry({
        position: [state.roverPosition[0], groundHeight(...state.roverPosition), state.roverPosition[1]],
        heading: state.roverHeading,
        battery: state.roverBattery,
        mode: state.roverMode,
        arm: state.roverArm,
        heldRockId: state.heldRockId,
        collectedRocks: state.collectedRocks,
      });
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect('rover');
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = '';
  };

  const yPos = groundHeight(...state.roverPosition);

  return (
    <group
      position={[state.roverPosition[0], yPos, state.roverPosition[1]]}
      rotation={[0, state.roverHeading, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Anillo de selección táctico */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[2, 2 + (isSelected ? 0.09 : 0.035), 64]} />
          <meshBasicMaterial
            color={isSelected ? ORANGE : '#b7c7de'}
            transparent
            opacity={isSelected ? 0.95 : 0.23}
            depthWrite={false}
          />
        </mesh>
        {isSelected &&
          [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle) => (
            <mesh
              key={angle}
              position={[Math.cos(angle) * 2.23, 0.055, Math.sin(angle) * 2.23]}
              rotation={[-Math.PI / 2, 0, angle]}
            >
              <planeGeometry args={[0.3, 0.12]} />
              <meshBasicMaterial color={ORANGE} />
            </mesh>
          ))}
      </group>

      <primitive object={model.group} dispose={null} />
    </group>
  );
}
