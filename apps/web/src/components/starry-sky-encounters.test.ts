import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { SHIP_APPEAR_INTERVAL_MS } from './starry-sky-encounters';

describe('starry sky fleet encounter scheduling', () => {
  test('schedules one legacy small ship encounter every two minutes', () => {
    expect(SHIP_APPEAR_INTERVAL_MS).toBe(2 * 60 * 1000);
  });

  test('uses the two legacy small ship variants instead of the canvas flagship lottery', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/StarrySkyCanvas.tsx'), 'utf8');

    expect(source).toContain("variant: 'scout'");
    expect(source).toContain("variant: 'voyager'");
    expect(source).toContain('drawScoutStarship');
    expect(source).toContain('drawVoyagerStarship');
    expect(source).not.toContain('selectFleetEncounterVariant()');
    expect(source).not.toContain('createFeaturedStarship(width, height)');
  });
});
