import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStationPower, integrateBatteryPct, advancePowerStore, calculatePowerDemand, dustEfficiencyAtCoverage, makeTerrain } from './junior.js';
import { dustEfficiency, solarOutput, powerDemand } from '../src/game/resourceSystem.js';
import { MODULES } from '../src/data/modules.js';

test('station generation uses the shared ZERO-G equation and accepts Dust-Shield attenuation', () => {
  assert.equal(calculateStationPower({ enabled: true, sunlight: 100, panelAngle: 45, dustEfficiency: 1 }), 240);
  assert.equal(calculateStationPower({ enabled: false, sunlight: 100, panelAngle: 45 }), 0);
  assert.equal(calculateStationPower({ enabled: true, sunlight: 100, panelAngle: 45, dustEfficiency: 0.5 }), 120);
  assert.equal(calculateStationPower({ enabled: true, sunlight: 100, panelAngle: 45, dustEfficiency: Math.exp(-0.6) }), 240 * Math.exp(-0.6));
});

test('original ZERO-G resource engine imports shared generation and demand without changing its model', () => {
  const s = { dust: 50, modules: [{ type: 'solar', condition: 100 }], destination: 'moon', cycle: 1, effects: [], activeScience: [], conserve: false };
  assert.equal(dustEfficiency(s), dustEfficiencyAtCoverage(50));
  assert.ok(solarOutput(s) > 0);
  assert.equal(solarOutput({ ...s, modules: [] }), 0);
  assert.equal(powerDemand(s).total, calculatePowerDemand({ base: powerDemand(s).base }).total);
  assert.ok(MODULES.solar.gen > 0);
});

test('storage equation handles brownout, full batteries and Wh integration', () => {
  assert.deepEqual(advancePowerStore({ capacity: 100, stored: 20, generation: 5, demand: 50 }), { stored: 0, ratio: 0.5 });
  assert.deepEqual(advancePowerStore({ capacity: 100, stored: 95, generation: 20, demand: 5 }), { stored: 100, ratio: 1 });
  assert.equal(integrateBatteryPct({ battery: 50, production: 240, demand: 40, seconds: 1 }), 50 + 200 / 60);
});

test('exposes the original deterministic terrain used by ZERO-G scenes', () => {
  const first = makeTerrain('moon');
  const second = makeTerrain('moon');
  assert.equal(first.craters.length, 16);
  assert.deepEqual(first.craters, second.craters);
  assert.equal(first.height(0, 0), 0);
  assert.equal(first.height(24, -21), second.height(24, -21));
  assert.ok(Number.isFinite(first.height(24, -21)));
});
