// Science missions. cycles = time, power = power per cycle, crew = crew assigned, points = science progress (GAME VALUES).
export const SCIENCE = {
  moon: [
    { id: 'regolith', name: 'Analyze Lunar Regolith', icon: '🪨', cycles: 1, power: 4, crew: 1, points: 10, chance: 0.95, desc: 'Study lunar soil — sharp, abrasive dust that sticks to everything.', real: 'Regolith studies help engineers design dust-tolerant suits, seals and machines.' },
    { id: 'ice', name: 'Search for Water Ice', icon: '🧊', cycles: 2, power: 6, crew: 2, points: 22, chance: 0.8, reward: { water: 10 }, desc: 'Scout shadowed ground for ice. Success tops up your water.', real: 'Ice in permanently shadowed regions could someday supply water, oxygen and fuel.' },
    { id: 'crater', name: 'Map a Crater', icon: '🗺️', cycles: 2, power: 5, crew: 1, points: 16, chance: 0.9, desc: 'Survey a crater rim to plan safe routes.', real: 'Detailed terrain maps help rovers and crews avoid hazards and find sunlit paths.' },
    { id: 'solarRad', name: 'Study Solar Radiation', icon: '☢️', cycles: 1, power: 5, crew: 1, points: 12, chance: 0.95, desc: 'Log particle data to improve radiation forecasts.', real: 'Better radiation data helps NASA decide how much shielding future crews need.' },
    { id: 'seismic', name: 'Deploy a Seismic Sensor', icon: '📈', cycles: 1, power: 3, crew: 1, points: 10, chance: 0.9, desc: 'Listen for moonquakes and impacts.', real: 'Seismometers reveal what is beneath the surface — and how often rocks hit it.' },
  ],
  mars: [
    { id: 'soil', name: 'Analyze Soil Composition', icon: '🪨', cycles: 1, power: 4, crew: 1, points: 10, chance: 0.95, desc: 'Test Martian soil for minerals and chemistry.', real: 'Soil chemistry tells us what can be grown, mined or used to build.' },
    { id: 'dust', name: 'Study Atmospheric Dust', icon: '🌫️', cycles: 2, power: 5, crew: 1, points: 16, chance: 0.9, desc: 'Sample the dust that fuels Mars storms.', real: 'Tracking dust helps forecast storms that can cut solar power.' },
    { id: 'ice', name: 'Search for Water Ice', icon: '🧊', cycles: 2, power: 6, crew: 2, points: 22, chance: 0.8, reward: { water: 10 }, desc: 'Scout for subsurface ice. Success tops up your water.', real: 'Water ice is a key resource target for long-term Mars exploration.' },
    { id: 'weather', name: 'Monitor Weather', icon: '🌡️', cycles: 1, power: 3, crew: 1, points: 10, chance: 0.95, desc: 'Record pressure, temperature and wind.', real: 'Weather stations give engineers real conditions to design against.' },
    { id: 'rocks', name: 'Collect Rock Samples', icon: '⛏️', cycles: 2, power: 6, crew: 2, points: 20, chance: 0.85, desc: 'Gather samples that could hold clues to Mars’ past.', real: 'Rock samples help scientists learn whether Mars was once habitable.' },
  ],
};
