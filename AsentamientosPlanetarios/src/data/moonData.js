// Moon environment. NASA FACTS are paraphrased and attributed in nasaSources.js.
// Everything under `sim` is a GAME SIMULATION VALUE.
export const moonData = {
  id: 'moon', name: 'MOON', title: 'LUNAR OUTPOST', icon: '🌑',
  tagline: 'Survive the long dark near the lunar South Pole.',
  difficulty: 'MEDIUM', avgDuration: '10–30 cycles', unitLabel: 'DAY',
  challenges: ['Radiation', 'Lunar dust', 'Light & shadow', 'Power management', 'Micrometeoroids'],
  levels: { Radiation: 'HIGH', Temperature: 'CRITICAL', Dust: 'HIGH', Atmosphere: 'CRITICAL', 'Solar power': 'MEDIUM', Terrain: 'HIGH' },
  primary: 'Keeping power flowing through long periods of low sunlight.',
  sim: {
    lightPattern: [1, 1, 1, 1, 0.9, 0.7, 0.4, 0.4, 0.7, 0.95],
    baseLoad: 3, dustRate: 4, radiationTotal: 85, seasonLen: 10,
    commDelay: '~1.3 s one way', commBase: 70,
  },
  welcome: ['Welcome to the Moon, Commander.', "Let's build something that can survive the darkness."],
};
