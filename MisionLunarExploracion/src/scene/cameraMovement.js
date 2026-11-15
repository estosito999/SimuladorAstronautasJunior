import * as THREE from 'three';

const offset = new THREE.Vector3();
const axis = new THREE.Vector3();
const direction = new THREE.Vector3();
const MAX_ELEVATION = THREE.MathUtils.degToRad(84);

function rotateView(camera, controls, horizontal, vertical, up, mouse) {
  offset.copy(camera.position).sub(controls.target);
  const radius = offset.length();
  if (mouse && radius < 0.0001) return;
  if (horizontal) offset.applyAxisAngle(up, horizontal);

  if (vertical) {
    if (mouse) {
      direction.copy(offset).multiplyScalar(-1).normalize();
      axis.crossVectors(direction, up);
      if (axis.lengthSq() < 0.000001) axis.set(1, 0, 0).applyQuaternion(camera.quaternion);
      offset.applyAxisAngle(axis.normalize(), vertical);
    } else {
      axis.crossVectors(offset, up);
      if (axis.lengthSq() > 0.0001) {
        const elevation = Math.asin(THREE.MathUtils.clamp(direction.copy(offset).normalize().dot(up), -1, 1));
        const next = THREE.MathUtils.clamp(elevation + vertical, -MAX_ELEVATION, MAX_ELEVATION);
        offset.applyAxisAngle(axis.normalize(), next - elevation);
      }
    }
  }

  if (mouse) offset.setLength(radius);
  camera.position.copy(controls.target).add(offset);
}

export function rotateOrbitCameraFromMouse(camera, controls, up) {
  const delta = controls.roverOrbitPointerDelta;
  if (!delta || (!delta.x && !delta.y)) return;
  const x = delta.x, y = delta.y;
  delta.x = delta.y = 0;
  rotateView(camera, controls, -x * 0.0042, -y * 0.0042, up, true);
}

export function rotateOrbitCamera(camera, controls, x, y, dt, up) {
  if (x || y) rotateView(camera, controls, -x * 1.35 * dt, y * 1.35 * dt, up, false);
}

export function updateCameraRoll(camera, input, dt, angle) {
  if (input) {
    angle += input * 1.25 * dt;
    angle = THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;
  }
  if (Math.abs(angle) >= 0.0001) camera.rotateZ(angle);
  return angle;
}

export function zoomCamera(camera, controls, factor) {
  offset.copy(camera.position).sub(controls.target);
  offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
  camera.position.copy(controls.target).add(offset);
}

export function updateCameraZoom(camera, controls, input, dt) {
  if (!input || camera.position.distanceTo(controls.target) < 0.0001) return;
  zoomCamera(camera, controls, Math.exp(-input * 1.15 * dt));
}
