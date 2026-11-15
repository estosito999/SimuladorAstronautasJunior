import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/** Small cartoon rover circling the base. Drives faster while science is running. Clickable. */
export default function Rover({ terrain, busy, selected, onSelect, radius = 15 }) {
  const g = useRef(), wheels = useRef([]), mast = useRef();
  const ang = useRef(0.6);
  useFrame((st, dt) => {
    const sp = busy ? 0.16 : 0.06;
    ang.current += dt * sp;
    const a = ang.current, x = Math.cos(a) * radius, z = Math.sin(a) * radius * 0.8;
    if (!g.current) return;
    const y = terrain.height(x, z);
    g.current.position.set(x, y + 0.42, z);
    g.current.rotation.y = Math.atan2(-0.8 * Math.cos(a), -Math.sin(a));
    const ny = terrain.height(Math.cos(a + 0.05) * radius, Math.sin(a + 0.05) * radius * 0.8);
    g.current.rotation.z = Math.max(-0.3, Math.min(0.3, (y - ny) * 0.4));
    wheels.current.forEach((w) => { if (w) w.rotation.z -= dt * sp * 40; });
    if (mast.current) mast.current.rotation.y = st.clock.elapsedTime * (busy ? 2 : 0.5);
  });
  return (
    <group ref={g} onClick={(e) => { e.stopPropagation(); onSelect('rover'); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
      <mesh castShadow><boxGeometry args={[1.5, 0.5, 0.9]} /><meshToonMaterial color="#ffcc33" /></mesh>
      <mesh position={[0.2, 0.45, 0]} castShadow><boxGeometry args={[0.7, 0.4, 0.7]} /><meshToonMaterial color="#f3f6fb" /></mesh>
      <mesh position={[0.56, 0.5, 0]}><boxGeometry args={[0.04, 0.26, 0.55]} /><meshToonMaterial color="#8be9ff" emissive="#4fd8ff" emissiveIntensity={0.6} /></mesh>
      <group ref={mast} position={[-0.5, 0.6, 0]}>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.03, 0.03, 0.6, 6]} /><meshToonMaterial color="#cbd5e6" /></mesh>
        <mesh position={[0.1, 0.62, 0]}><boxGeometry args={[0.3, 0.12, 0.2]} /><meshToonMaterial color="#ff7a45" /></mesh>
      </group>
      {[[-0.55, 0.45], [0.55, 0.45], [-0.55, -0.45], [0.55, -0.45]].map(([x, z], i) => (
        <group key={i} ref={(el) => (wheels.current[i] = el)} position={[x, -0.2, z]}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.25, 0.25, 0.2, 10]} /><meshToonMaterial color="#39435c" /></mesh><mesh position={[0.15, 0, 0.11 * Math.sign(z)]}><boxGeometry args={[0.08, 0.08, 0.02]} /><meshBasicMaterial color="#fff" /></mesh></group>
      ))}
      {selected && <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.2, 1.4, 24]} /><meshBasicMaterial color="#67e8f9" /></mesh>}
    </group>
  );
}
