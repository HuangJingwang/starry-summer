import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { defaultSettings, normalizeSiteSettings, type SiteSettings } from './settings';

const defaultRepositorySettingsPath = join(process.cwd(), 'content', 'site-settings.json');

interface RepositorySettingsFileCache {
  settingsFilePath: string;
  signature: string;
  settings: SiteSettings;
}

let repositorySettingsFileCache: RepositorySettingsFileCache | null = null;

export interface RepositorySettingsLoadOptions {
  settingsFilePath?: string;
}

export function readRepositorySettingsFile(settingsFilePath = defaultRepositorySettingsPath): SiteSettings {
  const signature = getFileSignature(settingsFilePath);

  if (
    repositorySettingsFileCache &&
    repositorySettingsFileCache.settingsFilePath === settingsFilePath &&
    repositorySettingsFileCache.signature === signature
  ) {
    return repositorySettingsFileCache.settings;
  }

  const settings = normalizeSiteSettings(JSON.parse(readFileSync(settingsFilePath, 'utf8')) as Partial<SiteSettings>);

  repositorySettingsFileCache = {
    settingsFilePath,
    signature,
    settings,
  };

  return settings;
}

function getFileSignature(filePath: string): string {
  const stats = statSync(filePath);

  return `${stats.mtimeMs}:${stats.size}`;
}

export async function loadSiteSettings(options: RepositorySettingsLoadOptions = {}): Promise<SiteSettings> {
  try {
    return readRepositorySettingsFile(options.settingsFilePath);
  } catch {
    return defaultSettings;
  }
}
