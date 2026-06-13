import { describe, expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { assertSafeMigrationName, createMigrationPlan } from './migrations';

describe('database migrations', () => {
  const privateOwnerName = String.fromCharCode(0x9ec4, 0x4eac, 0x671b);
  const privateOwnerNamePinyin = String.fromCharCode(0x68, 0x75, 0x61, 0x6e, 0x67);

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

  test('does not expose private owner identity in migration filenames or contents', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const migrationNames = readdirSync(migrationsDirectory);

    for (const migrationName of migrationNames) {
      const migration = readFileSync(join(migrationsDirectory, migrationName), 'utf8');

      expect(migrationName.toLowerCase()).not.toContain(privateOwnerNamePinyin);
      expect(migrationName).not.toContain(privateOwnerName);
      expect(migration.toLowerCase()).not.toContain(privateOwnerNamePinyin);
      expect(migration).not.toContain(privateOwnerName);
    }
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

  test('includes nested category parent metadata in migrations', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const categoryMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('category_parent'));

    expect(categoryMigrationName).toBeDefined();

    const migration = readFileSync(join(migrationsDirectory, categoryMigrationName ?? ''), 'utf8');

    expect(migration).toContain('parent_id');
    expect(migration).toContain('references categories(id)');
    expect(migration).toContain('categories_parent_not_self');
  });

  test('includes a migration that exposes search in default navigation', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const searchNavigationMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('search_navigation'));

    expect(searchNavigationMigrationName).toBeDefined();

    const migration = readFileSync(join(migrationsDirectory, searchNavigationMigrationName ?? ''), 'utf8');

    expect(migration).toContain("'search'");
    expect(migration).toContain('jsonb_array_elements_text');
    expect(migration).toContain('site_settings');
  });

  test('includes a migration that restores the owner public profile alias', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const identityMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('aster_alias'));

    expect(identityMigrationName).toBeDefined();

    const migration = readFileSync(join(migrationsDirectory, identityMigrationName ?? ''), 'utf8');

    expect(migration).toContain('site_settings');
    expect(migration).toContain('Aster.H');
    expect(migration).toContain('个人内容平台');
    expect(migration).not.toContain(privateOwnerName);
    expect(migration).not.toContain('AI Agent');
  });

  test('includes LeetCode study tracking tables for durable learning archives', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const studyMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('leetcode_study'));

    expect(studyMigrationName).toBeDefined();

    const migration = readFileSync(join(migrationsDirectory, studyMigrationName ?? ''), 'utf8');

    expect(migration).toContain('leetcode_study_settings');
    expect(migration).toContain('leetcode_problems');
    expect(migration).toContain('leetcode_submissions');
    expect(migration).toContain('rounds jsonb');
    expect(migration).toContain('must_repeat boolean');
  });

  test('defaults public comments and guestbook entries to direct publishing', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const initialMigration = readFileSync(join(migrationsDirectory, '0001_initial.sql'), 'utf8');
    const directPublishMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('direct_publish_interactions'));

    expect(initialMigration).toContain("status text not null default 'approved' check (status in ('pending', 'approved', 'rejected', 'spam'))");
    expect(directPublishMigrationName).toBeDefined();

    const directPublishMigration = readFileSync(join(migrationsDirectory, directPublishMigrationName ?? ''), 'utf8');

    expect(directPublishMigration).toMatch(/alter table comments\s+alter column status set default 'approved'/);
    expect(directPublishMigration).toMatch(/alter table guestbook_entries\s+alter column status set default 'approved'/);
  });

  test('seeds the public owner alias in fresh database installs', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const migration = readFileSync(join(migrationsDirectory, '0001_initial.sql'), 'utf8');

    expect(migration).toContain('"ownerName":"Aster.H"');
    expect(migration).toContain('个人内容平台');
    expect(migration).not.toContain(privateOwnerName);
    expect(migration).not.toContain('AI Agent');
  });

  test('includes a migration that removes notes from default public navigation', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const articleNavigationMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('article_navigation'));

    expect(articleNavigationMigrationName).toBeDefined();

    const migration = readFileSync(join(migrationsDirectory, articleNavigationMigrationName ?? ''), 'utf8');

    expect(migration).toContain('site_settings');
    expect(migration).toContain("'notes'");
    expect(migration).toContain('jsonb_array_elements_text');
  });

  test('includes a migration that promotes search and removes about from public navigation', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const headerSearchMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('header_search'));

    expect(headerSearchMigrationName).toBeDefined();

    const migration = readFileSync(join(migrationsDirectory, headerSearchMigrationName ?? ''), 'utf8');

    expect(migration).toContain('site_settings');
    expect(migration).toContain("'search'");
    expect(migration).toContain("'about'");
    expect(migration).toContain('jsonb_array_elements_text');
  });

  test('includes a migration that removes guestbook from public settings', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const removeGuestbookMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('remove_public_guestbook'));

    expect(removeGuestbookMigrationName).toBeDefined();

    const migration = readFileSync(join(migrationsDirectory, removeGuestbookMigrationName ?? ''), 'utf8');

    expect(migration).toContain('site_settings');
    expect(migration).toContain("'guestbook'");
    expect(migration).toContain('jsonb_array_elements_text');
    expect(migration).toContain('文章、笔记、日常和项目');
  });

  test('includes a migration that removes series from public navigation', () => {
    const migrationsDirectory = join(fileURLToPath(new URL('..', import.meta.url)), 'migrations');
    const removeSeriesMigrationName = readdirSync(migrationsDirectory).find((name) => name.includes('move_series_to_posts'));

    expect(removeSeriesMigrationName).toBeDefined();

    const migration = readFileSync(join(migrationsDirectory, removeSeriesMigrationName ?? ''), 'utf8');

    expect(migration).toContain('site_settings');
    expect(migration).toContain("'series'");
    expect(migration).toContain('jsonb_array_elements_text');
  });
});
