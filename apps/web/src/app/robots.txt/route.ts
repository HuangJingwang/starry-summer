import { buildRobotsText, normalizePublicSiteUrl } from '@/lib/seo';

export function GET() {
  return new Response(buildRobotsText(normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL)), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}
