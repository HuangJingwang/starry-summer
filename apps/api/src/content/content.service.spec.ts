import { beforeEach, describe, expect, test } from 'vitest';

import { InMemoryContentRepository } from './content.repository';
import { ContentService } from './content.service';

describe('ContentService', () => {
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService(new InMemoryContentRepository());
  });

  test('creates drafts for admin authoring', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Hello Platform',
      slug: 'hello-platform',
      summary: 'A launch note',
      bodyMarkdown: '# Hello Platform',
      categories: [' Platform ', 'Writing', 'Platform'],
      tags: ['Next.js', '  Architecture ', 'Next.js'],
    });

    expect(draft.status).toBe('draft');
    expect(draft.visibility).toBe('public');
    expect(draft.title).toBe('Hello Platform');
    expect(draft.categories).toEqual(['Platform', 'Writing']);
    expect(draft.tags).toEqual(['Next.js', 'Architecture']);
  });

  test('public listings exclude drafts and private content', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Draft',
      slug: 'draft',
      summary: 'Hidden draft',
      bodyMarkdown: '# Draft',
    });
    const published = await service.createDraft({
      type: 'post',
      title: 'Published',
      slug: 'published',
      summary: 'Visible post',
      bodyMarkdown: '# Published',
    });
    const privatePost = await service.createDraft({
      type: 'post',
      title: 'Private',
      slug: 'private',
      summary: 'Hidden private post',
      bodyMarkdown: '# Private',
    });

    await service.publish(published.id);
    await service.publish(privatePost.id);
    await service.setVisibility(privatePost.id, 'private');

    const publicPosts = await service.listPublic({ type: 'post' });

    expect(publicPosts.map((post) => post.id)).toEqual([published.id]);
    expect(publicPosts).not.toContainEqual(draft);
    expect(publicPosts).not.toContainEqual(privatePost);
  });

  test('publishing rejects invalid slugs', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Bad Slug',
      slug: 'Bad Slug',
      summary: 'Invalid',
      bodyMarkdown: '# Bad',
    });

    await expect(service.publish(draft.id)).rejects.toThrow('Content is not ready to publish');
  });

  test('updates editable content fields before publishing', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Old Title',
      slug: 'old-title',
      summary: 'Old summary',
      bodyMarkdown: '# Old',
    });

    const updated = await service.updateContent(draft.id, {
      title: 'New Title',
      slug: 'new-title',
      summary: 'New summary',
      bodyMarkdown: '# New',
      type: 'note',
      allowComments: false,
      featured: true,
      pinned: true,
      categories: ['Notes', 'Writing'],
      tags: ['Markdown', 'Draft'],
    });

    expect(updated).toMatchObject({
      id: draft.id,
      title: 'New Title',
      slug: 'new-title',
      summary: 'New summary',
      bodyMarkdown: '# New',
      type: 'note',
      allowComments: false,
      featured: true,
      pinned: true,
      categories: ['Notes', 'Writing'],
      tags: ['Markdown', 'Draft'],
    });
  });

  test('archives and restores content from the admin workflow', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Archive Me',
      slug: 'archive-me',
      summary: 'Temporary',
      bodyMarkdown: '# Archive Me',
    });
    await service.publish(draft.id);

    const archived = await service.archive(draft.id);

    expect(archived.status).toBe('archived');
    expect(await service.listPublic({ type: 'post' })).toEqual([]);

    const restored = await service.restoreDraft(draft.id);

    expect(restored.status).toBe('draft');
    expect(restored.publishedAt).toBeNull();
  });

  test('imports Markdown with front matter as a draft', async () => {
    const imported = await service.importMarkdown(
      [
        '---',
        'title: Imported Note',
        'slug: imported-note',
        'summary: Imported from a Markdown archive',
        'status: published',
        'visibility: private',
        '---',
        '# Imported Note',
      ].join('\n'),
      'note',
    );

    expect(imported.title).toBe('Imported Note');
    expect(imported.slug).toBe('imported-note');
    expect(imported.summary).toBe('Imported from a Markdown archive');
    expect(imported.status).toBe('draft');
    expect(imported.visibility).toBe('private');
    expect(imported.bodyMarkdown).toBe('# Imported Note');
  });

  test('exports content as Markdown with front matter', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Export Me',
      slug: 'export-me',
      summary: 'Portable content',
      bodyMarkdown: '# Export Me',
    });

    const exported = await service.exportMarkdown(draft.id);

    expect(exported).toContain('title: Export Me');
    expect(exported).toContain('slug: export-me');
    expect(exported).toContain('summary: Portable content');
    expect(exported).toContain('categories: []');
    expect(exported).toContain('tags: []');
    expect(exported).toContain('# Export Me');
  });
});
