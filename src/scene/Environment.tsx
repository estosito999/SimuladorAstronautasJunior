import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeTerrain } from './terrain';

/** Original deterministic scenery. Every shape and colour is generated locally. */
function random(seed: number) {
  let value = seed;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const lunarTerrain = makeTerrain('moon');

export function groundHeight(x: number, z: number) {
  const distanceFromStation = Math.max(Math.abs(x) / 17, Math.abs(z - 2) / 17);
  const outer = THREE.MathUtils.smoothstep(distanceFromStation, 0.9, 1.45);
  // ZERO-G's actual terrain generator; flatten the educational driving zone.
  return lunarTerrain.height(x, z) * outer;
}

function Ground() {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(110, 110, 100, 100);
    plane.rotateX(-Math.PI / 2);
    const positions = plane.attributes.position;
    const colours = new Float32Array(positions.count * 3);
    const colour = new THREE.Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i);
      const y = groundHeight(x, z);
      positions.setY(i, y - 0.06);
      const grain = Math.sin(x * 7.13 + z * 21.97) * 0.012;
      colour.set('#777786').multiplyScalar(1 + y * 0.07 + grain);
      colours.set([colour.r, colour.g, colour.b], i * 3);
    }
    plane.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    plane.computeVertexNormals();
    return plane;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
}

function Rocks() {
  const rock = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!rock.current) return;
    const rng = random(171);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 180; i++) {
      let x = (rng() - 0.5) * 95, z = (rng() - 0.5) * 95;
      if (Math.abs(x) < 14 && z > -10 && z < 16) { x += Math.sign(x || 1) * 18; z -= 12; }
      const size = 0.12 + rng() ** 3 * 1.7;
      dummy.position.set(x, groundHeight(x, z) + size * 0.22, z);
      dummy.rotation.set(rng() * 3, rng() * 6, rng() * 3);
      dummy.scale.set(size * (1 + rng()), size * 0.75, size);
      dummy.updateMatrix();
      rock.current.setMatrixAt(i, dummy.matrix);
      rock.current.setColorAt(i, new THREE.Color().setHSL(0.65, 0.04, 0.38 + rng() * 0.18));
    }
    rock.current.instanceMatrix.needsUpdate = true;
    if (rock.current.instanceColor) rock.current.instanceColor.needsUpdate = true;
  }, []);
  return <instancedMesh ref={rock} args={[undefined, undefined, 180]} castShadow receiveShadow>
    <dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial roughness={1} flatShading />
  </instancedMesh>;
}

function Stars({ low }: { low: boolean }) {
  const positions = useMemo(() => {
    const rng = random(527);
    const count = low ? 450 : 1000;
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2, elevation = 0.05 + rng() * 1.4;
      const distance = 110 + rng() * 35;
      points.set([Math.cos(a) * Math.cos(elevation) * distance, Math.sin(elevation) * distance, Math.sin(a) * Math.cos(elevation) * distance], i * 3);
    }
    return points;
  }, [low]);
  return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial size={0.16} color="#dce8ff" transparent opacity={0.72} sizeAttenuation depthWrite={false} /></points>;
}

function Earth() {
  const planet = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const sphere = new THREE.SphereGeometry(3.1, 36, 24);
    const positions = sphere.attributes.position;
    const colours = new Float32Array(positions.count * 3);
    const colour = new THREE.Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) / 3.1, y = positions.getY(i) / 3.1, z = positions.getZ(i) / 3.1;
      const land = Math.sin(x * 5 + z * 2) + Math.cos(z * 4 - y * 3) * 0.6 + Math.sin(y * 7 + x * 2) * 0.4;
      colour.set(Math.abs(y) > 0.86 ? '#e8f6ff' : land > 0.5 ? '#6bad9b' : '#367dc0');
      if (Math.sin(x * 13 + y * 17 + z * 4) > 0.9) colour.lerp(new THREE.Color('#e6eef1'), 0.7);
      colours.set([colour.r, colour.g, colour.b], i * 3);
    }
    sphere.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    return sphere;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, dt) => { if (planet.current) planet.current.rotation.y += Math.min(dt, 0.05) * 0.009; });
  return <group ref={planet} position={[-38, 6, -66]} scale={1.3} rotation={[0.2, 0.4, -0.1]}>
    <mesh geometry={geometry}><meshStandardMaterial vertexColors roughness={0.85} emissive="#194571" emissiveIntensity={0.35} /></mesh>
    <mesh scale={1.035}><sphereGeometry args={[3.1, 32, 20]} /><meshBasicMaterial color="#75b9f1" transparent opacity={0.12} side={THREE.BackSide} /></mesh>
  </group>;
}

function Mountains() {
  const hills = useMemo(() => {
    const rng = random(94);
    return Array.from({ length: 21 }, (_, i) => {
      const a = i / 21 * Math.PI * 2;
      return { x: Math.cos(a) * 48, z: Math.sin(a) * 48, height: 4 + rng() * 5, width: 7 + rng() * 9, rotate: rng() };
    });
  }, []);
  return <group>{hills.map((hill, i) => <mesh key={i} position={[hill.x, hill.height / 2 - 1, hill.z]} rotation={[0, hill.rotate, 0]} scale={[1.4, 1, 1]}>
    <coneGeometry args={[hill.width, hill.height, 5]} /><meshStandardMaterial color={i % 2 ? '#6a6978' : '#5e5f6f'} flatShading roughness={1} />
  </mesh>)}</group>;
}

export function Environment({ low }: { low: boolean }) {
  return <><Ground /><Rocks /><Mountains /><Stars low={low} /><Earth /></>;
}
