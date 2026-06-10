import { describe, expect, test } from 'vitest';

import {
  buildCommentInsert,
  buildModerationDelete,
  buildGuestbookInsert,
  buildLikeCountSelect,
  buildLikeInsert,
  buildModerationUpdate,
  buildViewCountSelect,
  buildViewInsert,
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

  test('builds moderation deletes for known interaction tables', () => {
    expect(buildModerationDelete('comments', 'comment-1')).toEqual({
      sql: 'delete from comments where id = $1 returning id',
      values: ['comment-1'],
    });
    expect(buildModerationDelete('guestbook_entries', 'entry-1')).toEqual({
      sql: 'delete from guestbook_entries where id = $1 returning id',
      values: ['entry-1'],
    });
  });

  test('builds like insert SQL with a generated actor hash', () => {
    const insert = buildLikeInsert('post', '11111111-1111-4111-8111-111111111111', () => 'actor-1');

    expect(insert.sql).toContain('insert into content_likes');
    expect(insert.sql).toContain('actor_hash');
    expect(insert.values).toEqual(['post', '11111111-1111-4111-8111-111111111111', 'actor-1']);
  });

  test('builds like count SQL and values', () => {
    expect(buildLikeCountSelect('post', '11111111-1111-4111-8111-111111111111')).toEqual({
      sql: `
      select count(*)::int as count
      from content_likes
      where target_type = $1
        and target_id = $2
    `,
      values: ['post', '11111111-1111-4111-8111-111111111111'],
    });
  });

  test('builds view insert SQL with a generated actor hash', () => {
    const insert = buildViewInsert('post', '11111111-1111-4111-8111-111111111111', () => 'viewer-1');

    expect(insert.sql).toContain('insert into view_events');
    expect(insert.sql).toContain('actor_hash');
    expect(insert.values).toEqual(['post', '11111111-1111-4111-8111-111111111111', 'viewer-1']);
  });

  test('builds view count SQL and values', () => {
    expect(buildViewCountSelect('post', '11111111-1111-4111-8111-111111111111')).toEqual({
      sql: `
      select count(*)::int as count
      from view_events
      where target_type = $1
        and target_id = $2
    `,
      values: ['post', '11111111-1111-4111-8111-111111111111'],
    });
  });
});
