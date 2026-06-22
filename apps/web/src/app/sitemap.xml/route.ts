import { loadSiteContent } from '@/lib/public-content';
import { buildSitemapXml, resolvePublicSiteUrl } from '@/lib/seo';

export async function GET() {
  const siteUrl = resolvePublicSiteUrl({
    configuredUrl: process.env.PUBLIC_SITE_URL,
    productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });
  const content = await loadSiteContent();

  return new Response(buildSitemapXml(siteUrl, content), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
    },
  });
}
