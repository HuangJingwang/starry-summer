import { describe, expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

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

  test('includes project metadata columns in migrations', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const projectMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('project_metadata'));

    expect(projectMigrationName).toBeDefined();

    const migration = readFileSync(join(migrationsDirectory, projectMigrationName ?? ''), 'utf8');

    expect(migration).toContain('project_status');
    expect(migration).toContain('project_links');
    expect(migration).toContain('project_stack');
    expect(migration).toContain('project_started_at');
    expect(migration).toContain('project_ended_at');
  });
});
