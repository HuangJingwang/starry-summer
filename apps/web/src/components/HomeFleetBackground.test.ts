import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  getRandomHomeFleetDelaySeconds,
  HOME_FLEET_MAX_DELAY_SECONDS,
  HOME_FLEET_MIN_DELAY_SECONDS,
} from './home-fleet-delay';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('HomeFleetBackground', () => {
  test('randomizes the first flagship pass between five and ten minutes', () => {
    expect(HOME_FLEET_MIN_DELAY_SECONDS).toBe(5 * 60);
    expect(HOME_FLEET_MAX_DELAY_SECONDS).toBe(10 * 60);
    expect(getRandomHomeFleetDelaySeconds(() => 0)).toBe(5 * 60);
    expect(getRandomHomeFleetDelaySeconds(() => 1)).toBe(10 * 60);
    expect(getRandomHomeFleetDelaySeconds(() => 0.5)).toBe(7.5 * 60);
  });

  test('renders the flagship only while the active theme is night', () => {
    const source = readSource('src/components/HomeFleetBackground.tsx');

    expect(source).toContain("type SiteTheme = 'summer-day' | 'summer-night';");
    expect(source).toContain("function getTheme(): SiteTheme");
    expect(source).toContain('const [theme, setTheme] = useState<SiteTheme | null>(null);');
    expect(source).toContain('setTheme(getTheme());');
    expect(source).toContain('new MutationObserver(() => {');
    expect(source).toContain("themeObserver.observe(document.documentElement, { attributeFilter: ['data-theme'], attributes: true });");
    expect(source).toContain("if (theme !== 'summer-night') {");
    expect(source).toContain('return null;');
  });
});
