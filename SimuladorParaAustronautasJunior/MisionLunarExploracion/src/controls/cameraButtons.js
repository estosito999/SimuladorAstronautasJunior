export function setupCameraButtons(state) {
  const cameraFreeEl = document.getElementById('camera-free');

  function bindHoldButton(id, axis, value) {
    const button = document.getElementById(id);

    function start(event) {
      event.preventDefault();
      if (state.cameraMode === 1 && axis !== 'cameraZoom') {
        setCameraMode(state, 0);
      }
      state[axis] = value;
      button.setPointerCapture?.(event.pointerId);
    }

    function stop(event) {
      if (state[axis] === value) state[axis] = 0;
      if (event?.pointerId !== undefined && button.hasPointerCapture?.(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
    }

    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointercancel', stop);
    button.addEventListener('lostpointercapture', stop);
  }

  bindHoldButton('camera-left', 'cameraOrbitX', 1);
  bindHoldButton('camera-right', 'cameraOrbitX', -1);
  bindHoldButton('camera-up', 'cameraOrbitY', 1);
  bindHoldButton('camera-down', 'cameraOrbitY', -1);
  bindHoldButton('camera-roll-left', 'cameraRoll', 1);
  bindHoldButton('camera-roll-right', 'cameraRoll', -1);
  bindHoldButton('camera-zoom-in', 'cameraZoom', 1);
  bindHoldButton('camera-zoom-out', 'cameraZoom', -1);

  cameraFreeEl.addEventListener('click', () => {
    setCameraMode(state, state.cameraMode === 2 ? 0 : 2);
  });

  document.getElementById('camera-center').addEventListener('click', () => {
    setCameraMode(state, 0);
    state.cameraCenterRequest += 1;
    state.cameraOrbitX = 0;
    state.cameraOrbitY = 0;
    state.cameraRoll = 0;
    state.cameraZoom = 0;
  });
}

export function setCameraMode(state, mode) {
  state.cameraMode = mode;
  const button = document.getElementById('camera-free');
  button.classList.toggle('active', mode === 2);
  button.textContent = mode === 2 ? 'Return to rover' : 'Free camera';
}
