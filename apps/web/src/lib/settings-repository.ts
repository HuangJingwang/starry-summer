import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { defaultSettings, normalizeSiteSettings, type SiteSettings } from './settings';

const defaultRepositorySettingsPath = join(process.cwd(), 'content', 'site-settings.json');

export interface RepositorySettingsLoadOptions {
  settingsFilePath?: string;
}

export function readRepositorySettingsFile(settingsFilePath = defaultRepositorySettingsPath): SiteSettings {
  return normalizeSiteSettings(JSON.parse(readFileSync(settingsFilePath, 'utf8')) as Partial<SiteSettings>);
}

export async function loadSiteSettings(options: RepositorySettingsLoadOptions = {}): Promise<SiteSettings> {
  try {
    return readRepositorySettingsFile(options.settingsFilePath);
  } catch {
    return defaultSettings;
  }
}
