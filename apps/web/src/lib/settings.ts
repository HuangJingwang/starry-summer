import { PUBLIC_OWNER_NAME } from './public-identity';

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
  profile?: SiteProfileSettings;
  hero?: SiteHeroSettings;
  navigation?: string[];
}

export interface SettingsRequest {
  url: string;
  init: RequestInit & { next?: { revalidate: number } };
}

export interface PublicSettingsRequestOptions {
  apiBaseUrl?: string;
}

export interface PublicSettingsLoadOptions extends PublicSettingsRequestOptions {
  timeoutMs?: number;
}

export const defaultSettings: SiteSettings = {
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
  updatedAt: '',
};

export function normalizeSiteSettings(input: Partial<SiteSettings>): SiteSettings {
  return {
    profile: {
      title: input.profile?.title ?? defaultSettings.profile.title,
      ownerName: PUBLIC_OWNER_NAME,
      description: input.profile?.description ?? defaultSettings.profile.description,
      socialLinks: normalizeSocialLinks(input.profile?.socialLinks),
    },
    hero: {
      tagline: input.hero?.tagline ?? defaultSettings.hero.tagline,
      backgroundImageUrl: input.hero?.backgroundImageUrl ?? defaultSettings.hero.backgroundImageUrl,
      motto: input.hero?.motto ?? defaultSettings.hero.motto,
      quotes: normalizeHeroQuotes(input.hero?.quotes),
    },
    navigation: Array.isArray(input.navigation) ? input.navigation : defaultSettings.navigation,
    updatedAt: input.updatedAt ?? '',
  };
}

export function parseSocialLinksText(value: string): SiteSocialLink[] {
  return normalizeSocialLinks(
    value.split('\n').map((line) => {
      const [label = '', ...hrefParts] = line.split('|');

      return {
        label,
        href: hrefParts.join('|'),
      };
    }),
  );
}

export function formatSocialLinksText(links: SiteSocialLink[]): string {
  return links.map((link) => `${link.label} | ${link.href}`).join('\n');
}

export function parseHeroQuotesText(value: string): string[] {
  return normalizeHeroQuotes(value.split('\n'));
}

export function formatHeroQuotesText(quotes: string[]): string {
  return normalizeHeroQuotes(quotes).join('\n');
}

export function buildSettingsFormKey(settings: SiteSettings): string {
  return JSON.stringify({
    profile: settings.profile,
    hero: settings.hero,
    navigation: settings.navigation,
    updatedAt: settings.updatedAt,
  });
}

function normalizeSocialLinks(links: SiteSocialLink[] | undefined): SiteSocialLink[] {
  return (Array.isArray(links) ? links : [])
    .map((link) => ({
      label: link.label.trim(),
      href: link.href.trim(),
    }))
    .filter((link) => link.label && link.href);
}

function normalizeHeroQuotes(quotes: string[] | undefined): string[] {
  const normalized = (Array.isArray(quotes) ? quotes : defaultSettings.hero.quotes)
    .map((quote) => quote.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [defaultSettings.hero.motto];
}

export function buildGetPublicSettingsRequest(options: PublicSettingsRequestOptions = {}): SettingsRequest {
  const url = options.apiBaseUrl
    ? `${options.apiBaseUrl.replace(/\/$/, '')}/settings`
    : '/api/settings';

  return {
    url,
    init: {
      method: 'GET',
      next: {
        revalidate: 60,
      },
    },
  };
}

export async function loadPublicSettings(
  fetcher?: (url: string, init: RequestInit) => Promise<Response>,
  options: PublicSettingsLoadOptions = {},
): Promise<SiteSettings> {
  if (!fetcher && !options.apiBaseUrl && typeof window === 'undefined') {
    return defaultSettings;
  }

  const request = buildGetPublicSettingsRequest(options);
  const activeFetcher = fetcher ?? ((url: string, init: RequestInit) => fetch(url, init));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 1_500);

  try {
    const response = await activeFetcher(request.url, { ...request.init, signal: controller.signal });

    if (!response.ok) {
      return defaultSettings;
    }

    return normalizeSiteSettings((await response.json()) as Partial<SiteSettings>);
  } catch {
    return defaultSettings;
  } finally {
    clearTimeout(timeout);
  }
}

export function buildGetAdminSettingsRequest(): SettingsRequest {
  return {
    url: '/api/admin/settings',
    init: {
      method: 'GET',
      credentials: 'include',
    },
  };
}

export function buildUpdateSettingsRequest(input: UpdateSiteSettingsInput): SettingsRequest {
  return {
    url: '/api/admin/settings',
    init: {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  };
}

export async function readSettingsErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = (await response.json()) as { message?: unknown; error?: unknown };
      const message = normalizeSettingsErrorMessage(data.message) || normalizeSettingsErrorMessage(data.error);

      return message || fallback;
    }

    const text = (await response.text()).trim();

    return text || fallback;
  } catch {
    return fallback;
  }
}

function normalizeSettingsErrorMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join('；');
  }

  return '';
}
