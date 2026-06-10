import { Inject, Injectable } from '@nestjs/common';

import {
  SETTINGS_REPOSITORY,
  type SettingsRepository,
  type SiteHeroSettings,
  type SiteProfileSettings,
  type SiteSocialLink,
  type SiteSettings,
  type UpdateSiteSettingsInput,
} from './settings.repository.js';

@Injectable()
export class SettingsService {
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly repository: SettingsRepository,
  ) {}

  getSettings(): Promise<SiteSettings> {
    return this.repository.get();
  }

  updateSettings(input: UpdateSiteSettingsInput): Promise<SiteSettings> {
    return this.repository.update({
      profile: input.profile ? normalizeProfile(input.profile) : undefined,
      hero: input.hero ? normalizeHero(input.hero) : undefined,
      navigation: input.navigation?.map((item) => item.trim()).filter(Boolean),
    });
  }
}

function normalizeProfile(input: Partial<SiteProfileSettings>): Partial<SiteProfileSettings> {
  const profile: Partial<SiteProfileSettings> = {};

  if (input.title !== undefined) {
    profile.title = input.title.trim();
  }

  if (input.ownerName !== undefined) {
    profile.ownerName = input.ownerName.trim();
  }

  if (input.description !== undefined) {
    profile.description = input.description.trim();
  }

  if (input.socialLinks) {
    profile.socialLinks = normalizeSocialLinks(input.socialLinks);
  }

  return profile;
}

function normalizeHero(input: Partial<SiteHeroSettings>): Partial<SiteHeroSettings> {
  const hero: Partial<SiteHeroSettings> = {};

  if (input.tagline !== undefined) {
    hero.tagline = input.tagline.trim();
  }

  if (input.backgroundImageUrl !== undefined) {
    hero.backgroundImageUrl = input.backgroundImageUrl.trim();
  }

  if (input.motto !== undefined) {
    hero.motto = input.motto.trim();
  }

  if (input.quotes) {
    hero.quotes = normalizeQuotes(input.quotes);
  }

  return hero;
}

function normalizeSocialLinks(links: SiteSocialLink[]): SiteSocialLink[] {
  return links
    .map((link) => ({
      label: link.label.trim(),
      href: link.href.trim(),
    }))
    .filter((link) => link.label && link.href);
}

function normalizeQuotes(quotes: string[]): string[] {
  return quotes.map((quote) => quote.trim()).filter(Boolean);
}
