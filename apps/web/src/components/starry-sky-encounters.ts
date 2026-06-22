export type FleetEncounterVariant = 'small' | 'flagship';

export const SHIP_APPEAR_INTERVAL_MS = 3 * 60 * 1000;

const SMALL_SHIP_WEIGHT = 3;
const FLAGSHIP_WEIGHT = 1;
const SMALL_SHIP_THRESHOLD = SMALL_SHIP_WEIGHT / (SMALL_SHIP_WEIGHT + FLAGSHIP_WEIGHT);

export function selectFleetEncounterVariant(randomNumber: () => number = Math.random): FleetEncounterVariant {
  return randomNumber() < SMALL_SHIP_THRESHOLD ? 'small' : 'flagship';
}
