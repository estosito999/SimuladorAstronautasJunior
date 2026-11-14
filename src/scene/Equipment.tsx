import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { createRover, updateRover } from './roverModel';
import type { ModuleId, State } from '../simulation/types';
import { metrics } from '../simulation/engine';

const WHITE = '#e9e6df', METAL = '#8e9aab', INK = '#28313f', MINT = '#8ff0c8', ORANGE = '#ff9c52';
type Selection = { selected: ModuleId; onSelect: (id: ModuleId) => void };

function interactive(id: ModuleId, onSelect: Selection['onSelect']) {
  return {
    onClick: (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect(id); },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; },
    onPointerOut: () => { document.body.style.cursor = ''; },
  };
}

function SelectionRing({ radius, selected }: { radius: number; selected: boolean }) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <ringGeometry args={[radius, radius + (selected ? 0.09 : 0.035), 64]} />
      <meshBasicMaterial color={selected ? ORANGE : '#b7c7de'} transparent opacity={selected ? 0.95 : 0.23} depthWrite={false} />
    </mesh>
    {selected && [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].map(angle => <mesh key={angle} position={[Math.cos(angle) * (radius + 0.23), 0.055, Math.sin(angle) * (radius + 0.23)]} rotation={[-Math.PI / 2, 0, angle]}>
      <planeGeometry args={[0.3, 0.12]} /><meshBasicMaterial color={ORANGE} />
    </mesh>)}
  </group>;
}

function Rod({ from, to, radius = 0.035, color = METAL }: { from: [number, number, number]; to: [number, number, number]; radius?: number; color?: string }) {
  const geometry = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const result = new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 6);
    result.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
    result.translate(...a.add(b).multiplyScalar(0.5).toArray());
    return result;
  }, [from[0], from[1], from[2], to[0], to[1], to[2], radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow><meshStandardMaterial color={color} roughness={0.65} metalness={0.35} /></mesh>;
}

function Panel({ state, offset }: { state: State; offset: number }) {
  const tilt = useRef<THREE.Group>(null);
  const broom = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (tilt.current) tilt.current.rotation.x = THREE.MathUtils.damp(tilt.current.rotation.x, -state.panelAngle * Math.PI / 180, 5, dt);
    if (broom.current) { broom.current.visible = state.cleaning; broom.current.position.z = Math.sin(state.elapsed * 3) * 0.95; }
  });
  return <group position={[0, 0, offset]}>
    <mesh position={[0, 0.09, 0]} receiveShadow><boxGeometry args={[1.6, 0.18, 1.2]} /><meshStandardMaterial color="#424957" roughness={0.9} /></mesh>
    <mesh position={[0, 0.85, 0]} castShadow><cylinderGeometry args={[0.1, 0.18, 1.6, 8]} /><meshStandardMaterial color={METAL} metalness={0.4} roughness={0.6} /></mesh>
    <Rod from={[-0.6, 0.14, -0.4]} to={[0, 1.45, 0]} radius={0.045} />
    <Rod from={[0.6, 0.14, 0.4]} to={[0, 1.45, 0]} radius={0.045} />
    <group ref={tilt} position={[0, 1.8, 0]} rotation={[-state.panelAngle * Math.PI / 180, 0, 0]}>
      <mesh castShadow><boxGeometry args={[3.45, 0.12, 2.35]} /><meshStandardMaterial color={WHITE} roughness={0.6} metalness={0.25} /></mesh>
      {Array.from({ length: 6 }, (_, column) => Array.from({ length: 4 }, (_, row) => <mesh key={`${column}-${row}`} position={[-1.385 + column * 0.555, 0.076, -0.85 + row * 0.565]}>
        <boxGeometry args={[0.52, 0.018, 0.53]} /><meshStandardMaterial color={state.solarOn ? '#245ca6' : '#263c5e'} roughness={0.35} metalness={0.35} emissive="#173d78" emissiveIntensity={state.solarOn ? 0.13 : 0} />
      </mesh>))}
      <mesh position={[0, 0.096, 0]}><boxGeometry args={[3.27, 0.01, 2.22]} /><meshStandardMaterial color="#b9a59d" transparent opacity={state.dust / 100 * 0.72} roughness={1} depthWrite={false} /></mesh>
      {Array.from({ length: 18 }, (_, index) => <mesh key={index} position={[-1.5 + (index * 0.69 % 3), 0.11, -1 + (index * 0.37 % 2)]} scale={0.03 + state.dust / 1800} visible={state.dust > index * 5}>
        <dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#b7aaa3" roughness={1} />
      </mesh>)}
      <mesh ref={broom} position={[0, 0.15, 0]} visible={state.cleaning}><boxGeometry args={[3.4, 0.06, 0.12]} /><meshStandardMaterial color={MINT} emissive={MINT} emissiveIntensity={0.5} /></mesh>
      <mesh position={[1.55, 0.12, 1.03]}><sphereGeometry args={[0.055, 8, 6]} /><meshBasicMaterial color={state.solarOn ? MINT : ORANGE} /></mesh>
    </group>
  </group>;
}

function Solar({ state, selected, onSelect }: { state: State } & Selection) {
  return <group position={[-7, 0, -2]} {...interactive('solar', onSelect)}>
    <SelectionRing radius={4.6} selected={selected === 'solar'} />
    {[-3.2, 0, 3.2].map(offset => <Panel key={offset} state={state} offset={offset} />)}
    <mesh position={[2.2, 0.4, 2.4]} castShadow><boxGeometry args={[0.65, 0.8, 0.7]} /><meshStandardMaterial color={WHITE} /></mesh>
    <mesh position={[2.2, 0.55, 2.765]}><boxGeometry args={[0.4, 0.12, 0.02]} /><meshBasicMaterial color={state.solarOn ? MINT : ORANGE} /></mesh>
  </group>;
}

function Habitat({ powered }: { powered: boolean }) {
  return <group position={[0, 0, -3]}>
    <mesh position={[0, 0.16, 0]} receiveShadow castShadow><boxGeometry args={[7, 0.32, 4.5]} /><meshStandardMaterial color="#4e5665" roughness={0.9} /></mesh>
    {[-2.7, 2.7].map(x => [-1.4, 1.4].map(z => <mesh key={`${x}-${z}`} position={[x, 0.55, z]} castShadow><boxGeometry args={[0.42, 0.7, 0.5]} /><meshStandardMaterial color={METAL} metalness={0.3} roughness={0.7} /></mesh>))}
    <mesh position={[0, 2.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow><capsuleGeometry args={[1.58, 3.55, 8, 20]} /><meshStandardMaterial color={WHITE} roughness={0.65} metalness={0.1} /></mesh>
    {[-1.75, 1.75].map(x => <mesh key={x} position={[x, 2.05, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[1.6, 0.07, 5, 24]} /><meshStandardMaterial color={ORANGE} roughness={0.55} /></mesh>)}
    {[-1.15, 1.15].map(x => <group key={x} position={[x, 2.3, 1.51]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.42, 0.42, 0.09, 20]} /><meshStandardMaterial color={METAL} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.38, 0.38, 0.12, 24]} /><meshStandardMaterial color="#80b8d5" metalness={0.4} roughness={0.2} emissive="#7bcacb" emissiveIntensity={powered ? 0.4 : 0.02} /></mesh>
      <mesh position={[0, 0, 0.065]}><torusGeometry args={[0.395, 0.045, 6, 24]} /><meshStandardMaterial color="#f7f4ea" /></mesh>
      <mesh position={[-0.1, 0.1, 0.14]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.09, 0.28, 0.01]} /><meshBasicMaterial color="#d9f5fa" transparent opacity={0.65} /></mesh>
    </group>)}
    <group position={[0, 1.3, 1.6]}>
      <mesh castShadow><boxGeometry args={[1.1, 1.85, 0.25]} /><meshStandardMaterial color={ORANGE} /></mesh>
      <mesh position={[0, 0, 0.15]}><boxGeometry args={[0.86, 1.64, 0.12]} /><meshStandardMaterial color={INK} /></mesh>
      <mesh position={[0, 0.35, 0.22]}><boxGeometry args={[0.57, 0.42, 0.04]} /><meshStandardMaterial color="#91b9c4" metalness={0.5} roughness={0.2} /></mesh>
      <mesh position={[0.3, -0.1, 0.24]}><boxGeometry args={[0.06, 0.24, 0.04]} /><meshStandardMaterial color={WHITE} /></mesh>
      <mesh position={[0, 1.04, 0.05]}><boxGeometry args={[1.1, 0.08, 0.12]} /><meshBasicMaterial color={powered ? MINT : '#515a6a'} /></mesh>
    </group>
    {[0, 1, 2].map(index => <mesh key={index} position={[0, 0.15 + index * 0.12, 2.6 - index * 0.27]} receiveShadow castShadow><boxGeometry args={[1.6, 0.15 + index * 0.24, 0.36]} /><meshStandardMaterial color="#9da6b2" roughness={0.75} /></mesh>)}
    <mesh position={[0.5, 3.39, -0.2]} castShadow><cylinderGeometry args={[0.85, 0.95, 0.24, 20]} /><meshStandardMaterial color={METAL} /></mesh>
    <mesh position={[0.5, 3.49, -0.2]}><sphereGeometry args={[0.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#8bc6d4" metalness={0.35} roughness={0.2} transparent opacity={0.8} /></mesh>
    <Rod from={[-2.3, 3.35, -0.2]} to={[-2.3, 4.55, -0.2]} radius={0.03} />
    <mesh position={[-2.3, 4.56, -0.2]}><sphereGeometry args={[0.09, 8, 6]} /><meshBasicMaterial color={ORANGE} /></mesh>
    <group position={[3.5, 0, -1.2]}>
      {[0, 0.65].map(z => <group key={z} position={[0, 0, z]}>
        <mesh position={[0, 0.9, 0]} castShadow><capsuleGeometry args={[0.28, 1.1, 5, 12]} /><meshStandardMaterial color={WHITE} roughness={0.6} metalness={0.2} /></mesh>
        <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.285, 0.285, 0.14, 12]} /><meshStandardMaterial color={MINT} /></mesh>
      </group>)}
    </group>
    <mesh position={[-3, 0.8, 0.4]} castShadow><boxGeometry args={[0.72, 1.2, 1.1]} /><meshStandardMaterial color={WHITE} /></mesh>
    {[0, 1, 2, 3].map(index => <mesh key={index} position={[-3, 0.48 + index * 0.18, 0.96]}><boxGeometry args={[0.42, 0.06, 0.025]} /><meshBasicMaterial color={powered ? MINT : '#596174'} /></mesh>)}
  </group>;
}

function Communications({ state, selected, onSelect }: { state: State } & Selection) {
  const dish = useRef<THREE.Group>(null);
  const waves = useRef<THREE.Group>(null);
  const { signal, powered } = metrics(state);
  const geometry = useMemo(() => new THREE.LatheGeometry(Array.from({ length: 15 }, (_, i) => {
    const radius = i / 14 * 1.65;
    return new THREE.Vector2(radius, radius * radius * 0.24);
  }), 32), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }, dt) => {
    if (dish.current) dish.current.rotation.z = THREE.MathUtils.damp(dish.current.rotation.z, -state.antennaAngle * Math.PI / 180, 5, dt);
    waves.current?.children.forEach((wave, index) => {
      const progress = (clock.elapsedTime * 0.45 + index / 3) % 1;
      wave.position.y = 1.1 + progress * 3;
      wave.scale.setScalar(0.35 + progress * 1.15);
      ((wave as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - progress) * Math.min(signal / 100, 0.65);
    });
  });
  return <group position={[7, 0, -2]} {...interactive('comms', onSelect)}>
    <SelectionRing radius={2.7} selected={selected === 'comms'} />
    <mesh position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[1.15, 1.4, 0.34, 8]} /><meshStandardMaterial color="#4f5767" roughness={0.8} /></mesh>
    <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.14, 0.28, 2.6, 10]} /><meshStandardMaterial color={WHITE} roughness={0.5} metalness={0.3} /></mesh>
    {[-1, 1].map(side => <Rod key={side} from={[side * 0.9, 0.3, 0]} to={[0, 2.2, 0]} radius={0.06} />)}
    <mesh position={[0.6, 0.65, 0.45]} castShadow><boxGeometry args={[0.85, 1, 0.65]} /><meshStandardMaterial color={WHITE} /></mesh>
    <mesh position={[0.6, 0.85, 0.79]}><boxGeometry args={[0.5, 0.2, 0.03]} /><meshBasicMaterial color={state.antennaOn && powered ? MINT : ORANGE} /></mesh>
    <group ref={dish} position={[0, 2.8, 0]} rotation={[0.15, 0, -state.antennaAngle * Math.PI / 180]}>
      <mesh geometry={geometry} castShadow><meshStandardMaterial color={WHITE} roughness={0.5} metalness={0.25} side={THREE.DoubleSide} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.65, 0]}><torusGeometry args={[1.65, 0.035, 6, 40]} /><meshStandardMaterial color={ORANGE} /></mesh>
      {[0, 2.094, 4.188].map(angle => <Rod key={angle} from={[Math.cos(angle) * 1.48, 0.54, Math.sin(angle) * 1.48]} to={[0, 1.5, 0]} radius={0.025} />)}
      <mesh position={[0, 1.48, 0]} castShadow><cylinderGeometry args={[0.12, 0.2, 0.3, 10]} /><meshStandardMaterial color={INK} /></mesh>
      <mesh position={[0, 1.65, 0]}><sphereGeometry args={[0.09, 8, 6]} /><meshBasicMaterial color={signal > 20 ? MINT : ORANGE} /></mesh>
      <group ref={waves} visible={state.antennaOn && powered && signal > 5}>{[0, 1, 2].map(index => <mesh key={index} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.67, 0.69, 40]} /><meshBasicMaterial color={MINT} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>)}</group>
    </group>
  </group>;
}

function Rover({ state, selected, onSelect }: { state: State } & Selection) {
  // This is Lunar-E's real factory, including its arm, panels and lights.
  // Only the renderer and the shared device state belong to the host app.
  const model = useMemo(() => {
    const rover = createRover(new THREE.Group());
    rover.group.rotation.y = -Math.PI / 2; // Original +X front -> station +Z.
    return rover;
  }, []);
  const previous = useRef<[number, number]>([...state.roverPosition]);
  const previousTime = useRef(state.elapsed);
  const moving = state.roverMode === 'driving' || state.roverMode === 'returning';

  useEffect(() => () => {
    // Primitives are not automatically disposed by React Three Fiber. Materials
    // and geometries are shared inside the original model, so dispose each once.
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    model.group.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      for (const material of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) materials.add(material);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
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

  useFrame((_, dt) => {
    const dx = state.roverPosition[0] - previous.current[0];
    const dz = state.roverPosition[1] - previous.current[1];
    if (state.elapsed < previousTime.current) model.wheels.forEach(wheel => { wheel.rotation.y = 0; });
    else if (!state.paused) {
      const direction = dx * Math.sin(state.roverHeading) + dz * Math.cos(state.roverHeading) < 0 ? -1 : 1;
      const rotation = -Math.hypot(dx, dz) * direction * 3.5;
      model.wheels.forEach(wheel => { wheel.rotation.y += rotation; });
    }
    previous.current = [...state.roverPosition];
    previousTime.current = state.elapsed;
    if (!state.paused && state.roverBattery > 0) updateRover(model, {
      panelsOpen: !moving,
      gripperOpen: true,
      keys: {},
    }, Math.min(dt, 0.1));
  });
  return <group position={[state.roverPosition[0], 0, state.roverPosition[1]]} rotation={[0, state.roverHeading, 0]} {...interactive('rover', onSelect)}>
    <SelectionRing radius={2} selected={selected === 'rover'} />
    <primitive object={model.group} dispose={null} />
  </group>;
}

function Cable({ points, active = true, data = false }: { points: Array<[number, number, number]>; active?: boolean; data?: boolean }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 32, 0.055, 6, false), [points]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color={active ? data ? '#b7a0e5' : '#d79555' : '#6d7682'} roughness={0.9} transparent opacity={active ? 0.95 : 0.35} emissive={active ? data ? '#8b6fbb' : '#805021' : '#000000'} emissiveIntensity={data ? 0.5 : 0.1} /></mesh>;
}

const cables: Array<Array<[number, number, number]>> = [
  [[-7, 0.04, -5], [-5.7, 0.04, -5], [-4.2, 0.04, -5.5], [-2, 0.04, -5.5]],
  [[-7, 0.04, 1.2], [-5.5, 0.04, 1.5], [-4.3, 0.04, 0.5], [-3.2, 0.04, -1]],
  [[3, 0.04, -4], [4.3, 0.04, -4.8], [6, 0.04, -4.8], [7, 0.04, -2]],
  [[2.5, 0.04, -1], [3.7, 0.04, 0.7], [3.8, 0.04, 3], [2, 0.04, 5]],
];

function ChargingPad({ state }: { state: State }) {
  return <group position={[0, 0.015, 5]}>
    <mesh receiveShadow><cylinderGeometry args={[2.15, 2.35, 0.06, 32]} /><meshStandardMaterial color="#555f6c" roughness={0.95} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}><ringGeometry args={[1.9, 1.98, 48]} /><meshBasicMaterial color={state.roverMode === 'charging' ? MINT : '#cbd6df'} transparent opacity={0.7} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * 0.5, 0.05, 0]}><boxGeometry args={[0.17, 0.025, 2.5]} /><meshStandardMaterial color={ORANGE} roughness={0.7} /></mesh>)}
    <mesh position={[2, 0.48, 0]} castShadow><boxGeometry args={[0.5, 0.9, 0.7]} /><meshStandardMaterial color={WHITE} /></mesh>
    <mesh position={[2, 0.7, 0.36]}><boxGeometry args={[0.3, 0.15, 0.02]} /><meshBasicMaterial color={state.roverMode === 'charging' ? MINT : ORANGE} /></mesh>
  </group>;
}

export function Equipment({ state, selected, onSelect }: { state: State } & Selection) {
  return <>
    {cables.map((points, index) => <Cable key={index} points={points} active={index < 2 ? state.connections.solarBus : index === 2 ? state.connections.antennaBus : state.connections.roverDock} />)}
    {state.connections.roverRadio && metrics(state).signal >= 20 && <Cable data points={[[7, 4, -2], [3.5, 3.5, (state.roverPosition[1] - 2) / 2], [state.roverPosition[0], 1.3, state.roverPosition[1]]]} />}
    <ChargingPad state={state} />
    <Solar state={state} selected={selected} onSelect={onSelect} />
    <Habitat powered={metrics(state).powered} />
    <Communications state={state} selected={selected} onSelect={onSelect} />
    <Rover state={state} selected={selected} onSelect={onSelect} />
  </>;
}
