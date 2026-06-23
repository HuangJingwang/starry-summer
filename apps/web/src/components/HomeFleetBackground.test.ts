import { describe, expect, test } from 'vitest';

import {
  getRandomHomeFleetDelaySeconds,
  HOME_FLEET_MAX_DELAY_SECONDS,
  HOME_FLEET_MIN_DELAY_SECONDS,
} from './home-fleet-delay';

describe('HomeFleetBackground', () => {
  test('randomizes the first flagship pass between five and ten minutes', () => {
    expect(HOME_FLEET_MIN_DELAY_SECONDS).toBe(5 * 60);
    expect(HOME_FLEET_MAX_DELAY_SECONDS).toBe(10 * 60);
    expect(getRandomHomeFleetDelaySeconds(() => 0)).toBe(5 * 60);
    expect(getRandomHomeFleetDelaySeconds(() => 1)).toBe(10 * 60);
    expect(getRandomHomeFleetDelaySeconds(() => 0.5)).toBe(7.5 * 60);
  });
});
