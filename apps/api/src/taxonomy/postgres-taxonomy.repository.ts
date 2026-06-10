import pg from 'pg';

import type {
  CreateTaxonomyTermInput,
  TaxonomyRepository,
  TaxonomyTerm,
  TaxonomyType,
  UpdateTaxonomyTermInput,
} from './taxonomy.repository';

const { Pool } = pg;

export interface TaxonomyRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface SqlStatement {
  sql: string;
  values: unknown[];
}

const tableByType: Record<TaxonomyType, string> = {
  category: 'categories',
  tag: 'tags',
  series: 'series',
};

export function mapTaxonomyRow(type: TaxonomyType, row: TaxonomyRow): TaxonomyTerm {
  return {
    id: row.id,
    type,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function buildTaxonomyInsert(input: CreateTaxonomyTermInput): SqlStatement {
  const table = tableByType[input.type];

  return {
    sql: `
      insert into ${table} (name, slug, description, sort_order)
      values ($1, $2, $3, $4)
      returning *
    `,
    values: [input.name, input.slug, input.description, input.sortOrder],
  };
}

export function buildTaxonomyFindById(type: TaxonomyType, id: string): SqlStatement {
  return {
    sql: `select * from ${tableByType[type]} where id = $1`,
    values: [id],
  };
}

export function buildTaxonomyFindBySlug(type: TaxonomyType, slug: string): SqlStatement {
  return {
    sql: `select * from ${tableByType[type]} where slug = $1`,
    values: [slug],
  };
}

export function buildTaxonomyList(type: TaxonomyType): SqlStatement {
  return {
    sql: `select * from ${tableByType[type]} order by sort_order asc, name asc`,
    values: [],
  };
}

export function buildTaxonomyUpdate(
  type: TaxonomyType,
  id: string,
  patch: UpdateTaxonomyTermInput,
): SqlStatement | null {
  const entries = Object.entries(toDatabasePatch(patch));

  if (entries.length === 0) {
    return null;
  }

  const assignments = entries.map(([column], index) => `${column} = $${index + 2}`).join(', ');

  return {
    sql: `update ${tableByType[type]} set ${assignments}, updated_at = now() where id = $1 returning *`,
    values: [id, ...entries.map(([, value]) => value)],
  };
}

export function buildTaxonomyDelete(type: TaxonomyType, id: string): SqlStatement {
  return {
    sql: `delete from ${tableByType[type]} where id = $1`,
    values: [id],
  };
}

export class PostgresTaxonomyRepository implements TaxonomyRepository {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async create(input: CreateTaxonomyTermInput): Promise<TaxonomyTerm> {
    const statement = buildTaxonomyInsert(input);
    const result = await this.pool.query<TaxonomyRow>(statement.sql, statement.values);
    const row = result.rows[0];

    if (!row) {
      throw new Error('PostgreSQL did not return the created taxonomy row');
    }

    return mapTaxonomyRow(input.type, row);
  }

  async findById(type: TaxonomyType, id: string): Promise<TaxonomyTerm | null> {
    const statement = buildTaxonomyFindById(type, id);
    const result = await this.pool.query<TaxonomyRow>(statement.sql, statement.values);

    return result.rows[0] ? mapTaxonomyRow(type, result.rows[0]) : null;
  }

  async findBySlug(type: TaxonomyType, slug: string): Promise<TaxonomyTerm | null> {
    const statement = buildTaxonomyFindBySlug(type, slug);
    const result = await this.pool.query<TaxonomyRow>(statement.sql, statement.values);

    return result.rows[0] ? mapTaxonomyRow(type, result.rows[0]) : null;
  }

  async list(type: TaxonomyType): Promise<TaxonomyTerm[]> {
    const statement = buildTaxonomyList(type);
    const result = await this.pool.query<TaxonomyRow>(statement.sql, statement.values);

    return result.rows.map((row) => mapTaxonomyRow(type, row));
  }

  async update(type: TaxonomyType, id: string, patch: UpdateTaxonomyTermInput): Promise<TaxonomyTerm | null> {
    const statement = buildTaxonomyUpdate(type, id, patch);

    if (!statement) {
      return this.findById(type, id);
    }

    const result = await this.pool.query<TaxonomyRow>(statement.sql, statement.values);

    return result.rows[0] ? mapTaxonomyRow(type, result.rows[0]) : null;
  }

  async delete(type: TaxonomyType, id: string): Promise<boolean> {
    const statement = buildTaxonomyDelete(type, id);
    const result = await this.pool.query(statement.sql, statement.values);

    return (result.rowCount ?? 0) > 0;
  }
}

function toDatabasePatch(patch: UpdateTaxonomyTermInput): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (patch.name !== undefined) {
    result.name = patch.name;
  }

  if (patch.slug !== undefined) {
    result.slug = patch.slug;
  }

  if (patch.description !== undefined) {
    result.description = patch.description;
  }

  if (patch.sortOrder !== undefined) {
    result.sort_order = patch.sortOrder;
  }

  return result;
}
