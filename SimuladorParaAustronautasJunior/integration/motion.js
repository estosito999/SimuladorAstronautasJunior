/**
 * Shared Lunar-E movement scalars, extracted from src/models/roverMotion.js.
 * The original spherical demo and Selene's local surface use the same input,
 * turning, distance and wheel rotation calculation. No renderer dependency.
 */
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function resolveRoverCommand(input, dt, options = {}) {
  const seconds = Math.max(0, finite(dt, 0));
  const forward = clamp(finite(input.forward, 0), -1, 1);
  const turn = clamp(finite(input.turn, 0), -1, 1);
  const speed = Math.max(0, finite(options.speed, 6));
  const turnSpeed = Math.max(0, finite(options.turnSpeed, 1.8));
  const distance = forward * speed * seconds;
  return {
    forward,
    turn,
    turnRadians: turn * turnSpeed * seconds,
    distance,
    wheelRotation: -distance * finite(options.wheelRotationPerMetre, 3.5),
  };
}

/** Local X/Z adaptation of Lunar-E motion; heading 0 means forward along +Z. */
export function advanceRover(input, dt, options = {}) {
  const command = resolveRoverCommand(input, dt, {
    speed: 1.6, turnSpeed: 1.15, ...options,
  });
  const startX = finite(input.position[0], 0);
  const startZ = finite(input.position[1], 5);
  const heading = finite(input.heading, 0) + command.turnRadians;
  const rawX = startX + Math.sin(heading) * command.distance;
  const rawZ = startZ + Math.cos(heading) * command.distance;
  const bounds = { minX: -12, maxX: 12, minZ: 3, maxZ: 13, ...options.bounds };
  const position = [clamp(rawX, bounds.minX, bounds.maxX), clamp(rawZ, bounds.minZ, bounds.maxZ)];
  const distance = Math.hypot(position[0] - startX, position[1] - startZ);
  return { position, heading, distance, blocked: rawX !== position[0] || rawZ !== position[1], wheelRotation: command.wheelRotation };
}

/** Used by the original camera and by the integrated camera's distance buttons. */
export function clampCameraDistance(distance, minDistance, maxDistance) {
  const minimum = Math.max(0, finite(minDistance, 0));
  const maximum = Math.max(minimum, finite(maxDistance, minimum));
  return clamp(finite(distance, minimum), minimum, maximum);
}
