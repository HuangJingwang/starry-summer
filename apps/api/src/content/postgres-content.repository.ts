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
    const statement = buildContentInsert(input);
    const result = await this.pool.query<ContentItemRow>(statement.sql, statement.values);
    const row = result.rows[0];

    if (!row) {
      throw new Error('PostgreSQL did not return the created content row');
    }

    return mapContentRow(row);
  }

  async findById(id: string): Promise<ContentRecord | null> {
    const result = await this.pool.query<ContentItemRow>('select * from content_items where id = $1', [id]);

    return result.rows[0] ? mapContentRow(result.rows[0]) : null;
  }

  async listAdmin(): Promise<ContentRecord[]> {
    const result = await this.pool.query<ContentItemRow>('select * from content_items order by updated_at desc');

    return result.rows.map(mapContentRow);
  }

  async listPublic(filter: { type?: ContentType } = {}): Promise<ContentRecord[]> {
    const values: unknown[] = [];
    const typeClause = filter.type ? 'and type = $1' : '';

    if (filter.type) {
      values.push(filter.type);
    }

    const result = await this.pool.query<ContentItemRow>(
      `
        select *
        from content_items
        where status = 'published'
          and visibility = 'public'
          ${typeClause}
        order by published_at desc
      `,
      values,
    );

    return result.rows.map(mapContentRow);
  }

  async update(id: string, patch: Partial<ContentRecord>): Promise<ContentRecord | null> {
    const statement = buildContentUpdate(id, patch);

    if (!statement) {
      return this.findById(id);
    }

    const result = await this.pool.query<ContentItemRow>(statement.sql, statement.values);

    return result.rows[0] ? mapContentRow(result.rows[0]) : null;
  }
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
