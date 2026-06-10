import { describe, expect, test } from 'vitest';

import {
  buildCommentInsert,
  buildGuestbookInsert,
  buildModerationUpdate,
  mapCommentRow,
  mapGuestbookRow,
  type CommentRow,
  type GuestbookEntryRow,
} from './postgres-interactions.repository';

describe('PostgresInteractionsRepository mapping', () => {
  test('maps comment rows to public records', () => {
    const row: CommentRow = {
      id: 'comment-1',
      target_type: 'post',
      target_id: '11111111-1111-4111-8111-111111111111',
      author_name: 'Reader',
      body: 'Nice writing.',
      status: 'approved',
      created_at: new Date('2026-06-10T00:00:00.000Z'),
    };

    expect(mapCommentRow(row)).toEqual({
      id: 'comment-1',
      targetType: 'post',
      targetId: '11111111-1111-4111-8111-111111111111',
      authorName: 'Reader',
      body: 'Nice writing.',
      status: 'approved',
      createdAt: '2026-06-10T00:00:00.000Z',
    });
  });

  test('maps guestbook rows to public records', () => {
    const row: GuestbookEntryRow = {
      id: 'entry-1',
      author_name: 'Visitor',
      body: 'Hello there.',
      status: 'pending',
      created_at: new Date('2026-06-10T01:00:00.000Z'),
    };

    expect(mapGuestbookRow(row)).toEqual({
      id: 'entry-1',
      authorName: 'Visitor',
      body: 'Hello there.',
      status: 'pending',
      createdAt: '2026-06-10T01:00:00.000Z',
    });
  });

  test('builds comment insert SQL and values', () => {
    const insert = buildCommentInsert({
      targetType: 'post',
      targetId: '11111111-1111-4111-8111-111111111111',
      authorName: 'Reader',
      body: 'Nice writing.',
    });

    expect(insert.sql).toContain('insert into comments');
    expect(insert.sql).toContain('target_type');
    expect(insert.sql).toContain('returning *');
    expect(insert.values).toEqual([
      'post',
      '11111111-1111-4111-8111-111111111111',
      'Reader',
      'Nice writing.',
    ]);
  });

  test('builds guestbook insert SQL and values', () => {
    const insert = buildGuestbookInsert({
      authorName: 'Visitor',
      body: 'Hello from the guestbook.',
    });

    expect(insert.sql).toContain('insert into guestbook_entries');
    expect(insert.sql).toContain('author_name');
    expect(insert.values).toEqual(['Visitor', 'Hello from the guestbook.']);
  });

  test('builds moderation updates for known interaction tables', () => {
    expect(buildModerationUpdate('comments', 'comment-1', 'approved')).toEqual({
      sql: 'update comments set status = $2, moderated_at = now() where id = $1 returning *',
      values: ['comment-1', 'approved'],
    });
    expect(buildModerationUpdate('guestbook_entries', 'entry-1', 'rejected')).toEqual({
      sql: 'update guestbook_entries set status = $2, moderated_at = now() where id = $1 returning *',
      values: ['entry-1', 'rejected'],
    });
  });
});
