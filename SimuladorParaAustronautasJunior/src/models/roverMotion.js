import * as THREE from 'three';
import { resolveRoverCommand } from '../../integration/motion.js';

export function moveRover(roverModel, keys, dt, moonSurface) {
  const rover = roverModel.group;
  const command = resolveRoverCommand({
    forward: (keys.w ? 1 : 0) - (keys.s ? 1 : 0),
    turn: (keys.a ? 1 : 0) - (keys.d ? 1 : 0),
  }, dt);

  const surfaceNormal = rover.position.clone().sub(moonSurface.center).normalize();
  const headingDirection = new THREE.Vector3(1, 0, 0).applyQuaternion(rover.quaternion);
  headingDirection.projectOnPlane(surfaceNormal).normalize();

  if (command.turnRadians) headingDirection.applyAxisAngle(surfaceNormal, command.turnRadians);

  headingDirection.projectOnPlane(surfaceNormal).normalize();

  const moving = command.forward;

  if (moving !== 0) {
    const distance = command.distance;
    const angularDistance = distance / moonSurface.radius;

    const side = headingDirection.clone().cross(surfaceNormal).normalize();

    surfaceNormal.applyAxisAngle(side, -angularDistance).normalize();

    headingDirection.applyAxisAngle(side, -angularDistance);
    headingDirection.projectOnPlane(surfaceNormal).normalize();

    roverModel.wheels.forEach((wheel) => {
      wheel.rotation.y += command.wheelRotation;
    });
  }

  const normal = surfaceNormal.clone().normalize();
  const forward = headingDirection.clone().projectOnPlane(normal).normalize();
  const side = forward.clone().cross(normal).normalize();

  rover.position.copy(moonSurface.center).add(
    normal.clone().multiplyScalar(moonSurface.radius + moonSurface.roverHeight)
  );

  const orientation = new THREE.Matrix4();
  orientation.makeBasis(forward, normal, side);
  rover.quaternion.setFromRotationMatrix(orientation);
}
