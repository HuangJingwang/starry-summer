export const HOME_FLEET_MIN_DELAY_SECONDS = 5 * 60;
export const HOME_FLEET_MAX_DELAY_SECONDS = 10 * 60;

export function getRandomHomeFleetDelaySeconds(randomNumber: () => number = Math.random): number {
  const range = HOME_FLEET_MAX_DELAY_SECONDS - HOME_FLEET_MIN_DELAY_SECONDS;

  return Math.round(HOME_FLEET_MIN_DELAY_SECONDS + randomNumber() * range);
}
