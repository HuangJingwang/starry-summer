import { describe, expect, test } from 'vitest';

import { getHomeGreeting } from '@/lib/home-greeting';

describe('HomeIntroCard', () => {
  test('uses the reference greeting rhythm across the day', () => {
    expect(getHomeGreeting(new Date('2026-06-29T21:59:00.000Z'))).toBe('Good Night');
    expect(getHomeGreeting(new Date('2026-06-29T22:00:00.000Z'))).toBe('Good Morning');
    expect(getHomeGreeting(new Date('2026-06-30T04:00:00.000Z'))).toBe('Good Afternoon');
    expect(getHomeGreeting(new Date('2026-06-30T10:00:00.000Z'))).toBe('Good Evening');
    expect(getHomeGreeting(new Date('2026-06-30T14:00:00.000Z'))).toBe('Good Night');
  });
});
