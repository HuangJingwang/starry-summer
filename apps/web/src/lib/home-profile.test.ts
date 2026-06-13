import { describe, expect, test } from 'vitest';

import { buildHomeProfileModel } from './home-profile';
import type { SiteContentItem } from './content';
import type { SiteSettings } from './settings';

const settings: SiteSettings = {
  profile: {
    title: 'Starry Summer',
    ownerName: 'Private Owner',
    description: 'Personal notes and projects.',
    socialLinks: [],
  },
  hero: {
    tagline: 'Writing in public.',
    backgroundImageUrl: '/hero.png',
    motto: 'Small notes compound.',
    quotes: ['Small notes compound.', 'Keep a record.'],
  },
  navigation: ['posts', 'projects'],
  updatedAt: '2026-06-10',
};

const baseContent: SiteContentItem = {
  id: 'base',
  title: 'Base',
  type: 'post',
  status: 'published',
  visibility: 'public',
  publishedAt: '2026-06-01',
};

describe('home profile model', () => {
  test('summarizes owner profile with recent project and moment', () => {
    const model = buildHomeProfileModel(
      settings,
      [
        { ...baseContent, id: 'post', type: 'post', title: 'Post', viewCount: 10, likeCount: 1 },
        { ...baseContent, id: 'old-project', type: 'project', title: 'Old Project', publishedAt: '2026-05-01' },
        { ...baseContent, id: 'latest-project', type: 'project', title: 'Latest Project', publishedAt: '2026-06-08' },
        { ...baseContent, id: 'moment', type: 'moment', title: 'Daily Note', summary: 'A small trace.', publishedAt: '2026-06-09' },
        { ...baseContent, id: 'draft-project', type: 'project', title: 'Draft Project', status: 'draft', publishedAt: '2026-06-10' },
      ],
      () => 0.8,
    );

    expect(model).toEqual({
      ownerName: 'Aster.H',
      title: 'Starry Summer',
      description: 'Personal notes and projects.',
      motto: 'Keep a record.',
      stats: {
        publicCount: 4,
        totalViews: 10,
        totalLikes: 1,
        lastPublishedAt: '2026-06-09',
      },
      latestProject: expect.objectContaining({ id: 'latest-project' }),
      latestMoment: expect.objectContaining({ id: 'moment' }),
    });
  });

  test('falls back to the single motto when no quote list is configured', () => {
    const model = buildHomeProfileModel({ ...settings, hero: { ...settings.hero, quotes: [] } }, [], () => 0.8);

    expect(model.motto).toBe('Small notes compound.');
  });
});
