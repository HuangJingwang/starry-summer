import pg from 'pg';

import type {
  AssetListFilter,
  AssetRecord,
  AssetRepository,
  AssetUsage,
  CreateAssetRecordInput,
} from './assets.repository.js';

const { Pool } = pg;

export interface AssetRow {
  id: string;
  storage_key: string;
  public_url: string;
  mime_type: string;
  byte_size: number;
  usage: AssetUsage;
  alt_text: string;
  created_at: Date;
}

export interface SqlStatement {
  sql: string;
  values: unknown[];
}

export function mapAssetRow(row: AssetRow): AssetRecord {
  return {
    id: row.id,
    storageKey: row.storage_key,
    publicUrl: row.public_url,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    usage: row.usage,
    altText: row.alt_text,
    createdAt: row.created_at.toISOString(),
  };
}

export function buildAssetInsert(input: CreateAssetRecordInput): SqlStatement {
  return {
    sql: `
      insert into assets (
        storage_key,
        public_url,
        mime_type,
        byte_size,
        usage,
        alt_text
      )
      values ($1, $2, $3, $4, $5, $6)
      returning *
    `,
    values: [
      input.storageKey,
      input.publicUrl,
      input.mimeType,
      input.byteSize,
      input.usage,
      input.altText,
    ],
  };
}

export function buildAssetSelect(filter: AssetListFilter = {}): SqlStatement {
  if (filter.usage) {
    return {
      sql: 'select * from assets where usage = $1 order by created_at desc',
      values: [filter.usage],
    };
  }

  return {
    sql: 'select * from assets order by created_at desc',
    values: [],
  };
}

export function buildAssetDelete(id: string): SqlStatement {
  return {
    sql: 'delete from assets where id = $1 returning id',
    values: [id],
  };
}

export class PostgresAssetsRepository implements AssetRepository {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async create(input: CreateAssetRecordInput): Promise<AssetRecord> {
    const statement = buildAssetInsert(input);
    const result = await this.pool.query<AssetRow>(statement.sql, statement.values);
    const row = result.rows[0];

    if (!row) {
      throw new Error('PostgreSQL did not return the created asset row');
    }

    return mapAssetRow(row);
  }

  async list(filter: AssetListFilter = {}): Promise<AssetRecord[]> {
    const statement = buildAssetSelect(filter);
    const result = await this.pool.query<AssetRow>(statement.sql, statement.values);

    return result.rows.map(mapAssetRow);
  }

  async delete(id: string): Promise<boolean> {
    const statement = buildAssetDelete(id);
    const result = await this.pool.query<{ id: string }>(statement.sql, statement.values);

    return Boolean(result.rows[0]);
  }
}
