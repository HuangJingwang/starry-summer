import pg from 'pg';

import type { ContentRepository } from './content.repository';
import type { AdminContentFilter, ContentRecord, ContentRecordPatch, CreateContentRecordInput, PublicContentFilter } from './content.types';
import { mapContentRow, type ContentItemRow } from './postgres-content.mapper.js';
import { syncTaxonomyLabels, type Queryable } from './postgres-content-taxonomy.js';
import {
  buildAdminContentSelect,
  buildContentDelete,
  buildContentInsert,
  buildContentSelect,
  buildContentUpdate,
  buildPublicContentOrderClause,
  buildPublicContentSearchClause,
  normalizeSearchTerms,
} from './postgres-content.sql.js';

export * from './postgres-content.mapper.js';
export * from './postgres-content.sql.js';
export * from './postgres-content-taxonomy.js';

const { Pool } = pg;

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
      await syncTaxonomyLabels(client, row.id, 'series', input.series);
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

    const queryTerms = normalizeSearchTerms(filter.query);
    const searchClause = queryTerms.length > 0
      ? buildPublicContentSearchClause(queryTerms.map((_, index) => `$${values.length + index + 1}`))
      : '';

    if (queryTerms.length > 0) {
      values.push(...queryTerms.map((term) => `%${term}%`));
    }

    const result = await this.pool.query<ContentItemRow>(
      buildContentSelect(
        `
          where ci.status = 'published'
            and ci.visibility = 'public'
            ${typeClause}
            ${searchClause}
        `,
        buildPublicContentOrderClause(filter.sort),
      ),
      values,
    );

    return result.rows.map(mapContentRow);
  }

  async update(id: string, patch: ContentRecordPatch): Promise<ContentRecord | null> {
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

      if (patch.series) {
        await syncTaxonomyLabels(client, id, 'series', patch.series);
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
