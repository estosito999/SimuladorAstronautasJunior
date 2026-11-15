const WHITE = '#e9e6df';
const METAL = '#8e9aab';
const INK = '#28313f';
const MINT = '#8ff0c8';
const ORANGE = '#ff9c52';

interface HabitatProps {
  powered: boolean;
}

export function Habitat({ powered }: HabitatProps) {
  return (
    <group position={[0, 0, -3]}>
      {/* Plataforma base de la cápsula */}
      <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
        <boxGeometry args={[7, 0.32, 4.5]} />
        <meshStandardMaterial color="#4e5665" roughness={0.9} />
      </mesh>
      {[-2.7, 2.7].map((x) =>
        [-1.4, 1.4].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.55, z]} castShadow>
            <boxGeometry args={[0.42, 0.7, 0.5]} />
            <meshStandardMaterial color={METAL} metalness={0.3} roughness={0.7} />
          </mesh>
        ))
      )}

      {/* Cápsula residencial cilíndrica horizontal */}
      <mesh position={[0, 2.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <capsuleGeometry args={[1.58, 3.55, 8, 20]} />
        <meshStandardMaterial color={WHITE} roughness={0.65} metalness={0.1} />
      </mesh>
      {[-1.75, 1.75].map((x) => (
        <mesh key={x} position={[x, 2.05, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[1.6, 0.07, 5, 24]} />
          <meshStandardMaterial color={ORANGE} roughness={0.55} />
        </mesh>
      ))}

      {/* Ventanas / Ojos de buey presurizados */}
      {[-1.15, 1.15].map((x) => (
        <group key={x} position={[x, 2.3, 1.51]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.09, 20]} />
            <meshStandardMaterial color={METAL} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.12, 24]} />
            <meshStandardMaterial
              color="#80b8d5"
              metalness={0.4}
              roughness={0.2}
              emissive="#7bcacb"
              emissiveIntensity={powered ? 0.4 : 0.02}
            />
          </mesh>
          <mesh position={[0, 0, 0.065]}>
            <torusGeometry args={[0.395, 0.045, 6, 24]} />
            <meshStandardMaterial color="#f7f4ea" />
          </mesh>
          <mesh position={[-0.1, 0.1, 0.14]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.09, 0.28, 0.01]} />
            <meshBasicMaterial color="#d9f5fa" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}

      {/* Esclusa de aire principal (Airlock) */}
      <group position={[0, 1.3, 1.6]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 1.85, 0.25]} />
          <meshStandardMaterial color={ORANGE} />
        </mesh>
        <mesh position={[0, 0, 0.15]}>
          <boxGeometry args={[0.86, 1.64, 0.12]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        <mesh position={[0, 0.35, 0.22]}>
          <boxGeometry args={[0.57, 0.42, 0.04]} />
          <meshStandardMaterial color="#91b9c4" metalness={0.5} roughness={0.2} />
        </mesh>
        <mesh position={[0.3, -0.1, 0.24]}>
          <boxGeometry args={[0.06, 0.24, 0.04]} />
          <meshStandardMaterial color={WHITE} />
        </mesh>
        <mesh position={[0, 1.04, 0.05]}>
          <boxGeometry args={[1.1, 0.08, 0.12]} />
          <meshBasicMaterial color={powered ? MINT : '#515a6a'} />
        </mesh>
      </group>

      {/* Escalones de acceso */}
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[0, 0.15 + index * 0.12, 2.6 - index * 0.27]} receiveShadow castShadow>
          <boxGeometry args={[1.6, 0.15 + index * 0.24, 0.36]} />
          <meshStandardMaterial color="#9da6b2" roughness={0.75} />
        </mesh>
      ))}

      {/* Domo de observación superior */}
      <mesh position={[0.5, 3.39, -0.2]} castShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.24, 20]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0.5, 3.49, -0.2]}>
        <sphereGeometry args={[0.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#8bc6d4" metalness={0.35} roughness={0.2} transparent opacity={0.8} />
      </mesh>

      {/* Tanques de soporte vital de oxígeno y agua */}
      <group position={[3.5, 0, -1.2]}>
        {[0, 0.65].map((z) => (
          <group key={z} position={[0, 0, z]}>
            <mesh position={[0, 0.9, 0]} castShadow>
              <capsuleGeometry args={[0.28, 1.1, 5, 12]} />
              <meshStandardMaterial color={WHITE} roughness={0.6} metalness={0.2} />
            </mesh>
            <mesh position={[0, 1, 0]}>
              <cylinderGeometry args={[0.285, 0.285, 0.14, 12]} />
              <meshStandardMaterial color={MINT} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Generador auxiliar de energía y baterías de soporte */}
      <mesh position={[-3, 0.8, 0.4]} castShadow>
        <boxGeometry args={[0.72, 1.2, 1.1]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[-3, 0.48 + index * 0.18, 0.96]}>
          <boxGeometry args={[0.42, 0.06, 0.025]} />
          <meshBasicMaterial color={powered ? MINT : '#596174'} />
        </mesh>
      ))}
    </group>
  );
}
