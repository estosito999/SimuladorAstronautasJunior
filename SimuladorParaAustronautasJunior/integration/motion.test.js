import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { advanceRover, resolveRoverCommand, clampCameraDistance } from './index.js';

describe('shared Lunar-E controls', () => {
  it('preserves the original demo speeds and wheel rotation', () => {
    assert.deepEqual(resolveRoverCommand({ forward: 1, turn: -1 }, 0.5), {
      forward: 1, turn: -1, turnRadians: -0.9, distance: 3, wheelRotation: -10.5,
    });
  });
  it('adapts the same motion to the station plane and clamps its practice area', () => {
    const move = advanceRover({ position: [0, 5], heading: 0, forward: 1, turn: 0 }, 1);
    assert.deepEqual(move.position, [0, 6.6]);
    assert.ok(Math.abs(move.distance - 1.6) < 1e-9);
    assert.equal(move.blocked, false);
    const boundary = advanceRover({ position: [0, 12.5], heading: 0, forward: 1, turn: 0 }, 1);
    assert.deepEqual(boundary.position, [0, 13]);
    assert.equal(boundary.blocked, true);
    assert.equal(boundary.distance, 0.5);
  });
  it('handles backward movement, turning and invalid input without NaN', () => {
    assert.deepEqual(advanceRover({ position: [0, 5], heading: 0, forward: -1, turn: 0 }, 1).position, [0, 3.4]);
    const turn = advanceRover({ position: [0, 5], heading: 0, forward: 0, turn: 1 }, 1);
    assert.equal(turn.heading, 1.15);
    assert.deepEqual(turn.position, [0, 5]);
    assert.deepEqual(resolveRoverCommand({ forward: NaN, turn: Infinity }, NaN), {
      forward: 0, turn: 0, turnRadians: 0, distance: 0, wheelRotation: -0,
    });
    assert.equal(clampCameraDistance(120, 9, 54), 54);
    assert.equal(clampCameraDistance(NaN, 9, 54), 9);
  });
});
