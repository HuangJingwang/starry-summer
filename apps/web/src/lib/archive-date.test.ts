import { expect, test } from 'vitest';
import { formatArchiveDate } from './archive-date';

test('archive rows display month-day, not year-month', () => {
  expect(formatArchiveDate('2026-09-03T12:00:00+08:00')).toBe('09-03');
  expect(formatArchiveDate('2025-12-31')).toBe('12-31');
  expect(formatArchiveDate('')).toBe('');
});
