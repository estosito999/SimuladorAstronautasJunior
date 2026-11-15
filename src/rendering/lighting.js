import * as THREE from 'three';

const HEADLIGHT_INTENSITY = 28;
const SUN_SHADOW_DISTANCE = 900;

const roverWorldPosition = new THREE.Vector3();
const sunWorldPosition = new THREE.Vector3();
const sunDirectionWorld = new THREE.Vector3();

function updateHeadlight(light, lensMaterial, isOn) {
  light.intensity = isOn ? HEADLIGHT_INTENSITY : 0;
  lensMaterial.emissiveIntensity = isOn ? 1.65 : 0;
}

export function updateLighting({ sunModel, roverModel, state }) {
  roverModel.group.getWorldPosition(roverWorldPosition);

  sunModel.sun.getWorldPosition(sunWorldPosition);
  sunDirectionWorld.copy(sunWorldPosition).sub(roverWorldPosition).normalize();

  sunModel.sunTarget.position.copy(roverWorldPosition);
  sunModel.sunLight.position
    .copy(roverWorldPosition)
    .addScaledVector(sunDirectionWorld, SUN_SHADOW_DISTANCE);
  sunModel.sunTarget.updateMatrixWorld();
  sunModel.sunLight.updateMatrixWorld();

  const headlights = roverModel.headlights;
  updateHeadlight(headlights.leftHeadlight, headlights.leftLensMaterial, state.headlightsOn);
  updateHeadlight(headlights.rightHeadlight, headlights.rightLensMaterial, state.headlightsOn);
}
