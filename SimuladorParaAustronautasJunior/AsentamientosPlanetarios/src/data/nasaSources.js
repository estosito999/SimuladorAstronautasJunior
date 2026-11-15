// NASA references. FACT text is paraphrased from the cited pages; the "sim" text is how ZERO-G uses it (GAME SIMULATION VALUE).
export const SOURCES = [
  { id: 'moonbase', title: 'The Lunar South Pole Region', url: 'https://www.nasa.gov/reference/moonbase-environment/' },
  { id: 'marsfacts', title: 'Mars Facts', url: 'https://science.nasa.gov/mars/facts/' },
  { id: 'marsdust', title: 'Mars Atmospheric Temperature and Dust Storm Tracking', url: 'https://science.nasa.gov/resource/mars-atmospheric-temperature-and-dust-storm-tracking/' },
  { id: 'marsglance', title: 'Mars at a Glance', url: 'https://www.jpl.nasa.gov/news/press_kits/insight/landing/facts/mars-at-a-glance/' },
  { id: 'hazards', title: 'Human Spaceflight Hazards (NASA HRP)', url: 'https://www.nasa.gov/hrp/hazards/' },
  { id: 'radiation', title: 'Space Radiation (NASA HRP)', url: 'https://www.nasa.gov/hrp/hazard-space-radiation/' },
  { id: 'power', title: 'NASA POWER Docs', url: 'https://power.larc.nasa.gov/docs/' },
];

export const TOPICS = [
  { id: 'moon', icon: '🌑', title: 'Moon Environment', source: 'moonbase',
    fact: 'The Moon has almost no atmosphere. Near the lunar South Pole, light and shadow vary a lot: some ridges get long stretches of sunlight while nearby crater floors can stay in shadow.',
    sim: 'On the Moon your sunlight rises and falls in a repeating pattern, and an Extended Darkness hazard can nearly cut off solar power.' },
  { id: 'mars', icon: '🔴', title: 'Mars Environment', source: 'marsfacts',
    fact: 'Mars has a very thin atmosphere made mostly of carbon dioxide, is much colder than Earth, and its day (a sol) is a little longer than an Earth day.',
    sim: 'Mars cycles are called sols. Solar power is lower than on the Moon, and heating costs more power.' },
  { id: 'radiation', icon: '☢️', title: 'Radiation', source: 'radiation',
    fact: 'Beyond low Earth orbit, crews are exposed to galactic cosmic rays and solar particle events. Radiation can raise long-term health risks, so shielding and planning matter.',
    sim: 'Radiation is a cumulative meter. Radiation Shields, the Habitat and the Storm Shelter reduce it, and solar events add to it.' },
  { id: 'temperature', icon: '🌡️', title: 'Temperature', source: 'marsglance',
    fact: 'Mars is far colder than Earth on average, and temperatures can swing widely between day and night.',
    sim: 'Mars has a higher base heating load, and Extreme Cold Snap events raise it further.' },
  { id: 'dust', icon: '🌪️', title: 'Dust', source: 'marsdust',
    fact: 'Dust storms on Mars can grow large, and sometimes encircle the planet. NASA tracks them using atmospheric temperature and dust observations. Lunar dust is also sharp and sticks to equipment.',
    sim: 'Dust storms cut solar generation. Dust slowly dims panels, so you must clean them. On the Moon, dust harms crew and filters.' },
  { id: 'power', icon: '⚡', title: 'Power', source: 'power',
    fact: 'NASA POWER provides solar and meteorological data sets used for energy planning. The idea — match energy supply to sunlight and weather — applies on other worlds too.',
    sim: 'ZERO-G uses local, offline data inspired by this idea: generation depends on light, dust and storms; storage and consumption decide how long you last.' },
  { id: 'terrain', icon: '⛰️', title: 'Terrain', source: 'moonbase',
    fact: 'The lunar South Pole region is rugged, with craters and slopes that affect where crews can land, drive and place equipment.',
    sim: 'The 3D world is cratered and rocky, and science missions like crater mapping reward exploring it.' },
  { id: 'hazards', icon: '⚠️', title: 'Mission Hazards', source: 'hazards',
    fact: 'NASA’s Human Research Program groups spaceflight hazards into five areas: radiation, isolation and confinement, distance from Earth, gravity fields, and hostile or closed environments.',
    sim: 'Every hazard in ZERO-G is a decision with a trade-off, and at the end you can see which decisions helped or hurt.' },
];

export const FACT_CARDS = [
  { fact: 'Some regions near the lunar South Pole receive long periods of sunlight while nearby areas can remain in shadow.', impact: 'Choosing storage and managing consumption matters when your outpost depends on solar power.', source: 'moonbase' },
  { fact: 'Mars has a thin atmosphere and dust storms that can darken the sky.', impact: 'Dust storms reduce solar generation, so batteries and conservation become critical.', source: 'marsdust' },
  { fact: 'Space radiation is a major health risk for crews beyond low Earth orbit.', impact: 'Radiation Shields and the Storm Shelter reduce your crew’s dose.', source: 'radiation' },
  { fact: 'Signals between Earth and Mars take minutes each way.', impact: 'Mars crews decide alone — a Comm Relay gives you forecasts, not instant answers.', source: 'marsglance' },
];
export const sourceById = (id) => SOURCES.find((s) => s.id === id);
