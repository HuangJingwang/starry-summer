import type { SiteSettings } from './settings';

export interface SiteFooterLink {
  label: string;
  href: string;
  external: boolean;
}

export interface SiteFooterModel {
  title: string;
  ownerName: string;
  description: string;
  links: SiteFooterLink[];
}

export function buildSiteFooterModel(settings: SiteSettings): SiteFooterModel {
  return {
    title: settings.profile.title,
    ownerName: settings.profile.ownerName,
    description: settings.profile.description,
    links: [
      ...settings.profile.socialLinks.map((link) => ({
        label: link.label,
        href: link.href,
        external: true,
      })),
    ],
  };
}
