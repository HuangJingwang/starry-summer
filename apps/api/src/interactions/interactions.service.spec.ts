import { beforeEach, describe, expect, test } from 'vitest';

import { InMemoryInteractionsRepository } from './interactions.repository';
import { InteractionsService } from './interactions.service';

describe('InteractionsService', () => {
  let service: InteractionsService;

  beforeEach(() => {
    service = new InteractionsService(
      new InMemoryInteractionsRepository(() => '2026-06-10T00:00:00.000Z'),
    );
  });

  test('creates pending comments by default', async () => {
    const comment = await service.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: ' Reader ',
      body: ' Nice writing. ',
    });

    expect(comment.status).toBe('pending');
    expect(comment.authorName).toBe('Reader');
    expect(comment.body).toBe('Nice writing.');
    expect(await service.listApprovedComments('post', 'post-1')).toEqual([]);
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

  test('approved comments become visible', async () => {
    const comment = await service.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Nice writing.',
    });

    await service.moderateComment(comment.id, 'approved');

    expect(await service.listApprovedComments('post', 'post-1')).toHaveLength(1);
  });

  test('lists comments for admin moderation by status', async () => {
    const pending = await service.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Please review me.',
    });
    const approved = await service.createComment({
      targetType: 'note',
      targetId: 'note-1',
      authorName: 'Editor',
      body: 'Already reviewed.',
    });

    await service.moderateComment(approved.id, 'approved');

    expect((await service.listAdminComments({ status: 'pending' })).map((comment) => comment.id)).toEqual([pending.id]);
    expect((await service.listAdminComments({ status: 'approved' })).map((comment) => comment.id)).toEqual([approved.id]);
    expect((await service.listAdminComments()).map((comment) => comment.id)).toEqual([approved.id, pending.id]);
  });

  test('likes increment per content target', async () => {
    await service.likeContent('post', 'post-1');
    await service.likeContent('post', 'post-1');

    expect(await service.getLikeCount('post', 'post-1')).toBe(2);
  });

  test('views increment per content target', async () => {
    await service.recordView('post', 'post-1');
    await service.recordView('post', 'post-1');

    expect(await service.getViewCount('post', 'post-1')).toBe(2);
  });

  test('guestbook entries are pending by default', async () => {
    const entry = await service.createGuestbookEntry({
      authorName: ' Visitor ',
      body: ' Hello from the guestbook. ',
    });

    expect(entry.status).toBe('pending');
    expect(entry.authorName).toBe('Visitor');
    expect(entry.body).toBe('Hello from the guestbook.');
    expect(await service.listApprovedGuestbookEntries()).toEqual([]);
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

  test('moderates and lists guestbook entries for admin review', async () => {
    const pending = await service.createGuestbookEntry({
      authorName: 'Visitor',
      body: 'Waiting here.',
    });
    const approved = await service.createGuestbookEntry({
      authorName: 'Friend',
      body: 'Hello there.',
    });

    await service.moderateGuestbookEntry(approved.id, 'approved');

    expect(await service.listApprovedGuestbookEntries()).toEqual([expect.objectContaining({ id: approved.id })]);
    expect((await service.listAdminGuestbookEntries({ status: 'pending' })).map((entry) => entry.id)).toEqual([pending.id]);
    expect((await service.listAdminGuestbookEntries()).map((entry) => entry.id)).toEqual([approved.id, pending.id]);
  });
});
