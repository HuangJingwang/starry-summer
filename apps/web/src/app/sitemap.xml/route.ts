import { getContentHref } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';

export async function GET() {
  const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const staticRoutes = ['', 'posts', 'notes', 'moments', 'projects', 'categories', 'archives', 'guestbook', 'about', 'search'];
  const contentRoutes = (await loadSiteContent()).map((item) => getContentHref(item).slice(1));
  const urls = [...staticRoutes, ...contentRoutes]
    .map((route) => {
      const loc = route ? `${siteUrl}/${route}` : siteUrl;

      return `<url><loc>${loc}</loc></url>`;
    })
    .join('');

  return new Response(`<?xml version="1.0" encoding="UTF-8" ?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
    },
  });
}
