import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRover, updateRover } from './model.js';
import { moveRover } from '../src/models/roverMotion.js';
import { zoomCamera } from '../src/scene/cameraMovement.js';

function disposeModel(model) {
  const geometries = new Set(), materials = new Set();
  model.group.traverse(object => {
    if (object.isMesh) {
      geometries.add(object.geometry);
      for (const material of (Array.isArray(object.material) ? object.material : [object.material])) materials.add(material);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

describe('real Lunar-E sources', () => {
  it('constructs the original rover without remote textures and animates its original equipment', () => {
    const scene = new THREE.Group();
    const model = createRover(scene);
    assert.equal(model.group.parent, scene);
    assert.equal(model.wheels.length, 4);
    assert.ok(model.arm.shoulder.isGroup);
    assert.ok(model.headlights.leftHeadlight.isSpotLight);
    updateRover(model, { panelsOpen: true, gripperOpen: true, keys: { q: true } }, 0.1);
    assert.ok(model.panels.leftPanelPivot.rotation.x > 0);
    assert.ok(model.antennaPivot.rotation.y > 0);
    assert.ok(model.arm.targets.shoulderYaw > -Math.PI / 2);
    disposeModel(model);
  });
  it('keeps the original demo spherical surface and wheel motion after shared-control extraction', () => {
    const model = createRover(new THREE.Group());
    const surface = { center: new THREE.Vector3(), radius: 10, roverHeight: 0.55 };
    model.group.position.set(0, 10.55, 0);
    moveRover(model, { w: true }, 0.1, surface);
    assert.ok(Math.abs(model.group.position.length() - 10.55) < 1e-9);
    assert.ok(model.group.position.x > 0);
    assert.ok(Math.abs(model.wheels[0].rotation.y + 2.1) < 1e-9);
    assert.ok(model.group.quaternion.toArray().every(Number.isFinite));
    disposeModel(model);
  });
  it('keeps original camera zoom inside the shared distance limits', () => {
    const camera = new THREE.PerspectiveCamera();
    const controls = { target: new THREE.Vector3(), minDistance: 9, maxDistance: 54 };
    camera.position.set(0, 0, 20);
    zoomCamera(camera, controls, 0.1);
    assert.equal(camera.position.length(), 9);
    zoomCamera(camera, controls, 100);
    assert.equal(camera.position.length(), 54);
  });
});
