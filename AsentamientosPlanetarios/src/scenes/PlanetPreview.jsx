import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';
import { rng } from './terrain.js';

function Planet({ kind, size = 2, spin = 0.12 }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(size, 3), p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    const r = rng(kind === 'moon' ? 3 : 5), blobs = Array.from({ length: kind === 'moon' ? 14 : 9 }, () => new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(size));
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const near = Math.min(...blobs.map((b) => b.distanceTo(v)));
      if (kind === 'moon') c.set(near < size * 0.28 ? '#6b6f7a' : near < size * 0.36 ? '#c9ccd4' : '#a4a8b3');
      else c.set(v.y > size * 0.9 ? '#fff4ea' : near < size * 0.3 ? '#8b3d22' : (Math.sin(v.x * 2) + Math.cos(v.z * 2.3)) > 0.5 ? '#d9743f' : '#c25a30');
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g.toNonIndexed();
  }, [kind, size]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * spin; });
  return (
    <group>
      <mesh ref={ref} geometry={geo}><meshStandardMaterial vertexColors flatShading roughness={1} /></mesh>
      <mesh scale={1.1}><sphereGeometry args={[size, 24, 16]} /><meshBasicMaterial color={kind === 'moon' ? '#9fc2ff' : '#ff9a62'} transparent opacity={0.1} side={THREE.BackSide} /></mesh>
    </group>
  );
}

export default function PlanetPreview({ kind, hovered = false }) {
  return (
    <Canvas dpr={[1, 1.4]} camera={{ position: [0, 0.6, 6.2], fov: 38 }} gl={{ antialias: true }}>
      <ambientLight intensity={0.45} color={kind === 'moon' ? '#b7c8ff' : '#ffb98f'} />
      <directionalLight position={[5, 3, 4]} intensity={2.4} color="#fff3df" />
      <Stars radius={30} depth={20} count={400} factor={3} fade />
      <Planet kind={kind} spin={hovered ? 0.5 : 0.14} />
    </Canvas>
  );
}
