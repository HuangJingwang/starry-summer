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
});
