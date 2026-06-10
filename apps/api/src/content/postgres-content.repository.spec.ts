import { describe, expect, test } from 'vitest';

import {
  buildContentInsert,
  buildPublicContentOrderClause,
  buildContentSelect,
  buildContentUpdate,
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
      categories: ['Writing', 'Platform'],
      tags: ['Next.js', 'Architecture'],
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
      categories: ['Writing', 'Platform'],
      tags: ['Next.js', 'Architecture'],
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
      categories: ['Notes'],
      tags: ['Markdown'],
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

  test('builds update SQL for editable content fields', () => {
    const update = buildContentUpdate('content-1', {
      type: 'note',
      title: 'Updated',
      bodyMarkdown: '# Updated',
      status: 'archived',
      categories: ['Notes'],
      tags: ['Markdown'],
      updatedAt: '2026-06-10T02:00:00.000Z',
    });

    expect(update).not.toBeNull();
    expect(update?.sql).toContain('type = $2');
    expect(update?.sql).toContain('title = $3');
    expect(update?.sql).toContain('body_markdown = $4');
    expect(update?.sql).toContain('status = $5');
    expect(update?.values).toEqual([
      'content-1',
      'note',
      'Updated',
      '# Updated',
      'archived',
      '2026-06-10T02:00:00.000Z',
    ]);
  });

  test('builds content selects with persisted like and view counts', () => {
    const select = buildContentSelect('where ci.status = $1', 'order by ci.published_at desc');

    expect(select).toContain('left join');
    expect(select).toContain('content_likes');
    expect(select).toContain('view_events');
    expect(select).toContain('ci.view_count + coalesce(view_counts.count, 0) as view_count');
    expect(select).toContain('ci.like_count + coalesce(like_counts.count, 0) as like_count');
    expect(select).toContain('group by ci.id, like_counts.count, view_counts.count');
    expect(select).toContain('where ci.status = $1');
    expect(select).toContain('order by ci.published_at desc');
  });

  test('builds popular order clauses from persisted interaction counts', () => {
    const select = buildContentSelect('where ci.status = $1', buildPublicContentOrderClause('popular'));

    expect(select).toContain('(ci.view_count + coalesce(view_counts.count, 0)) desc');
    expect(select).toContain('(ci.like_count + coalesce(like_counts.count, 0)) desc');
    expect(select).toContain('ci.published_at desc');
  });
});
