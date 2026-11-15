export const marsData = {
  id: 'mars', name: 'MARS', title: 'MARTIAN OUTPOST', icon: '🔴',
  tagline: 'Hold the line against dust storms, cold and distance.',
  difficulty: 'HARD', avgDuration: '10–30 cycles', unitLabel: 'SOL',
  challenges: ['Dust storms', 'Radiation', 'Cold', 'Thin atmosphere', 'Power reduction'],
  levels: { Radiation: 'HIGH', Temperature: 'CRITICAL', Dust: 'CRITICAL', Atmosphere: 'HIGH', 'Solar power': 'MEDIUM', Terrain: 'MEDIUM' },
  primary: 'Dust storms can choke solar power just when you need it most.',
  sim: {
    solarBase: 0.62, baseLoad: 6, dustRate: 3, radiationTotal: 65, seasonLen: 12,
    commDelay: 'minutes one way', commBase: 55,
  },
  welcome: ['Welcome to Mars, Commander.', "Let's keep everyone alive."],
};
