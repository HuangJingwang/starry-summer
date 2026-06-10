import { loadSiteContent } from '@/lib/public-content';
import { buildSitemapXml, normalizePublicSiteUrl } from '@/lib/seo';

export async function GET() {
  const siteUrl = normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL);
  const content = await loadSiteContent();

  return new Response(buildSitemapXml(siteUrl, content), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
    },
  });
}
