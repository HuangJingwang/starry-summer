import { describe, expect, test } from 'vitest';

import type { SiteContentItem } from './content';
import { defaultSettings } from './settings';
import {
  buildContentMetadata,
  buildPageMetadata,
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
    expect(buildContentMetadata({ ...content, updatedAt: '2026-06-11' }, defaultSettings, 'https://example.com')).toMatchObject({
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
        modifiedTime: '2026-06-11',
      },
    });
  });

  test('builds canonical metadata for public index pages', () => {
    expect(
      buildPageMetadata(
        {
          title: '文章',
          description: '长文、教程、观点和阶段性复盘。',
          path: '/posts',
        },
        defaultSettings,
        'https://example.com/',
      ),
    ).toMatchObject({
      title: `文章 | ${defaultSettings.profile.title}`,
      description: '长文、教程、观点和阶段性复盘。',
      alternates: {
        canonical: '/posts',
      },
      openGraph: {
        title: '文章',
        description: '长文、教程、观点和阶段性复盘。',
        url: 'https://example.com/posts',
        siteName: defaultSettings.profile.title,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: '文章',
        description: '长文、教程、观点和阶段性复盘。',
      },
    });
  });

  test('uses per-content SEO title and description when provided', () => {
    expect(
      buildContentMetadata(
        {
          ...content,
          seoTitle: 'Custom Search Title',
          seoDescription: 'Custom search description.',
        },
        defaultSettings,
        'https://example.com',
      ),
    ).toMatchObject({
      title: 'Custom Search Title',
      description: 'Custom search description.',
      openGraph: {
        title: 'Custom Search Title',
        description: 'Custom search description.',
      },
      twitter: {
        title: 'Custom Search Title',
        description: 'Custom search description.',
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

  test('uses the generated default article cover in social metadata when posts have no cover', () => {
    expect(buildContentMetadata(content, defaultSettings, 'https://example.com/')).toMatchObject({
      openGraph: {
        images: [
          {
            url: 'https://example.com/images/default-post-cover.png',
            alt: 'Public Post 默认文章封面',
          },
        ],
      },
      twitter: {
        images: ['https://example.com/images/default-post-cover.png'],
      },
    });
  });

  test('builds RSS XML from site settings and public content', () => {
    const xml = buildRssXml(defaultSettings, 'https://example.com', [{ ...content, updatedAt: '2026-06-11' }]);

    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<title><![CDATA[Starry Summer]]></title>');
    expect(xml).toContain(
      '<description><![CDATA[我是 Aster.H，这里是我的个人内容平台。文章、笔记、日常和项目都会长期沉淀在这里，方便公开分享，也方便我回看自己的思考和成长轨迹。]]></description>',
    );
    expect(xml).toContain('<link>https://example.com</link>');
    expect(xml).toContain('<atom:link href="https://example.com/rss.xml" rel="self" type="application/rss+xml" />');
    expect(xml).toContain(`<lastBuildDate>${new Date('2026-06-11').toUTCString()}</lastBuildDate>`);
    expect(xml).toContain('<title><![CDATA[Public Post]]></title>');
    expect(xml).toContain('<link>https://example.com/posts/public-post</link>');
    expect(xml).toContain('<description><![CDATA[A public post summary.]]></description>');
  });

  test('builds sitemap XML with static content category series and tag URLs', () => {
    const xml = buildSitemapXml('https://example.com', [
      {
        ...content,
        updatedAt: '2026-06-11',
        categories: ['Writing Notes'],
        series: ['Platform Journal'],
        tags: ['Next.js'],
      },
    ]);

    expect(xml).toContain('<loc>https://example.com</loc>');
    expect(xml).toContain('<loc>https://example.com/series</loc>');
    expect(xml).not.toContain('<loc>https://example.com/guestbook</loc>');
    expect(xml).toContain('<loc>https://example.com/categories/writing-notes</loc>');
    expect(xml).toContain('<loc>https://example.com/tags</loc>');
    expect(xml).toContain('<loc>https://example.com/posts/public-post</loc>');
    expect(xml).toContain('<lastmod>2026-06-11</lastmod>');
    expect(xml).toContain('<loc>https://example.com/series/platform-journal</loc>');
    expect(xml).toContain('<loc>https://example.com/tags/next-js</loc>');
  });
});
