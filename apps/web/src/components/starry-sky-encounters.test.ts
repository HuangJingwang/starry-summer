import { describe, expect, test } from 'vitest';

import { SHIP_APPEAR_INTERVAL_MS, selectFleetEncounterVariant } from './starry-sky-encounters';

describe('starry sky fleet encounter scheduling', () => {
  test('schedules one fleet encounter every five minutes', () => {
    expect(SHIP_APPEAR_INTERVAL_MS).toBe(5 * 60 * 1000);
  });

  test('uses a three-to-one small ship to flagship encounter weight', () => {
    expect(selectFleetEncounterVariant(() => 0)).toBe('small');
    expect(selectFleetEncounterVariant(() => 0.74)).toBe('small');
    expect(selectFleetEncounterVariant(() => 0.75)).toBe('flagship');
    expect(selectFleetEncounterVariant(() => 0.99)).toBe('flagship');
  });
});
