// Hazards & decisions. Effects are GAME SIMULATION VALUES inspired by NASA hazard research.
// quality: 'best' | 'ok' | 'poor' (or a function of mission state) — used for scoring + report.
const n = (s, t) => s.modules.filter((m) => m.type === t).length;
const batt = (s) => n(s, 'battery');

export const HAZARDS = [
  {
    id: 'solar_flare', dest: ['moon', 'mars'], title: 'Solar Radiation Event', icon: '☢️', severity: 'HIGH', weight: 3, minCycle: 2, shake: true,
    desc: 'A burst of energetic particles from the Sun is heading for your outpost. Exposure rises fast outside shielding.',
    start: { radiation: 8, shieldable: true },
    choices: [
      { id: 'shelter', label: 'Move crew into the storm shelter', sub: 'Smallest dose • science pauses for a cycle', requires: 'shelter',
        delta: { radiation: 2 }, else: { radiation: 10, crewHealth: -4 },
        elseWhat: 'You had no storm shelter, so the crew crowded into the habitat core and still took a hit.',
        what: 'The crew sheltered until the particle burst passed.', effect: { id: 'sheltering', label: 'Crew sheltering', duration: 1, mods: { sci: 0 } },
        q: (s) => (n(s, 'shelter') ? 'best' : 'poor') },
      { id: 'core', label: 'Retreat to the habitat core and keep working', sub: 'Moderate dose • science slows', delta: { radiation: 8 }, effect: { id: 'core', label: 'Reduced activity', duration: 1, mods: { sci: 0.5 } },
        what: 'The crew stayed inside the thickest part of the habitat.', q: 'ok' },
      { id: 'eva', label: 'Finish the outside work first', sub: 'Big dose • science keeps going', delta: { radiation: 20, crewHealth: -8, science: 3 },
        what: 'The crew stayed outside to finish work and absorbed a heavy dose.', q: 'poor' },
    ],
    why: 'Solar particle events add radiation quickly. Shielding, shelter and timing decide how much reaches the crew.',
    real: 'NASA’s Human Research Program studies space radiation because crews beyond low Earth orbit have less natural protection.',
  },
  {
    id: 'lunar_dust', dest: ['moon'], title: 'Lunar Dust Exposure', icon: '🌫️', severity: 'MEDIUM', weight: 3, minCycle: 2,
    desc: 'Fine, sharp lunar dust has followed the crew through the airlock. It clings to suits, seals and filters.',
    start: { delta: { crewHealth: -3 } },
    choices: [
      { id: 'clean', label: 'Run a deep clean of suits and airlock', sub: 'Uses power • protects crew and filters', delta: { power: -6, crewHealth: 3 }, what: 'Suits, filters and the airlock got a full cleaning cycle.', q: 'best' },
      { id: 'limit', label: 'Limit outside activity for 2 cycles', sub: 'Less dust • science slows', effect: { id: 'limitEVA', label: 'Limited EVA', duration: 2, mods: { sci: 0.5 } }, delta: { crewHealth: -1 }, what: 'Crew stayed inside more, so less dust came in.', q: 'ok' },
      { id: 'ignore', label: 'Ignore it and keep going', sub: 'No cost now • life support wears down', effect: { id: 'dustyLS', label: 'Dusty filters', duration: 3, mods: { ls: 0.8 } }, delta: { crewHealth: -6 }, what: 'Dust built up in filters and seals; life support lost efficiency.', q: 'poor' },
    ],
    why: 'Lunar dust is abrasive and sticks to hardware, so it harms both people and machines.',
    real: 'Apollo astronauts reported dust clinging to suits and tools; NASA designs dust mitigation into modern surface systems.',
  },
  {
    id: 'micrometeoroid', dest: ['moon', 'mars'], title: 'Micrometeoroid Impact', icon: '☄️', severity: 'MEDIUM', weight: 2, minCycle: 3, shake: true,
    desc: 'A fast-moving particle has struck the outpost. One module is damaged.',
    start: { damage: 35 },
    choices: [
      { id: 'repair', label: 'Send a repair crew now', sub: 'Costs 3 build points and power • mostly fixed', cost: { buildPoints: 3 }, delta: { power: -4 }, repair: 0.8, what: 'The crew patched the damaged module quickly.', q: 'best' },
      { id: 'seal', label: 'Seal off the area and repair later', sub: 'Cheap now • module stays weak', repair: 0.3, what: 'The damaged area was sealed; it works at reduced strength.', q: 'ok' },
      { id: 'ignore', label: 'Ignore the damage', sub: 'Free • leaks and wear continue', delta: { oxygen: -8 }, what: 'The unrepaired damage leaked oxygen.', q: 'poor' },
    ],
    why: 'Even tiny, fast particles can damage equipment, so outposts need repair plans.',
    real: 'On the Moon, with almost no atmosphere, small meteoroids reach the surface at high speed.',
  },
  {
    id: 'darkness', dest: ['moon'], title: 'Extended Darkness', icon: '🌘', severity: 'HIGH', weight: 3, minCycle: 3,
    desc: 'Your site has slipped into a long shadow. Solar panels are barely producing energy.',
    start: { effect: { id: 'dark', label: 'Darkness: solar −85%', duration: 3, mods: { solar: 0.15 } } },
    choices: [
      { id: 'conserve', label: 'Enter Power Conservation Mode', sub: 'Lab and science paused • saves power', setConserve: true, what: 'You paused science and trimmed loads while the sun was gone.', q: (s) => (batt(s) >= 1 ? 'best' : 'ok') },
      { id: 'continue', label: 'Continue normal operations', sub: 'Science keeps going • risk draining batteries', delta: { science: 3 }, what: 'You drew down the batteries to keep working.', q: (s) => (s.resources.power >= 80 && batt(s) >= 2 ? 'ok' : 'poor') },
      { id: 'shutdown', label: 'Shut down non-essential systems', sub: 'Biggest savings • crew comfort penalty', setConserve: true, effect: { id: 'shutdown', label: 'Non-essential systems off', duration: 3, mods: { demand: 0.75 } }, delta: { crewHealth: -3 }, what: 'Non-essential systems went dark and the crew felt the cold.', q: 'ok' },
    ],
    why: 'Solar power depends on light. When light disappears, stored energy and low consumption keep you alive.',
    real: 'NASA notes that near the lunar South Pole some areas get long sunlight while others stay in shadow, which makes power planning critical.',
  },
  {
    id: 'panel_dust', dest: ['moon', 'mars'], title: 'Solar Panel Dust Buildup', icon: '🧹', severity: 'LOW', weight: 3, minCycle: 2,
    desc: 'A layer of dust is dimming your solar panels.',
    start: { dust: 30 },
    choices: [
      { id: 'clean', label: 'Clean the panels now', sub: 'Uses power • restores output', delta: { power: -4 }, setDust: 8, what: 'Crew brushed the panels clean.', q: 'best' },
      { id: 'later', label: 'Schedule cleaning next cycle', sub: 'Slightly reduced output meanwhile', effect: { id: 'dimPanels', label: 'Dim panels', duration: 1, mods: { solar: 0.9 } }, what: 'You postponed cleaning; panels worked a little worse.', q: 'ok' },
      { id: 'ignore', label: 'Ignore it', sub: 'Free now • output keeps dropping', what: 'You left the dust in place.', q: (s) => (s.dust > 60 ? 'poor' : 'ok') },
    ],
    why: 'Dust on panels blocks light, so output falls even when the sun is bright.',
    real: 'Dust accumulation reduced solar output on past Mars rovers, which is why panel cleaning is a real design concern.',
  },
  {
    id: 'equipment', dest: ['moon', 'mars'], title: 'Equipment Failure', icon: '🛠️', severity: 'MEDIUM', weight: 2, minCycle: 3,
    desc: 'A system has failed and one module is running poorly.',
    start: { damage: 40 },
    choices: [
      { id: 'repair', label: 'Full repair', sub: 'Costs 4 build points • restores module', cost: { buildPoints: 4 }, repair: 1, what: 'Technicians restored the module.', q: 'best' },
      { id: 'spare', label: 'Swap in spare parts', sub: 'Costs 2 build points • partly fixed', cost: { buildPoints: 2 }, repair: 0.6, what: 'Spare parts brought it part-way back.', q: 'ok' },
      { id: 'degraded', label: 'Run degraded', sub: 'Free • output stays weak', repair: 0, what: 'You left the module running at reduced capacity.', q: 'poor' },
    ],
    why: 'Machines wear out. Spare parts and maintenance are as important as the machines themselves.',
    real: 'Long missions plan spare parts and repair skills because resupply from Earth is slow or impossible.',
  },
  {
    id: 'comm_loss', dest: ['moon', 'mars'], title: 'Communication Disruption', icon: '📡', severity: 'LOW', weight: 2, minCycle: 2,
    desc: 'The link to mission control is degraded. Forecasts and guidance are delayed.',
    start: { effect: { id: 'commLoss', label: 'Comm link degraded', duration: 3, mods: { comm: -50 } } },
    choices: [
      { id: 'relay', label: 'Switch to backup relay', sub: 'Needs a Comm Relay • restores most of the link', requires: 'comms', delta: { power: -2 }, effect: { id: 'relay', label: 'Backup relay', duration: 3, mods: { comm: 35 } }, else: { crewHealth: -2 }, elseWhat: 'No Comm Relay was installed, so you waited it out.', what: 'The relay brought the link mostly back.', q: (s) => (n(s, 'comms') ? 'best' : 'poor') },
      { id: 'wait', label: 'Wait for the link to recover', sub: 'Free • you fly blind for a few cycles', what: 'You waited for the link to recover.', q: 'ok' },
      { id: 'auto', label: 'Run on crew autonomy', sub: 'Science slows • crew decides alone', effect: { id: 'auto', label: 'Crew autonomy', duration: 2, mods: { sci: 0.7 } }, what: 'The crew handled decisions on their own.', q: 'ok' },
    ],
    why: 'When communication is cut, crews must act independently and rely on onboard systems.',
    real: 'On Mars, signals take several minutes each way, so crews cannot wait for real-time instructions.',
  },
  {
    id: 'dust_storm', dest: ['mars'], title: 'Regional Dust Storm Detected', icon: '🌪️', severity: 'HIGH', weight: 4, minCycle: 3, storm: 0.7,
    desc: 'A wall of dust is crossing the region. Sunlight is scattered before it reaches your panels. Solar generation falls by 40%.',
    start: { effect: { id: 'storm', label: 'Dust storm: solar −40%', duration: 4, mods: { solar: 0.6 } }, dust: 15 },
    choices: [
      { id: 'conserve', label: 'Enter Power Conservation Mode', sub: 'Lab and science paused • saves power', setConserve: true, what: 'You paused science and trimmed non-essential loads while the storm passed.', q: (s) => (batt(s) >= 1 ? 'best' : 'ok') },
      { id: 'continue', label: 'Continue normal operations', sub: 'Keep science progress • risk battery depletion', delta: { science: 3 }, what: 'You kept science running through the storm and drew on the batteries.', q: (s) => (s.resources.power >= 80 && batt(s) >= 2 ? 'ok' : 'poor') },
      { id: 'shutdown', label: 'Shut down non-essential systems', sub: 'Biggest savings • crew comfort penalty', setConserve: true, effect: { id: 'shutdown', label: 'Non-essential systems off', duration: 4, mods: { demand: 0.75 } }, delta: { crewHealth: -3 }, what: 'Non-essential systems went dark; the crew was uncomfortable but power held.', q: 'ok' },
    ],
    why: 'Dust in the air blocks sunlight, so generation falls while consumption stays the same. Storage and conservation close the gap.',
    real: 'NASA tracks Mars dust storms because they can reduce solar energy for days or weeks.',
  },
  {
    id: 'dust_storm_global', dest: ['mars'], title: 'Global Dust Storm', icon: '🌪️', severity: 'CRITICAL', weight: 2, minCycle: 8, storm: 1, shake: true,
    desc: 'A planet-wide dust storm has darkened the sky. Solar generation falls by 80% for several cycles.',
    start: { effect: { id: 'gstorm', label: 'Global storm: solar −80%', duration: 6, mods: { solar: 0.2 } }, dust: 25 },
    choices: [
      { id: 'conserve', label: 'Full conservation mode', sub: 'Science paused • stretch the batteries', setConserve: true, effect: { id: 'lowload', label: 'Minimal loads', duration: 6, mods: { demand: 0.85 } }, what: 'You cut loads to the bone and rationed energy for the long storm.', q: 'best' },
      { id: 'balanced', label: 'Keep life support + greenhouse, pause the rest', sub: 'Food stays up • modest savings', setConserve: true, what: 'You protected life support and food production.', q: 'ok' },
      { id: 'push', label: 'Push on as normal', sub: 'Science continues • likely blackout', delta: { science: 4 }, what: 'You ran as normal and the batteries drained fast.', q: 'poor' },
    ],
    why: 'A long, planet-wide dimming event means energy reserves — not generation — decide survival.',
    real: 'NASA has observed global dust storms on Mars that circle the planet and affect solar-powered spacecraft.',
  },
  {
    id: 'extreme_cold', dest: ['mars'], title: 'Extreme Cold Snap', icon: '🥶', severity: 'MEDIUM', weight: 3, minCycle: 3,
    desc: 'Temperatures have plunged. Heaters need more power to keep the habitat and equipment warm.',
    start: { effect: { id: 'cold', label: 'Cold: heating demand +30%', duration: 3, mods: { demand: 1.3 } } },
    choices: [
      { id: 'heat', label: 'Boost heating', sub: 'Uses power • crew stays comfortable', delta: { power: -7, crewHealth: 1 }, what: 'You boosted heating and kept the crew warm.', q: (s) => (s.resources.power >= 40 ? 'best' : 'ok') },
      { id: 'insulate', label: 'Insulate and conserve', sub: 'Saves power • science slows', setConserve: true, effect: { id: 'insul', label: 'Insulating', duration: 3, mods: { demand: 0.85 } }, what: 'You sealed off unused areas and conserved.', q: 'ok' },
      { id: 'ignore', label: 'Ignore it', sub: 'Free • crew and equipment suffer', delta: { crewHealth: -8, oxygen: -3 }, what: 'The cold stressed the crew and the equipment.', q: 'poor' },
    ],
    why: 'Cold increases heating demand, which draws from the same limited power supply.',
    real: 'Mars is far colder than Earth on average, so heat is a major part of an outpost’s energy budget.',
  },
];

export const getHazard = (id) => HAZARDS.find((h) => h.id === id);
