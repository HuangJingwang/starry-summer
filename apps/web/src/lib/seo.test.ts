import { describe, expect, test } from 'vitest';

import type { SiteContentItem } from './content';
import { defaultSettings } from './settings';
import {
  buildContentMetadata,
  buildRobotsText,
  buildRssXml,
  buildSitemapXml,
  buildSiteMetadata,
  normalizePublicSiteUrl,
} from './seo';

const content: SiteContentItem = {
  id: 'content-1',
  type: 'post',
  title: 'Public Post',
  slug: 'public-post',
  status: 'published',
  visibility: 'public',
  publishedAt: '2026-06-10',
  summary: 'A public post summary.',
  bodyMarkdown: '# Public Post',
  categories: ['Writing'],
  tags: ['SEO'],
};

describe('SEO helpers', () => {
  test('normalizes public site URLs', () => {
    expect(normalizePublicSiteUrl('https://example.com/')).toBe('https://example.com');
    expect(normalizePublicSiteUrl('')).toBe('http://localhost:3000');
    expect(normalizePublicSiteUrl(undefined)).toBe('http://localhost:3000');
  });

  test('builds robots text for public deployment', () => {
    expect(buildRobotsText('https://example.com')).toBe(
      ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api', 'Sitemap: https://example.com/sitemap.xml', ''].join('\n'),
    );
  });

  test('builds site metadata with Open Graph defaults', () => {
    expect(buildSiteMetadata(defaultSettings, 'https://example.com')).toMatchObject({
      title: defaultSettings.profile.title,
      description: defaultSettings.profile.description,
      metadataBase: new URL('https://example.com'),
      alternates: {
        canonical: '/',
      },
      openGraph: {
        title: defaultSettings.profile.title,
        description: defaultSettings.profile.description,
        url: 'https://example.com',
        siteName: defaultSettings.profile.title,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: defaultSettings.profile.title,
        description: defaultSettings.profile.description,
      },
    });
  });

  test('builds canonical metadata for content detail pages', () => {
    expect(buildContentMetadata(content, defaultSettings, 'https://example.com')).toMatchObject({
      title: `Public Post | ${defaultSettings.profile.title}`,
      description: 'A public post summary.',
      alternates: {
        canonical: '/posts/public-post',
      },
      openGraph: {
        title: 'Public Post',
        description: 'A public post summary.',
        url: 'https://example.com/posts/public-post',
        siteName: defaultSettings.profile.title,
        type: 'article',
        publishedTime: '2026-06-10',
      },
    });
  });

  test('uses content cover images in social metadata', () => {
    expect(
      buildContentMetadata(
        {
          ...content,
          coverImageUrl: '/uploads/public-post.png',
          coverAltText: 'A calm writing desk',
        },
        defaultSettings,
        'https://example.com/',
      ),
    ).toMatchObject({
      openGraph: {
        images: [
          {
            url: 'https://example.com/uploads/public-post.png',
            alt: 'A calm writing desk',
          },
        ],
      },
      twitter: {
        images: ['https://example.com/uploads/public-post.png'],
      },
    });
  });

  test('builds RSS XML from site settings and public content', () => {
    const xml = buildRssXml(defaultSettings, 'https://example.com', [content]);

    expect(xml).toContain('<title><![CDATA[Starry Summer]]></title>');
    expect(xml).toContain('<description><![CDATA[A personal content platform.]]></description>');
    expect(xml).toContain('<link>https://example.com</link>');
    expect(xml).toContain('<title><![CDATA[Public Post]]></title>');
    expect(xml).toContain('<link>https://example.com/posts/public-post</link>');
    expect(xml).toContain('<description><![CDATA[A public post summary.]]></description>');
  });

  test('builds sitemap XML with static content series and tag URLs', () => {
    const xml = buildSitemapXml('https://example.com', [
      {
        ...content,
        series: ['Platform Journal'],
        tags: ['Next.js'],
      },
    ]);

    expect(xml).toContain('<loc>https://example.com</loc>');
    expect(xml).toContain('<loc>https://example.com/series</loc>');
    expect(xml).toContain('<loc>https://example.com/tags</loc>');
    expect(xml).toContain('<loc>https://example.com/posts/public-post</loc>');
    expect(xml).toContain('<loc>https://example.com/series/platform-journal</loc>');
    expect(xml).toContain('<loc>https://example.com/tags/next-js</loc>');
  });
});
