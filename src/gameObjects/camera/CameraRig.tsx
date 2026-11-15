import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { groundHeight } from '../environment/terrainHeight';
import type { State } from '../../simulation/types';
import { CAMERA_PRESETS, type CameraCommand, type CameraMode } from './cameraModes';
import { UnityBridge } from '../unity/UnityBridge';

const clampCameraDistance = (distance: number, min: number, max: number) =>
  Math.min(max, Math.max(min, distance));

export function CameraRig({
  state,
  mode,
  command,
}: {
  state: State;
  mode: CameraMode;
  command: CameraCommand;
}) {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const lastCommand = useRef(command.id);
  const target = useRef(new THREE.Vector3());
  const translation = useRef(new THREE.Vector3());
  const currentState = useRef(state);
  currentState.current = state;

  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.target.set(...CAMERA_PRESETS.overview.target);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.09;
    orbit.enablePan = false;
    orbit.minDistance = 9;
    orbit.maxDistance = 140;
    orbit.minPolarAngle = 0.05;
    orbit.maxPolarAngle = Math.PI / 2.05;
    orbit.update();
    controls.current = orbit;
    return () => {
      orbit.dispose();
      controls.current = null;
      document.body.style.cursor = '';
    };
  }, [camera, gl]);

  useEffect(() => {
    if (!controls.current) return;
    const orbit = controls.current;
    orbit.enabled = true;
    orbit.minDistance = mode === 'follow' ? 3.4 : mode === 'control' ? 4 : mode === 'iss' ? 2 : 9;
    orbit.maxDistance = mode === 'follow' ? 24 : mode === 'iss' ? 180 : 140;

    if (mode === 'overview') {
      camera.position.set(...CAMERA_PRESETS.overview.position);
      orbit.target.set(...CAMERA_PRESETS.overview.target);
    } else if (mode === 'control') {
      camera.position.set(...CAMERA_PRESETS.control.position);
      orbit.target.set(...CAMERA_PRESETS.control.target);
    } else if (mode === 'iss') {
      camera.position.set(...CAMERA_PRESETS.iss.position);
      orbit.target.set(...CAMERA_PRESETS.iss.target);
    } else {
      const rover = currentState.current;
      const [x, z] = rover.roverPosition;
      const y = groundHeight(x, z);
      orbit.target.set(x, y + 0.9, z);
      camera.position.set(
        x - Math.sin(rover.roverHeading) * 8,
        y + 5.4,
        z - Math.cos(rover.roverHeading) * 8
      );
    }
    orbit.update();

    // Notifica a Unity sobre el cambio de modo de cámara
    UnityBridge.setCameraMode({ mode });
  }, [mode, camera]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || lastCommand.current === command.id) return;
    lastCommand.current = command.id;
    const offset = camera.position.clone().sub(orbit.target);

    if (command.action === 'reset') {
      if (mode === 'control') {
        camera.position.set(...CAMERA_PRESETS.control.position);
        orbit.target.set(...CAMERA_PRESETS.control.target);
      } else if (mode === 'iss') {
        camera.position.set(...CAMERA_PRESETS.iss.position);
        orbit.target.set(...CAMERA_PRESETS.iss.target);
      } else if (mode === 'follow') {
        const rover = currentState.current;
        const [x, z] = rover.roverPosition;
        const y = groundHeight(x, z);
        orbit.target.set(x, y + 0.9, z);
        camera.position.set(
          x - Math.sin(rover.roverHeading) * 8,
          y + 5.4,
          z - Math.cos(rover.roverHeading) * 8
        );
      } else {
        camera.position.set(...CAMERA_PRESETS.overview.position);
        orbit.target.set(...CAMERA_PRESETS.overview.target);
      }
    } else {
      if (command.action === 'left' || command.action === 'right') {
        offset.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          command.action === 'left' ? -0.25 : 0.25
        );
      }
      if (command.action === 'in') {
        offset.setLength(
          clampCameraDistance(offset.length() * 0.85, orbit.minDistance, orbit.maxDistance)
        );
      }
      if (command.action === 'out') {
        offset.setLength(
          clampCameraDistance(offset.length() / 0.85, orbit.minDistance, orbit.maxDistance)
        );
      }
      camera.position.copy(orbit.target).add(offset);
    }
    orbit.update();
  }, [command.id, command.action, camera, mode]);

  useFrame((_, dt) => {
    const orbit = controls.current;
    if (!orbit) return;

    if (mode === 'follow') {
      const [x, z] = state.roverPosition;
      target.current.set(x, groundHeight(x, z) + 0.9, z);
      translation.current
        .copy(target.current)
        .sub(orbit.target)
        .multiplyScalar(1 - Math.exp(-Math.min(dt, 0.1) * 8));
      camera.position.add(translation.current);
      orbit.target.add(translation.current);
    }

    orbit.update();
    const ground = groundHeight(camera.position.x, camera.position.z) + 1.2;
    if (camera.position.y < ground) {
      camera.position.y = ground;
      camera.lookAt(orbit.target);
    }
  });

  return null;
}
