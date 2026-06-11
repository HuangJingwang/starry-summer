import type { Metadata } from 'next';

import { buildPageMetadata, normalizePublicSiteUrl, type PageMetadataInput } from './seo';
import { loadPublicSettings } from './settings';

export async function loadPublicPageMetadata(input: PageMetadataInput): Promise<Metadata> {
  const settings = await loadPublicSettings(undefined, {
    apiBaseUrl: process.env.API_BASE_URL,
  });

  return buildPageMetadata(input, settings, normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL));
}
