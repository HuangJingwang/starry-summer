import { Inject, Injectable } from '@nestjs/common';

import {
  SETTINGS_REPOSITORY,
  type SettingsRepository,
  type SiteProfileSettings,
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
      navigation: input.navigation?.map((item) => item.trim()).filter(Boolean),
    });
  }
}

function normalizeProfile(input: Partial<SiteProfileSettings>): Partial<SiteProfileSettings> {
  return {
    title: input.title?.trim(),
    ownerName: input.ownerName?.trim(),
    description: input.description?.trim(),
  };
}
