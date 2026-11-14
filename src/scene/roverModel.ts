/**
 * Constructor del Modelo 3D del Rover Lunar
 * Derivado de los componentes visuales de final-project-Lunar-E.
 * Implementación 100% autocontenida en TypeScript con Three.js.
 */
import * as THREE from 'three';

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
    shoulder: THREE.Group;
    elbow: THREE.Group;
    wrist: THREE.Group;
    leftFingerPivot: THREE.Group;
    rightFingerPivot: THREE.Group;
    targets: Record<string, number>;
  };
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

  const shoulder = new THREE.Group();
  shoulder.position.set(1.02, 0.24, 0);
  rover.add(shoulder);

  const shoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), jointMaterial);
  enableShadows(shoulderMesh);
  shoulder.add(shoulderMesh);

  const bicepMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.82), armMaterial);
  bicepMesh.position.z = -0.41;
  enableShadows(bicepMesh);
  shoulder.add(bicepMesh);

  const elbow = new THREE.Group();
  elbow.position.z = -0.82;
  shoulder.add(elbow);

  const elbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), jointMaterial);
  enableShadows(elbowMesh);
  elbow.add(elbowMesh);

  const forearmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.7), armMaterial);
  forearmMesh.position.z = -0.35;
  enableShadows(forearmMesh);
  elbow.add(forearmMesh);

  const wrist = new THREE.Group();
  wrist.position.z = -0.72;
  elbow.add(wrist);

  const wristMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), jointMaterial);
  enableShadows(wristMesh);
  wrist.add(wristMesh);

  const leftFingerPivot = new THREE.Group();
  const rightFingerPivot = new THREE.Group();
  leftFingerPivot.position.set(0.105, 0, -0.21);
  rightFingerPivot.position.set(-0.105, 0, -0.21);
  wrist.add(leftFingerPivot, rightFingerPivot);

  const fingerGeometry = new THREE.BoxGeometry(0.045, 0.085, 0.31);
  const leftFinger = new THREE.Mesh(fingerGeometry, clawMaterial);
  leftFinger.position.set(0.015, 0, -0.155);
  enableShadows(leftFinger);
  leftFingerPivot.add(leftFinger);

  const rightFinger = new THREE.Mesh(fingerGeometry, clawMaterial);
  rightFinger.position.set(-0.015, 0, -0.155);
  enableShadows(rightFinger);
  rightFingerPivot.add(rightFinger);

  return {
    shoulder,
    elbow,
    wrist,
    leftFingerPivot,
    rightFingerPivot,
    targets: {},
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

  return {
    group: rover,
    wheels,
    panels,
    antennaPivot,
    arm,
    headlights,
  };
}

export function updateRover(
  roverModel: Rover3DInstance,
  state: { panelsOpen?: boolean; gripperOpen?: boolean; keys?: Record<string, boolean> },
  dt: number
) {
  if (roverModel.antennaPivot) {
    roverModel.antennaPivot.rotation.y += dt * 0.9;
  }
  const targetPanelAngle = state.panelsOpen ? Math.PI / 5 : 0;
  const { leftPanelPivot, rightPanelPivot } = roverModel.panels;
  leftPanelPivot.rotation.x += (targetPanelAngle - leftPanelPivot.rotation.x) * 0.08;
  rightPanelPivot.rotation.x += (-targetPanelAngle - rightPanelPivot.rotation.x) * 0.08;
}
