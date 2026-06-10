import { describe, expect, test } from 'vitest';

import { assertSafeMigrationName, createMigrationPlan } from './migrations';

describe('database migrations', () => {
  test('plans only migrations that have not been applied', () => {
    expect(createMigrationPlan(['0001_initial.sql'], ['0001_initial.sql', '0002_assets.sql'])).toEqual([
      '0002_assets.sql',
    ]);
  });

  test('sorts migrations before planning', () => {
    expect(createMigrationPlan([], ['0002_second.sql', '0001_first.sql'])).toEqual([
      '0001_first.sql',
      '0002_second.sql',
    ]);
  });

  test('rejects unsafe migration names', () => {
    expect(() => assertSafeMigrationName('../secret.sql')).toThrow('Unsafe migration name');
    expect(() => assertSafeMigrationName('initial.sql')).toThrow('Unsafe migration name');
    expect(assertSafeMigrationName('0001_initial.sql')).toBe('0001_initial.sql');
  });
});
