import { getPublicContent, getSiteStats, type SiteContentItem, type SiteStats } from './content';
import { PUBLIC_OWNER_NAME } from './public-identity';
import type { SiteSettings } from './settings';

export interface HomeProfileModel {
  ownerName: string;
  title: string;
  description: string;
  motto: string;
  stats: SiteStats;
  latestArticle?: SiteContentItem;
  latestProject?: SiteContentItem;
  latestMoment?: SiteContentItem;
}

export function buildHomeProfileModel(
  settings: SiteSettings,
  content: SiteContentItem[],
  randomNumber: () => number = Math.random,
): HomeProfileModel {
  return {
    ownerName: PUBLIC_OWNER_NAME,
    title: settings.profile.title,
    description: settings.profile.description,
    motto: selectHomeQuote(settings, randomNumber),
    stats: getSiteStats(content),
    latestArticle: selectLatestHomeArticle(content),
    latestProject: getPublicContent(content, 'project')[0],
    latestMoment: getPublicContent(content, 'moment')[0],
  };
}

function selectLatestHomeArticle(content: SiteContentItem[]): SiteContentItem | undefined {
  const articlesByDate = [...getPublicContent(content, 'article')].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return articlesByDate.find((item) => !item.pinned) ?? articlesByDate[0];
}

function selectHomeQuote(settings: SiteSettings, randomNumber: () => number): string {
  const quotes = settings.hero.quotes.map((quote) => quote.trim()).filter(Boolean);

  if (quotes.length === 0) {
    return settings.hero.motto;
  }

  const index = Math.min(quotes.length - 1, Math.floor(randomNumber() * quotes.length));

  return quotes[index] ?? settings.hero.motto;
}
