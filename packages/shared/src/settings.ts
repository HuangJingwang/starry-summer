export interface SiteProfile {
  title: string;
  description: string;
  ownerName: string;
  socialLinks: Array<{
    label: string;
    href: string;
  }>;
}
