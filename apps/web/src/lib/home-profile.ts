import { getPublicContent, getSiteStats, type SiteContentItem, type SiteStats } from './content';
import type { SiteSettings } from './settings';

export interface HomeProfileModel {
  ownerName: string;
  title: string;
  description: string;
  stats: SiteStats;
  latestProject?: SiteContentItem;
  latestMoment?: SiteContentItem;
}

export function buildHomeProfileModel(settings: SiteSettings, content: SiteContentItem[]): HomeProfileModel {
  return {
    ownerName: settings.profile.ownerName,
    title: settings.profile.title,
    description: settings.profile.description,
    stats: getSiteStats(content),
    latestProject: getPublicContent(content, 'project')[0],
    latestMoment: getPublicContent(content, 'moment')[0],
  };
}
