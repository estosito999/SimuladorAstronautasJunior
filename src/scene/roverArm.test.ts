import { describe, expect, it } from 'vitest';
import { Group, Vector3 } from 'three';
import { createRover, updateRover } from './roverModel';
import { createInitialState } from '../simulation/engine';
import { ARM_SEGMENTS, armGripperPosition } from '../simulation/roverExploration';

describe('brazo visible y volumen de recogida', () => {
  it.each([
    { yaw: 0, shoulder: 0, elbow: -55, gripperOpen: true },
    { yaw: 80, shoulder: 30, elbow: -75, gripperOpen: false },
    { yaw: -120, shoulder: 70, elbow: -110, gripperOpen: true },
  ])('mantiene la pinza del modelo en la posición calculada del motor: %j', arm => {
    const parent = new Group();
    const state = { ...createInitialState(), roverPosition: [24, -17] as [number, number], roverHeading: 1.2, roverArm: arm };
    parent.position.set(state.roverPosition[0], 0, state.roverPosition[1]);
    parent.rotation.y = state.roverHeading;
    const rover = createRover(parent);
    rover.group.rotation.y = -Math.PI / 2;
    updateRover(rover, { arm }, 10);
    parent.updateMatrixWorld(true);
    const visibleTip = rover.arm.wrist.localToWorld(new Vector3(ARM_SEGMENTS.claw, 0, 0));
    const expected = armGripperPosition(state);
    expect(visibleTip.x).toBeCloseTo(expected[0], 9);
    expect(visibleTip.y).toBeCloseTo(expected[1], 9);
    expect(visibleTip.z).toBeCloseTo(expected[2], 9);
  });
});
