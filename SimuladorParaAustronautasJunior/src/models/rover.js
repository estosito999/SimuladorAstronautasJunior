import { createMaterial, enableShadows } from './roverMaterials.js';
import { createRobotArm, updateManualArmTargets, applyRobotArmPose } from './robotArm.js';
import * as THREE from 'three';

function createWheel(rover, wheels, wheelTexture, wheelBumpMap, x, z) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.25, 32),
    createMaterial({
      map: wheelTexture,
      bumpMap: wheelBumpMap,
      bumpScale: 0.035,
    })
  );

  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(x, -0.35, z);
  enableShadows(wheel);

  rover.add(wheel);
  wheels.push(wheel);
}

function createPanels(rover) {
  const leftPanelPivot = new THREE.Group();
  const rightPanelPivot = new THREE.Group();
  const panelMaterial = createMaterial({ color: 0x1e3a8a });

  rover.add(leftPanelPivot, rightPanelPivot);
  for (const [pivot, side] of [[leftPanelPivot, 1], [rightPanelPivot, -1]]) {
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

function createAntenna(rover) {
  const antennaPivot = new THREE.Group();

  antennaPivot.position.set(-0.55, 0.30, -0.25);
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
      side: THREE.DoubleSide
    })
  );
  dish.position.y = 0.78;
  dish.rotation.x = Math.PI;
  enableShadows(dish);
  antennaPivot.add(dish);

  return antennaPivot;
}

function createHeadlightAssembly(rover, x, y, z) {
  const assembly = new THREE.Group();
  assembly.position.set(x, y, z);
  rover.add(assembly);

  const housingMaterial = createMaterial({ color: 0x111827 });

  const lensMaterial = createMaterial({
    color: 0xfff3d0,
    emissive: 0xffc766,
    emissiveIntensity: 0,
  });

  const housing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.16, 24),
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
  lens.castShadow = false;
  assembly.add(lens);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.112, 0.012, 8, 24),
    housingMaterial
  );
  rim.rotation.y = Math.PI / 2;
  rim.position.x = 0.105;
  enableShadows(rim);
  assembly.add(rim);

  const light = new THREE.SpotLight(0xfff3d0, 0, 24, Math.PI / 7.5, 0.42, 2);
  light.position.set(0.13, 0, 0);

  light.castShadow = false;

  assembly.add(light);

  return { lensMaterial, light };
}

function createHeadlights(rover) {
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
    rightLensMaterial: right.lensMaterial
  };
}

export function createRover(scene, { metalTexture, wheelTexture, wheelBumpMap } = {}) {
  const rover = new THREE.Group();
  rover.position.set(0, 0.55, 0);

  scene.add(rover);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.6, 1.4),
    createMaterial({
      map: metalTexture,
    })
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

  const wheels = [];
  for (const x of [0.75, -0.75]) {
    for (const z of [0.82, -0.82]) {
      createWheel(rover, wheels, wheelTexture, wheelBumpMap, x, z);
    }
  }

  const panels = createPanels(rover);
  const antennaPivot = createAntenna(rover);
  const arm = createRobotArm(rover);
  const headlights = createHeadlights(rover);

  return {
    group: rover,
    wheels,
    panels,
    antennaPivot,
    arm,
    headlights
  };
}

export function updateRover(roverModel, state, dt) {
  roverModel.antennaPivot.rotation.y += dt * 0.9;

  const targetPanelAngle = state.panelsOpen ? Math.PI / 5 : 0;
  const { leftPanelPivot, rightPanelPivot } = roverModel.panels;
  for (const [pivot, angle] of [
    [leftPanelPivot, targetPanelAngle],
    [rightPanelPivot, -targetPanelAngle]
  ]) {
    pivot.rotation.x += (angle - pivot.rotation.x) * 0.08;
  }

  updateManualArmTargets(roverModel.arm.targets, state.keys, dt);

  applyRobotArmPose(roverModel.arm, roverModel.arm.targets, dt, state.gripperOpen);
}
