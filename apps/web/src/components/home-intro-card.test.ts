import { describe, expect, test } from 'vitest';

import { getHomeGreeting } from '@/lib/home-greeting';

describe('HomeIntroCard', () => {
  test('uses the reference greeting rhythm across the day', () => {
    expect(getHomeGreeting(new Date('2026-06-30T05:59:00'))).toBe('Good Night');
    expect(getHomeGreeting(new Date('2026-06-30T06:00:00'))).toBe('Good Morning');
    expect(getHomeGreeting(new Date('2026-06-30T12:00:00'))).toBe('Good Afternoon');
    expect(getHomeGreeting(new Date('2026-06-30T18:00:00'))).toBe('Good Evening');
    expect(getHomeGreeting(new Date('2026-06-30T22:00:00'))).toBe('Good Night');
  });
});
