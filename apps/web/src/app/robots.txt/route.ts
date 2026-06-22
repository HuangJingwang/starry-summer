import { buildRobotsText, resolvePublicSiteUrl } from '@/lib/seo';

export function GET() {
  return new Response(
    buildRobotsText(
      resolvePublicSiteUrl({
        configuredUrl: process.env.PUBLIC_SITE_URL,
        productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      }),
    ),
    {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
    },
  );
}
