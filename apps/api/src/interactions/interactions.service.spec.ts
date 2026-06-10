import { beforeEach, describe, expect, test } from 'vitest';

import { InteractionsService } from './interactions.service';

describe('InteractionsService', () => {
  let service: InteractionsService;

  beforeEach(() => {
    service = new InteractionsService();
  });

  test('creates pending comments by default', async () => {
    const comment = await service.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Nice writing.',
    });

    expect(comment.status).toBe('pending');
    expect(await service.listApprovedComments('post', 'post-1')).toEqual([]);
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

  test('guestbook entries are pending by default', async () => {
    const entry = await service.createGuestbookEntry({
      authorName: 'Visitor',
      body: 'Hello from the guestbook.',
    });

    expect(entry.status).toBe('pending');
    expect(await service.listApprovedGuestbookEntries()).toEqual([]);
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
