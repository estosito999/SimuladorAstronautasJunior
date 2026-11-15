import { describe, expect, it } from 'vitest';
import { createInitialState, reduce, step } from './engine';
import { ARM_LIMITS, armGripperPosition, DEFAULT_ROVER_ARM, getNearestRock, getRockPickupStatus, LUNAR_ROCKS, ROVER_BOUNDS, ROCK_PICKUP_RADIUS } from './roverExploration';
import { lunarGroundHeight } from '../scene/terrain';
import type { State } from './types';

const aligned = (): State => ({ ...createInitialState(), roverPosition: [0, 6.15], roverArm: { ...DEFAULT_ROVER_ARM, shoulder: 0 } });

describe('zona ampliada de exploración', () => {
  it('recorre más allá del límite antiguo sin salir del terreno permitido', () => {
    let s = step(reduce(createInitialState(), { type: 'rover-drive', forward: 1, turn: 0 }), 20);
    expect(s.roverPosition[1]).toBeCloseTo(37);
    expect(s.roverMode).toBe('driving');
    s = step(s, 30);
    expect(s.roverPosition[1]).toBe(ROVER_BOUNDS.maxZ);
    expect(s.roverMode).toBe('parked');
    const boundary = s.roverPosition;
    s = step(reduce(s, { type: 'rover-drive', forward: 1, turn: 0 }), 1);
    expect(s.roverPosition).toEqual(boundary);
  });

  it('permite ir al norte de la base y reserva energía para volver de lejos', () => {
    const start: State = { ...createInitialState(), roverHeading: Math.PI };
    const north = step(reduce(start, { type: 'rover-drive', forward: 1, turn: 0 }), 10);
    expect(north.roverPosition[1]).toBeLessThan(-10);
    let low: State = { ...createInitialState(), roverPosition: [44, 12], roverMode: 'driving', roverBattery: 24, roverDrive: { forward: 1, turn: 0 } };
    low = step(low, 0.1);
    expect(low.roverMode).toBe('returning');
    low = step(low, 30);
    expect(low.roverPosition).toEqual([0, 5]);
    expect(low.roverBattery).toBeGreaterThan(0);
  });
});

describe('brazo robótico y muestras lunares', () => {
  it('solo recoge al alinear la pinza y conserva la roca hasta guardarla', () => {
    const initial = aligned();
    expect(getRockPickupStatus(initial).canCollect).toBe(true);
    const picked = reduce(initial, { type: 'rover-collect' });
    expect(picked.heldRockId).toBe(LUNAR_ROCKS[0].id);
    expect(picked.roverArm.gripperOpen).toBe(false);
    expect(picked.collectedRocks).toEqual([]);
    expect(picked.roverBattery).toBeLessThan(initial.roverBattery);
    expect(initial.heldRockId).toBeNull();
    expect(reduce(picked, { type: 'rover-gripper' }).heldRockId).toBe(picked.heldRockId);
    expect(reduce(picked, { type: 'rover-gripper' }).roverArm.gripperOpen).toBe(false);
    const resetArm = reduce(picked, { type: 'rover-arm-reset' });
    expect(resetArm.heldRockId).toBe(picked.heldRockId);
    const stored = reduce(resetArm, { type: 'rover-stow' });
    expect(stored.heldRockId).toBeNull();
    expect(stored.collectedRocks).toEqual([LUNAR_ROCKS[0].id]);
    expect(stored.roverArm).toEqual(DEFAULT_ROVER_ARM);
    expect(stored.pendingRoverSamples).toBe(initial.pendingRoverSamples);
    expect(stored.observations).toBe(initial.observations);
  });

  it('no crea muestras a distancia, con pinza cerrada ni repitiendo una captura', () => {
    expect(reduce(createInitialState(), { type: 'rover-collect' }).heldRockId).toBeNull();
    const closed = reduce(aligned(), { type: 'rover-gripper' });
    expect(getRockPickupStatus(closed).canCollect).toBe(false);
    expect(reduce(closed, { type: 'rover-collect' }).heldRockId).toBeNull();
    let s = reduce(aligned(), { type: 'rover-collect' });
    s = reduce(s, { type: 'rover-collect' });
    s = reduce(s, { type: 'rover-stow' });
    s = { ...s, roverArm: aligned().roverArm };
    expect(reduce(s, { type: 'rover-collect' }).heldRockId).toBeNull();
    expect(reduce(s, { type: 'rover-stow' }).collectedRocks).toEqual([LUNAR_ROCKS[0].id]);
    expect(getNearestRock(s).rock?.id).not.toBe(LUNAR_ROCKS[0].id);
  });

  it('bloquea el brazo durante movimiento, carga, retorno, pausa o batería insuficiente', () => {
    for (const roverMode of ['driving', 'returning', 'charging'] as const) {
      const s = { ...aligned(), roverMode };
      expect(reduce(s, { type: 'rover-arm', joint: 'yaw', value: 60 }).roverArm).toEqual(s.roverArm);
      expect(reduce(s, { type: 'rover-collect' }).heldRockId).toBeNull();
    }
    const paused = { ...aligned(), paused: true };
    expect(reduce(paused, { type: 'rover-collect' })).toBe(paused);
    expect(reduce(paused, { type: 'rover-arm', joint: 'yaw', value: 40 })).toBe(paused);
    expect(reduce({ ...aligned(), roverBattery: 12 }, { type: 'rover-collect' }).heldRockId).toBeNull();
  });

  it('limita articulaciones, ignora NaN y protege la reserva del rover', () => {
    let s = reduce(aligned(), { type: 'rover-arm', joint: 'yaw', value: 999 });
    expect(s.roverArm.yaw).toBe(ARM_LIMITS.yaw.max);
    s = reduce(s, { type: 'rover-arm', joint: 'elbow', value: -999 });
    expect(s.roverArm.elbow).toBe(ARM_LIMITS.elbow.min);
    const old = s.roverArm.shoulder;
    s = reduce(s, { type: 'rover-arm', joint: 'shoulder', value: Number.NaN });
    expect(s.roverArm.shoulder).toBe(old);
    expect(s.roverBattery).toBeLessThan(aligned().roverBattery);
    const low = reduce({ ...aligned(), roverBattery: 12.01 }, { type: 'rover-arm', joint: 'yaw', value: 160 });
    expect(low.roverBattery).toBe(12);
  });

  it('repliega al conducir o regresar sin perder una roca y reinicia las muestras', () => {
    const picked = reduce(aligned(), { type: 'rover-collect' });
    for (const action of [{ type: 'rover-drive', forward: 1, turn: 0 }, { type: 'rover-return' }] as const) {
      const next = reduce(picked, action);
      expect(next.roverArm).toEqual({ ...DEFAULT_ROVER_ARM, gripperOpen: false });
      expect(next.heldRockId).toBe(picked.heldRockId);
    }
    const stored = reduce(picked, { type: 'rover-stow' });
    expect(reduce(stored, { type: 'reset' })).toEqual(createInitialState());
  });

  it('rota alrededor del pivote delantero y calcula altura real en pendientes', () => {
    const s: State = { ...aligned(), roverArm: { ...aligned().roverArm, yaw: 90 } };
    const tip = armGripperPosition(s);
    expect(tip[2]).toBeCloseTo(s.roverPosition[1] + 0.95);
    expect(tip[0]).toBeGreaterThan(1.8);
    const target = LUNAR_ROCKS[10];
    const reach = armGripperPosition(aligned())[2] - aligned().roverPosition[1];
    const distant: State = { ...aligned(), roverPosition: [target.position[0], target.position[1] - reach] };
    const pickup = getRockPickupStatus(distant);
    const distantTip = armGripperPosition(distant);
    const expectedHeightDifference = lunarGroundHeight(...target.position) + target.size * 0.55
      - lunarGroundHeight(...distant.roverPosition) - distantTip[1];
    expect(pickup.rock?.id).toBe(target.id);
    expect(pickup.distance).toBeCloseTo(Math.abs(expectedHeightDifference));
    expect(pickup.canCollect).toBe(Math.abs(expectedHeightDifference) <= ROCK_PICKUP_RADIUS);
  });
});
