export interface SiteProfileSettings {
  title: string;
  ownerName: string;
  description: string;
}

export interface SiteHeroSettings {
  tagline: string;
  backgroundImageUrl: string;
  motto: string;
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
  },
  hero: {
    tagline: 'Writing, notes, daily traces, and projects in one long-lived home.',
    backgroundImageUrl: '/hero-workspace.png',
    motto: 'Build a public trail of private work.',
  },
  navigation: ['posts', 'notes', 'moments', 'projects', 'series', 'guestbook', 'about'],
  updatedAt: '',
};

export function normalizeSiteSettings(input: Partial<SiteSettings>): SiteSettings {
  return {
    profile: {
      title: input.profile?.title ?? defaultSettings.profile.title,
      ownerName: input.profile?.ownerName ?? defaultSettings.profile.ownerName,
      description: input.profile?.description ?? defaultSettings.profile.description,
    },
    hero: {
      tagline: input.hero?.tagline ?? defaultSettings.hero.tagline,
      backgroundImageUrl: input.hero?.backgroundImageUrl ?? defaultSettings.hero.backgroundImageUrl,
      motto: input.hero?.motto ?? defaultSettings.hero.motto,
    },
    navigation: Array.isArray(input.navigation) ? input.navigation : defaultSettings.navigation,
    updatedAt: input.updatedAt ?? '',
  };
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
