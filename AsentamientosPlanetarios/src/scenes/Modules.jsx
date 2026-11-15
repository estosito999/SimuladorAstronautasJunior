import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { MODULES } from '../data/modules.js';

// Layout slots per module type (x, z, rotationY). Heights come from the terrain.
const SLOTS = {
  habitat: [[0, 0, 0], [5.4, 1.2, 0.2], [-5.4, 1.2, -0.2]],
  lifeSupport: [[3.4, -3.8, 0], [-3.4, -3.8, 0], [0, -4.4, 0], [6.4, -3.4, 0]],
  recycler: [[-6.6, -2.8, 0.4], [-8, -0.2, 0.2], [7.6, -1.2, 0]],
  greenhouse: [[0, 6.4, 0], [-5.8, 6.2, 0.2], [5.8, 6.2, -0.2], [0, 11, 0]],
  lab: [[-9, 3.4, 0.4], [-9.2, 7.2, 0.2]],
  comms: [[8.6, 4.6, 0]],
  shelter: [[9.2, -3.6, 0], [10.4, -0.2, 0]],
  shield: [[0, -9, 0], [-8, -7, 0.6], [8, -7, -0.6]],
  solar: [[-12.4, 5, 0.3], [-12.4, 9.4, 0.3], [-12.4, 13.8, 0.3], [-17, 5, 0.3], [-17, 9.4, 0.3], [-17, 13.8, 0.3]],
  battery: [[11.4, 6.8, 0], [13.2, 8.8, 0], [11.4, 10.8, 0], [13.2, 12.8, 0], [11.4, 14.8, 0]],
};
export const slotFor = (type, i) => SLOTS[type]?.[i] ?? [0, 0, 0];

const T = (props) => <meshToonMaterial {...props} />;

function Shape({ type, dust, palette, tt }) {
  const white = '#f3f6fb', trim = palette.trim;
  switch (type) {
    case 'solar': {
      const c = new THREE.Color('#2f66d8').lerp(new THREE.Color('#b9a37c'), Math.min(1, dust / 120));
      return (
        <group>
          <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.09, 0.12, 1.4, 8]} />{T({ color: '#9aa7bd' })}</mesh>
          <group position={[0, 1.5, 0]} rotation={[-0.5, 0, 0]} scale={[Math.max(0.05, tt), 1, 1]}>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 1.0, 0, 0]}>
                <mesh castShadow><boxGeometry args={[1.85, 0.07, 1.5]} />{T({ color: c, emissive: '#16408f', emissiveIntensity: 0.25 })}</mesh>
                <mesh position={[0, 0.045, 0]}><boxGeometry args={[1.9, 0.02, 0.05]} />{T({ color: white })}</mesh>
                <mesh position={[0, 0.045, 0]}><boxGeometry args={[0.05, 0.02, 1.55]} />{T({ color: white })}</mesh>
              </group>
            ))}
          </group>
        </group>
      );
    }
    case 'battery':
      return (
        <group>
          <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[1.3, 1.4, 1.1]} />{T({ color: '#4b5878' })}</mesh>
          <mesh position={[0, 0.9, 0.56]}><boxGeometry args={[0.9, 0.18, 0.04]} />{T({ color: '#4ade80', emissive: '#4ade80', emissiveIntensity: 0.9 })}</mesh>
          <mesh position={[0, 1.45, 0]}><boxGeometry args={[0.8, 0.12, 0.7]} />{T({ color: '#cbd5e6' })}</mesh>
        </group>
      );
    case 'lifeSupport':
      return (
        <group>
          <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.8, 0.8, 2.2, 14]} />{T({ color: white })}</mesh>
          <mesh position={[0, 2.3, 0]} castShadow><sphereGeometry args={[0.8, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />{T({ color: '#7fd4ff' })}</mesh>
          <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.83, 0.83, 0.3, 14]} />{T({ color: trim })}</mesh>
          <mesh position={[0.9, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.1, 1.1, 8]} />{T({ color: '#9aa7bd' })}</mesh>
        </group>
      );
    case 'recycler':
      return (
        <group>
          <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.9, 0.9, 1.6, 14]} />{T({ color: '#3b9be8' })}</mesh>
          <mesh position={[0, 1.8, 0]}><cylinderGeometry args={[0.95, 0.95, 0.2, 14]} />{T({ color: white })}</mesh>
          <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.93, 0.93, 0.35, 14]} />{T({ color: '#bfe6ff' })}</mesh>
          <mesh position={[-1.2, 0.3, 0.4]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 1.2, 8]} />{T({ color: '#9aa7bd' })}</mesh>
        </group>
      );
    case 'greenhouse':
      return (
        <group>
          <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[2.1, 2.2, 0.3, 18]} />{T({ color: '#8d99ad' })}</mesh>
          <mesh position={[0, 0.25, 0]} castShadow><sphereGeometry args={[2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />{T({ color: '#8dffbf', transparent: true, opacity: 0.38 })}</mesh>
          {[[-0.8, -0.4], [0.6, 0.5], [0, -0.1], [-0.4, 0.8], [0.9, -0.7]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.55, z]}><coneGeometry args={[0.28, 0.9, 6]} />{T({ color: i % 2 ? '#3fbf5f' : '#59d77a' })}</mesh>
          ))}
        </group>
      );
    case 'shield':
      return (
        <group>
          {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
            <mesh key={x} position={[x, 0.7 + (i % 2) * 0.05, Math.abs(x) * 0.12]} rotation={[0, x * 0.08, 0]} castShadow><boxGeometry args={[1.55, 1.4 + (i % 2) * 0.2, 1]} />{T({ color: i % 2 ? palette.rockLight : palette.rock })}</mesh>
          ))}
          <mesh position={[0, 1.6, 0.1]}><boxGeometry args={[8, 0.12, 0.4]} />{T({ color: '#facc15' })}</mesh>
        </group>
      );
    case 'habitat':
      return (
        <group>
          <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><capsuleGeometry args={[1.35, 2.3, 6, 16]} />{T({ color: white })}</mesh>
          <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[1.38, 1.38, 0.35, 16]} />{T({ color: trim })}</mesh>
          {[-1.1, 1.1].map((x) => (<mesh key={x} position={[x, 1.8, 1.33]}><sphereGeometry args={[0.28, 10, 8]} />{T({ color: '#8be9ff', emissive: '#4fd8ff', emissiveIntensity: 0.8 })}</mesh>))}
          <mesh position={[0, 0.85, 1.35]}><boxGeometry args={[0.6, 1.1, 0.12]} />{T({ color: '#5b6b8c' })}</mesh>
          {[[-1.8, 0.3], [1.8, 0.3], [-1.8, -0.3], [1.8, -0.3]].map(([x, z], i) => (<mesh key={i} position={[x, 0.2, z]}><cylinderGeometry args={[0.12, 0.16, 0.4, 6]} />{T({ color: '#9aa7bd' })}</mesh>))}
          <mesh position={[0, 3.15, 0]}><cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />{T({ color: '#cbd5e6' })}</mesh>
          <mesh position={[0, 3.65, 0]}><sphereGeometry args={[0.12, 8, 6]} />{T({ color: '#ff5d5d', emissive: '#ff3030', emissiveIntensity: 0.9 })}</mesh>
        </group>
      );
    case 'lab':
      return (
        <group>
          <mesh position={[0, 0.8, 0]} castShadow><boxGeometry args={[2.4, 1.6, 2]} />{T({ color: white })}</mesh>
          <mesh position={[0, 1.65, 0]}><boxGeometry args={[2.5, 0.16, 2.1]} />{T({ color: trim })}</mesh>
          <mesh position={[-0.5, 2.1, 0]} rotation={[0.5, 0, 0.4]}><coneGeometry args={[0.7, 0.5, 14, 1, true]} />{T({ color: '#cbd5e6', side: THREE.DoubleSide })}</mesh>
          <mesh position={[0.7, 2.1, 0.2]}><cylinderGeometry args={[0.28, 0.28, 0.9, 10]} />{T({ color: '#7f8eaa' })}</mesh>
          <mesh position={[0, 0.9, 1.02]}><boxGeometry args={[1.2, 0.6, 0.05]} />{T({ color: '#8be9ff', emissive: '#4fd8ff', emissiveIntensity: 0.7 })}</mesh>
        </group>
      );
    case 'comms':
      return (
        <group>
          <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.1, 0.16, 3.2, 8]} />{T({ color: '#cbd5e6' })}</mesh>
          <mesh position={[0.3, 3.2, 0]} rotation={[0, 0, -0.9]}><sphereGeometry args={[0.9, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.6]} />{T({ color: white, side: THREE.DoubleSide })}</mesh>
          <mesh position={[0, 3.45, 0]}><sphereGeometry args={[0.1, 8, 6]} />{T({ color: '#ff5d5d', emissive: '#ff3030', emissiveIntensity: 1 })}</mesh>
        </group>
      );
    case 'shelter':
      return (
        <group>
          <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[1.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />{T({ color: '#5a6682' })}</mesh>
          <mesh position={[0, 0.5, 1.3]}><boxGeometry args={[0.7, 0.9, 0.5]} />{T({ color: '#facc15' })}</mesh>
        </group>
      );
    default: return null;
  }
}

function Burst() {
  const ref = useRef();
  const data = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ a: (i / 16) * Math.PI * 2, v: 1.2 + (i % 4) * 0.5 })), []);
  const t0 = useRef(null);
  useFrame((st) => {
    if (t0.current == null) t0.current = st.clock.elapsedTime;
    const t = st.clock.elapsedTime - t0.current;
    if (!ref.current) return;
    ref.current.visible = t < 1.4;
    ref.current.children.forEach((c, i) => { const d = data[i]; c.position.set(Math.cos(d.a) * t * d.v, 0.2 + t * d.v * 0.9 - t * t * 1.4, Math.sin(d.a) * t * d.v); c.scale.setScalar(Math.max(0.01, 1 - t / 1.4)); });
  });
  return <group ref={ref}>{data.map((d, i) => (<mesh key={i}><sphereGeometry args={[0.1, 6, 5]} /><meshBasicMaterial color="#ffe27a" /></mesh>))}</group>;
}

export function ModuleMesh({ m, index, terrain, selected, onSelect, dust, palette }) {
  const ref = useRef();
  const ring = useRef();
  const beacon = useRef();
  const t0 = useRef(null);
  const [x, z, rot] = slotFor(m.type, index);
  const y = terrain.height(x, z);
  const [tt, setTt] = useState(0);
  useFrame((st) => {
    if (t0.current == null) t0.current = st.clock.elapsedTime;
    const t = Math.min(1, (st.clock.elapsedTime - t0.current) / 1.1);
    const e = 1 - Math.pow(1 - t, 3);
    if (ref.current) {
      ref.current.scale.setScalar(0.05 + 0.95 * e);
      ref.current.position.y = y - (1 - e) * 1.2;
      if (m.type === 'solar') ref.current.rotation.y = rot + Math.sin(st.clock.elapsedTime * 0.2 + index) * 0.15;
      else if (m.type === 'comms') ref.current.rotation.y = rot + st.clock.elapsedTime * 0.5;
    }
    if (t < 1 || tt < 1) setTt(Math.min(1, t * 1.15));
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(st.clock.elapsedTime * 4) * 0.06);
    if (beacon.current) beacon.current.visible = Math.floor(st.clock.elapsedTime * 3) % 2 === 0;
  });
  const damaged = m.condition < 55;
  return (
    <group position={[x, 0, z]}>
      <group ref={ref} rotation={[0, rot, 0]} position={[0, y, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(m.uid); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}>
        <Shape type={m.type} dust={dust} palette={palette} tt={tt} />
        {m.fresh && <Burst />}
      </group>
      {selected && (
        <mesh ref={ring} position={[0, y + 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.0, 2.3, 32]} /><meshBasicMaterial color="#67e8f9" transparent opacity={0.9} />
        </mesh>
      )}
      {damaged && (
        <mesh ref={beacon} position={[0, y + 4.2, 0]}><octahedronGeometry args={[0.25]} /><meshBasicMaterial color="#ff4d4d" /></mesh>
      )}
      {selected && <Html position={[0, y + 3.6, 0]} center distanceFactor={14} zIndexRange={[5, 0]}><div className="pointer-events-none whitespace-nowrap rounded-md border border-accent/70 bg-space-900/90 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-white">{MODULES[m.type].icon} {MODULES[m.type].name}</div></Html>}
    </group>
  );
}

export function Outpost({ mission, terrain, selected, onSelect, palette }) {
  const seen = {};
  return (
    <group>
      {mission.modules.map((m) => {
        const i = (seen[m.type] = (seen[m.type] ?? -1) + 1);
        return <ModuleMesh key={m.uid} m={m} index={i} terrain={terrain} selected={selected === m.uid} onSelect={onSelect} dust={mission.dust} palette={palette} />;
      })}
    </group>
  );
}
