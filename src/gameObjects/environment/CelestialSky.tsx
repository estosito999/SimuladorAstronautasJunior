import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function random(seed: number) {
  let value = seed;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function StarsField({ low = false }: { low?: boolean }) {
  const positions = useMemo(() => {
    const rng = random(527);
    const count = low ? 450 : 1000;
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const elevation = 0.05 + rng() * 1.4;
      const distance = 110 + rng() * 35;
      points.set(
        [
          Math.cos(a) * Math.cos(elevation) * distance,
          Math.sin(elevation) * distance,
          Math.sin(a) * Math.cos(elevation) * distance,
        ],
        i * 3
      );
    }
    return points;
  }, [low]);

  return (
    <points name="GameObject_StarField">
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color="#dce8ff"
        transparent
        opacity={0.72}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function EarthPlanet() {
  const planet = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const sphere = new THREE.SphereGeometry(3.1, 36, 24);
    const positions = sphere.attributes.position;
    const colours = new Float32Array(positions.count * 3);
    const colour = new THREE.Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) / 3.1;
      const y = positions.getY(i) / 3.1;
      const z = positions.getZ(i) / 3.1;
      const land =
        Math.sin(x * 5 + z * 2) +
        Math.cos(z * 4 - y * 3) * 0.6 +
        Math.sin(y * 7 + x * 2) * 0.4;
      colour.set(Math.abs(y) > 0.86 ? '#e8f6ff' : land > 0.5 ? '#6bad9b' : '#367dc0');
      if (Math.sin(x * 13 + y * 17 + z * 4) > 0.9) colour.lerp(new THREE.Color('#e6eef1'), 0.7);
      colours.set([colour.r, colour.g, colour.b], i * 3);
    }
    sphere.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    return sphere;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    if (planet.current) planet.current.rotation.y += Math.min(dt, 0.05) * 0.009;
  });

  return (
    <group ref={planet} position={[-38, 6, -66]} scale={1.3} rotation={[0.2, 0.4, -0.1]} name="GameObject_EarthPlanet">
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.85}
          emissive="#194571"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Atmósfera azulada de dispersión */}
      <mesh scale={1.035}>
        <sphereGeometry args={[3.1, 32, 20]} />
        <meshBasicMaterial
          color="#75b9f1"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

export function CelestialSky({ low = false }: { low?: boolean }) {
  return (
    <group name="GameObject_CelestialSky">
      <StarsField low={low} />
      <EarthPlanet />
    </group>
  );
}
