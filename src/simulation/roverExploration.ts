import type { RoverArm, State } from './types';
import { lunarGroundHeight } from '../scene/terrain';

/** Shared by movement, the sample scene and the controls. Distances are metres. */
export const ROVER_BOUNDS = { minX: -60, maxX: 60, minZ: -60, maxZ: 60 } as const;
export const ROVER_EXPLORATION_RADIUS = 60;
export const ARM_LIMITS = {
  yaw: { min: -160, max: 160, initial: 0 },
  shoulder: { min: -25, max: 75, initial: 25 },
  elbow: { min: -120, max: 70, initial: -55 },
} as const;
export const DEFAULT_ROVER_ARM: RoverArm = {
  yaw: ARM_LIMITS.yaw.initial,
  shoulder: ARM_LIMITS.shoulder.initial,
  elbow: ARM_LIMITS.elbow.initial,
  gripperOpen: true,
};
export const ARM_SEGMENTS = { mountForward: 0.95, mountHeight: 1.05, upper: 1.1, lower: 0.95, claw: 0.25 } as const;
export const ROCK_PICKUP_RADIUS = 0.65;

export interface LunarRock {
  id: string;
  name: string;
  kind: string;
  position: [number, number];
  size: number;
  color: string;
}

// These are learning specimens, not claims about real geological survey sites.
export const LUNAR_ROCKS: LunarRock[] = [
  { id: 'selene-01', name: 'Roca de práctica', kind: 'Basalto', position: [0, 9], size: 0.34, color: '#8d92a4' },
  { id: 'selene-02', name: 'Fragmento del sendero', kind: 'Brecha lunar', position: [9, 15], size: 0.32, color: '#afa3a0' },
  { id: 'selene-03', name: 'Roca de la llanura', kind: 'Anortosita', position: [-13, 17], size: 0.4, color: '#d1ced3' },
  { id: 'selene-04', name: 'Fragmento del cráter', kind: 'Basalto', position: [23, 23], size: 0.37, color: '#777b8b' },
  { id: 'selene-05', name: 'Brecha del horizonte', kind: 'Brecha lunar', position: [-25, 30], size: 0.36, color: '#ab9694' },
  { id: 'selene-06', name: 'Roca del borde sur', kind: 'Anortosita', position: [13, 42], size: 0.42, color: '#cec9c4' },
  { id: 'selene-07', name: 'Fragmento del valle', kind: 'Basalto', position: [-39, 7], size: 0.31, color: '#818799' },
  { id: 'selene-08', name: 'Roca de las tierras altas', kind: 'Anortosita', position: [43, -13], size: 0.39, color: '#ddd4cb' },
  { id: 'selene-09', name: 'Brecha de impacto', kind: 'Brecha lunar', position: [-23, -26], size: 0.38, color: '#baa5a1' },
  { id: 'selene-10', name: 'Fragmento del norte', kind: 'Basalto', position: [2, -43], size: 0.35, color: '#7d8291' },
  { id: 'selene-11', name: 'Roca de la cresta lejana', kind: 'Anortosita', position: [51, 38], size: 0.4, color: '#d3cdd2' },
  { id: 'selene-12', name: 'Brecha de la cuenca', kind: 'Brecha lunar', position: [-48, -40], size: 0.33, color: '#a6939c' },
];

type ArmState = Pick<State, 'roverPosition' | 'roverHeading' | 'roverArm'>;
type SampleState = ArmState & Pick<State, 'collectedRocks' | 'heldRockId' | 'roverMode' | 'roverBattery' | 'paused'>;
const radians = (degrees: number) => degrees * Math.PI / 180;

/** World X/Z, with Y relative to the ground under the rover. */
export function armGripperPosition(state: ArmState): [number, number, number] {
  const shoulder = radians(state.roverArm.shoulder);
  const elbow = radians(state.roverArm.elbow);
  const angle = state.roverHeading + radians(state.roverArm.yaw);
  const reach = Math.cos(shoulder) * ARM_SEGMENTS.upper
    + Math.cos(shoulder + elbow) * ARM_SEGMENTS.lower + ARM_SEGMENTS.claw;
  const height = ARM_SEGMENTS.mountHeight + Math.sin(shoulder) * ARM_SEGMENTS.upper
    + Math.sin(shoulder + elbow) * ARM_SEGMENTS.lower;
  return [state.roverPosition[0] + Math.sin(state.roverHeading) * ARM_SEGMENTS.mountForward + Math.sin(angle) * reach,
    height, state.roverPosition[1] + Math.cos(state.roverHeading) * ARM_SEGMENTS.mountForward + Math.cos(angle) * reach];
}

export function getNearestRock(state: Pick<State, 'roverPosition' | 'roverHeading' | 'collectedRocks' | 'heldRockId'>) {
  let rock: LunarRock | null = null;
  let distance = Infinity;
  for (const candidate of LUNAR_ROCKS) {
    if (state.collectedRocks.includes(candidate.id) || state.heldRockId === candidate.id) continue;
    const next = Math.hypot(candidate.position[0] - state.roverPosition[0], candidate.position[1] - state.roverPosition[1]);
    if (next < distance) { distance = next; rock = candidate; }
  }
  const angle = rock ? Math.atan2(rock.position[0] - state.roverPosition[0], rock.position[1] - state.roverPosition[1]) - state.roverHeading : 0;
  const bearing = Math.atan2(Math.sin(angle), Math.cos(angle)) * 180 / Math.PI;
  return { rock, distance, bearing };
}

/** Collection is spatial: proximity to the rover alone never grants a sample. */
export function getRockPickupStatus(state: SampleState): { rock: LunarRock | null; distance: number; canCollect: boolean; message: string } {
  const tip = armGripperPosition(state);
  const tipHeight = tip[1] + lunarGroundHeight(...state.roverPosition);
  let rock: LunarRock | null = null;
  let distance = Infinity;
  for (const candidate of LUNAR_ROCKS) {
    if (state.collectedRocks.includes(candidate.id) || state.heldRockId === candidate.id) continue;
    const rockHeight = lunarGroundHeight(...candidate.position) + candidate.size * 0.55;
    const next = Math.hypot(candidate.position[0] - tip[0], rockHeight - tipHeight, candidate.position[1] - tip[2]);
    if (next < distance) { distance = next; rock = candidate; }
  }
  let message: string;
  if (state.paused) message = 'Continúa la simulación para mover el brazo.';
  else if (state.roverMode !== 'parked') message = 'Detén el rover para utilizar el brazo.';
  else if (state.roverBattery <= 12) message = 'Recarga el rover antes de utilizar el brazo.';
  else if (state.heldRockId) message = 'La pinza sostiene una roca. Guarda la muestra en el depósito.';
  else if (!rock) message = '¡Todas las rocas de esta zona están guardadas!';
  else if (!state.roverArm.gripperOpen) message = 'Abre la pinza antes de recoger otra roca.';
  else if (distance > ROCK_PICKUP_RADIUS) message = 'Acércate a una roca y baja el brazo hasta alinear la pinza.';
  else message = 'Pinza alineada. Pulsa «Recoger roca» para cerrar la pinza y capturarla.';
  return { rock, distance, canCollect: !state.paused && state.roverMode === 'parked' && state.roverBattery > 12
    && !state.heldRockId && state.roverArm.gripperOpen && !!rock && distance <= ROCK_PICKUP_RADIUS, message };
}
