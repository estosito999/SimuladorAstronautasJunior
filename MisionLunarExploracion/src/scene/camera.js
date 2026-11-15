import { rotateOrbitCameraFromMouse, rotateOrbitCamera, updateCameraRoll, updateCameraZoom, zoomCamera } from './cameraMovement.js';
import * as THREE from 'three';

const position = new THREE.Vector3();
const up = new THREE.Vector3();
const forward = new THREE.Vector3();
const target = new THREE.Vector3();
const offset = new THREE.Vector3();
const moonCenter = new THREE.Vector3();
const rotation = new THREE.Quaternion();
const previousRotation = new THREE.Quaternion();
const rotationChange = new THREE.Quaternion();

let previousMode = null;
let centerRequest = 0;
let roll = 0;
let followDistance = 8;

function placeBehind(camera, controls, distance, height, lookTarget) {
  camera.position.copy(position).addScaledVector(forward, -distance).addScaledVector(up, height);
  camera.up.copy(up);
  controls.target.copy(lookTarget);
  camera.lookAt(lookTarget);
}

export function updateCamera(camera, controls, rover, moon, state, dt) {
  const mode = state.cameraMode;
  rover.getWorldPosition(position);
  rover.getWorldQuaternion(rotation);
  up.set(0, 1, 0).applyQuaternion(rotation).normalize();
  forward.set(1, 0, 0).applyQuaternion(rotation).normalize();
  target.copy(position).addScaledVector(up, 1.05);
  rotationChange.copy(previousRotation).invert().premultiply(rotation);
  previousRotation.copy(rotation);

  if (previousMode === null) {
    offset.copy(forward).multiplyScalar(-18).addScaledVector(up, 7);
    camera.position.copy(target).add(offset);
    camera.up.copy(up);
    controls.target.copy(target);
    camera.lookAt(target);
    rotationChange.identity();
    previousMode = mode;
  }

  if (state.cameraCenterRequest !== centerRequest) {
    followDistance = 8;
    placeBehind(camera, controls, 10, 3.8, target);
    roll = 0;
    centerRequest = state.cameraCenterRequest;
    rotationChange.identity();
  }

  controls.followingRover = mode === 1;
  controls.enabled = mode === 2;
  if (mode !== 1) {
    controls.enablePan = controls.enableRotate = mode === 2;
    camera.up.copy(up);
    if (mode === 2) camera.up.set(0, 1, 0);
  }

  if (mode !== previousMode) {
    roll = 0;
    if (mode === 0) {
      controls.maxDistance = 3500;
      if (previousMode === 2) placeBehind(camera, controls, 10, 3.8, target);
      rotationChange.identity();
      camera.lookAt(controls.target);
    } else if (mode === 2) {
      controls.screenSpacePanning = true;
      controls.maxDistance = 20000;
      controls.update();
    }
    previousMode = mode;
  }

  if (mode === 1) {
    followDistance = THREE.MathUtils.clamp(
      followDistance * Math.exp((controls.roverZoom || 0) - state.cameraZoom * dt), 3, 60
    );
    target.copy(position).addScaledVector(up, 0.85);
    placeBehind(camera, controls, followDistance, 3.2, target);
  } else if (mode === 2) {
    const speed = Math.max(10, camera.position.distanceTo(controls.target) * 0.5) * dt;
    offset.set(-state.cameraOrbitX * speed, state.cameraOrbitY * speed, 0);
    camera.position.add(offset);
    controls.target.add(offset);
    updateCameraZoom(camera, controls, state.cameraZoom, dt);
    controls.roverZoom = 0;
    controls.roverOrbitPointerDelta.x = controls.roverOrbitPointerDelta.y = 0;
    controls.update();
  } else {
    offset.copy(camera.position).sub(controls.target).applyQuaternion(rotationChange);
    controls.target.copy(target);
    camera.position.copy(target).add(offset);
    rotateOrbitCameraFromMouse(camera, controls, up);
    rotateOrbitCamera(camera, controls, state.cameraOrbitX, state.cameraOrbitY, dt, up);
    updateCameraZoom(camera, controls, state.cameraZoom, dt);
    zoomCamera(camera, controls, Math.exp(controls.roverZoom || 0));
  }

  controls.roverZoom = 0;
  controls.roverOrbitPointerDelta.x = controls.roverOrbitPointerDelta.y = 0;
  moon.getWorldPosition(moonCenter);
  offset.copy(camera.position).sub(moonCenter);
  const radius = moon.geometry.parameters.radius + Math.max(0.5, camera.near * 2);
  if (offset.length() < radius) {
    if (offset.lengthSq() < 0.000001) offset.copy(up);
    camera.position.copy(moonCenter).add(offset.setLength(radius));
  }
  camera.lookAt(controls.target);
  if (mode !== 1) roll = updateCameraRoll(camera, state.cameraRoll, dt, roll);
}
