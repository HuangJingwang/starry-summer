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
    ownerName: 'Aster.H',
    description:
      '我是 Aster.H，这里是我的个人内容平台。文章、笔记、日常和项目都会长期沉淀在这里，方便公开分享，也方便我回看自己的思考和成长轨迹。',
    socialLinks: [],
  },
  hero: {
    tagline: '把技术探索、项目实践和日常思考长期沉淀成一个可回看的个人知识系统。',
    backgroundImageUrl: '',
    motto: 'Stay curious. Keep building.',
    quotes: [
      '用代码解决问题，用文字留下路径。',
      '把每一次实践沉淀成未来可以复用的认知。',
    ],
  },
  navigation: ['search', 'posts', 'moments', 'projects'],
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
