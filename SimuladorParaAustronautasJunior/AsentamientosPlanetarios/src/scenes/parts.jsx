import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { makeTerrain, rng } from './terrain.js';

export function Terrain({ kind, palette, terrain }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(140, 140, 74, 74);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const base = new THREE.Color(palette.ground), hi = new THREE.Color(palette.groundHi), lo = new THREE.Color(palette.groundLo);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = terrain.height(x, z);
      p.setY(i, y);
      const t = Math.max(-1, Math.min(1, y / 2));
      c.copy(base).lerp(t > 0 ? hi : lo, Math.abs(t) * 0.8);
      const n = (Math.sin(x * 1.7) * Math.cos(z * 1.3)) * 0.04;
      col[i * 3] = c.r + n; col[i * 3 + 1] = c.g + n; col[i * 3 + 2] = c.b + n;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    return flat;
  }, [kind, palette, terrain]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={0.95} metalness={0} /></mesh>;
}

export function Rocks({ terrain, color, count = 70, seed = 4 }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const r = rng(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2, d = 12 + r() * 48;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const k = 0.4 + r() * r() * 1.8;
      e.set(r() * 3, r() * 3, r() * 3); q.setFromEuler(e);
      s.set(k * (0.8 + r() * 0.5), k * (0.6 + r() * 0.4), k * (0.8 + r() * 0.5));
      p.set(x, terrain.height(x, z) + k * 0.25, z);
      m.compose(p, q, s); ref.current.setMatrixAt(i, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [terrain, count, seed]);
  return (
    <instancedMesh ref={ref} args={[null, null, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color={color} roughness={1} flatShading />
    </instancedMesh>
  );
}

export function Ridges({ color, count = 16, radius = 78, tall = 9, seed = 9 }) {
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + r() * 0.2, h = tall * (0.5 + r() * 0.9);
      return { x: Math.cos(a) * (radius + r() * 14), z: Math.sin(a) * (radius + r() * 14), h, w: 9 + r() * 12 };
    });
  }, [count, radius, tall, seed]);
  return (
    <group>
      {items.map((m, i) => (
        <mesh key={i} position={[m.x, m.h / 2 - 1, m.z]} scale={[1, 1, 1]}>
          <coneGeometry args={[m.w, m.h, 5]} /><meshStandardMaterial color={color} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Particle dust. `weather.current.level` (0..1) controls density; wind blows along +x. */
export function Dust({ weather, color, base = 0.15, count = 900, speed = 1.2, size = 0.16, area = 64, height = 14 }) {
  const ref = useRef();
  const pos = useMemo(() => {
    const r = rng(77), a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { a[i * 3] = (r() - 0.5) * area; a[i * 3 + 1] = r() * height; a[i * 3 + 2] = (r() - 0.5) * area; }
    return a;
  }, [count, area, height]);
  useFrame((st, dt) => {
    const pts = ref.current; if (!pts) return;
    const lvl = weather.current.level, k = Math.min(dt, 0.05), sp = speed * (1 + lvl * 5);
    const arr = pts.geometry.attributes.position.array, t = st.clock.elapsedTime;
    const n = Math.floor(count * (base + (1 - base) * lvl));
    for (let i = 0; i < n; i++) {
      arr[i * 3] += sp * k; arr[i * 3 + 1] += Math.sin(t + i) * 0.004;
      arr[i * 3 + 2] += Math.cos(t * 0.5 + i) * 0.006 * (1 + lvl * 4);
      if (arr[i * 3] > area / 2) arr[i * 3] -= area;
    }
    pts.geometry.attributes.position.needsUpdate = true;
    pts.geometry.setDrawRange(0, n);
    pts.material.opacity = 0.35 + lvl * 0.4;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={count} itemSize={3} /></bufferGeometry>
      <pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={0.4} depthWrite={false} />
    </points>
  );
}

/** Smooths weather level toward the target and drives fog, sky and sun. */
export function WeatherRig({ weather, target, fog, stormFog, sunRef, ambRef, sunBase, ambBase, skyRef, sunDrop = 0.55 }) {
  const { scene } = useThree();
  useEffect(() => {
    if (fog) { scene.fog = new THREE.Fog(fog.color, fog.near, fog.far); scene.background = new THREE.Color(fog.color); }
    else { scene.fog = null; scene.background = new THREE.Color('#02030a'); }
    return () => { scene.fog = null; };
  }, [scene, fog]);
  const tmp = useMemo(() => new THREE.Color(), []);
  const tmp2 = useMemo(() => new THREE.Color(), []);
  useFrame((_, dt) => {
    const w = weather.current;
    w.level += (target - w.level) * Math.min(1, dt * 1.4);
    const l = w.level;
    if (scene.fog && fog && stormFog) {
      tmp.set(fog.color).lerp(tmp2.set(stormFog.color), l);
      scene.fog.color.copy(tmp); scene.background.copy(tmp);
      scene.fog.near = fog.near + (stormFog.near - fog.near) * l;
      scene.fog.far = fog.far + (stormFog.far - fog.far) * l;
    }
    const light = 1 - sunDrop * l;
    if (sunRef.current) sunRef.current.intensity = sunBase * Math.max(0.12, light);
    if (ambRef.current) ambRef.current.intensity = ambBase * Math.max(0.5, 1 - 0.3 * l);
    if (skyRef?.current) skyRef.current.material.color.setScalar(Math.max(0.35, 1 - 0.6 * l));
  });
  return null;
}

/** Gradient sky dome (Mars). */
export function SkyDome({ top, bottom, innerRef }) {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(130, 24, 16);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    const a = new THREE.Color(top), b = new THREE.Color(bottom), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { c.copy(b).lerp(a, Math.min(1, Math.max(0, p.getY(i) / 90))); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [top, bottom]);
  return <mesh ref={innerRef} geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
}

export function Earth({ position = [-70, 42, -95], size = 7 }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(size, 3);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = Math.sin(x * 0.9) * Math.cos(y * 0.8 + 1) + Math.sin(z * 0.7 + x * 0.3);
      c.set(n > 0.55 ? '#58b368' : Math.abs(y) > size * 0.88 ? '#f3f8ff' : '#2f6fd1');
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g.toNonIndexed();
  }, [size]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.05; });
  return <mesh ref={ref} position={position} geometry={geo}><meshStandardMaterial vertexColors flatShading emissive="#1b3a73" emissiveIntensity={0.35} fog={false} /></mesh>;
}
