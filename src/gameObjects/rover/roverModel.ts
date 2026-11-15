/**
 * Constructor del Modelo 3D del Rover Lunar
 * Implementación modularizada para Three.js y React Three Fiber.
 */
import * as THREE from 'three';
import type { RoverArm } from '../../simulation/types';
import { ARM_SEGMENTS } from '../../simulation/roverExploration';

function enableShadows(mesh: THREE.Object3D) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createMaterial(options: THREE.MeshPhongMaterialParameters = {}) {
  const supplied = Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined)
  );
  return new THREE.MeshPhongMaterial({
    shininess: 45,
    specular: 0x444444,
    ...supplied,
  });
}

function createWheel(
  rover: THREE.Group,
  wheels: THREE.Mesh[],
  x: number,
  z: number
) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.25, 24),
    createMaterial({ color: 0x1f2937 })
  );
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(x, -0.35, z);
  enableShadows(wheel);
  rover.add(wheel);
  wheels.push(wheel);
}

function createPanels(rover: THREE.Group) {
  const leftPanelPivot = new THREE.Group();
  const rightPanelPivot = new THREE.Group();
  const panelMaterial = createMaterial({ color: 0x1e3a8a });

  rover.add(leftPanelPivot, rightPanelPivot);
  for (const [pivot, side] of [
    [leftPanelPivot, 1],
    [rightPanelPivot, -1],
  ] as [THREE.Group, number][]) {
    pivot.position.set(0, 0.15, side * 0.7);
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.05, 0.65),
      panelMaterial
    );
    panel.position.z = side * 0.325;
    enableShadows(panel);
    pivot.add(panel);
  }

  return { leftPanelPivot, rightPanelPivot };
}

function createAntenna(rover: THREE.Group) {
  const antennaPivot = new THREE.Group();
  antennaPivot.position.set(-0.55, 0.3, -0.25);
  rover.add(antennaPivot);

  const antennaPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.75, 12),
    createMaterial({ color: 0xd1d5db })
  );
  antennaPole.position.y = 0.375;
  enableShadows(antennaPole);
  antennaPivot.add(antennaPole);

  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.18, 24, 1, true),
    createMaterial({
      color: 0xe5e7eb,
      side: THREE.DoubleSide,
    })
  );
  dish.position.y = 0.78;
  dish.rotation.x = Math.PI;
  enableShadows(dish);
  antennaPivot.add(dish);

  return antennaPivot;
}

export interface Rover3DInstance {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  panels: { leftPanelPivot: THREE.Group; rightPanelPivot: THREE.Group };
  antennaPivot: THREE.Group;
  arm: {
    base: THREE.Group;
    shoulder: THREE.Group;
    elbow: THREE.Group;
    wrist: THREE.Group;
    leftFingerPivot: THREE.Group;
    rightFingerPivot: THREE.Group;
  };
  sampleCargo: { heldRock: THREE.Mesh; storedRocks: THREE.Mesh[] };
  headlights: {
    leftHeadlight: THREE.SpotLight;
    rightHeadlight: THREE.SpotLight;
    leftLensMaterial: THREE.MeshPhongMaterial;
    rightLensMaterial: THREE.MeshPhongMaterial;
  };
}

function createHeadlightAssembly(
  rover: THREE.Group,
  x: number,
  y: number,
  z: number
) {
  const housingMaterial = createMaterial({ color: 0x475569 });
  const lensMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0xfff3d0,
    emissiveIntensity: 0,
    shininess: 90,
  });

  const assembly = new THREE.Group();
  assembly.position.set(x, y, z);
  rover.add(assembly);

  const housing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.145, 0.18, 24),
    housingMaterial
  );
  housing.rotation.z = Math.PI / 2;
  enableShadows(housing);
  assembly.add(housing);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.025, 24),
    lensMaterial
  );
  lens.rotation.z = Math.PI / 2;
  lens.position.x = 0.09;
  assembly.add(lens);

  const light = new THREE.SpotLight(0xfff3d0, 0, 24, Math.PI / 7.5, 0.42, 2);
  light.position.set(0.13, 0, 0);
  assembly.add(light);

  return { lensMaterial, light };
}

function createHeadlights(rover: THREE.Group) {
  const left = createHeadlightAssembly(rover, 1.14, 0.16, 0.36);
  const right = createHeadlightAssembly(rover, 1.14, 0.16, -0.36);

  const leftTarget = new THREE.Object3D();
  const rightTarget = new THREE.Object3D();
  leftTarget.position.set(8, -1.2, 0.36);
  rightTarget.position.set(8, -1.2, -0.36);
  rover.add(leftTarget, rightTarget);

  left.light.target = leftTarget;
  right.light.target = rightTarget;

  return {
    leftHeadlight: left.light,
    rightHeadlight: right.light,
    leftLensMaterial: left.lensMaterial,
    rightLensMaterial: right.lensMaterial,
  };
}

function createArm(rover: THREE.Group) {
  const jointMaterial = createMaterial({ color: 0x64748b });
  const armMaterial = createMaterial({ color: 0xe5e7eb });
  const clawMaterial = createMaterial({ color: 0xfacc15 });

  const base = new THREE.Group();
  base.position.set(ARM_SEGMENTS.mountForward, ARM_SEGMENTS.mountHeight - 0.55, 0);
  rover.add(base);
  const shoulder = new THREE.Group();
  base.add(shoulder);

  const shoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), jointMaterial);
  enableShadows(shoulderMesh);
  shoulder.add(shoulderMesh);

  const bicepMesh = new THREE.Mesh(new THREE.BoxGeometry(ARM_SEGMENTS.upper, 0.16, 0.16), armMaterial);
  bicepMesh.position.x = ARM_SEGMENTS.upper / 2;
  enableShadows(bicepMesh);
  shoulder.add(bicepMesh);

  const elbow = new THREE.Group();
  elbow.position.x = ARM_SEGMENTS.upper;
  shoulder.add(elbow);

  const elbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), jointMaterial);
  enableShadows(elbowMesh);
  elbow.add(elbowMesh);

  const forearmMesh = new THREE.Mesh(new THREE.BoxGeometry(ARM_SEGMENTS.lower, 0.13, 0.13), armMaterial);
  forearmMesh.position.x = ARM_SEGMENTS.lower / 2;
  enableShadows(forearmMesh);
  elbow.add(forearmMesh);

  const wrist = new THREE.Group();
  wrist.position.x = ARM_SEGMENTS.lower;
  elbow.add(wrist);

  const wristMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), jointMaterial);
  enableShadows(wristMesh);
  wrist.add(wristMesh);

  const leftFingerPivot = new THREE.Group();
  const rightFingerPivot = new THREE.Group();
  leftFingerPivot.position.set(0.05, 0, 0.12);
  rightFingerPivot.position.set(0.05, 0, -0.12);
  wrist.add(leftFingerPivot, rightFingerPivot);

  const fingerGeometry = new THREE.BoxGeometry(0.34, 0.085, 0.045);
  const leftFinger = new THREE.Mesh(fingerGeometry, clawMaterial);
  leftFinger.position.set(0.17, 0, 0);
  enableShadows(leftFinger);
  leftFingerPivot.add(leftFinger);

  const rightFinger = new THREE.Mesh(fingerGeometry, clawMaterial);
  rightFinger.position.set(0.17, 0, 0);
  enableShadows(rightFinger);
  rightFingerPivot.add(rightFinger);

  return {
    base,
    shoulder,
    elbow,
    wrist,
    leftFingerPivot,
    rightFingerPivot,
  };
}

export function createRover(parent: THREE.Object3D): Rover3DInstance {
  const rover = new THREE.Group();
  rover.position.set(0, 0.55, 0);
  parent.add(rover);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.6, 1.4),
    createMaterial({ color: 0xdfe5ec })
  );
  enableShadows(body);
  rover.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.45, 0.65),
    createMaterial({ color: 0xd1d5db })
  );
  head.position.set(0.2, 0.52, 0);
  enableShadows(head);
  rover.add(head);

  const wheels: THREE.Mesh[] = [];
  for (const x of [0.75, -0.75]) {
    for (const z of [0.82, -0.82]) {
      createWheel(rover, wheels, x, z);
    }
  }

  const panels = createPanels(rover);
  const antennaPivot = createAntenna(rover);
  const arm = createArm(rover);
  const headlights = createHeadlights(rover);

  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.13, 0.95), createMaterial({ color: 0x475569 }));
  tray.position.set(-0.73, 0.38, 0);
  enableShadows(tray);
  rover.add(tray);
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  const heldRock = new THREE.Mesh(rockGeometry, createMaterial({ color: 0x9ca3af }));
  heldRock.position.x = ARM_SEGMENTS.claw;
  heldRock.visible = false;
  enableShadows(heldRock);
  arm.wrist.add(heldRock);
  const storedRocks = Array.from({ length: 12 }, (_, i) => {
    const stone = new THREE.Mesh(rockGeometry, createMaterial({ color: 0x9ca3af }));
    stone.position.set(-0.9 + i % 3 * 0.17, 0.52 + Math.floor(i / 6) * 0.15, -0.28 + Math.floor(i % 6 / 3) * 0.5);
    stone.scale.set(0.11, 0.08, 0.12);
    stone.visible = false;
    enableShadows(stone);
    rover.add(stone);
    return stone;
  });

  return {
    group: rover,
    wheels,
    panels,
    antennaPivot,
    arm,
    headlights,
    sampleCargo: { heldRock, storedRocks },
  };
}

export function updateRover(
  roverModel: Rover3DInstance,
  state: { panelsOpen?: boolean; arm?: RoverArm },
  dt: number
) {
  if (roverModel.antennaPivot) {
    roverModel.antennaPivot.rotation.y += dt * 0.9;
  }
  const targetPanelAngle = state.panelsOpen ? Math.PI / 5 : 0;
  const { leftPanelPivot, rightPanelPivot } = roverModel.panels;
  leftPanelPivot.rotation.x += (targetPanelAngle - leftPanelPivot.rotation.x) * 0.08;
  rightPanelPivot.rotation.x += (-targetPanelAngle - rightPanelPivot.rotation.x) * 0.08;
  if (state.arm) {
    const smoothing = 1 - Math.exp(-Math.max(0, dt) * 12);
    const arm = roverModel.arm;
    arm.base.rotation.y = THREE.MathUtils.lerp(arm.base.rotation.y, THREE.MathUtils.degToRad(state.arm.yaw), smoothing);
    arm.shoulder.rotation.z = THREE.MathUtils.lerp(arm.shoulder.rotation.z, THREE.MathUtils.degToRad(state.arm.shoulder), smoothing);
    arm.elbow.rotation.z = THREE.MathUtils.lerp(arm.elbow.rotation.z, THREE.MathUtils.degToRad(state.arm.elbow), smoothing);
    // Mantiene la pinza nivelada horizontalmente
    arm.wrist.rotation.z = -arm.shoulder.rotation.z - arm.elbow.rotation.z;
    const opening = state.arm.gripperOpen ? 0.65 : 0.02;
    arm.leftFingerPivot.rotation.y = THREE.MathUtils.lerp(arm.leftFingerPivot.rotation.y, -opening, smoothing);
    arm.rightFingerPivot.rotation.y = THREE.MathUtils.lerp(arm.rightFingerPivot.rotation.y, opening, smoothing);
  }
}
