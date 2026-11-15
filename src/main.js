import { setRenderQuality } from './rendering/quality.js';
import * as THREE from 'three';
import { createProjectTextures } from './rendering/textures.js';
import { createSceneContext, setupResizeHandler } from './scene/sceneSetup.js';
import { createSun } from './solarSystem/sun.js';
import { createEarth, updateEarth } from './solarSystem/planets/earth.js';
import { createPlanets, updatePlanets } from './solarSystem/planets/planets.js';
import { createMoon, updateMoon } from './solarSystem/moons/moon.js';
import { createRover, updateRover } from './models/rover.js';
import { moveRover } from './models/roverMotion.js';
import { createInteractionState, updateLegend, updateMusic } from './controls/interaction.js';
import { setupStartMenu } from './controls/startMenu.js';
import { updateCamera } from './scene/camera.js';
import { updateLighting } from './rendering/lighting.js';
import { createStars } from './scene/stars.js';
import {
  createShadowState,
  applyShadowShader,
  updateShadowState
} from './rendering/celestialShadows.js';
import { EARTH_POSITION, MOON_CENTER } from './solarSystem/spaceScale.js';

const context = createSceneContext();
const textures = createProjectTextures();
context.scene.background = textures.spaceTexture;
context.scene.backgroundIntensity = 0.08;

const sunModel = createSun(context.scene);
const stars = createStars(context.scene);
const earth = createEarth(context.scene, textures);
const planets = createPlanets(context.scene, textures);

const lunarOrbitGroup = new THREE.Group();
lunarOrbitGroup.name = 'LunarOrbitGroup';
lunarOrbitGroup.position.copy(earth.earth.position);
lunarOrbitGroup.rotation.y = Math.random() * Math.PI * 2;
context.scene.add(lunarOrbitGroup);

const moonModel = createMoon(lunarOrbitGroup, {
  moonTexture: textures.moonTexture,
  moonCenter: MOON_CENTER.clone().sub(EARTH_POSITION)
});

const roverModel = createRover(moonModel.rotationGroup, textures);

roverModel.group.position
  .copy(moonModel.surface.center)
  .add(new THREE.Vector3(0, moonModel.surface.radius + moonModel.surface.roverHeight, 0));

const moonShadowState = createShadowState([earth.earth], sunModel.sun);
const roverShadowState = createShadowState([earth.earth, moonModel.moon], sunModel.sun);

const planetLightingState = createShadowState([], sunModel.sun);
applyShadowShader(earth.earth, planetLightingState, true);
for (const model of Object.values(planets)) {
  applyShadowShader(model.planet, planetLightingState);
}

applyShadowShader(moonModel.moon, moonShadowState);
applyShadowShader(roverModel.group, roverShadowState);

const legendEl = document.getElementById('legend');
const legendToggleEl = document.getElementById('legend-toggle');
const interactionState = createInteractionState(legendEl, legendToggleEl);
const music = document.getElementById('background-music');
const musicButton = document.getElementById('music-toggle');
music.volume = 0.35;

function updateShadows() {
  const quality = context.renderer.currentQuality;
  updateShadowState(planetLightingState, true);
  updateShadowState(moonShadowState, quality !== 'low');
  updateShadowState(roverShadowState, quality === 'high');
}

function applyRuntimeSettings(settings) {
  setRenderQuality(context.renderer, sunModel.sunLight, stars, settings.quality);

  updateShadows();

  const visibility = settings.planets;
  earth.earth.visible = visibility.earth !== false;
  for (const name in planets) {
    planets[name].planet.visible = visibility[name] !== false;
  }

  interactionState.musicOn = settings.musicOn !== false;
  updateMusic(interactionState, musicButton);

  if (interactionState.musicOn) {
    music.play().catch(() => {});
  } else {
    music.pause();
  }

  interactionState.legendVisible = settings.legendVisible === true;
  updateLegend(interactionState, legendEl, legendToggleEl);
}

applyRuntimeSettings({
  quality: 'low',
  musicOn: true,
  legendVisible: false,
  planets: {}
});
setupStartMenu(applyRuntimeSettings);

document.getElementById('capture-button').addEventListener('click', () => {
  context.renderer.render(context.scene, context.camera);
  context.renderer.domElement.toBlob((blob) => {
    if (!blob) return;

    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rover-${date}.jpg`;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.92);
});

const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const planetDt = dt * interactionState.planetTimeScale;

  moveRover(roverModel, interactionState.keys, dt, moonModel.surface);
  updateRover(roverModel, interactionState, dt);
  updateEarth(earth, planetDt);
  lunarOrbitGroup.position.copy(earth.earth.position);
  lunarOrbitGroup.rotation.y += planetDt * 0.025;
  updateMoon(moonModel, planetDt);
  updatePlanets(planets, planetDt);

  updateShadows();

  sunModel.sun.rotation.y += dt * 0.2;
  updateLighting({ sunModel, roverModel, state: interactionState });

  updateCamera(context.camera, context.controls, roverModel.group,
    moonModel.moon, interactionState, dt);

  context.renderer.render(context.scene, context.camera);
  requestAnimationFrame(animate);
}

setupResizeHandler(context.camera, context.renderer);

animate();
