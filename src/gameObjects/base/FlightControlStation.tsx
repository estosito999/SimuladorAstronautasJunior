import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { ModuleId, State } from '../../simulation/types';
import { metrics } from '../../simulation/engine';

const WHITE = '#e9e6df';
const METAL = '#8e9aab';
const MINT = '#8ff0c8';
const ORANGE = '#ff9c52';

interface FlightControlStationProps {
  state: State;
  selected: ModuleId;
  onSelect: (id: ModuleId) => void;
}

export function FlightControlStation({ state, selected, onSelect }: FlightControlStationProps) {
  const isSelected = selected === 'control';
  const { signal, powered } = metrics(state);
  const dishRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const strobeRef = useRef<THREE.Mesh>(null);

  useFrame((stateThree, dt) => {
    const t = stateThree.clock.elapsedTime;
    if (dishRef.current) {
      dishRef.current.rotation.y = Math.sin(t * 0.15) * 0.35;
      dishRef.current.rotation.x = 0.25 + Math.cos(t * 0.1) * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += dt * 0.3;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 3) * 0.18;
    }
    if (strobeRef.current) {
      strobeRef.current.visible = Math.sin(t * 6) > 0.4;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect('control');
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = '';
  };

  return (
    <group
      position={[0, 0, -9.2]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Anillo de selección táctico */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[8.8, 8.8 + (isSelected ? 0.12 : 0.04), 64]} />
          <meshBasicMaterial
            color={isSelected ? '#38bdf8' : '#b7c7de'}
            transparent
            opacity={isSelected ? 0.95 : 0.2}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ── 1. PLATAFORMA DE CIMENTACIÓN INDUSTRIAL BLINDADA (16.2m x 9.6m) ── */}
      <mesh position={[0, 0.22, 0]} receiveShadow castShadow>
        <boxGeometry args={[16.2, 0.44, 9.6]} />
        <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.3} />
      </mesh>
      {/* Bordes perimetrales de seguridad color ámbar */}
      {[-8.1, 8.1].map((x) => (
        <mesh key={x} position={[x, 0.32, 0]}>
          <boxGeometry args={[0.2, 0.28, 9.6]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Pilotes de anclaje hidráulico a regolito */}
      {[-7.2, -2.4, 2.4, 7.2].map((x) =>
        [-4.2, 4.2].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.1, z]} castShadow>
            <cylinderGeometry args={[0.32, 0.38, 0.6, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.4} />
          </mesh>
        ))
      )}

      {/* ── 2. TÚNELES HERMÉTICOS DE CONEXIÓN CON EL HÁBITAT RESIDENCIAL ── */}
      {[-1.6, 1.6].map((x) => (
        <group key={`corridor-${x}`} position={[x, 1.9, 4.2]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.68, 0.68, 3.8, 16]} />
            <meshStandardMaterial color={WHITE} roughness={0.6} metalness={0.2} />
          </mesh>
          {[-1.2, 0, 1.2].map((z) => (
            <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.72, 0.05, 6, 20]} />
              <meshStandardMaterial color={ORANGE} roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0.7, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 3.8, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ── 3. NÚCLEO CENTRAL: CIUDADELA DE CONTROL DE VUELO (ALTURA 7.5m) ── */}
      {/* Nivel 1: Sala de Servidores y Centro de Datos de Vuelo */}
      <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 4.6, 3.8, 24]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} metalness={0.25} />
      </mesh>
      {/* Nervios estructurales de titanio */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 4.3, 2.3, Math.sin(a) * 4.3]}>
            <boxGeometry args={[0.18, 3.8, 0.35]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}

      {/* Nivel 2: Plataforma de Dirección de Vuelo y Bahías Panorámicas */}
      <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.2, 3.8, 1.8, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Ventanas panorámicas frontales de control de vuelo */}
      <group position={[0, 4.6, 2.8]}>
        <mesh>
          <boxGeometry args={[4.2, 1.1, 0.3]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={powered ? 0.65 : 0.05}
            roughness={0.15}
            metalness={0.8}
            transparent
            opacity={0.88}
          />
        </mesh>
      </group>

      {/* Nivel 3: Cúpula Superior de Observación y Telemetría Espacial */}
      <mesh position={[0, 5.5, 0]} castShadow>
        <sphereGeometry args={[2.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0369a1"
          emissiveIntensity={powered ? 0.5 : 0.05}
          roughness={0.2}
          metalness={0.7}
          transparent
          opacity={0.75}
        />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <sphereGeometry args={[2.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#475569" wireframe />
      </mesh>

      {/* Anillo holográfico de telemetría de vuelo */}
      <mesh ref={ringRef} position={[0, 6.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.8, 0.05, 8, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
      </mesh>

      {/* ── 4. ALA OESTE: BAHÍA DE ENLACE DSN Y TELECOMUNICACIONES ── */}
      <group position={[-5.6, 1.9, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.6, 3.4, 6.2]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.55} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.2, 3.12]}>
          <boxGeometry args={[4.2, 0.22, 0.05]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <group position={[-1.2, 2.2, 1.4]} rotation={[0.3, 0.4, 0]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
            <meshStandardMaterial color={METAL} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.7, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={WHITE} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <mesh position={[-2.32, 0.2, 0]}>
          <boxGeometry args={[0.05, 2.2, 4.4]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
      </group>

      {/* ── 5. ALA ESTE: GESTIÓN DE MISIONES Y AVIONICA ── */}
      <group position={[5.6, 1.9, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.6, 3.4, 6.2]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.55} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.2, 3.12]}>
          <boxGeometry args={[4.2, 0.22, 0.05]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <group position={[1.2, 2.2, 1.4]} rotation={[-0.4, -0.3, 0]}>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.8, 1.2, 0.15]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.35, 0.09]}>
            <boxGeometry args={[1.6, 1.0, 0.02]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      </group>

      {/* ── 6. TORRE PRINCIPAL DE TELEMETRÍA DSN (HASTA 11.2 METROS) ── */}
      <group position={[0, 6.8, 0]}>
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.16, 0.3, 3.6, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Plato Parabólico Principal DSN orientable */}
        <group ref={dishRef} position={[0, 3.2, 0]} rotation={[0.3, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[1.65, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={WHITE} side={THREE.DoubleSide} roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.08, 0.14, 0.7, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 1.25, 0]}>
            <sphereGeometry args={[0.14, 8, 6]} />
            <meshBasicMaterial color={signal > 30 ? MINT : ORANGE} />
          </mesh>
        </group>

        {/* Baliza estroboscópica superior de control de vuelo */}
        <mesh ref={strobeRef} position={[0, 4.6, 0]}>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* ── 7. SEÑALIZACIÓN FRONTAL Y 10 CANALES DE TELEMETRÍA LED ── */}
      <group position={[0, 1.4, 4.65]}>
        <mesh>
          <boxGeometry args={[4.2, 0.55, 0.1]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[-1.8 + i * 0.4, 0, 0.06]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshBasicMaterial color={powered ? MINT : '#64748b'} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
