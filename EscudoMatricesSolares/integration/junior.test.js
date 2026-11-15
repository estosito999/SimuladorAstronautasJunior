import test from 'node:test';
import assert from 'node:assert/strict';
import { EDS_K, MAX_POWER_W, BASE_POWER_W, calculateDustEfficiency, calculateDustPower, getClearingSpeed, advanceDust, accumulateRecoveredEnergy } from './junior.js';

test('shares original exponential attenuation and recovered power equation', () => {
  assert.equal(EDS_K, 0.03);
  assert.equal(calculateDustEfficiency(0), 1);
  assert.equal(calculateDustEfficiency(100), Math.exp(-3));
  assert.equal(calculateDustEfficiency(-20), 1);
  const clean = calculateDustPower(0);
  assert.equal(clean.currentPowerW, MAX_POWER_W);
  assert.equal(clean.recoveredPowerW, MAX_POWER_W - BASE_POWER_W);
  assert.equal(calculateDustPower(100).recoveredPowerW, 0);
});

test('uses original voltage and phase speed; stops removing dust without shared station power', () => {
  assert.equal(getClearingSpeed(1250, 3), 0.056249999999999994);
  const powered = advanceDust({ coverage: 48, active: true, powered: true }, 1);
  assert.ok(Math.abs(powered.coverage - 39) < 0.0000001);
  assert.equal(advanceDust({ coverage: 48, active: true, powered: false }, 1).coverage, 48);
  assert.deepEqual(advanceDust({ coverage: 2, active: true, powered: true }, 1), { coverage: 0, active: false, removed: 2 });
});

test('recovered energy integrates only during active clearing', () => {
  assert.equal(accumulateRecoveredEnergy(1, { active: true, coverage: 20, recoveredPowerW: 120 }, 30), 2);
  assert.equal(accumulateRecoveredEnergy(1, { active: false, coverage: 20, recoveredPowerW: 120 }, 30), 1);
});
