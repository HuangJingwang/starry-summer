import type { AdminContentFilter, ContentRecord, ContentRecordPatch, CreateContentRecordInput, PublicContentFilter } from './content.types.js';

export interface SqlStatement {
  sql: string;
  values: unknown[];
}

export function buildContentInsert(input: CreateContentRecordInput): SqlStatement {
  return {
    sql: `
      insert into content_items (
        type,
        title,
        slug,
        summary,
        seo_title,
        seo_description,
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
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      returning *
    `,
    values: [
      input.type,
      input.title,
      input.slug,
      input.summary,
      input.seoTitle ?? null,
      input.seoDescription ?? null,
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

export function buildContentUpdate(id: string, patch: ContentRecordPatch): SqlStatement | null {
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

export function buildContentSelect(whereClause: string, orderClause = ''): string {
  return `
    select
      ci.*,
      cover_assets.public_url as cover_asset_url,
      cover_assets.alt_text as cover_asset_alt_text,
      ci.view_count + coalesce(view_counts.count, 0) as view_count,
      ci.like_count + coalesce(like_counts.count, 0) as like_count,
      coalesce(array_remove(array_agg(distinct c.name), null), '{}') as categories,
      coalesce(array_remove(array_agg(distinct t.name), null), '{}') as tags,
      coalesce(array_remove(array_agg(distinct s.name), null), '{}') as series
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
    left join content_series cs on cs.content_id = ci.id
    left join series s on s.id = cs.series_id
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

  const series = filter.series?.trim().toLowerCase();

  if (series) {
    values.push(series);
    clauses.push(`
      and exists (
        select 1
        from content_series cs_exact
        join series s_exact on s_exact.id = cs_exact.series_id
        where cs_exact.content_id = ci.id
          and lower(s_exact.name) = $${values.length}
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
        or lower(ci.seo_title) like ${placeholder}
        or lower(ci.seo_description) like ${placeholder}
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
        or exists (
          select 1
          from content_series cs_filter
          join series s_filter on s_filter.id = cs_filter.series_id
          where cs_filter.content_id = ci.id
            and lower(s_filter.name) like ${placeholder}
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

export function buildPublicContentSearchClause(placeholders: string | string[]): string {
  const terms = Array.isArray(placeholders) ? placeholders : [placeholders];

  return terms
    .map((placeholder) => `
      and (
      lower(ci.title) like ${placeholder}
      or lower(ci.slug) like ${placeholder}
      or lower(ci.summary) like ${placeholder}
      or lower(ci.seo_title) like ${placeholder}
      or lower(ci.seo_description) like ${placeholder}
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
      or exists (
        select 1
        from content_series cs_filter
        join series s_filter on s_filter.id = cs_filter.series_id
        where cs_filter.content_id = ci.id
          and lower(s_filter.name) like ${placeholder}
      )
    )
    `)
    .join('\n');
}

export function normalizeSearchTerms(query: string | undefined): string[] {
  return query
    ?.trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean) ?? [];
}

function toDatabasePatch(patch: ContentRecordPatch): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const mapping: Array<[keyof ContentRecord, string]> = [
    ['type', 'type'],
    ['title', 'title'],
    ['slug', 'slug'],
    ['summary', 'summary'],
    ['seoTitle', 'seo_title'],
    ['seoDescription', 'seo_description'],
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
