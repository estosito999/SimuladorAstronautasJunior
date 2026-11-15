import { OrbitControls, Stars } from '@react-three/drei';

export function Controls({ autoRotate = true, interactive = true }) {
  return (
    <OrbitControls enablePan={false} enabled={interactive} minDistance={9} maxDistance={46} maxPolarAngle={Math.PI / 2.08}
      target={[-1, 1.5, 3]} autoRotate={autoRotate} autoRotateSpeed={0.35} enableDamping dampingFactor={0.08} />
  );
}
export const StarField = ({ count = 2200 }) => <Stars radius={115} depth={40} count={count} factor={4} saturation={0} fade speed={0.6} />;
