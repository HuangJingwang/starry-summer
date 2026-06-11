export interface SiteProfileSettings {
  title: string;
  ownerName: string;
  description: string;
  socialLinks: SiteSocialLink[];
}

export interface SiteSocialLink {
  label: string;
  href: string;
}

export interface SiteHeroSettings {
  tagline: string;
  backgroundImageUrl: string;
  motto: string;
  quotes: string[];
}

export interface SiteSettings {
  profile: SiteProfileSettings;
  hero: SiteHeroSettings;
  navigation: string[];
  updatedAt: string;
}

export interface UpdateSiteSettingsInput {
  profile?: Partial<SiteProfileSettings>;
  hero?: Partial<SiteHeroSettings>;
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
    socialLinks: [],
  },
  hero: {
    tagline: 'Writing, notes, daily traces, and projects in one long-lived home.',
    backgroundImageUrl: '/hero-workspace.png',
    motto: 'Build a public trail of private work.',
    quotes: [
      'Build a public trail of private work.',
      'Small notes compound into a life you can revisit.',
    ],
  },
  navigation: ['posts', 'notes', 'moments', 'projects', 'series', 'guestbook', 'search', 'about'],
  updatedAt: '2026-06-10T00:00:00.000Z',
};

export class InMemorySettingsRepository implements SettingsRepository {
  private settings: SiteSettings;

  constructor(private readonly now: () => string = () => new Date().toISOString()) {
    this.settings = {
      ...defaultSiteSettings,
      profile: { ...defaultSiteSettings.profile },
      hero: { ...defaultSiteSettings.hero },
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
      hero: {
        ...this.settings.hero,
        ...input.hero,
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
    profile: {
      ...settings.profile,
      socialLinks: settings.profile.socialLinks.map((link) => ({ ...link })),
    },
    hero: {
      ...settings.hero,
      quotes: [...settings.hero.quotes],
    },
    navigation: [...settings.navigation],
  };
}
