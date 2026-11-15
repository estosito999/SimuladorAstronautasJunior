import * as THREE from 'three';

const worldPosition = new THREE.Vector3();

export function createShadowState(occluders, sun) {
  return {
    occluders,
    sun,
    spheres: [new THREE.Vector4(), new THREE.Vector4()],
    sunPosition: new THREE.Vector3()
  };
}

export function applyShadowShader(root, state, nightMap = false) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.material.onBeforeCompile = (shader) => {
      shader.uniforms.shadowSpheres = { value: state.spheres };
      shader.uniforms.shadowSunPosition = { value: state.sunPosition };
      patchShader(shader, nightMap);
    };

    object.material.customProgramCacheKey = () => `celestial-shadow-${nightMap}`;
    object.material.needsUpdate = true;
  });
}

export function updateShadowState(state, enabled) {
  state.sun.getWorldPosition(state.sunPosition);

  for (let i = 0; i < state.spheres.length; i++) {
    const mesh = state.occluders[i];

    if (enabled && mesh && mesh.visible) {
      mesh.getWorldPosition(worldPosition);
      const radius = mesh.geometry.parameters.radius;
      state.spheres[i].set(worldPosition.x, worldPosition.y, worldPosition.z, radius);
    } else {
      state.spheres[i].set(0, 0, 0, 0);
    }
  }
}

function patchShader(shader, nightMap) {
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
varying vec3 vShadowWorldPosition;`
    )
    .replace(
      '#include <project_vertex>',
      `vShadowWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
#include <project_vertex>`
    );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
uniform vec4 shadowSpheres[2];
uniform vec3 shadowSunPosition;
varying vec3 vShadowWorldPosition;

float sphereShadow(vec3 point, vec3 direction, float sunDistance, vec4 sphere) {
  float radius = sphere.w;
  if (radius <= 0.0) return 0.0;

  vec3 toCenter = sphere.xyz - point;
  float alongRay = dot(toCenter, direction);
  if (alongRay <= 0.0 || alongRay >= sunDistance) return 0.0;

  vec3 closestOffset = direction * alongRay;
  float separation = length(toCenter - closestOffset);
  return 1.0 - smoothstep(radius * 0.9, radius, separation);
}

float celestialShadow(vec3 point) {
  vec3 toSun = shadowSunPosition - point;
  float sunDistance = length(toSun);

  if (sunDistance < 0.0001) return 0.0;

  vec3 direction = toSun / sunDistance;
  float first = sphereShadow(point, direction, sunDistance, shadowSpheres[0]);
  float second = sphereShadow(point, direction, sunDistance, shadowSpheres[1]);
  return min(max(first, second), 0.92);
}`
  );

  if (nightMap) {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
vec3 sunDirection = normalize((viewMatrix * vec4(
  shadowSunPosition - vShadowWorldPosition, 0.0)).xyz);
float night = 1.0 - smoothstep(-0.12, 0.08, dot(normal, sunDirection));
totalEmissiveRadiance *= night;`
    );
  }

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <lights_fragment_end>',
    `#include <lights_fragment_end>
float shadowAmount = celestialShadow(vShadowWorldPosition);
reflectedLight.directDiffuse *= 1.0 - shadowAmount;
reflectedLight.directSpecular *= 1.0 - shadowAmount;`
  );
}
