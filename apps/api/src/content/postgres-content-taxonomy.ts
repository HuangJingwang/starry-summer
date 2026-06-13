import type pg from 'pg';

export interface Queryable {
  query<T extends pg.QueryResultRow>(sql: string, values?: unknown[]): Promise<pg.QueryResult<T>>;
}

type TaxonomyKind = 'category' | 'tag' | 'series';

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
  series: {
    table: 'series',
    joinTable: 'content_series',
    joinColumn: 'series_id',
  },
};

export async function syncTaxonomyLabels(client: Queryable, contentId: string, kind: TaxonomyKind, labels: string[]): Promise<void> {
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

export function slugifyTaxonomyLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}
