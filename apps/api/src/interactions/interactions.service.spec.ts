import { beforeEach, describe, expect, test } from 'vitest';

import { InMemoryInteractionsRepository } from './interactions.repository';
import { InteractionsService } from './interactions.service';

describe('InteractionsService', () => {
  let service: InteractionsService;
  let allowedCommentTargets: Array<{ targetType: string; targetId: string }>;

  beforeEach(() => {
    allowedCommentTargets = [];
    service = new InteractionsService(
      new InMemoryInteractionsRepository(() => '2026-06-10T00:00:00.000Z'),
      {
        ensureCanComment: async (targetType, targetId) => {
          allowedCommentTargets.push({ targetType, targetId });
        },
      },
    );
  });

  test('publishes GitHub-authenticated comments immediately', async () => {
    const comment = await service.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: ' Reader ',
      body: ' Nice writing. ',
      ipHash: 'ip-hash-1',
      userAgent: 'Mozilla/5.0',
    });

    expect(comment.status).toBe('approved');
    expect(comment.authorName).toBe('Reader');
    expect(comment.body).toBe('Nice writing.');
    expect(comment.ipHash).toBe('ip-hash-1');
    expect(comment.userAgent).toBe('Mozilla/5.0');
    expect(allowedCommentTargets).toEqual([{ targetType: 'post', targetId: 'post-1' }]);
    expect(await service.listApprovedComments('post', 'post-1')).toEqual([
      expect.objectContaining({
        id: comment.id,
        status: 'approved',
        body: 'Nice writing.',
      }),
    ]);
  });

  test('publishes inline comments with selection anchors immediately', async () => {
    const anchor = {
      text: 'selected passage',
      prefix: 'before',
      suffix: 'after',
      start: 12,
      end: 28,
      hash: 'a'.repeat(64),
    };

    const comment = await service.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'This part deserves a note.',
      anchor,
    });

    expect(comment.status).toBe('approved');
    expect(comment.anchor).toEqual(anchor);
    expect(await service.listApprovedComments('post', 'post-1')).toEqual([
      expect.objectContaining({
        id: comment.id,
        anchor,
      }),
    ]);
  });

  test('rejects invalid inline comment anchors', async () => {
    await expect(
      service.createComment({
        targetType: 'post',
        targetId: 'post-1',
        authorName: 'Reader',
        body: 'Nice writing.',
        anchor: {
          text: ' ',
          prefix: '',
          suffix: '',
          start: 1,
          end: 2,
          hash: 'a'.repeat(64),
        },
      }),
    ).rejects.toThrow('Anchor text is required');

    await expect(
      service.createComment({
        targetType: 'post',
        targetId: 'post-1',
        authorName: 'Reader',
        body: 'Nice writing.',
        anchor: {
          text: 'selected passage',
          prefix: '',
          suffix: '',
          start: 10,
          end: 10,
          hash: 'a'.repeat(64),
        },
      }),
    ).rejects.toThrow('Anchor range is invalid');
  });

  test('rejects comments when the content policy rejects the target', async () => {
    service = new InteractionsService(
      new InMemoryInteractionsRepository(() => '2026-06-10T00:00:00.000Z'),
      {
        ensureCanComment: async () => {
          throw new Error('Comments are disabled for this content');
        },
      },
    );

    await expect(
      service.createComment({
        targetType: 'post',
        targetId: 'post-1',
        authorName: 'Reader',
        body: 'Nice writing.',
      }),
    ).rejects.toThrow('Comments are disabled for this content');

    expect(await service.listAdminComments()).toEqual([]);
  });

  test('rejects empty comments before moderation', async () => {
    await expect(
      service.createComment({
        targetType: 'post',
        targetId: 'post-1',
        authorName: ' ',
        body: 'Nice writing.',
      }),
    ).rejects.toThrow('Author name is required');

    await expect(
      service.createComment({
        targetType: 'post',
        targetId: 'post-1',
        authorName: 'Reader',
        body: ' ',
      }),
    ).rejects.toThrow('Submission body is required');
  });

  test('rejects overly long comments', async () => {
    await expect(
      service.createComment({
        targetType: 'post',
        targetId: 'post-1',
        authorName: 'A'.repeat(81),
        body: 'Nice writing.',
      }),
    ).rejects.toThrow('Author name must be at most 80 characters');

    await expect(
      service.createComment({
        targetType: 'post',
        targetId: 'post-1',
        authorName: 'Reader',
        body: 'B'.repeat(2001),
      }),
    ).rejects.toThrow('Submission body must be at most 2000 characters');
  });

  test('published comments can still be moderated away later', async () => {
    const comment = await service.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Nice writing.',
    });

    expect(await service.listApprovedComments('post', 'post-1')).toHaveLength(1);

    await service.moderateComment(comment.id, 'rejected');

    expect(await service.listApprovedComments('post', 'post-1')).toEqual([]);
  });

  test('lists comments for admin moderation by status', async () => {
    const approved = await service.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Editor',
      body: 'Published immediately.',
    });
    const rejected = await service.createComment({
      targetType: 'note',
      targetId: 'note-1',
      authorName: 'Reader',
      body: 'Removed later.',
    });

    await service.moderateComment(rejected.id, 'rejected');

    expect((await service.listAdminComments({ status: 'approved' })).map((comment) => comment.id)).toEqual([approved.id]);
    expect((await service.listAdminComments({ status: 'rejected' })).map((comment) => comment.id)).toEqual([rejected.id]);
    expect((await service.listAdminComments()).map((comment) => comment.id)).toEqual([rejected.id, approved.id]);
  });

  test('deletes comments from admin moderation', async () => {
    const comment = await service.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Delete me.',
    });

    await expect(service.deleteComment(comment.id)).resolves.toBeUndefined();
    expect(await service.listAdminComments()).toEqual([]);
    await expect(service.deleteComment(comment.id)).rejects.toThrow(`Comment ${comment.id} was not found`);
  });

  test('likes increment per content target', async () => {
    await service.likeContent('post', 'post-1');
    await service.likeContent('post', 'post-1');

    expect(await service.getLikeCount('post', 'post-1')).toBe(2);
  });

  test('likes are deduplicated when actor hash is provided', async () => {
    await service.likeContent('post', 'post-1', 'actor-1');
    await service.likeContent('post', 'post-1', 'actor-1');
    await service.likeContent('post', 'post-1', 'actor-2');

    expect(await service.getLikeCount('post', 'post-1')).toBe(2);
  });

  test('views increment per content target', async () => {
    await service.recordView('post', 'post-1');
    await service.recordView('post', 'post-1');

    expect(await service.getViewCount('post', 'post-1')).toBe(2);
  });

  test('views are deduplicated when actor hash is provided', async () => {
    await service.recordView('post', 'post-1', 'viewer-1');
    await service.recordView('post', 'post-1', 'viewer-1');
    await service.recordView('post', 'post-1', 'viewer-2');

    expect(await service.getViewCount('post', 'post-1')).toBe(2);
  });

  test('publishes GitHub-authenticated guestbook entries immediately', async () => {
    const entry = await service.createGuestbookEntry({
      authorName: ' Visitor ',
      body: ' Hello from the guestbook. ',
      ipHash: 'ip-hash-1',
      userAgent: 'Mozilla/5.0',
    });

    expect(entry.status).toBe('approved');
    expect(entry.authorName).toBe('Visitor');
    expect(entry.body).toBe('Hello from the guestbook.');
    expect(entry.ipHash).toBe('ip-hash-1');
    expect(entry.userAgent).toBe('Mozilla/5.0');
    expect(await service.listApprovedGuestbookEntries()).toEqual([
      expect.objectContaining({
        id: entry.id,
        status: 'approved',
        body: 'Hello from the guestbook.',
      }),
    ]);
  });

  test('rejects invalid guestbook entries before moderation', async () => {
    await expect(
      service.createGuestbookEntry({
        authorName: '',
        body: 'Hello from the guestbook.',
      }),
    ).rejects.toThrow('Author name is required');

    await expect(
      service.createGuestbookEntry({
        authorName: 'Visitor',
        body: 'B'.repeat(2001),
      }),
    ).rejects.toThrow('Submission body must be at most 2000 characters');
  });

  test('published guestbook entries can still be moderated away later', async () => {
    const rejected = await service.createGuestbookEntry({
      authorName: 'Visitor',
      body: 'Remove this later.',
    });
    const approved = await service.createGuestbookEntry({
      authorName: 'Friend',
      body: 'Hello there.',
    });

    await service.moderateGuestbookEntry(rejected.id, 'rejected');

    expect(await service.listApprovedGuestbookEntries()).toEqual([expect.objectContaining({ id: approved.id })]);
    expect((await service.listAdminGuestbookEntries({ status: 'approved' })).map((entry) => entry.id)).toEqual([approved.id]);
    expect((await service.listAdminGuestbookEntries({ status: 'rejected' })).map((entry) => entry.id)).toEqual([rejected.id]);
    expect((await service.listAdminGuestbookEntries()).map((entry) => entry.id)).toEqual([approved.id, rejected.id]);
  });

  test('deletes guestbook entries from admin moderation', async () => {
    const entry = await service.createGuestbookEntry({
      authorName: 'Visitor',
      body: 'Delete this.',
    });

    await expect(service.deleteGuestbookEntry(entry.id)).resolves.toBeUndefined();
    expect(await service.listAdminGuestbookEntries()).toEqual([]);
    await expect(service.deleteGuestbookEntry(entry.id)).rejects.toThrow(`Guestbook entry ${entry.id} was not found`);
  });
});
