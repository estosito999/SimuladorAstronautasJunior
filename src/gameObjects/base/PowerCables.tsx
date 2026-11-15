import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { State } from '../../simulation/types';
import { metrics } from '../../simulation/engine';
import { groundHeight } from '../../scene/Environment';

function Cable({
  points,
  active = true,
  data = false,
}: {
  points: Array<[number, number, number]>;
  active?: boolean;
  data?: boolean;
}) {
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        32,
        0.055,
        6,
        false
      ),
    [points]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={active ? (data ? '#b7a0e5' : '#d79555') : '#6d7682'}
        roughness={0.9}
        transparent
        opacity={active ? 0.95 : 0.35}
        emissive={active ? (data ? '#8b6fbb' : '#805021') : '#000000'}
        emissiveIntensity={data ? 0.5 : 0.1}
      />
    </mesh>
  );
}

const cableRoutes: Array<Array<[number, number, number]>> = [
  // 0: Paneles solares banco A hacia base
  [[-7, 0.04, -5], [-5.7, 0.04, -5], [-4.2, 0.04, -5.5], [-2, 0.04, -5.5]],
  // 1: Paneles solares banco B hacia base
  [[-7, 0.04, 1.2], [-5.5, 0.04, 1.5], [-4.3, 0.04, 0.5], [-3.2, 0.04, -1]],
  // 2: Base hacia antena de comunicaciones
  [[3, 0.04, -4], [4.3, 0.04, -4.8], [6, 0.04, -4.8], [7, 0.04, -2]],
  // 3: Base hacia plataforma de carga del rover
  [[2.5, 0.04, -1], [3.7, 0.04, 0.7], [3.8, 0.04, 3], [2, 0.04, 5]],
  // 4: Base hacia Estación de Control DSN (Ala Oeste)
  [[-2, 0.04, -5.2], [-2, 0.04, -7.2], [0, 0.04, -8.6]],
  // 5: Base hacia Estación de Control DSN (Ala Este)
  [[2, 0.04, -5.2], [2, 0.04, -7.2], [0, 0.04, -8.6]],
];

interface PowerCablesProps {
  state: State;
}

export function PowerCables({ state }: PowerCablesProps) {
  const m = metrics(state);

  return (
    <>
      {cableRoutes.map((points, index) => {
        const active =
          index < 2
            ? state.connections.solarBus
            : index === 2
            ? state.connections.antennaBus
            : index === 3
            ? state.connections.roverDock
            : state.connections.controlBus ?? true;
        return <Cable key={index} points={points} active={active} />;
      })}

      {/* Enlace inalámbrico de datos de radiofrecuencia rover ↔ antena */}
      {state.connections.roverRadio && m.signal >= 20 && (
        <Cable
          data
          points={[
            [7, 4, -2],
            [
              state.roverPosition[0] / 2 + 3.5,
              5 + groundHeight(...state.roverPosition),
              (state.roverPosition[1] - 2) / 2,
            ],
            [
              state.roverPosition[0],
              groundHeight(...state.roverPosition) + 1.3,
              state.roverPosition[1],
            ],
          ]}
        />
      )}
    </>
  );
}
