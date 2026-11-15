export interface RoverAxes { forward: number; turn: number }
export interface MotionOptions {
  speed?: number;
  turnSpeed?: number;
  wheelRotationPerMetre?: number;
  bounds?: { minX?: number; maxX?: number; minZ?: number; maxZ?: number };
}
export function resolveRoverCommand(input: RoverAxes, dt: number, options?: MotionOptions): {
  forward: number; turn: number; turnRadians: number; distance: number; wheelRotation: number;
};
export function advanceRover(input: RoverAxes & { position: [number, number]; heading: number }, dt: number, options?: MotionOptions): {
  position: [number, number]; heading: number; distance: number; blocked: boolean; wheelRotation: number;
};
export function clampCameraDistance(distance: number, minDistance: number, maxDistance: number): number;
