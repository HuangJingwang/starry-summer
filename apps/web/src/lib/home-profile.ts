import { getPublicContent, getSiteStats, type SiteContentItem, type SiteStats } from './content';
import type { SiteSettings } from './settings';

export interface HomeProfileModel {
  ownerName: string;
  title: string;
  description: string;
  motto: string;
  stats: SiteStats;
  latestProject?: SiteContentItem;
  latestMoment?: SiteContentItem;
}

export function buildHomeProfileModel(
  settings: SiteSettings,
  content: SiteContentItem[],
  randomNumber: () => number = Math.random,
): HomeProfileModel {
  return {
    ownerName: settings.profile.ownerName,
    title: settings.profile.title,
    description: settings.profile.description,
    motto: selectHomeQuote(settings, randomNumber),
    stats: getSiteStats(content),
    latestProject: getPublicContent(content, 'project')[0],
    latestMoment: getPublicContent(content, 'moment')[0],
  };
}

function selectHomeQuote(settings: SiteSettings, randomNumber: () => number): string {
  const quotes = settings.hero.quotes.map((quote) => quote.trim()).filter(Boolean);

  if (quotes.length === 0) {
    return settings.hero.motto;
  }

  const index = Math.min(quotes.length - 1, Math.floor(randomNumber() * quotes.length));

  return quotes[index] ?? settings.hero.motto;
}
