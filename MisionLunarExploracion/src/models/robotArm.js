import * as THREE from 'three';
import { createMaterial, enableShadows } from './roverMaterials.js';

const joints = {
  shoulderYaw: { part: 'shoulder', axis: 'y', start: -Math.PI / 2, min: -Math.PI / 2 - 1.1, max: -Math.PI / 2 + 1.1, speed: 1.25, up: 'q', down: 'e' },
  shoulderPitch: { part: 'shoulder', axis: 'x', start: -0.18, min: -0.18, max: 0.25, speed: 1.05, up: 'r', down: 'f' },
  elbowPitch: { part: 'elbow', axis: 'x', start: 0.42, min: 0, max: 0.8, speed: 1.05, up: 't', down: 'g' },
  wristYaw: { part: 'wrist', axis: 'y', start: 0, min: -0.75, max: 0.75, speed: 1.45, up: 'j', down: 'k' },
  wristPitch: { part: 'wrist', axis: 'x', start: 0, min: -0.25, max: 0.35, speed: 1.45, up: 'u', down: 'i' }
};

export function createRobotArm(rover) {
  const jointMaterial = createMaterial({ color: 0x64748b });
  const armMaterial = createMaterial({ color: 0xe5e7eb });
  const clawMaterial = createMaterial({ color: 0xfacc15 });

  const shoulder = new THREE.Group();
  shoulder.position.set(1.02, 0.24, 0);
  rover.add(shoulder);

  function addPart(parent, geometry, material, z = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = z;
    parent.add(mesh);
  }

  addPart(shoulder, new THREE.SphereGeometry(0.16, 24, 16), jointMaterial);
  addPart(shoulder, new THREE.BoxGeometry(0.16, 0.16, 0.82), armMaterial, -0.41);

  const elbow = new THREE.Group();
  elbow.position.z = -0.82;
  shoulder.add(elbow);
  addPart(elbow, new THREE.SphereGeometry(0.14, 24, 16), jointMaterial);
  addPart(elbow, new THREE.BoxGeometry(0.13, 0.13, 0.7), armMaterial, -0.35);

  const wrist = new THREE.Group();
  wrist.position.z = -0.72;
  elbow.add(wrist);
  addPart(wrist, new THREE.SphereGeometry(0.11, 20, 14), jointMaterial);
  addPart(wrist, new THREE.BoxGeometry(0.28, 0.12, 0.14), clawMaterial, -0.12);

  const leftFingerPivot = new THREE.Group();
  const rightFingerPivot = new THREE.Group();
  leftFingerPivot.position.set(0.105, 0, -0.21);
  rightFingerPivot.position.set(-0.105, 0, -0.21);
  wrist.add(leftFingerPivot, rightFingerPivot);

  const fingerGeometry = new THREE.BoxGeometry(0.045, 0.085, 0.31);
  const tipGeometry = new THREE.BoxGeometry(0.055, 0.09, 0.09);

  for (const [pivot, side] of [[leftFingerPivot, 1], [rightFingerPivot, -1]]) {
    const finger = new THREE.Mesh(fingerGeometry, clawMaterial);
    finger.position.set(side * 0.015, 0, -0.155);
    pivot.add(finger);

    const tip = new THREE.Mesh(tipGeometry, clawMaterial);
    tip.position.set(side * -0.01, 0, -0.325);
    tip.rotation.y = side * -0.28;
    pivot.add(tip);
  }

  shoulder.traverse((part) => {
    if (part.isMesh) enableShadows(part);
  });

  const targets = {};
  for (const name in joints) targets[name] = joints[name].start;

  return {
    shoulder,
    elbow,
    wrist,
    leftFingerPivot,
    rightFingerPivot,
    targets
  };
}

export function updateManualArmTargets(targets, keys, dt) {
  for (const name in joints) {
    const joint = joints[name];
    if (keys[joint.up]) targets[name] += joint.speed * dt;
    if (keys[joint.down]) targets[name] -= joint.speed * dt;
    if (keys.x) targets[name] = joint.start;
    targets[name] = THREE.MathUtils.clamp(targets[name], joint.min, joint.max);
  }
}

export function applyRobotArmPose(arm, targets, dt, gripperOpen) {
  const smoothing = 1 - Math.exp(-dt * 9);
  for (const target in joints) {
    const settings = joints[target];
    const joint = arm[settings.part];
    const axis = settings.axis;
    joint.rotation[axis] += (targets[target] - joint.rotation[axis]) * smoothing;
  }

  const gripperAngle = gripperOpen ? 0.72 : 0.02;
  const left = arm.leftFingerPivot.rotation;
  const right = arm.rightFingerPivot.rotation;
  left.y += (-gripperAngle - left.y) * smoothing;
  right.y += (gripperAngle - right.y) * smoothing;
}
