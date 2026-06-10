import { beforeEach, describe, expect, test } from 'vitest';

import { InMemoryContentRepository } from './content.repository';
import { ContentService } from './content.service';

describe('ContentService', () => {
  let service: ContentService;
  let repository: InMemoryContentRepository;

  beforeEach(() => {
    repository = new InMemoryContentRepository();
    service = new ContentService(repository);
  });

  test('creates drafts for admin authoring', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Hello Platform',
      slug: 'hello-platform',
      summary: 'A launch note',
      bodyMarkdown: '# Hello Platform',
      coverAssetId: ' cover-asset-1 ',
      categories: [' Platform ', 'Writing', 'Platform'],
      tags: ['Next.js', '  Architecture ', 'Next.js'],
    });

    expect(draft.status).toBe('draft');
    expect(draft.visibility).toBe('public');
    expect(draft.sourceType).toBe('original');
    expect(draft.sourceUrl).toBe('');
    expect(draft.coverAssetId).toBe('cover-asset-1');
    expect(draft.title).toBe('Hello Platform');
    expect(draft.categories).toEqual(['Platform', 'Writing']);
    expect(draft.tags).toEqual(['Next.js', 'Architecture']);
  });

  test('normalizes project metadata when creating project drafts', async () => {
    const draft = await service.createDraft({
      type: 'project',
      title: 'Project Platform',
      slug: 'project-platform',
      summary: 'A project profile',
      bodyMarkdown: '# Project Platform',
      project: {
        status: 'active',
        links: {
          website: ' https://example.com ',
          repository: ' https://github.com/me/project ',
          demo: '',
          article: ' https://example.com/writeup ',
        },
        stack: [' Next.js ', 'PostgreSQL', 'next.js', ''],
        startedAt: ' 2026-01-01 ',
        endedAt: '',
      },
    } as any);

    expect(draft.project).toEqual({
      status: 'active',
      links: {
        website: 'https://example.com',
        repository: 'https://github.com/me/project',
        article: 'https://example.com/writeup',
      },
      stack: ['Next.js', 'PostgreSQL'],
      startedAt: '2026-01-01',
    });
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

  test('public listings can be sorted by popularity', async () => {
    const older = await service.createDraft({
      type: 'post',
      title: 'Older',
      slug: 'older',
      summary: 'Older',
      bodyMarkdown: '# Older',
    });
    const newer = await service.createDraft({
      type: 'post',
      title: 'Newer',
      slug: 'newer',
      summary: 'Newer',
      bodyMarkdown: '# Newer',
    });

    await service.publish(older.id);
    await service.publish(newer.id);
    await repository.update(older.id, { viewCount: 200, likeCount: 10 });
    await repository.update(newer.id, { viewCount: 10, likeCount: 1 });

    expect((await service.listPublic({ type: 'post', sort: 'popular' })).map((item) => item.id)).toEqual([older.id, newer.id]);
  });

  test('lists admin content with server-side filters', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Draft Post',
      slug: 'draft-post',
      summary: 'A draft',
      bodyMarkdown: '# Draft',
      categories: ['Drafts'],
      tags: ['Writing'],
    });
    const privateProject = await service.createDraft({
      type: 'project',
      title: 'Private Project',
      slug: 'private-project',
      summary: 'Private work',
      bodyMarkdown: '# Project',
      categories: ['Lab'],
      tags: ['Roadmap'],
    });
    await service.publish(privateProject.id);
    await service.setVisibility(privateProject.id, 'private');

    expect((await service.listAdmin({ type: 'project' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await service.listAdmin({ status: 'draft' })).map((item) => item.id)).toEqual([draft.id]);
    expect((await service.listAdmin({ status: 'private' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await service.listAdmin({ category: 'lab' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await service.listAdmin({ tag: 'roadmap' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await service.listAdmin({ query: 'roadmap' })).map((item) => item.id)).toEqual([privateProject.id]);
  });

  test('allows comments only on published public content with comments enabled', async () => {
    const published = await service.createDraft({
      type: 'post',
      title: 'Published',
      slug: 'commentable',
      summary: 'Visible post',
      bodyMarkdown: '# Published',
    });
    await service.publish(published.id);

    await expect(service.ensureCanComment('post', published.id)).resolves.toBeUndefined();

    const disabled = await service.updateContent(published.id, { allowComments: false });
    await expect(service.ensureCanComment('post', disabled.id)).rejects.toThrow('Comments are disabled for this content');

    const privatePost = await service.createDraft({
      type: 'post',
      title: 'Private',
      slug: 'private-comment-target',
      summary: 'Hidden',
      bodyMarkdown: '# Private',
    });
    await service.publish(privatePost.id);
    await service.setVisibility(privatePost.id, 'private');

    await expect(service.ensureCanComment('post', privatePost.id)).rejects.toThrow(`Content ${privatePost.id} was not found`);
    await expect(service.ensureCanComment('note', disabled.id)).rejects.toThrow(`Content ${disabled.id} was not found`);
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
      sourceType: 'repost',
      sourceUrl: 'https://example.com/original-post',
      coverAssetId: ' cover-asset-2 ',
      categories: ['Notes', 'Writing'],
      tags: ['Markdown', 'Draft'],
      project: {
        status: 'completed',
        links: {
          website: 'https://example.com/project',
          repository: ' https://github.com/me/project ',
        },
        stack: ['NestJS', 'PostgreSQL', 'nestjs'],
        startedAt: '2025-12-01',
        endedAt: '2026-02-01',
      },
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
      sourceType: 'repost',
      sourceUrl: 'https://example.com/original-post',
      coverAssetId: 'cover-asset-2',
      categories: ['Notes', 'Writing'],
      tags: ['Markdown', 'Draft'],
      project: {
        status: 'completed',
        links: {
          website: 'https://example.com/project',
          repository: 'https://github.com/me/project',
        },
        stack: ['NestJS', 'PostgreSQL'],
        startedAt: '2025-12-01',
        endedAt: '2026-02-01',
      },
    });
  });

  test('rejects duplicate content slugs', async () => {
    const first = await service.createDraft({
      type: 'post',
      title: 'First Post',
      slug: 'shared-slug',
      summary: 'First',
      bodyMarkdown: '# First',
    });
    const second = await service.createDraft({
      type: 'note',
      title: 'Second Note',
      slug: 'second-note',
      summary: 'Second',
      bodyMarkdown: '# Second',
    });

    await expect(
      service.createDraft({
        type: 'project',
        title: 'Duplicate Project',
        slug: 'shared-slug',
        summary: 'Duplicate',
        bodyMarkdown: '# Duplicate',
      }),
    ).rejects.toThrow('Content slug is already in use');
    await expect(service.updateContent(second.id, { slug: first.slug })).rejects.toThrow('Content slug is already in use');
    await expect(service.updateContent(first.id, { summary: 'Updated with same slug', slug: first.slug })).resolves.toMatchObject({
      id: first.id,
      slug: first.slug,
      summary: 'Updated with same slug',
    });
  });

  test('returns a full admin content record by id', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Editable Post',
      slug: 'editable-post',
      summary: 'Ready to edit',
      bodyMarkdown: '# Editable Post',
      categories: ['Writing'],
      tags: ['Admin'],
    });

    await expect(service.getAdminRecord(draft.id)).resolves.toEqual(draft);
    await expect(service.getAdminRecord('missing')).rejects.toThrow('Content missing was not found');
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

  test('permanently deletes archived content only', async () => {
    const draft = await service.createDraft({
      type: 'post',
      title: 'Delete Me',
      slug: 'delete-me',
      summary: 'Temporary',
      bodyMarkdown: '# Delete Me',
    });

    await expect(service.deleteArchived(draft.id)).rejects.toThrow('Only archived content can be permanently deleted');

    await service.archive(draft.id);
    await expect(service.deleteArchived(draft.id)).resolves.toBeUndefined();
    await expect(service.getAdminRecord(draft.id)).rejects.toThrow('Content 1 was not found');
  });

  test('imports Markdown with front matter as a draft', async () => {
    const imported = await service.importMarkdown(
      [
        '---',
        'title: Imported Note',
        'slug: imported-note',
        'summary: Imported from a Markdown archive',
        'sourceType: repost',
        'sourceUrl: https://example.com/source',
        'status: published',
        'visibility: private',
        'allowComments: false',
        'featured: true',
        'pinned: true',
        '---',
        '# Imported Note',
      ].join('\n'),
      'note',
    );

    expect(imported.title).toBe('Imported Note');
    expect(imported.slug).toBe('imported-note');
    expect(imported.summary).toBe('Imported from a Markdown archive');
    expect(imported.sourceType).toBe('repost');
    expect(imported.sourceUrl).toBe('https://example.com/source');
    expect(imported.status).toBe('draft');
    expect(imported.visibility).toBe('private');
    expect(imported.allowComments).toBe(false);
    expect(imported.featured).toBe(true);
    expect(imported.pinned).toBe(true);
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
    await service.updateContent(draft.id, { allowComments: false, featured: true, pinned: true });

    const exported = await service.exportMarkdown(draft.id);

    expect(exported).toContain('title: Export Me');
    expect(exported).toContain('slug: export-me');
    expect(exported).toContain('summary: Portable content');
    expect(exported).toContain('sourceType: original');
    expect(exported).toContain("sourceUrl: ''");
    expect(exported).toContain('allowComments: false');
    expect(exported).toContain('featured: true');
    expect(exported).toContain('pinned: true');
    expect(exported).toContain('categories: []');
    expect(exported).toContain('tags: []');
    expect(exported).toContain('# Export Me');
  });

  test('exports every admin content record as one Markdown archive', async () => {
    const first = await service.createDraft({
      type: 'post',
      title: 'First Export',
      slug: 'first-export',
      summary: 'First portable content',
      bodyMarkdown: '# First Export',
    });
    const second = await service.createDraft({
      type: 'note',
      title: 'Second Export',
      slug: 'second-export',
      summary: 'Second portable content',
      bodyMarkdown: '# Second Export',
    });

    await service.publish(first.id);
    await service.setVisibility(second.id, 'private');

    const archive = await service.exportMarkdownArchive();

    expect(archive).toContain('# Starry Summer Markdown Export');
    expect(archive).toContain(`<!-- starry-summer:content post/first-export id=${first.id} -->`);
    expect(archive).toContain(`<!-- starry-summer:content note/second-export id=${second.id} -->`);
    expect(archive).toContain('title: First Export');
    expect(archive).toContain('title: Second Export');
    expect(archive).toContain('visibility: private');
    expect(archive).toContain('# First Export');
    expect(archive).toContain('# Second Export');
  });

  test('imports every Markdown archive section as draft content', async () => {
    const imported = await service.importMarkdownArchive(
      [
        '# Starry Summer Markdown Export',
        '',
        '<!-- starry-summer:content post/restored-post id=old-1 -->',
        '---',
        'title: Restored Post',
        'slug: restored-post',
        'summary: Restored from a full archive',
        'type: post',
        'status: published',
        'visibility: public',
        'categories:',
        '  - Writing',
        'tags:',
        '  - Backup',
        '---',
        '# Restored Post',
        '',
        '<!-- starry-summer:content note/restored-note id=old-2 -->',
        '---',
        'title: Restored Note',
        'slug: restored-note',
        'summary: Private restored note',
        'type: note',
        'status: archived',
        'visibility: private',
        '---',
        '# Restored Note',
      ].join('\n'),
    );

    expect(imported).toHaveLength(2);
    expect(imported.map((item) => item.type)).toEqual(['post', 'note']);
    expect(imported.map((item) => item.status)).toEqual(['draft', 'draft']);
    expect(imported.map((item) => item.visibility)).toEqual(['public', 'private']);
    expect(imported[0]).toMatchObject({
      title: 'Restored Post',
      slug: 'restored-post',
      summary: 'Restored from a full archive',
      categories: ['Writing'],
      tags: ['Backup'],
      bodyMarkdown: '# Restored Post',
    });
    expect(imported[1]).toMatchObject({
      title: 'Restored Note',
      slug: 'restored-note',
      summary: 'Private restored note',
      bodyMarkdown: '# Restored Note',
    });
  });
});
