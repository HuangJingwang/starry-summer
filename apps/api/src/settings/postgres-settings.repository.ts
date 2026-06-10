import pg from 'pg';

import {
  defaultSiteSettings,
  type SettingsRepository,
  type SiteProfileSettings,
  type SiteSettings,
  type UpdateSiteSettingsInput,
} from './settings.repository';

const { Pool } = pg;

export interface SettingRow {
  key: string;
  value: unknown;
  updated_at: Date;
}

export interface SqlStatement {
  sql: string;
  values: unknown[];
}

type SettingKey = 'profile' | 'navigation';

export function buildSettingsSelect(): SqlStatement {
  return {
    sql: 'select key, value, updated_at from site_settings where key in ($1, $2)',
    values: ['profile', 'navigation'],
  };
}

export function buildSettingsUpsert(key: SettingKey, value: unknown): SqlStatement {
  return {
    sql: `
      insert into site_settings (key, value, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
    `,
    values: [key, JSON.stringify(value)],
  };
}

export function mapSettingsRows(rows: SettingRow[]): SiteSettings {
  const profileRow = rows.find((row) => row.key === 'profile');
  const navigationRow = rows.find((row) => row.key === 'navigation');
  const newest = rows.map((row) => row.updated_at).sort((a, b) => b.getTime() - a.getTime())[0];

  return {
    profile: isProfile(profileRow?.value) ? profileRow.value : defaultSiteSettings.profile,
    navigation: isNavigation(navigationRow?.value) ? navigationRow.value : defaultSiteSettings.navigation,
    updatedAt: (newest ?? new Date(defaultSiteSettings.updatedAt)).toISOString(),
  };
}

export class PostgresSettingsRepository implements SettingsRepository {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async get(): Promise<SiteSettings> {
    const statement = buildSettingsSelect();
    const result = await this.pool.query<SettingRow>(statement.sql, statement.values);

    return mapSettingsRows(result.rows);
  }

  async update(input: UpdateSiteSettingsInput): Promise<SiteSettings> {
    if (input.profile) {
      const current = await this.get();
      const statement = buildSettingsUpsert('profile', {
        ...current.profile,
        ...input.profile,
      });
      await this.pool.query(statement.sql, statement.values);
    }

    if (input.navigation) {
      const statement = buildSettingsUpsert('navigation', input.navigation);
      await this.pool.query(statement.sql, statement.values);
    }

    return this.get();
  }
}

function isProfile(value: unknown): value is SiteProfileSettings {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as SiteProfileSettings).title === 'string' &&
    typeof (value as SiteProfileSettings).ownerName === 'string' &&
    typeof (value as SiteProfileSettings).description === 'string'
  );
}

function isNavigation(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
