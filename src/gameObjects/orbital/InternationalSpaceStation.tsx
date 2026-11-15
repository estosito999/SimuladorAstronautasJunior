import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { ModuleId, State } from '../../simulation/types';
import { UnityBridge } from '../unity/UnityBridge';

interface ISSProps {
  selected: ModuleId;
  onSelect: (id: ModuleId) => void;
  state: State;
}

export function InternationalSpaceStation({ selected, onSelect, state }: ISSProps) {
  const issGroup = useRef<THREE.Group>(null);
  const solarRotary = useRef<THREE.Group>(null);
  const dataBeam = useRef<THREE.Mesh>(null);
  const beaconStarboard = useRef<THREE.Mesh>(null);
  const beaconPort = useRef<THREE.Mesh>(null);
  const beaconStrobe = useRef<THREE.Mesh>(null);
  const lastSyncTime = useRef(0);

  const isSelected = selected === 'iss';

  // Geometría y materiales de los paneles solares
  const solarWingGeom = useMemo(() => new THREE.BoxGeometry(3.1, 0.04, 5.4), []);
  const trussGeom = useMemo(() => new THREE.BoxGeometry(22, 0.42, 0.42), []);

  useFrame((stateThree) => {
    const t = stateThree.clock.elapsedTime;

    // Órbita suave alrededor del cuadrante celestial terrestre
    if (issGroup.current) {
      issGroup.current.rotation.y = Math.sin(t * 0.04) * 0.15 + 0.35;
      issGroup.current.rotation.z = Math.cos(t * 0.03) * 0.08 - 0.12;
      issGroup.current.position.x = -28 + Math.sin(t * 0.035) * 2.2;
      issGroup.current.position.y = 22 + Math.cos(t * 0.035) * 1.1;
    }

    // Orientación angular continua de las alas fotovoltaicas (SARJ)
    if (solarRotary.current) {
      solarRotary.current.rotation.x = t * 0.12;
    }

    // Luces estroboscópicas orbitales y balizas de navegación
    const blink = Math.sin(t * 5) > 0.5;
    if (beaconStarboard.current) beaconStarboard.current.visible = true;
    if (beaconPort.current) beaconPort.current.visible = true;
    if (beaconStrobe.current) beaconStrobe.current.visible = blink;

    // Haz de datos de telemetría inter-estaciones (Banda Ka / DSN)
    if (dataBeam.current) {
      dataBeam.current.visible = state.issTelemetryActive ?? true;
      const mat = dataBeam.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.22 + Math.sin(t * 4) * 0.12;
    }

    // Sincronización de telemetría orbital hacia Unity cada 1 s
    if (t - lastSyncTime.current > 1.0) {
      lastSyncTime.current = t;
      UnityBridge.syncISS({
        altitudeKm: 420.5,
        orbitalSpeedKmH: 27600,
        inclinationDeg: 51.64,
        orbitalPeriodMin: 92.68,
        solarGenerationKw: 120,
        lifeSupportPressureKPa: 101.3,
        interStationLinkActive: state.issTelemetryActive ?? true,
        activeGroundCenter: 'Houston MCC / Col-CC',
      });
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = '';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect('iss');
  };

  return (
    <group
      ref={issGroup}
      position={[-28, 22, -50]}
      scale={1.12}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      name="GameObject_ISS"
    >
      {/* Retícula orbital táctica de selección */}
      {isSelected && (
        <group>
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[12.5, 12.75, 48]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[12.5, 12.75, 48]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ── 1. ESTRUCTURA INTEGRADA DE ARMADURA CENTRAL (ITS TRUSS) ── */}
      <mesh geometry={trussGeom}>
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Refuerzos y vigas cruzadas de la armadura */}
      {[-8.5, -4.5, 0, 4.5, 8.5].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.65, 0.75, 0.75]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* ── 2. ALAS DE MATRICES SOLARES ARTICULADAS (8 WINGS - SAW) ── */}
      <group ref={solarRotary}>
        {/* Lado de babor (Port) - 4 alas (2 pares) */}
        {[-9.6, -7.4].map((x) => (
          <group key={`port-${x}`} position={[x, 0, 0]}>
            <mesh position={[0, 0, 3.4]} geometry={solarWingGeom}>
              <meshStandardMaterial
                color="#b45309"
                emissive="#d97706"
                emissiveIntensity={0.2}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, 0, -3.4]} geometry={solarWingGeom}>
              <meshStandardMaterial
                color="#b45309"
                emissive="#d97706"
                emissiveIntensity={0.2}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 12.8, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Lado de estribor (Starboard) - 4 alas (2 pares) */}
        {[7.4, 9.6].map((x) => (
          <group key={`starboard-${x}`} position={[x, 0, 0]}>
            <mesh position={[0, 0, 3.4]} geometry={solarWingGeom}>
              <meshStandardMaterial
                color="#b45309"
                emissive="#d97706"
                emissiveIntensity={0.2}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, 0, -3.4]} geometry={solarWingGeom}>
              <meshStandardMaterial
                color="#b45309"
                emissive="#d97706"
                emissiveIntensity={0.2}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 12.8, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── 3. PANELES RADIADORES TÉRMICOS (HRS) ── */}
      {[-2.8, 2.8].map((x) => (
        <group key={`radiator-${x}`} position={[x, 0, -2.6]}>
          <mesh rotation={[0.4, 0, 0]}>
            <boxGeometry args={[1.5, 0.05, 3.6]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {/* ── 4. CLUSTER DE MÓDULOS PRESURIZADOS CENTRALES ── */}
      <group position={[0, -0.6, 0]}>
        {/* Módulo Laboratorio Destiny (EE. UU.) */}
        <mesh position={[0, 0, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 2.8, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.65} roughness={0.35} />
        </mesh>

        {/* Nodo Harmony (Node 2) */}
        <mesh position={[0, 0, 3.2]}>
          <boxGeometry args={[1.1, 1.1, 1.2]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Módulo Europeo Columbus (ESA) */}
        <mesh position={[-1.7, 0, 3.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.55, 0.55, 2.2, 16]} />
          <meshStandardMaterial color="#dbeafe" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[-1.7, 0, 3.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.56, 0.56, 0.35, 16]} />
          <meshBasicMaterial color="#2563eb" />
        </mesh>

        {/* Módulo Japonés Kibo (JEM - JAXA) */}
        <mesh position={[2.1, 0, 3.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.64, 0.64, 3.0, 18]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[3.8, -0.1, 3.2]}>
          <boxGeometry args={[1.2, 0.45, 1.4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} />
        </mesh>

        {/* Cúpula de Observación Terrestre (Cupola) */}
        <mesh position={[0, -0.7, 1.4]}>
          <sphereGeometry args={[0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.85} roughness={0.1} metalness={0.9} />
        </mesh>

        {/* Nodo Unity (Node 1) */}
        <mesh position={[0, 0, -0.4]}>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Segmento Ruso: Zarya (FGB) y Zvezda */}
        <mesh position={[0, 0, -2.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.58, 0.58, 2.4, 18]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, -3.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.62, 2.2, 18]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.4} roughness={0.6} />
        </mesh>
        {[-2.4, 2.4].map((x) => (
          <mesh key={`zvezda-solar-${x}`} position={[x, 0, -3.9]}>
            <boxGeometry args={[2.2, 0.03, 0.85]} />
            <meshStandardMaterial color="#ca8a04" emissive="#854d0e" emissiveIntensity={0.2} metalness={0.7} />
          </mesh>
        ))}

        {/* ── 5. NAVE DE TRIPULACIÓN ACOPLADA (CREW DRAGON) ── */}
        <group position={[0, 0, 4.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.42, 0.7, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.55, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.3} />
          </mesh>
        </group>

        {/* ── 6. BRAZO ROBÓTICO CANADARM2 ── */}
        <group position={[-0.8, 0.65, 0.8]} rotation={[0.4, 0.8, -0.3]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.15, 0.4]} rotation={[0.8, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.1, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.6, 0.8]}>
            <boxGeometry args={[0.15, 0.15, 0.2]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>

        {/* Antena SGANT de Alta Ganancia */}
        <group position={[0, 1.2, -0.4]} rotation={[0.4, 0.2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
          <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* ── 7. BALIZAS DE NAVEGACIÓN ASTRONÁUTICA ── */}
      <mesh ref={beaconStarboard} position={[11.2, 0.2, 0]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh ref={beaconPort} position={[-11.2, 0.2, 0]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh ref={beaconStrobe} position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* ── 8. HAZ DE DATOS DE TELEMETRÍA (ISS ↔ TIERRA Y BASE LUNAR) ── */}
      <mesh ref={dataBeam} position={[14, -18, 22]} rotation={[0.6, 0.3, 0.7]}>
        <cylinderGeometry args={[0.03, 0.12, 54, 8]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </group>
  );
}
