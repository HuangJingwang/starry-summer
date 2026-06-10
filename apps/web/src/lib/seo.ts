import type { Metadata } from 'next';

import { getContentHref, type SiteContentItem } from './content';
import type { SiteSettings } from './settings';

const defaultSiteUrl = 'http://localhost:3000';

export function normalizePublicSiteUrl(value: string | undefined): string {
  const normalized = value?.trim().replace(/\/+$/, '');

  return normalized || defaultSiteUrl;
}

export function buildRobotsText(siteUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api',
    `Sitemap: ${normalizePublicSiteUrl(siteUrl)}/sitemap.xml`,
    '',
  ].join('\n');
}

export function buildSiteMetadata(settings: SiteSettings, siteUrl: string): Metadata {
  const url = normalizePublicSiteUrl(siteUrl);

  return {
    title: settings.profile.title,
    description: settings.profile.description,
    metadataBase: new URL(url),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: settings.profile.title,
      description: settings.profile.description,
      url,
      siteName: settings.profile.title,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.profile.title,
      description: settings.profile.description,
    },
  };
}

export function buildContentMetadata(item: SiteContentItem, settings: SiteSettings, siteUrl: string): Metadata {
  const href = getContentHref(item);
  const url = `${normalizePublicSiteUrl(siteUrl)}${href}`;
  const description = item.summary || settings.profile.description;

  return {
    title: `${item.title} | ${settings.profile.title}`,
    description,
    alternates: {
      canonical: href,
    },
    openGraph: {
      title: item.title,
      description,
      url,
      siteName: settings.profile.title,
      type: 'article',
      publishedTime: item.publishedAt,
      tags: item.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description,
    },
  };
}

export function buildRssXml(settings: SiteSettings, siteUrl: string, content: SiteContentItem[]): string {
  const url = normalizePublicSiteUrl(siteUrl);
  const items = content
    .map((item) => {
      const href = `${url}${getContentHref(item)}`;

      return [
        '<item>',
        `<title><![CDATA[${escapeCdata(item.title)}]]></title>`,
        `<link>${escapeXml(href)}</link>`,
        `<guid>${escapeXml(href)}</guid>`,
        `<pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>`,
        `<description><![CDATA[${escapeCdata(item.summary ?? '')}]]></description>`,
        '</item>',
      ].join('');
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8" ?>',
    '<rss version="2.0">',
    '<channel>',
    `<title><![CDATA[${escapeCdata(settings.profile.title)}]]></title>`,
    `<link>${escapeXml(url)}</link>`,
    `<description><![CDATA[${escapeCdata(settings.profile.description)}]]></description>`,
    items,
    '</channel>',
    '</rss>',
  ].join('');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCdata(value: string): string {
  return value.replace(/\]\]>/g, ']]]]><![CDATA[>');
}
