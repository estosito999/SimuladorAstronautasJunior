import * as THREE from 'three';

export function moveRover(roverModel, keys, dt, moonSurface) {
  const rover = roverModel.group;
  const moveSpeed = 6;
  const turnSpeed = 1.8;

  const surfaceNormal = rover.position.clone().sub(moonSurface.center).normalize();
  const headingDirection = new THREE.Vector3(1, 0, 0).applyQuaternion(rover.quaternion);
  headingDirection.projectOnPlane(surfaceNormal).normalize();

  if (keys.a) headingDirection.applyAxisAngle(surfaceNormal, turnSpeed * dt);
  if (keys.d) headingDirection.applyAxisAngle(surfaceNormal, -turnSpeed * dt);

  headingDirection.projectOnPlane(surfaceNormal).normalize();

  const moving = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);

  if (moving !== 0) {
    const distance = moving * moveSpeed * dt;
    const angularDistance = distance / moonSurface.radius;

    const side = headingDirection.clone().cross(surfaceNormal).normalize();

    surfaceNormal.applyAxisAngle(side, -angularDistance).normalize();

    headingDirection.applyAxisAngle(side, -angularDistance);
    headingDirection.projectOnPlane(surfaceNormal).normalize();

    roverModel.wheels.forEach((wheel) => {
      wheel.rotation.y -= moving * moveSpeed * dt * 3.5;
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
