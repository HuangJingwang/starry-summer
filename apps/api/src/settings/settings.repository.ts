export interface SiteProfileSettings {
  title: string;
  ownerName: string;
  description: string;
}

export interface SiteSettings {
  profile: SiteProfileSettings;
  navigation: string[];
  updatedAt: string;
}

export interface UpdateSiteSettingsInput {
  profile?: Partial<SiteProfileSettings>;
  navigation?: string[];
}

export interface SettingsRepository {
  get(): Promise<SiteSettings>;
  update(input: UpdateSiteSettingsInput): Promise<SiteSettings>;
}

export const SETTINGS_REPOSITORY = Symbol('SETTINGS_REPOSITORY');

export const defaultSiteSettings: SiteSettings = {
  profile: {
    title: 'Starry Summer',
    ownerName: 'Owner',
    description: 'A personal content platform.',
  },
  navigation: ['posts', 'notes', 'moments', 'projects', 'guestbook', 'about'],
  updatedAt: '2026-06-10T00:00:00.000Z',
};

export class InMemorySettingsRepository implements SettingsRepository {
  private settings: SiteSettings;

  constructor(private readonly now: () => string = () => new Date().toISOString()) {
    this.settings = {
      ...defaultSiteSettings,
      profile: { ...defaultSiteSettings.profile },
      navigation: [...defaultSiteSettings.navigation],
      updatedAt: this.now(),
    };
  }

  async get(): Promise<SiteSettings> {
    return cloneSettings(this.settings);
  }

  async update(input: UpdateSiteSettingsInput): Promise<SiteSettings> {
    this.settings = {
      profile: {
        ...this.settings.profile,
        ...input.profile,
      },
      navigation: input.navigation ? [...input.navigation] : [...this.settings.navigation],
      updatedAt: this.now(),
    };

    return cloneSettings(this.settings);
  }
}

export function cloneSettings(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    profile: { ...settings.profile },
    navigation: [...settings.navigation],
  };
}
