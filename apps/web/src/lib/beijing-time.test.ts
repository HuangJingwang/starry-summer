import { describe, expect, test } from 'vitest';

import {
  formatBeijingHomeDate,
  formatBeijingHomeDateHeading,
  formatBeijingHomeWeekday,
  getBeijingClockParts,
  getBeijingDateParts,
} from '@/lib/beijing-time';
import { getHomeGreeting } from '@/lib/home-greeting';

describe('beijing home time', () => {
  test('formats home clock and calendar values in Asia/Shanghai across the UTC day boundary', () => {
    const beforeBeijingMidnight = new Date('2026-06-30T15:59:00.000Z');
    const afterBeijingMidnight = new Date('2026-06-30T16:00:00.000Z');

    expect(getBeijingClockParts(beforeBeijingMidnight)).toEqual({ hours: '23', minutes: '59' });
    expect(formatBeijingHomeDateHeading(beforeBeijingMidnight)).toBe('2026/6/30');
    expect(formatBeijingHomeDateHeading(afterBeijingMidnight)).toBe('2026/7/1');
    expect(formatBeijingHomeDate(afterBeijingMidnight)).toBe('2026年7月1日');
    expect(formatBeijingHomeWeekday(afterBeijingMidnight)).toBe('周三');
    expect(getBeijingDateParts(afterBeijingMidnight)).toEqual({ year: 2026, month: 7, day: 1 });
  });

  test('uses Beijing hours for the home greeting rhythm', () => {
    expect(getHomeGreeting(new Date('2026-06-29T21:59:00.000Z'))).toBe('Good Night');
    expect(getHomeGreeting(new Date('2026-06-29T22:00:00.000Z'))).toBe('Good Morning');
    expect(getHomeGreeting(new Date('2026-06-30T04:00:00.000Z'))).toBe('Good Afternoon');
    expect(getHomeGreeting(new Date('2026-06-30T10:00:00.000Z'))).toBe('Good Evening');
    expect(getHomeGreeting(new Date('2026-06-30T14:00:00.000Z'))).toBe('Good Night');
  });
});
