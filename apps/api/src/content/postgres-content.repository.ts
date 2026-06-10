import pg from 'pg';

import type { ContentStatus, ContentType, ContentVisibility } from '@starry-summer/shared';

import type { ContentRecord } from './content.service';
import type { ContentRepository, CreateContentRecordInput } from './content.repository';

const { Pool } = pg;

export interface ContentItemRow {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  body_markdown: string;
  status: ContentStatus;
  visibility: ContentVisibility;
  allow_comments: boolean;
  pinned: boolean;
  featured: boolean;
  categories?: string[] | null;
  tags?: string[] | null;
  view_count: number;
  like_count: number;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface SqlStatement {
  sql: string;
  values: unknown[];
}

export function mapContentRow(row: ContentItemRow): ContentRecord {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    bodyMarkdown: row.body_markdown,
    status: row.status,
    visibility: row.visibility,
    allowComments: row.allow_comments,
    pinned: row.pinned,
    featured: row.featured,
    categories: row.categories ?? [],
    tags: row.tags ?? [],
    viewCount: row.view_count,
    likeCount: row.like_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    publishedAt: row.published_at?.toISOString() ?? null,
  };
}

export function buildContentInsert(input: CreateContentRecordInput): SqlStatement {
  return {
    sql: `
      insert into content_items (
        type,
        title,
        slug,
        summary,
        body_markdown,
        status,
        visibility,
        allow_comments,
        pinned,
        featured,
        view_count,
        like_count,
        published_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      returning *
    `,
    values: [
      input.type,
      input.title,
      input.slug,
      input.summary,
      input.bodyMarkdown,
      input.status,
      input.visibility,
      input.allowComments,
      input.pinned,
      input.featured,
      input.viewCount,
      input.likeCount,
      input.publishedAt,
    ],
  };
}

export function buildContentUpdate(id: string, patch: Partial<ContentRecord>): SqlStatement | null {
  const entries = Object.entries(toDatabasePatch(patch));

  if (entries.length === 0) {
    return null;
  }

  const assignments = entries.map(([column], index) => `${column} = $${index + 2}`).join(', ');

  return {
    sql: `update content_items set ${assignments} where id = $1 returning *`,
    values: [id, ...entries.map(([, value]) => value)],
  };
}

export class PostgresContentRepository implements ContentRepository {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async create(input: CreateContentRecordInput): Promise<ContentRecord> {
    const client = await this.pool.connect();

    try {
      await client.query('begin');
      const statement = buildContentInsert(input);
      const result = await client.query<ContentItemRow>(statement.sql, statement.values);
      const row = result.rows[0];

      if (!row) {
        throw new Error('PostgreSQL did not return the created content row');
      }

      await syncTaxonomyLabels(client, row.id, 'category', input.categories);
      await syncTaxonomyLabels(client, row.id, 'tag', input.tags);
      const created = await this.findByIdWithClient(client, row.id);
      await client.query('commit');

      if (!created) {
        throw new Error('PostgreSQL did not return the created content relations');
      }

      return created;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<ContentRecord | null> {
    return this.findByIdWithClient(this.pool, id);
  }

  async listAdmin(): Promise<ContentRecord[]> {
    const result = await this.pool.query<ContentItemRow>(
      buildContentSelect('where true', 'order by ci.updated_at desc'),
    );

    return result.rows.map(mapContentRow);
  }

  async listPublic(filter: { type?: ContentType } = {}): Promise<ContentRecord[]> {
    const values: unknown[] = [];
    const typeClause = filter.type ? 'and ci.type = $1' : '';

    if (filter.type) {
      values.push(filter.type);
    }

    const result = await this.pool.query<ContentItemRow>(
      buildContentSelect(
        `
          where ci.status = 'published'
            and ci.visibility = 'public'
            ${typeClause}
        `,
        'order by ci.published_at desc',
      ),
      values,
    );

    return result.rows.map(mapContentRow);
  }

  async update(id: string, patch: Partial<ContentRecord>): Promise<ContentRecord | null> {
    const client = await this.pool.connect();

    try {
      await client.query('begin');
      const statement = buildContentUpdate(id, patch);

      if (statement) {
        await client.query<ContentItemRow>(statement.sql, statement.values);
      }

      if (patch.categories) {
        await syncTaxonomyLabels(client, id, 'category', patch.categories);
      }

      if (patch.tags) {
        await syncTaxonomyLabels(client, id, 'tag', patch.tags);
      }

      const updated = await this.findByIdWithClient(client, id);
      await client.query('commit');

      return updated;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  private async findByIdWithClient(client: Queryable, id: string): Promise<ContentRecord | null> {
    const result = await client.query<ContentItemRow>(buildContentSelect('where ci.id = $1'), [id]);

    return result.rows[0] ? mapContentRow(result.rows[0]) : null;
  }
}

interface Queryable {
  query<T extends pg.QueryResultRow>(sql: string, values?: unknown[]): Promise<pg.QueryResult<T>>;
}

type TaxonomyKind = 'category' | 'tag';

const taxonomyConfig: Record<TaxonomyKind, { table: string; joinTable: string; joinColumn: string }> = {
  category: {
    table: 'categories',
    joinTable: 'content_categories',
    joinColumn: 'category_id',
  },
  tag: {
    table: 'tags',
    joinTable: 'content_tags',
    joinColumn: 'tag_id',
  },
};

function buildContentSelect(whereClause: string, orderClause = ''): string {
  return `
    select
      ci.*,
      coalesce(array_remove(array_agg(distinct c.name), null), '{}') as categories,
      coalesce(array_remove(array_agg(distinct t.name), null), '{}') as tags
    from content_items ci
    left join content_categories cc on cc.content_id = ci.id
    left join categories c on c.id = cc.category_id
    left join content_tags ct on ct.content_id = ci.id
    left join tags t on t.id = ct.tag_id
    ${whereClause}
    group by ci.id
    ${orderClause}
  `;
}

async function syncTaxonomyLabels(client: Queryable, contentId: string, kind: TaxonomyKind, labels: string[]): Promise<void> {
  const config = taxonomyConfig[kind];

  await client.query(`delete from ${config.joinTable} where content_id = $1`, [contentId]);

  for (const label of labels) {
    const name = label.trim();

    if (!name) {
      continue;
    }

    const slug = slugifyTaxonomyLabel(name);
    const term = await client.query<{ id: string }>(
      `
        insert into ${config.table} (name, slug)
        values ($1, $2)
        on conflict (slug) do update set name = excluded.name
        returning id
      `,
      [name, slug],
    );
    const termId = term.rows[0]?.id;

    if (termId) {
      await client.query(
        `
          insert into ${config.joinTable} (content_id, ${config.joinColumn})
          values ($1, $2)
          on conflict do nothing
        `,
        [contentId, termId],
      );
    }
  }
}

function slugifyTaxonomyLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function toDatabasePatch(patch: Partial<ContentRecord>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const mapping: Array<[keyof ContentRecord, string]> = [
    ['type', 'type'],
    ['title', 'title'],
    ['slug', 'slug'],
    ['summary', 'summary'],
    ['bodyMarkdown', 'body_markdown'],
    ['status', 'status'],
    ['visibility', 'visibility'],
    ['allowComments', 'allow_comments'],
    ['pinned', 'pinned'],
    ['featured', 'featured'],
    ['viewCount', 'view_count'],
    ['likeCount', 'like_count'],
    ['publishedAt', 'published_at'],
    ['updatedAt', 'updated_at'],
  ];

  for (const [key, column] of mapping) {
    if (patch[key] !== undefined) {
      result[column] = patch[key];
    }
  }

  return result;
}
