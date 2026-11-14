import { describe, expect, it } from 'vitest';
import { createJuniorTelemetry, TelemetryMetadataManager } from '../telemetry/telemetryEngine';
import { calculateDustEfficiency } from './dustModel';
import { calculateStationPower } from './solarModel';
import { makeTerrain } from '../scene/terrain';
import { advanceRover } from './roverModel';
import { createRover } from '../scene/roverModel';
import { Group } from 'three';
import { createInitialState, metrics, reduce, step } from './engine';
import { missionTelemetrySnapshot } from './telemetrySnapshot';

describe('repositorios conectados a la estación', () => {
  it('usa terreno, rover, movimiento y modelo de polvo de los paquetes locales', () => {
    const s = createInitialState();
    expect(metrics(s).production).toBe(calculateStationPower({ enabled: true, sunlight: s.sunlight, panelAngle: s.panelAngle, dustEfficiency: calculateDustEfficiency(s.dust) }));
    expect(calculateDustEfficiency(100)).toBeCloseTo(Math.exp(-3));
    expect(makeTerrain('moon').height(0, 0)).toBe(0);
    const motion = advanceRover({ position: [0, 5], heading: 0, forward: 1, turn: 0 }, 1);
    expect(motion.position).toEqual([0, 6.6]);
    const rover = createRover(new Group());
    expect(rover.wheels).toHaveLength(4);
    expect(rover.arm.shoulder.isGroup).toBe(true);
  });

  it('corta la generación que llega a la base al desconectar paneles', () => {
    const s = reduce(createInitialState(), { type: 'connection-toggle', id: 'solarBus' });
    expect(s.solarOn).toBe(true);
    expect(metrics(s).production).toBe(0);
    expect(step(s, 1).battery).toBeLessThan(s.battery);
  });

  it('desconectar la antena corta señal y transmisión y reduce consumo', () => {
    let s = reduce(createInitialState(), { type: 'antenna-toggle' });
    s = reduce(s, { type: 'antenna-angle', value: 45 });
    const before = metrics(s);
    s = reduce(s, { type: 'connection-toggle', id: 'antennaBus' });
    expect(metrics(s).signal).toBe(0);
    expect(metrics(s).demand).toBe(before.demand - 16);
    expect(reduce(s, { type: 'transmit' }).packets).toBe(0);
  });

  it('desconectar la plataforma detiene y bloquea recarga', () => {
    let s = reduce(createInitialState(), { type: 'rover-charge' });
    expect(s.roverMode).toBe('charging');
    s = reduce(s, { type: 'connection-toggle', id: 'roverDock' });
    expect(s.roverMode).toBe('parked');
    expect(reduce(s, { type: 'rover-charge' }).roverMode).toBe('parked');
    expect(step(s, 1).roverBattery).toBe(s.roverBattery);
  });

  it('guarda observaciones a bordo y las reenvía cuando se conecta la radio', () => {
    let s = createInitialState();
    s = reduce(s, { type: 'connection-toggle', id: 'roverDock' });
    s = reduce(s, { type: 'connection-toggle', id: 'roverRadio' });
    s = step(reduce(s, { type: 'rover-drive', forward: 1, turn: 0 }), 3);
    s = reduce(s, { type: 'rover-stop' });
    expect(s.pendingRoverSamples).toBeGreaterThan(0);
    expect(s.observations).toBe(0);
    s = reduce(s, { type: 'antenna-toggle' });
    s = reduce(s, { type: 'antenna-angle', value: 45 });
    s = reduce(s, { type: 'connection-toggle', id: 'roverRadio' });
    s = step(s, 0.1);
    expect(s.pendingRoverSamples).toBe(0);
    expect(s.observations).toBeGreaterThan(0);
    s = reduce(s, { type: 'transmit' });
    expect(s.lastTransmission?.observations).toBe(s.observations);
    expect(s.lastTransmission?.roverPosition).toEqual(s.roverPosition);
    expect(s.lastTransmission?.production).toBe(metrics(s).production);
    const snapshot = s.lastTransmission;
    s = reduce(s, { type: 'add-dust' });
    expect(s.lastTransmission).toBe(snapshot);
    expect(s.lastTransmission?.dust).toBeLessThan(s.dust);
  });

  it('el movimiento cerca de paneles deposita polvo y baja generación', () => {
    let s = { ...createInitialState(), roverPosition: [-7, 3] as [number, number] };
    const production = metrics(s).production;
    s = step(reduce(s, { type: 'rover-drive', forward: 1, turn: 0 }), 0.5);
    expect(s.dust).toBeGreaterThan(48);
    expect(metrics(s).production).toBeLessThan(production);
  });

  it('la estación conserva telemetría recibida y no conoce lecturas nuevas sin enlace', () => {
    let s = reduce(createInitialState(), { type: 'connection-toggle', id: 'roverDock' });
    s = reduce(s, { type: 'connection-toggle', id: 'roverRadio' });
    const received = s.lastRoverTelemetry;
    s = step(reduce(s, { type: 'rover-drive', forward: 1, turn: 0 }), 2);
    s = reduce(s, { type: 'rover-stop' });
    expect(s.roverBattery).toBeLessThan(received.battery);
    expect(s.lastRoverTelemetry).toBe(received);
    expect(missionTelemetrySnapshot(s).roverBattery).toBe(received.battery);
    expect(missionTelemetrySnapshot(s).roverDistance).toBe(0);
    s = reduce(s, { type: 'antenna-toggle' });
    s = reduce(s, { type: 'antenna-angle', value: 45 });
    s = reduce(s, { type: 'transmit' });
    expect(s.lastTransmission?.roverBattery).toBe(received.battery);
    s = step(reduce(s, { type: 'connection-toggle', id: 'roverRadio' }), 0.1);
    expect(missionTelemetrySnapshot(s).roverBattery).toBe(s.roverBattery);
    expect(missionTelemetrySnapshot(s).roverDistance).toBe(s.roverDistance);
  });

  it('publica los datos conectados en el proveedor y metadatos originales Open MCT', () => {
    const source = createJuniorTelemetry({ epoch: 0 });
    const s = createInitialState(), m = metrics(s);
    const received: number[] = [];
    const release = source.subscribe('solar.production', datum => received.push(datum.value));
    source.publish({ time: s.elapsed, ...m, battery: s.battery, roverBattery: s.roverBattery, dust: s.dust, roverDistance: s.roverDistance, observations: s.observations, packets: s.packets });
    expect(source.getMetadata('solar.production')).toBeInstanceOf(TelemetryMetadataManager);
    expect(source.request('solar.production')[0].value).toBe(m.production);
    expect(source.request('station.balance')[0].value).toBe(m.balance);
    expect(source.getDomainObjects()).toHaveLength(10);
    expect(received).toEqual([m.production]);
    release();
  });
});
