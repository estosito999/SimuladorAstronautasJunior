import { moonData } from './moonData.js';
import { marsData } from './marsData.js';
export const DESTINATIONS = { moon: moonData, mars: marsData };
export const getDest = (id) => DESTINATIONS[id] || moonData;
