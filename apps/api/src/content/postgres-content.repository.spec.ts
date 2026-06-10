import { describe, expect, test } from 'vitest';

import {
  buildContentInsert,
  mapContentRow,
  type ContentItemRow,
} from './postgres-content.repository';

describe('PostgresContentRepository mapping', () => {
  test('maps database rows to content records', () => {
    const row: ContentItemRow = {
      id: 'content-1',
      type: 'post',
      title: 'Hello',
      slug: 'hello',
      summary: 'Intro',
      body_markdown: '# Hello',
      status: 'published',
      visibility: 'public',
      allow_comments: true,
      pinned: false,
      featured: true,
      view_count: 10,
      like_count: 2,
      created_at: new Date('2026-06-10T00:00:00.000Z'),
      updated_at: new Date('2026-06-10T01:00:00.000Z'),
      published_at: new Date('2026-06-10T00:30:00.000Z'),
    };

    expect(mapContentRow(row)).toEqual({
      id: 'content-1',
      type: 'post',
      title: 'Hello',
      slug: 'hello',
      summary: 'Intro',
      bodyMarkdown: '# Hello',
      status: 'published',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: true,
      viewCount: 10,
      likeCount: 2,
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T01:00:00.000Z',
      publishedAt: '2026-06-10T00:30:00.000Z',
    });
  });

  test('builds insert SQL and values from create input', () => {
    const insert = buildContentInsert({
      type: 'note',
      title: 'Note',
      slug: 'note',
      summary: 'Short note',
      bodyMarkdown: '# Note',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });

    expect(insert.sql).toContain('insert into content_items');
    expect(insert.sql).toContain('body_markdown');
    expect(insert.values).toEqual([
      'note',
      'Note',
      'note',
      'Short note',
      '# Note',
      'draft',
      'public',
      true,
      false,
      false,
      0,
      0,
      null,
    ]);
  });
});
