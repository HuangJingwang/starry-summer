import { mkdir, readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const { Client } = pg;

const SAFE_MIGRATION_PATTERN = /^\d{4}_[a-z0-9_]+\.sql$/;

export interface RunMigrationsOptions {
  databaseUrl: string;
  migrationsDir?: string;
}

export interface MigrationResult {
  applied: string[];
  skipped: string[];
}

export function assertSafeMigrationName(name: string): string {
  if (!SAFE_MIGRATION_PATTERN.test(name)) {
    throw new Error(`Unsafe migration name: ${name}`);
  }

  return name;
}

export function createMigrationPlan(applied: string[], available: string[]): string[] {
  const appliedSet = new Set(applied.map(assertSafeMigrationName));

  return available.map(assertSafeMigrationName).sort().filter((name) => !appliedSet.has(name));
}

export async function getDefaultMigrationsDir(): Promise<string> {
  const currentFile = fileURLToPath(import.meta.url);

  return join(dirname(currentFile), '..', 'migrations');
}

export async function listAvailableMigrations(migrationsDir: string): Promise<string[]> {
  await mkdir(migrationsDir, { recursive: true });
  const entries = await readdir(migrationsDir);

  return entries.filter((entry) => entry.endsWith('.sql')).map(assertSafeMigrationName).sort();
}

export async function runMigrations(options: RunMigrationsOptions): Promise<MigrationResult> {
  const migrationsDir = options.migrationsDir ?? (await getDefaultMigrationsDir());
  const client = new Client({ connectionString: options.databaseUrl });

  await client.connect();

  try {
    await client.query(`
      create table if not exists schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const appliedResult = await client.query<{ name: string }>('select name from schema_migrations order by name');
    const applied = appliedResult.rows.map((row) => row.name);
    const available = await listAvailableMigrations(migrationsDir);
    const pending = createMigrationPlan(applied, available);

    for (const migration of pending) {
      const sql = await readFile(join(migrationsDir, migration), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (name) values ($1)', [migration]);
        await client.query('commit');
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }

    return {
      applied: pending,
      skipped: applied,
    };
  } finally {
    await client.end();
  }
}
