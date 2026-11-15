import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { groundHeight } from './terrainHeight';
import { LUNAR_ROCKS } from '../../simulation/roverExploration';

function random(seed: number) {
  let value = seed;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function Ground() {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(180, 180, 160, 160);
    plane.rotateX(-Math.PI / 2);
    const positions = plane.attributes.position;
    const colours = new Float32Array(positions.count * 3);
    const colour = new THREE.Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
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

  return (
    <mesh geometry={geometry} receiveShadow name="GameObject_LunarGround">
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
}

export function RocksScattering() {
  const rock = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!rock.current) return;
    const rng = random(171);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 320; i++) {
      let x = (rng() - 0.5) * 168;
      let z = (rng() - 0.5) * 168;
      for (
        let attempt = 0;
        attempt < 30 &&
        ((Math.abs(x) < 14 && z > -10 && z < 16) ||
          LUNAR_ROCKS.some(
            (sample) => Math.hypot(x - sample.position[0], z - sample.position[1]) < 3
          ));
        attempt++
      ) {
        x = (rng() - 0.5) * 168;
        z = (rng() - 0.5) * 168;
      }
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

  return (
    <instancedMesh ref={rock} args={[undefined, undefined, 320]} castShadow receiveShadow name="GameObject_LunarRocks">
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={1} flatShading />
    </instancedMesh>
  );
}

export function Mountains() {
  const hills = useMemo(() => {
    const rng = random(94);
    return Array.from({ length: 21 }, (_, i) => {
      const a = (i / 21) * Math.PI * 2;
      const radius = 88 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
      return {
        x: Math.cos(a) * radius,
        z: Math.sin(a) * radius,
        height: 6 + rng() * 7,
        width: 7 + rng() * 6,
        rotate: rng(),
      };
    });
  }, []);

  return (
    <group name="GameObject_LunarMountains">
      {hills.map((hill, i) => (
        <mesh
          key={i}
          position={[hill.x, hill.height / 2 - 1, hill.z]}
          rotation={[0, hill.rotate, 0]}
          scale={[1.4, 1, 1]}
        >
          <coneGeometry args={[hill.width, hill.height, 5]} />
          <meshStandardMaterial
            color={i % 2 ? '#6a6978' : '#5e5f6f'}
            flatShading
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

export function LunarTerrain() {
  return (
    <group name="GameObject_TerrainGroup">
      <Ground />
      <RocksScattering />
      <Mountains />
    </group>
  );
}
