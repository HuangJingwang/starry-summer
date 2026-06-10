import { beforeEach, describe, expect, test } from 'vitest';

import { ContentService } from './content.service';

describe('ContentService', () => {
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService();
  });

  test('creates drafts for admin authoring', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Hello Platform',
      slug: 'hello-platform',
      summary: 'A launch note',
      bodyMarkdown: '# Hello Platform',
    });

    expect(draft.status).toBe('draft');
    expect(draft.visibility).toBe('public');
    expect(draft.title).toBe('Hello Platform');
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
    expect(exported).toContain('# Export Me');
  });
});
