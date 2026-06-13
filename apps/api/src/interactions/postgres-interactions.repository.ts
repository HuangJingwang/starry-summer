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
  anchor_text?: string | null;
  anchor_prefix?: string | null;
  anchor_suffix?: string | null;
  anchor_start?: number | null;
  anchor_end?: number | null;
  anchor_hash?: string | null;
  ip_hash?: string | null;
  user_agent?: string | null;
  created_at: Date;
}

export interface GuestbookEntryRow {
  id: string;
  author_name: string;
  body: string;
  status: ModerationStatus;
  ip_hash?: string | null;
  user_agent?: string | null;
  created_at: Date;
}

export interface SqlStatement {
  sql: string;
  values: unknown[];
}

interface CountRow {
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
    ...mapCommentAnchor(row),
    ...mapModerationMetadata(row),
    createdAt: row.created_at.toISOString(),
  };
}

export function mapGuestbookRow(row: GuestbookEntryRow): GuestbookEntryRecord {
  return {
    id: row.id,
    authorName: row.author_name,
    body: row.body,
    status: row.status,
    ...mapModerationMetadata(row),
    createdAt: row.created_at.toISOString(),
  };
}

export function mapPublicCommentRow(row: CommentRow): CommentRecord {
  const { ipHash: _ipHash, userAgent: _userAgent, ...record } = mapCommentRow(row);

  return record;
}

export function mapPublicGuestbookRow(row: GuestbookEntryRow): GuestbookEntryRecord {
  const { ipHash: _ipHash, userAgent: _userAgent, ...record } = mapGuestbookRow(row);

  return record;
}

export function buildCommentInsert(input: CreateCommentInput): SqlStatement {
  return {
    sql: `
      insert into comments (
        target_type,
        target_id,
        author_name,
        body,
        status,
        ip_hash,
        user_agent,
        anchor_text,
        anchor_prefix,
        anchor_suffix,
        anchor_start,
        anchor_end,
        anchor_hash
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      returning *
    `,
    values: [
      input.targetType,
      input.targetId,
      input.authorName,
      input.body,
      'approved',
      input.ipHash ?? null,
      input.userAgent ?? null,
      input.anchor?.text ?? null,
      input.anchor?.prefix ?? null,
      input.anchor?.suffix ?? null,
      input.anchor?.start ?? null,
      input.anchor?.end ?? null,
      input.anchor?.hash ?? null,
    ],
  };
}

export function buildGuestbookInsert(input: CreateGuestbookEntryInput): SqlStatement {
  return {
    sql: `
      insert into guestbook_entries (
        author_name,
        body,
        status,
        ip_hash,
        user_agent
      )
      values ($1, $2, $3, $4, $5)
      returning *
    `,
    values: [input.authorName, input.body, 'approved', input.ipHash ?? null, input.userAgent ?? null],
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

export function buildModerationDelete(table: ModerationTable, id: string): SqlStatement {
  return {
    sql: `delete from ${table} where id = $1 returning id`,
    values: [id],
  };
}

export function buildLikeInsert(
  targetType: ContentType,
  targetId: string,
  actorHashOrCreate: string | (() => string) = randomUUID,
): SqlStatement {
  return {
    sql: `
      insert into content_likes (
        target_type,
        target_id,
        actor_hash
      )
      values ($1, $2, $3)
      on conflict do nothing
    `,
    values: [targetType, targetId, resolveActorHash(actorHashOrCreate)],
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

export function buildViewInsert(
  targetType: ContentType,
  targetId: string,
  actorHashOrCreate: string | (() => string) = randomUUID,
): SqlStatement {
  return {
    sql: `
      insert into view_events (
        target_type,
        target_id,
        actor_hash
      )
      values ($1, $2, $3)
      on conflict do nothing
    `,
    values: [targetType, targetId, resolveActorHash(actorHashOrCreate)],
  };
}

export function buildViewCountSelect(targetType: ContentType, targetId: string): SqlStatement {
  return {
    sql: `
      select count(*)::int as count
      from view_events
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

  async deleteComment(id: string): Promise<boolean> {
    const statement = buildModerationDelete('comments', id);
    const result = await this.pool.query(statement.sql, statement.values);

    return (result.rowCount ?? 0) > 0;
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

    return result.rows.map(mapPublicCommentRow);
  }

  async likeContent(targetType: ContentType, targetId: string, actorHash?: string): Promise<number> {
    const statement = buildLikeInsert(targetType, targetId, actorHash ?? randomUUID);

    await this.pool.query(statement.sql, statement.values);

    return this.getLikeCount(targetType, targetId);
  }

  async getLikeCount(targetType: ContentType, targetId: string): Promise<number> {
    const statement = buildLikeCountSelect(targetType, targetId);
    const result = await this.pool.query<CountRow>(statement.sql, statement.values);

    return result.rows[0]?.count ?? 0;
  }

  async recordView(targetType: ContentType, targetId: string, actorHash?: string): Promise<number> {
    const statement = buildViewInsert(targetType, targetId, actorHash ?? randomUUID);

    await this.pool.query(statement.sql, statement.values);

    return this.getViewCount(targetType, targetId);
  }

  async getViewCount(targetType: ContentType, targetId: string): Promise<number> {
    const statement = buildViewCountSelect(targetType, targetId);
    const result = await this.pool.query<CountRow>(statement.sql, statement.values);

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

  async deleteGuestbookEntry(id: string): Promise<boolean> {
    const statement = buildModerationDelete('guestbook_entries', id);
    const result = await this.pool.query(statement.sql, statement.values);

    return (result.rowCount ?? 0) > 0;
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

    return result.rows.map(mapPublicGuestbookRow);
  }
}

function resolveActorHash(actorHashOrCreate: string | (() => string)): string {
  return typeof actorHashOrCreate === 'function' ? actorHashOrCreate() : actorHashOrCreate;
}

function mapCommentAnchor(row: CommentRow): Pick<CommentRecord, 'anchor'> {
  if (
    !row.anchor_text ||
    row.anchor_start === null ||
    row.anchor_start === undefined ||
    row.anchor_end === null ||
    row.anchor_end === undefined ||
    !row.anchor_hash
  ) {
    return {};
  }

  return {
    anchor: {
      text: row.anchor_text,
      prefix: row.anchor_prefix ?? '',
      suffix: row.anchor_suffix ?? '',
      start: row.anchor_start,
      end: row.anchor_end,
      hash: row.anchor_hash,
    },
  };
}

function mapModerationMetadata(row: { ip_hash?: string | null; user_agent?: string | null }): Pick<CommentRecord, 'ipHash' | 'userAgent'> {
  return {
    ...(row.ip_hash ? { ipHash: row.ip_hash } : {}),
    ...(row.user_agent ? { userAgent: row.user_agent } : {}),
  };
}
