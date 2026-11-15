import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Dust } from './parts.jsx';

function Orbiter() {
  const g = useRef();
  useFrame((st) => { const t = st.clock.elapsedTime * 0.35; if (g.current) { g.current.position.set(Math.cos(t) * 5.2, Math.sin(t * 0.7) * 1.2, Math.sin(t) * 5.2); g.current.rotation.y = -t; } });
  return (
    <group ref={g}>
      <mesh><boxGeometry args={[0.4, 0.22, 0.22]} /><meshStandardMaterial color="#e8eef8" /></mesh>
      <mesh position={[0, 0, 0.5]}><boxGeometry args={[0.7, 0.03, 0.4]} /><meshStandardMaterial color="#2f66d8" emissive="#16408f" emissiveIntensity={0.4} /></mesh>
      <mesh position={[0, 0, -0.5]}><boxGeometry args={[0.7, 0.03, 0.4]} /><meshStandardMaterial color="#2f66d8" emissive="#16408f" emissiveIntensity={0.4} /></mesh>
    </group>
  );
}
function Moon() {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.06; });
  return (
    <group position={[2.6, -1.8, -1]}>
      <mesh ref={ref}><icosahedronGeometry args={[3.2, 2]} /><meshStandardMaterial color="#a9adb9" flatShading roughness={1} /></mesh>
    </group>
  );
}
function MarsFar() {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.08; });
  return <mesh ref={ref} position={[-4.4, 2.2, -5]}><icosahedronGeometry args={[1.1, 2]} /><meshStandardMaterial color="#d2683a" flatShading roughness={1} /></mesh>;
}

export default function HeroScene() {
  const weather = useRef({ level: 0 });
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.4, 9], fov: 45 }} gl={{ antialias: true }}>
      <color attach="background" args={['#04060d']} />
      <ambientLight intensity={0.35} color="#9db6ff" />
      <directionalLight position={[8, 5, 6]} intensity={2.6} color="#fff1dc" />
      <Stars radius={60} depth={40} count={2500} factor={4} saturation={0} fade speed={0.8} />
      <Moon /><MarsFar /><Orbiter />
      <Dust weather={weather} color="#cfd8ff" base={0.4} count={260} speed={0.25} size={0.06} area={30} height={12} />
    </Canvas>
  );
}
