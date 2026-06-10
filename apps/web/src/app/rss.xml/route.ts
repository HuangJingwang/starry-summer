import { loadSiteContent } from '@/lib/public-content';
import { buildRssXml, normalizePublicSiteUrl } from '@/lib/seo';
import { loadPublicSettings } from '@/lib/settings';

export async function GET() {
  const siteUrl = normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL);
  const settings = await loadPublicSettings(undefined, {
    apiBaseUrl: process.env.API_BASE_URL,
  });
  const content = await loadSiteContent();
  const xml = buildRssXml(settings, siteUrl, content);

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
    },
  });
}
