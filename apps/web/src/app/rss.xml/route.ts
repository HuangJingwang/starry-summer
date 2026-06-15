import { loadSiteContent } from '@/lib/public-content';
import { buildRssXml, normalizePublicSiteUrl } from '@/lib/seo';
import { loadSiteSettings } from '@/lib/settings-repository';

export async function GET() {
  const siteUrl = normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL);
  const settings = await loadSiteSettings();
  const content = await loadSiteContent();
  const xml = buildRssXml(settings, siteUrl, content);

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
    },
  });
}
