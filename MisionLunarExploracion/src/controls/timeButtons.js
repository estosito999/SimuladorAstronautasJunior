export function setupTimeButtons(state) {
  const controls = [
    [document.getElementById('time-backward'), -10],
    [document.getElementById('time-forward'), 10]
  ];

  function setSpeed(speed) {
    state.planetTimeScale = speed;
    for (const [button, buttonSpeed] of controls) {
      const active = speed === buttonSpeed;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  }

  for (const [button, speed] of controls) {
    function stop() {
      if (state.planetTimeScale === speed) setSpeed(1);
    }

    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture(event.pointerId);
      setSpeed(speed);
    });

    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture', 'keyup', 'blur']) {
      button.addEventListener(name, stop);
    }

    button.addEventListener('keydown', (event) => {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      event.stopPropagation();
      setSpeed(speed);
    });
  }

  window.addEventListener('blur', () => setSpeed(1));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setSpeed(1);
  });
}
