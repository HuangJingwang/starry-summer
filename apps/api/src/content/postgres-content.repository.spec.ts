import { describe, expect, test } from 'vitest';

import {
  buildAdminContentSelect,
  buildContentDelete,
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
      seo_title: 'Hello SEO',
      seo_description: 'Search intro',
      body_markdown: '# Hello',
      source_type: 'repost',
      source_url: 'https://example.com/original',
      cover_asset_id: 'asset-1',
      cover_asset_url: '/uploads/cover.png',
      cover_asset_alt_text: 'Cover image',
      status: 'published',
      visibility: 'public',
      allow_comments: true,
      pinned: false,
      featured: true,
      categories: ['Writing', 'Platform'],
      tags: ['Next.js', 'Architecture'],
      series: ['Build Log', 'Platform Journal'],
      view_count: 10,
      like_count: 2,
      project_status: 'active',
      project_links: {
        website: 'https://example.com',
        repository: 'https://github.com/me/project',
      },
      project_stack: ['Next.js', 'PostgreSQL'],
      project_started_at: '2026-01-01',
      project_ended_at: null,
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
      seoTitle: 'Hello SEO',
      seoDescription: 'Search intro',
      bodyMarkdown: '# Hello',
      sourceType: 'repost',
      sourceUrl: 'https://example.com/original',
      coverAssetId: 'asset-1',
      coverImageUrl: '/uploads/cover.png',
      coverAltText: 'Cover image',
      status: 'published',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: true,
      categories: ['Writing', 'Platform'],
      tags: ['Next.js', 'Architecture'],
      series: ['Build Log', 'Platform Journal'],
      viewCount: 10,
      likeCount: 2,
      project: {
        status: 'active',
        links: {
          website: 'https://example.com',
          repository: 'https://github.com/me/project',
        },
        stack: ['Next.js', 'PostgreSQL'],
        startedAt: '2026-01-01',
      },
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
      seoTitle: 'Note SEO',
      seoDescription: 'Search note',
      bodyMarkdown: '# Note',
      sourceType: 'original',
      sourceUrl: '',
      coverAssetId: 'asset-2',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: ['Notes'],
      tags: ['Markdown'],
      series: ['Build Log'],
      viewCount: 0,
      likeCount: 0,
      project: {
        status: 'paused',
        links: {
          demo: 'https://example.com/demo',
        },
        stack: ['Vue', 'Spring Boot'],
        startedAt: '2025-01-01',
        endedAt: '2025-12-31',
      },
      publishedAt: null,
    });

    expect(insert.sql).toContain('insert into content_items');
    expect(insert.sql).toContain('seo_title');
    expect(insert.sql).toContain('seo_description');
    expect(insert.sql).toContain('body_markdown');
    expect(insert.sql).toContain('source_type');
    expect(insert.sql).toContain('source_url');
    expect(insert.sql).toContain('cover_asset_id');
    expect(insert.values).toEqual([
      'note',
      'Note',
      'note',
      'Short note',
      'Note SEO',
      'Search note',
      '# Note',
      'original',
      '',
      'asset-2',
      'draft',
      'public',
      true,
      false,
      false,
      0,
      0,
      'paused',
      {
        demo: 'https://example.com/demo',
      },
      ['Vue', 'Spring Boot'],
      '2025-01-01',
      '2025-12-31',
      null,
    ]);
  });

  test('builds update SQL for editable content fields', () => {
    const update = buildContentUpdate('content-1', {
      type: 'note',
      title: 'Updated',
      seoTitle: 'Updated SEO',
      seoDescription: 'Updated search description',
      bodyMarkdown: '# Updated',
      sourceType: 'repost',
      sourceUrl: 'https://example.com/updated',
      coverAssetId: 'asset-3',
      status: 'archived',
      categories: ['Notes'],
      tags: ['Markdown'],
      series: ['Build Log'],
      project: {
        status: 'completed',
        links: { repository: 'https://github.com/me/updated' },
        stack: ['Next.js'],
        startedAt: '2026-01-01',
      },
      updatedAt: '2026-06-10T02:00:00.000Z',
    });

    expect(update).not.toBeNull();
    expect(update?.sql).toContain('type = $2');
    expect(update?.sql).toContain('title = $3');
    expect(update?.sql).toContain('seo_title = $4');
    expect(update?.sql).toContain('seo_description = $5');
    expect(update?.sql).toContain('body_markdown = $6');
    expect(update?.sql).toContain('source_type = $7');
    expect(update?.sql).toContain('source_url = $8');
    expect(update?.sql).toContain('cover_asset_id = $9');
    expect(update?.sql).toContain('status = $10');
    expect(update?.sql).toContain('project_status = $11');
    expect(update?.sql).toContain('project_links = $12');
    expect(update?.sql).toContain('project_stack = $13');
    expect(update?.sql).toContain('project_started_at = $14');
    expect(update?.sql).toContain('project_ended_at = $15');
    expect(update?.values).toEqual([
      'content-1',
      'note',
      'Updated',
      'Updated SEO',
      'Updated search description',
      '# Updated',
      'repost',
      'https://example.com/updated',
      'asset-3',
      'archived',
      'completed',
      { repository: 'https://github.com/me/updated' },
      ['Next.js'],
      '2026-01-01',
      null,
      '2026-06-10T02:00:00.000Z',
    ]);
  });

  test('builds content delete SQL', () => {
    expect(buildContentDelete('content-1')).toEqual({
      sql: 'delete from content_items where id = $1 returning id',
      values: ['content-1'],
    });
  });

  test('builds content selects with persisted like and view counts', () => {
    const select = buildContentSelect('where ci.status = $1', 'order by ci.published_at desc');

    expect(select).toContain('left join');
    expect(select).toContain('cover_assets.public_url as cover_asset_url');
    expect(select).toContain('left join assets cover_assets');
    expect(select).toContain('content_series');
    expect(select).toContain('series');
    expect(select).toContain('content_likes');
    expect(select).toContain('view_events');
    expect(select).toContain('ci.view_count + coalesce(view_counts.count, 0) as view_count');
    expect(select).toContain('ci.like_count + coalesce(like_counts.count, 0) as like_count');
    expect(select).toContain('group by ci.id, cover_assets.public_url, cover_assets.alt_text, like_counts.count, view_counts.count');
    expect(select).toContain('where ci.status = $1');
    expect(select).toContain('order by ci.published_at desc');
  });

  test('builds filtered admin content selects', () => {
    const statement = buildAdminContentSelect({
      type: 'project',
      status: 'private',
      query: 'roadmap',
      category: 'Lab',
      tag: 'Roadmap',
      series: 'Build Log',
    });

    expect(statement.sql).toContain('where true');
    expect(statement.sql).toContain('ci.type = $1');
    expect(statement.sql).toContain("ci.visibility = 'private'");
    expect(statement.sql).toContain('lower(c_exact.name) = $2');
    expect(statement.sql).toContain('lower(t_exact.name) = $3');
    expect(statement.sql).toContain('lower(s_exact.name) = $4');
    expect(statement.sql).toContain('lower(ci.title) like $5');
    expect(statement.sql).toContain('exists');
    expect(statement.sql).toContain('categories');
    expect(statement.sql).toContain('tags');
    expect(statement.sql).toContain('series');
    expect(statement.sql).toContain('order by ci.updated_at desc');
    expect(statement.values).toEqual(['project', 'lab', 'roadmap', 'build log', '%roadmap%']);
  });

  test('builds slug lookup selects', () => {
    expect(buildContentSelect('where ci.slug = $1')).toContain('where ci.slug = $1');
  });

  test('builds popular order clauses from persisted interaction counts', () => {
    const select = buildContentSelect('where ci.status = $1', buildPublicContentOrderClause('popular'));

    expect(select).toContain('ci.pinned desc');
    expect(select).toContain('(ci.view_count + coalesce(view_counts.count, 0)) desc');
    expect(select).toContain('(ci.like_count + coalesce(like_counts.count, 0)) desc');
    expect(select).toContain('ci.published_at desc');
  });

  test('builds latest order clauses with pinned content first', () => {
    expect(buildPublicContentOrderClause('latest')).toContain('order by ci.pinned desc, ci.published_at desc');
  });
});
