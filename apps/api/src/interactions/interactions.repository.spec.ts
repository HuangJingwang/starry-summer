import { describe, expect, test } from 'vitest';

import { InMemoryInteractionsRepository } from './interactions.repository';

describe('InMemoryInteractionsRepository', () => {
  test('stores comments until they are moderated', async () => {
    const repository = new InMemoryInteractionsRepository(() => '2026-06-10T00:00:00.000Z');

    const comment = await repository.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Nice writing.',
    });

    expect(comment).toEqual({
      id: '1',
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Nice writing.',
      status: 'pending',
      createdAt: '2026-06-10T00:00:00.000Z',
    });
    expect(await repository.listApprovedComments('post', 'post-1')).toEqual([]);

    await repository.moderateComment(comment.id, 'approved');

    expect(await repository.listApprovedComments('post', 'post-1')).toEqual([
      expect.objectContaining({ id: comment.id, status: 'approved' }),
    ]);
  });

  test('returns null when moderating missing submissions', async () => {
    const repository = new InMemoryInteractionsRepository();

    await expect(repository.moderateComment('missing', 'approved')).resolves.toBeNull();
    await expect(repository.moderateGuestbookEntry('missing', 'approved')).resolves.toBeNull();
  });
});
