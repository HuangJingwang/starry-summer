import { runMigrations } from './migrations.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations');
}

const result = await runMigrations({ databaseUrl });
console.log(`Applied ${result.applied.length} migration(s). Skipped ${result.skipped.length}.`);
