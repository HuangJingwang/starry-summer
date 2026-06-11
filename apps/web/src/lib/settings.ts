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
  updatedAt: '',
};

export function normalizeSiteSettings(input: Partial<SiteSettings>): SiteSettings {
  return {
    profile: {
      title: input.profile?.title ?? defaultSettings.profile.title,
      ownerName: input.profile?.ownerName ?? defaultSettings.profile.ownerName,
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
  fetcher: (url: string, init: RequestInit) => Promise<Response> = (url, init) => fetch(url, init),
  options: PublicSettingsLoadOptions = {},
): Promise<SiteSettings> {
  const request = buildGetPublicSettingsRequest(options);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 1_500);

  try {
    const response = await fetcher(request.url, { ...request.init, signal: controller.signal });

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
