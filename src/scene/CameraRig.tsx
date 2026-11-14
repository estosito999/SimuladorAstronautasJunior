import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
const clampCameraDistance = (distance: number, min: number, max: number) =>
  Math.min(max, Math.max(min, distance));
import type { State } from '../simulation/types';

export type CameraCommand = { id: number; action: 'reset' | 'left' | 'right' | 'in' | 'out' };

export function CameraRig({ state, mode, command }: { state: State; mode: 'overview' | 'follow'; command: CameraCommand }) {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const lastCommand = useRef(-1);
  const followDistance = useRef(8);
  const followAngle = useRef(0);
  const desired = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());

  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.target.set(0, 0.6, 1);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.09;
    orbit.enablePan = false;
    orbit.minDistance = 9;
    orbit.maxDistance = 54;
    orbit.minPolarAngle = 0.12;
    orbit.maxPolarAngle = Math.PI / 2.16;
    orbit.update();
    controls.current = orbit;
    return () => { orbit.dispose(); controls.current = null; document.body.style.cursor = ''; };
  }, [camera, gl]);

  useEffect(() => {
    if (!controls.current) return;
    controls.current.enabled = mode === 'overview';
    if (mode === 'overview') {
      camera.position.set(21, 18, 26);
      controls.current.target.set(0, 0.6, 1);
      controls.current.update();
    }
  }, [mode, camera]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || lastCommand.current === command.id) return;
    lastCommand.current = command.id;
    if (mode === 'follow') {
      if (command.action === 'reset') { followDistance.current = 8; followAngle.current = 0; }
      if (command.action === 'left') followAngle.current -= 0.3;
      if (command.action === 'right') followAngle.current += 0.3;
      if (command.action === 'in') followDistance.current = clampCameraDistance(followDistance.current * 0.85, 4, 16);
      if (command.action === 'out') followDistance.current = clampCameraDistance(followDistance.current / 0.85, 4, 16);
      return;
    }
    const offset = camera.position.clone().sub(orbit.target);
    if (command.action === 'reset') { camera.position.set(21, 18, 26); orbit.target.set(0, 0.6, 1); }
    else {
      if (command.action === 'left' || command.action === 'right') offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), command.action === 'left' ? -0.25 : 0.25);
      if (command.action === 'in') offset.setLength(clampCameraDistance(offset.length() * 0.85, orbit.minDistance, orbit.maxDistance));
      if (command.action === 'out') offset.setLength(clampCameraDistance(offset.length() / 0.85, orbit.minDistance, orbit.maxDistance));
      camera.position.copy(orbit.target).add(offset);
    }
    orbit.update();
  }, [command.id, command.action, camera, mode]);

  useFrame((_, dt) => {
    const orbit = controls.current;
    if (!orbit) return;
    if (mode === 'follow') {
      target.current.set(state.roverPosition[0], 0.9, state.roverPosition[1]);
      const angle = state.roverHeading + followAngle.current;
      desired.current.set(-Math.sin(angle) * followDistance.current, 4.5, -Math.cos(angle) * followDistance.current).add(target.current);
      camera.position.lerp(desired.current, 1 - Math.exp(-Math.min(dt, 0.1) * 5));
      orbit.target.lerp(target.current, 1 - Math.exp(-Math.min(dt, 0.1) * 8));
      camera.lookAt(orbit.target);
    } else orbit.update();
    if (camera.position.y < 1.2) camera.position.y = 1.2;
  });
  return null;
}
