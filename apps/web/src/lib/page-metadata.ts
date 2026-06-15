import type { Metadata } from 'next';

import { buildPageMetadata, normalizePublicSiteUrl, type PageMetadataInput } from './seo';
import { loadSiteSettings } from './settings-repository';

export async function loadPublicPageMetadata(input: PageMetadataInput): Promise<Metadata> {
  const settings = await loadSiteSettings();

  return buildPageMetadata(input, settings, normalizePublicSiteUrl(process.env.PUBLIC_SITE_URL));
}
