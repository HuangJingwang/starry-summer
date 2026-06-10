import pg from 'pg';
import { randomUUID } from 'node:crypto';

import type { ContentType, ModerationStatus } from '@starry-summer/shared';

import type { InteractionsRepository } from './interactions.repository';
import type {
  CommentRecord,
  CreateCommentInput,
  CreateGuestbookEntryInput,
  GuestbookEntryRecord,
  ModerationListFilter,
} from './interactions.service';

const { Pool } = pg;

export interface CommentRow {
  id: string;
  target_type: CommentRecord['targetType'];
  target_id: string;
  author_name: string;
  body: string;
  status: ModerationStatus;
  created_at: Date;
}

export interface GuestbookEntryRow {
  id: string;
  author_name: string;
  body: string;
  status: ModerationStatus;
  created_at: Date;
}

export interface SqlStatement {
  sql: string;
  values: unknown[];
}

interface LikeCountRow {
  count: number;
}

type ModerationTable = 'comments' | 'guestbook_entries';

export function mapCommentRow(row: CommentRow): CommentRecord {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    authorName: row.author_name,
    body: row.body,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapGuestbookRow(row: GuestbookEntryRow): GuestbookEntryRecord {
  return {
    id: row.id,
    authorName: row.author_name,
    body: row.body,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export function buildCommentInsert(input: CreateCommentInput): SqlStatement {
  return {
    sql: `
      insert into comments (
        target_type,
        target_id,
        author_name,
        body
      )
      values ($1, $2, $3, $4)
      returning *
    `,
    values: [input.targetType, input.targetId, input.authorName, input.body],
  };
}

export function buildGuestbookInsert(input: CreateGuestbookEntryInput): SqlStatement {
  return {
    sql: `
      insert into guestbook_entries (
        author_name,
        body
      )
      values ($1, $2)
      returning *
    `,
    values: [input.authorName, input.body],
  };
}

export function buildModerationUpdate(
  table: ModerationTable,
  id: string,
  status: ModerationStatus,
): SqlStatement {
  return {
    sql: `update ${table} set status = $2, moderated_at = now() where id = $1 returning *`,
    values: [id, status],
  };
}

export function buildLikeInsert(
  targetType: ContentType,
  targetId: string,
  createActorHash: () => string = randomUUID,
): SqlStatement {
  return {
    sql: `
      insert into content_likes (
        target_type,
        target_id,
        actor_hash
      )
      values ($1, $2, $3)
    `,
    values: [targetType, targetId, createActorHash()],
  };
}

export function buildLikeCountSelect(targetType: ContentType, targetId: string): SqlStatement {
  return {
    sql: `
      select count(*)::int as count
      from content_likes
      where target_type = $1
        and target_id = $2
    `,
    values: [targetType, targetId],
  };
}

export class PostgresInteractionsRepository implements InteractionsRepository {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async createComment(input: CreateCommentInput): Promise<CommentRecord> {
    const statement = buildCommentInsert(input);
    const result = await this.pool.query<CommentRow>(statement.sql, statement.values);
    const row = result.rows[0];

    if (!row) {
      throw new Error('PostgreSQL did not return the created comment row');
    }

    return mapCommentRow(row);
  }

  async moderateComment(id: string, status: ModerationStatus): Promise<CommentRecord | null> {
    const statement = buildModerationUpdate('comments', id, status);
    const result = await this.pool.query<CommentRow>(statement.sql, statement.values);

    return result.rows[0] ? mapCommentRow(result.rows[0]) : null;
  }

  async listAdminComments(filter: ModerationListFilter = {}): Promise<CommentRecord[]> {
    const values: unknown[] = [];
    const statusClause = filter.status ? 'where status = $1' : '';

    if (filter.status) {
      values.push(filter.status);
    }

    const result = await this.pool.query<CommentRow>(
      `
        select *
        from comments
        ${statusClause}
        order by created_at desc
      `,
      values,
    );

    return result.rows.map(mapCommentRow);
  }

  async listApprovedComments(targetType: CommentRecord['targetType'], targetId: string): Promise<CommentRecord[]> {
    const result = await this.pool.query<CommentRow>(
      `
        select *
        from comments
        where target_type = $1
          and target_id = $2
          and status = 'approved'
        order by created_at desc
      `,
      [targetType, targetId],
    );

    return result.rows.map(mapCommentRow);
  }

  async likeContent(targetType: ContentType, targetId: string): Promise<number> {
    const statement = buildLikeInsert(targetType, targetId);

    await this.pool.query(statement.sql, statement.values);

    return this.getLikeCount(targetType, targetId);
  }

  async getLikeCount(targetType: ContentType, targetId: string): Promise<number> {
    const statement = buildLikeCountSelect(targetType, targetId);
    const result = await this.pool.query<LikeCountRow>(statement.sql, statement.values);

    return result.rows[0]?.count ?? 0;
  }

  async createGuestbookEntry(input: CreateGuestbookEntryInput): Promise<GuestbookEntryRecord> {
    const statement = buildGuestbookInsert(input);
    const result = await this.pool.query<GuestbookEntryRow>(statement.sql, statement.values);
    const row = result.rows[0];

    if (!row) {
      throw new Error('PostgreSQL did not return the created guestbook entry row');
    }

    return mapGuestbookRow(row);
  }

  async moderateGuestbookEntry(id: string, status: ModerationStatus): Promise<GuestbookEntryRecord | null> {
    const statement = buildModerationUpdate('guestbook_entries', id, status);
    const result = await this.pool.query<GuestbookEntryRow>(statement.sql, statement.values);

    return result.rows[0] ? mapGuestbookRow(result.rows[0]) : null;
  }

  async listAdminGuestbookEntries(filter: ModerationListFilter = {}): Promise<GuestbookEntryRecord[]> {
    const values: unknown[] = [];
    const statusClause = filter.status ? 'where status = $1' : '';

    if (filter.status) {
      values.push(filter.status);
    }

    const result = await this.pool.query<GuestbookEntryRow>(
      `
        select *
        from guestbook_entries
        ${statusClause}
        order by created_at desc
      `,
      values,
    );

    return result.rows.map(mapGuestbookRow);
  }

  async listApprovedGuestbookEntries(): Promise<GuestbookEntryRecord[]> {
    const result = await this.pool.query<GuestbookEntryRow>(
      `
        select *
        from guestbook_entries
        where status = 'approved'
        order by created_at desc
      `,
    );

    return result.rows.map(mapGuestbookRow);
  }
}
