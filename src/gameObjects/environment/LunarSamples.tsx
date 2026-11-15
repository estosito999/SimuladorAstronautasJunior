import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { State } from '../../simulation/types';
import { armGripperPosition, getNearestRock, getRockPickupStatus, LUNAR_ROCKS } from '../../simulation/roverExploration';
import { groundHeight } from './terrainHeight';

export interface LunarSamplesProps {
  state: State;
  active: boolean;
  onInspect: () => void;
}

/**
 * Rocas y muestras geológicas lunares interactivas.
 * Permite seleccionar, medir proximidad y conectar con la pinza del brazo robótico.
 */
export function LunarSamples({ state, active, onInspect }: LunarSamplesProps) {
  const nearest = getNearestRock(state);
  const pickup = getRockPickupStatus(state);
  const tip = armGripperPosition(state);
  const worldTip: [number, number, number] = [
    tip[0],
    tip[1] + groundHeight(...state.roverPosition),
    tip[2],
  ];
  const showGuide = active && nearest.distance < 6 && !state.heldRockId;
  const linePoints = useMemo(
    () =>
      new Float32Array([
        ...worldTip,
        ...(pickup.rock
          ? [
              pickup.rock.position[0],
              groundHeight(...pickup.rock.position) + pickup.rock.size * 0.55,
              pickup.rock.position[1],
            ]
          : worldTip),
      ]),
    [worldTip[0], worldTip[1], worldTip[2], pickup.rock]
  );
  const inspect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onInspect();
  };

  return (
    <group name="GameObject_LunarSamples">
      {LUNAR_ROCKS.filter(
        (rock) => !state.collectedRocks.includes(rock.id) && rock.id !== state.heldRockId
      ).map((rock, index) => {
        const nearby = nearest.rock?.id === rock.id;
        return (
          <group
            key={rock.id}
            position={[rock.position[0], groundHeight(...rock.position), rock.position[1]]}
          >
            <mesh
              position={[0, rock.size * 0.55, 0]}
              rotation={[0.2, index * 1.7, 0.15]}
              scale={[rock.size, rock.size * 0.65, rock.size * 0.85]}
              onClick={inspect}
              castShadow
              receiveShadow
            >
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color={rock.color}
                flatShading
                roughness={1}
                emissive={nearby ? '#3f5668' : '#000000'}
                emissiveIntensity={0.25}
              />
            </mesh>
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={inspect}>
              <ringGeometry args={[rock.size + 0.28, rock.size + 0.34, 32]} />
              <meshBasicMaterial
                color={nearby ? '#7dd3fc' : '#fbbf24'}
                transparent
                opacity={nearby ? 0.95 : 0.65}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[0, 1.1, 0]} rotation={[0, Math.PI / 4, Math.PI / 4]} onClick={inspect}>
              <octahedronGeometry args={[nearby ? 0.14 : 0.09]} />
              <meshBasicMaterial color={nearby ? '#7dd3fc' : '#fbbf24'} />
            </mesh>
          </group>
        );
      })}
      {showGuide && (
        <>
          <mesh position={worldTip}>
            <sphereGeometry args={[0.09, 12, 8]} />
            <meshBasicMaterial
              color={pickup.canCollect ? '#34d399' : '#fbbf24'}
              transparent
              opacity={0.7}
            />
          </mesh>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[linePoints, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              color={pickup.canCollect ? '#34d399' : '#fbbf24'}
              transparent
              opacity={0.7}
              depthTest={false}
            />
          </lineSegments>
        </>
      )}
    </group>
  );
}
