import { getContentHref } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';

export async function GET() {
  const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const content = await loadSiteContent();
  const items = content
    .map((item) => {
      const href = `${siteUrl}${getContentHref(item)}`;

      return [
        '<item>',
        `<title><![CDATA[${item.title}]]></title>`,
        `<link>${href}</link>`,
        `<guid>${href}</guid>`,
        `<pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>`,
        `<description><![CDATA[${item.summary ?? ''}]]></description>`,
        '</item>',
      ].join('');
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>Starry Summer</title><link>${siteUrl}</link><description>Personal content platform</description>${items}</channel></rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
    },
  });
}
