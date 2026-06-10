import pg from 'pg';

import type { ContentSourceType, ContentStatus, ContentType, ContentVisibility, ProjectLinks, ProjectMetadata, ProjectStatus } from '@starry-summer/shared';

import type { AdminContentFilter, ContentRecord, PublicContentFilter } from './content.service';
import type { ContentRepository, CreateContentRecordInput } from './content.repository';

const { Pool } = pg;

export interface ContentItemRow {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  body_markdown: string;
  source_type: ContentSourceType;
  source_url: string;
  cover_asset_id?: string | null;
  cover_asset_url?: string | null;
  cover_asset_alt_text?: string | null;
  status: ContentStatus;
  visibility: ContentVisibility;
  allow_comments: boolean;
  pinned: boolean;
  featured: boolean;
  categories?: string[] | null;
  tags?: string[] | null;
  view_count: number;
  like_count: number;
  project_status?: ProjectStatus | null;
  project_links?: ProjectLinks | null;
  project_stack?: string[] | null;
  project_started_at?: Date | string | null;
  project_ended_at?: Date | string | null;
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
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    coverAssetId: row.cover_asset_id ?? undefined,
    coverImageUrl: row.cover_asset_url ?? undefined,
    coverAltText: row.cover_asset_alt_text ?? undefined,
    status: row.status,
    visibility: row.visibility,
    allowComments: row.allow_comments,
    pinned: row.pinned,
    featured: row.featured,
    categories: row.categories ?? [],
    tags: row.tags ?? [],
    viewCount: row.view_count,
    likeCount: row.like_count,
    project: mapProjectMetadata(row),
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
        source_type,
        source_url,
        cover_asset_id,
        status,
        visibility,
        allow_comments,
        pinned,
        featured,
        view_count,
        like_count,
        project_status,
        project_links,
        project_stack,
        project_started_at,
        project_ended_at,
        published_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      returning *
    `,
    values: [
      input.type,
      input.title,
      input.slug,
      input.summary,
      input.bodyMarkdown,
      input.sourceType,
      input.sourceUrl,
      input.coverAssetId ?? null,
      input.status,
      input.visibility,
      input.allowComments,
      input.pinned,
      input.featured,
      input.viewCount,
      input.likeCount,
      input.project?.status ?? null,
      input.project?.links ?? {},
      input.project?.stack ?? [],
      input.project?.startedAt ?? null,
      input.project?.endedAt ?? null,
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

export function buildContentDelete(id: string): SqlStatement {
  return {
    sql: 'delete from content_items where id = $1 returning id',
    values: [id],
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

  async findBySlug(slug: string): Promise<ContentRecord | null> {
    const result = await this.pool.query<ContentItemRow>(buildContentSelect('where ci.slug = $1'), [slug]);

    return result.rows[0] ? mapContentRow(result.rows[0]) : null;
  }

  async listAdmin(filter: AdminContentFilter = {}): Promise<ContentRecord[]> {
    const statement = buildAdminContentSelect(filter);
    const result = await this.pool.query<ContentItemRow>(statement.sql, statement.values);

    return result.rows.map(mapContentRow);
  }

  async listPublic(filter: PublicContentFilter = {}): Promise<ContentRecord[]> {
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
        buildPublicContentOrderClause(filter.sort),
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

  async delete(id: string): Promise<boolean> {
    const statement = buildContentDelete(id);
    const result = await this.pool.query<{ id: string }>(statement.sql, statement.values);

    return Boolean(result.rows[0]);
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

export function buildContentSelect(whereClause: string, orderClause = ''): string {
  return `
    select
      ci.*,
      cover_assets.public_url as cover_asset_url,
      cover_assets.alt_text as cover_asset_alt_text,
      ci.view_count + coalesce(view_counts.count, 0) as view_count,
      ci.like_count + coalesce(like_counts.count, 0) as like_count,
      coalesce(array_remove(array_agg(distinct c.name), null), '{}') as categories,
      coalesce(array_remove(array_agg(distinct t.name), null), '{}') as tags
    from content_items ci
    left join assets cover_assets on cover_assets.id = ci.cover_asset_id
    left join (
      select target_type, target_id, count(*)::int as count
      from view_events
      group by target_type, target_id
    ) view_counts on view_counts.target_type = ci.type and view_counts.target_id = ci.id
    left join (
      select target_type, target_id, count(*)::int as count
      from content_likes
      group by target_type, target_id
    ) like_counts on like_counts.target_type = ci.type and like_counts.target_id = ci.id
    left join content_categories cc on cc.content_id = ci.id
    left join categories c on c.id = cc.category_id
    left join content_tags ct on ct.content_id = ci.id
    left join tags t on t.id = ct.tag_id
    ${whereClause}
    group by ci.id, cover_assets.public_url, cover_assets.alt_text, like_counts.count, view_counts.count
    ${orderClause}
  `;
}

export function buildAdminContentSelect(filter: AdminContentFilter = {}): SqlStatement {
  const clauses = ['where true'];
  const values: unknown[] = [];

  if (filter.type) {
    values.push(filter.type);
    clauses.push(`and ci.type = $${values.length}`);
  }

  if (filter.status) {
    if (filter.status === 'private') {
      clauses.push("and ci.visibility = 'private'");
    } else {
      values.push(filter.status);
      clauses.push(`and ci.status = $${values.length}`);
    }
  }

  const category = filter.category?.trim().toLowerCase();

  if (category) {
    values.push(category);
    clauses.push(`
      and exists (
        select 1
        from content_categories cc_exact
        join categories c_exact on c_exact.id = cc_exact.category_id
        where cc_exact.content_id = ci.id
          and lower(c_exact.name) = $${values.length}
      )
    `);
  }

  const tag = filter.tag?.trim().toLowerCase();

  if (tag) {
    values.push(tag);
    clauses.push(`
      and exists (
        select 1
        from content_tags ct_exact
        join tags t_exact on t_exact.id = ct_exact.tag_id
        where ct_exact.content_id = ci.id
          and lower(t_exact.name) = $${values.length}
      )
    `);
  }

  const query = filter.query?.trim().toLowerCase();

  if (query) {
    values.push(`%${query}%`);
    const placeholder = `$${values.length}`;
    clauses.push(`
      and (
        lower(ci.title) like ${placeholder}
        or lower(ci.slug) like ${placeholder}
        or lower(ci.summary) like ${placeholder}
        or lower(ci.body_markdown) like ${placeholder}
        or exists (
          select 1
          from content_categories cc_filter
          join categories c_filter on c_filter.id = cc_filter.category_id
          where cc_filter.content_id = ci.id
            and lower(c_filter.name) like ${placeholder}
        )
        or exists (
          select 1
          from content_tags ct_filter
          join tags t_filter on t_filter.id = ct_filter.tag_id
          where ct_filter.content_id = ci.id
            and lower(t_filter.name) like ${placeholder}
        )
      )
    `);
  }

  return {
    sql: buildContentSelect(clauses.join('\n'), 'order by ci.updated_at desc'),
    values,
  };
}

export function buildPublicContentOrderClause(sort: PublicContentFilter['sort'] = 'latest'): string {
  if (sort === 'popular') {
    return `
      order by
        ci.pinned desc,
        (ci.view_count + coalesce(view_counts.count, 0)) desc,
        (ci.like_count + coalesce(like_counts.count, 0)) desc,
        ci.published_at desc
    `;
  }

  return 'order by ci.pinned desc, ci.published_at desc';
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
    ['sourceType', 'source_type'],
    ['sourceUrl', 'source_url'],
    ['coverAssetId', 'cover_asset_id'],
    ['status', 'status'],
    ['visibility', 'visibility'],
    ['allowComments', 'allow_comments'],
    ['pinned', 'pinned'],
    ['featured', 'featured'],
    ['viewCount', 'view_count'],
    ['likeCount', 'like_count'],
    ['publishedAt', 'published_at'],
  ];

  for (const [key, column] of mapping) {
    if (patch[key] !== undefined) {
      result[column] = patch[key];
    }
  }

  if (patch.project !== undefined) {
    result.project_status = patch.project.status ?? null;
    result.project_links = patch.project.links ?? {};
    result.project_stack = patch.project.stack ?? [];
    result.project_started_at = patch.project.startedAt ?? null;
    result.project_ended_at = patch.project.endedAt ?? null;
  }

  if (patch.updatedAt !== undefined) {
    result.updated_at = patch.updatedAt;
  }

  return result;
}

function mapProjectMetadata(row: ContentItemRow): ProjectMetadata | undefined {
  const project: ProjectMetadata = {};
  const links = normalizeProjectLinks(row.project_links);
  const stack = row.project_stack?.filter(Boolean) ?? [];
  const startedAt = dateOnlyFromDatabase(row.project_started_at);
  const endedAt = dateOnlyFromDatabase(row.project_ended_at);

  if (row.project_status) {
    project.status = row.project_status;
  }

  if (links) {
    project.links = links;
  }

  if (stack.length > 0) {
    project.stack = stack;
  }

  if (startedAt) {
    project.startedAt = startedAt;
  }

  if (endedAt) {
    project.endedAt = endedAt;
  }

  return Object.keys(project).length > 0 ? project : undefined;
}

function normalizeProjectLinks(links: ProjectLinks | null | undefined): ProjectLinks | undefined {
  if (!links) {
    return undefined;
  }

  const normalized: ProjectLinks = {};
  const keys: Array<keyof ProjectLinks> = ['website', 'repository', 'demo', 'article'];

  for (const key of keys) {
    const value = links[key]?.trim();

    if (value) {
      normalized[key] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function dateOnlyFromDatabase(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}
