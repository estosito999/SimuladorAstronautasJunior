export function setupStartMenu(applySettings) {
  const menu = document.getElementById('start-menu');
  const startButton = document.getElementById('start-button');
  const settingsButton = document.getElementById('settings-button');
  const music = document.getElementById('background-music');
  const musicOption = document.getElementById('start-music');

  function getSettings() {
    const selectedQuality = document.querySelector('input[name="quality"]:checked');

    const planets = {};
    for (const option of document.querySelectorAll('[data-planet]')) {
      planets[option.dataset.planet] = option.checked;
    }
    return {
      quality: selectedQuality.value,
      musicOn: musicOption.checked,
      legendVisible: document.getElementById('start-legend').checked,
      planets
    };
  }

  function startMenuMusic() {
    if (!musicOption.checked || !music.paused) return;

    music.play().then(() => {
      document.removeEventListener('pointerdown', startMenuMusic, true);
      document.removeEventListener('keydown', startMenuMusic, true);
    }).catch(() => {});
  }

  function closeMenu() {
    applySettings(getSettings());
    menu.classList.add('closed');

    startButton.textContent = 'Apply settings';
  }

  startButton.addEventListener('click', closeMenu);

  settingsButton.addEventListener('click', () => {
    menu.classList.remove('closed');
  });

  musicOption.addEventListener('change', () => {
    if (musicOption.checked) {
      startMenuMusic();
    } else {
      music.pause();
    }
  });

  startMenuMusic();
  document.addEventListener('pointerdown', startMenuMusic, true);
  document.addEventListener('keydown', startMenuMusic, true);
}
