/**
 * Cinemática y Control del Rover Lunar
 * Derivado de los modelos de movimiento de final-project-Lunar-E.
 * Sin dependencias externas: implementación 100% autocontenida en TypeScript.
 */

const finite = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export interface RoverCommandInput {
  forward: number;
  turn: number;
}

export interface RoverOptions {
  speed?: number;
  turnSpeed?: number;
  wheelRotationPerMetre?: number;
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface AdvanceRoverInput {
  position: [number, number];
  heading: number;
  forward: number;
  turn: number;
}

export function resolveRoverCommand(
  input: RoverCommandInput,
  dt: number,
  options: RoverOptions = {}
) {
  const seconds = Math.max(0, finite(dt, 0));
  const forward = clamp(finite(input.forward, 0), -1, 1);
  const turn = clamp(finite(input.turn, 0), -1, 1);
  const speed = Math.max(0, finite(options.speed ?? 6, 6));
  const turnSpeed = Math.max(0, finite(options.turnSpeed ?? 1.8, 1.8));
  const distance = forward * speed * seconds;
  return {
    forward,
    turn,
    turnRadians: turn * turnSpeed * seconds,
    distance,
    wheelRotation: -distance * finite(options.wheelRotationPerMetre ?? 3.5, 3.5),
  };
}

/**
 * Avanza la posición [x, z] y orientación del rover sobre la superficie lunar.
 * Restringe los límites de exploración a la cuadrícula de la base.
 */
export function advanceRover(
  input: AdvanceRoverInput,
  dt: number,
  options: RoverOptions = {}
) {
  const command = resolveRoverCommand(
    { forward: input.forward, turn: input.turn },
    dt,
    { speed: 1.6, turnSpeed: 1.15, ...options }
  );

  const startX = finite(input.position[0], 0);
  const startZ = finite(input.position[1], 5);
  const heading = finite(input.heading, 0) + command.turnRadians;

  const rawX = startX + Math.sin(heading) * command.distance;
  const rawZ = startZ + Math.cos(heading) * command.distance;

  const bounds = { minX: -12, maxX: 12, minZ: 3, maxZ: 13, ...options.bounds };
  const position: [number, number] = [
    clamp(rawX, bounds.minX, bounds.maxX),
    clamp(rawZ, bounds.minZ, bounds.maxZ),
  ];

  const distance = Math.hypot(position[0] - startX, position[1] - startZ);

  return {
    position,
    heading,
    distance,
    blocked: rawX !== position[0] || rawZ !== position[1],
    wheelRotation: command.wheelRotation,
  };
}
