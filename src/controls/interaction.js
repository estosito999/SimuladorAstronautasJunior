import { setupCameraButtons, setCameraMode } from './cameraButtons.js';
import { setupTimeButtons } from './timeButtons.js';

const CONTROL_KEYS = 'wasdlpocqerftgjkuixmh';

export function createInteractionState(legendEl, legendToggleEl) {
  const state = {
    keys: {},
    headlightsOn: false,
    panelsOpen: false,
    gripperOpen: true,
    cameraMode: 0,
    planetTimeScale: 1,
    cameraOrbitX: 0,
    cameraOrbitY: 0,
    cameraRoll: 0,
    cameraZoom: 0,
    cameraCenterRequest: 0,
    musicOn: true,
    legendVisible: false
  };

  const musicButton = document.getElementById('music-toggle');
  const music = document.getElementById('background-music');

  function toggleLegend() {
    state.legendVisible = !state.legendVisible;
    updateLegend(state, legendEl, legendToggleEl);
  }

  function toggleMusic() {
    state.musicOn = !state.musicOn;
    updateMusic(state, musicButton);

    if (state.musicOn) {
      music.play().catch(() => {
        state.musicOn = false;
        updateMusic(state, musicButton);
      });
    } else {
      music.pause();
    }
  }

  updateLegend(state, legendEl, legendToggleEl);
  updateMusic(state, musicButton);
  legendToggleEl.addEventListener('click', toggleLegend);
  musicButton.addEventListener('click', toggleMusic);
  setupCameraButtons(state);
  setupTimeButtons(state);

  window.addEventListener('keydown', (event) => {
    const key = readKey(event);
    state.keys[key] = true;
    if (event.repeat) return;

    if (key === 'l') state.headlightsOn = !state.headlightsOn;
    if (key === 'p') state.panelsOpen = !state.panelsOpen;
    if (key === 'o') state.gripperOpen = !state.gripperOpen;
    if (key === 'm') toggleMusic();
    if (key === 'h') toggleLegend();
    if (key === 'c') setCameraMode(state, state.cameraMode === 1 ? 0 : 1);
  });

  window.addEventListener('keyup', (event) => {
    state.keys[readKey(event)] = false;
  });

  return state;
}

function readKey(event) {
  const key = event.code.startsWith('Key')
    ? event.code.slice(3).toLowerCase()
    : event.key.toLowerCase();

  if (key.length === 1 && CONTROL_KEYS.includes(key)) event.preventDefault();
  return key;
}

export function updateLegend(state, legend, button) {
  legend.classList.toggle('hidden', !state.legendVisible);
  button.textContent = state.legendVisible ? 'Hide legend' : 'Show legend';
  button.setAttribute('aria-expanded', String(state.legendVisible));
}

export function updateMusic(state, button) {
  button.textContent = state.musicOn ? 'Music: On' : 'Music: Off';
  button.classList.toggle('active', state.musicOn);
  button.setAttribute('aria-pressed', String(state.musicOn));
}
