import pg from 'pg';

import {
  defaultSiteSettings,
  type SettingsRepository,
  type SiteHeroSettings,
  type SiteProfileSettings,
  type SiteSettings,
  type SiteSocialLink,
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

type SettingKey = 'profile' | 'navigation' | 'hero';

export function buildSettingsSelect(): SqlStatement {
  return {
    sql: 'select key, value, updated_at from site_settings where key in ($1, $2, $3)',
    values: ['profile', 'navigation', 'hero'],
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
  const heroRow = rows.find((row) => row.key === 'hero');
  const newest = rows.map((row) => row.updated_at).sort((a, b) => b.getTime() - a.getTime())[0];

  return {
    profile: normalizeProfileSettings(profileRow?.value),
    hero: normalizeHeroSettings(heroRow?.value),
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

    if (input.hero) {
      const current = await this.get();
      const statement = buildSettingsUpsert('hero', {
        ...current.hero,
        ...input.hero,
      });
      await this.pool.query(statement.sql, statement.values);
    }

    return this.get();
  }
}

function normalizeProfileSettings(value: unknown): SiteProfileSettings {
  if (!value || typeof value !== 'object') {
    return defaultSiteSettings.profile;
  }

  const profile = value as Partial<SiteProfileSettings>;

  if (typeof profile.title !== 'string' || typeof profile.ownerName !== 'string' || typeof profile.description !== 'string') {
    return defaultSiteSettings.profile;
  }

  return {
    title: profile.title,
    ownerName: profile.ownerName,
    description: profile.description,
    socialLinks: normalizeSocialLinks(profile.socialLinks),
  };
}

function normalizeHeroSettings(value: unknown): SiteHeroSettings {
  if (!value || typeof value !== 'object') {
    return defaultSiteSettings.hero;
  }

  const hero = value as Partial<SiteHeroSettings>;

  if (typeof hero.tagline !== 'string' || typeof hero.backgroundImageUrl !== 'string') {
    return defaultSiteSettings.hero;
  }

  return {
    tagline: hero.tagline,
    backgroundImageUrl: hero.backgroundImageUrl,
    motto: typeof hero.motto === 'string' ? hero.motto : defaultSiteSettings.hero.motto,
  };
}

function isNavigation(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function normalizeSocialLinks(value: unknown): SiteSocialLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      label: typeof item?.label === 'string' ? item.label.trim() : '',
      href: typeof item?.href === 'string' ? item.href.trim() : '',
    }))
    .filter((item) => item.label && item.href);
}
