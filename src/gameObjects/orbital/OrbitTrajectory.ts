/**
 * Utilidades matemáticas para la cinemática orbital en Órbita Terrestre Baja (LEO).
 */
export interface OrbitalParameters {
  altitudeKm: number;
  velocityKmS: number;
  inclinationDeg: number;
  periodMinutes: number;
}

export const ISS_ORBITAL_CONSTANTS: OrbitalParameters = {
  altitudeKm: 420.5,
  velocityKmS: 7.66,
  inclinationDeg: 51.64,
  periodMinutes: 92.68,
};

export function calculateOrbitalPosition(t: number, radius = 55): [number, number, number] {
  const angle = (t * (2 * Math.PI)) / (ISS_ORBITAL_CONSTANTS.periodMinutes * 60);
  const incRad = (ISS_ORBITAL_CONSTANTS.inclinationDeg * Math.PI) / 180;

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * Math.sin(incRad) * (radius * 0.45);
  const z = Math.sin(angle) * Math.cos(incRad) * radius;

  return [x, y, z];
}
