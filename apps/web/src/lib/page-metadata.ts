import type { Metadata } from 'next';

import { buildPageMetadata, resolvePublicSiteUrl, type PageMetadataInput } from './seo';
import { loadSiteSettings } from './settings-repository';

export async function loadPublicPageMetadata(input: PageMetadataInput): Promise<Metadata> {
  const settings = await loadSiteSettings();

  return buildPageMetadata(
    input,
    settings,
    resolvePublicSiteUrl({
      configuredUrl: process.env.PUBLIC_SITE_URL,
      productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    }),
  );
}
