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
      ipHash: 'ip-hash-1',
      userAgent: 'Mozilla/5.0',
    });

    expect(comment).toEqual({
      id: '1',
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Nice writing.',
      status: 'pending',
      createdAt: '2026-06-10T00:00:00.000Z',
      ipHash: 'ip-hash-1',
      userAgent: 'Mozilla/5.0',
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

  test('deletes moderated submissions permanently', async () => {
    const repository = new InMemoryInteractionsRepository();
    const comment = await repository.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Remove me.',
    });
    const entry = await repository.createGuestbookEntry({
      authorName: 'Visitor',
      body: 'Remove this entry.',
    });

    await expect(repository.deleteComment(comment.id)).resolves.toBe(true);
    await expect(repository.deleteGuestbookEntry(entry.id)).resolves.toBe(true);

    expect(await repository.listAdminComments()).toEqual([]);
    expect(await repository.listAdminGuestbookEntries()).toEqual([]);
    await expect(repository.deleteComment(comment.id)).resolves.toBe(false);
    await expect(repository.deleteGuestbookEntry(entry.id)).resolves.toBe(false);
  });

  test('keeps moderation metadata off approved public comments', async () => {
    const repository = new InMemoryInteractionsRepository();
    const comment = await repository.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Reader',
      body: 'Private metadata should not leak.',
      ipHash: 'ip-hash-1',
      userAgent: 'Mozilla/5.0',
    });

    await repository.moderateComment(comment.id, 'approved');

    expect(await repository.listAdminComments()).toEqual([
      expect.objectContaining({
        id: comment.id,
        ipHash: 'ip-hash-1',
        userAgent: 'Mozilla/5.0',
      }),
    ]);
    expect(await repository.listApprovedComments('post', 'post-1')).toEqual([
      expect.not.objectContaining({
        ipHash: 'ip-hash-1',
        userAgent: 'Mozilla/5.0',
      }),
    ]);
  });

  test('counts likes per content target', async () => {
    const repository = new InMemoryInteractionsRepository();

    await expect(repository.likeContent('post', 'post-1')).resolves.toBe(1);
    await expect(repository.likeContent('post', 'post-1')).resolves.toBe(2);
    await expect(repository.getLikeCount('post', 'post-1')).resolves.toBe(2);
    await expect(repository.getLikeCount('note', 'note-1')).resolves.toBe(0);
  });

  test('deduplicates likes per actor and content target', async () => {
    const repository = new InMemoryInteractionsRepository();

    await expect(repository.likeContent('post', 'post-1', 'actor-1')).resolves.toBe(1);
    await expect(repository.likeContent('post', 'post-1', 'actor-1')).resolves.toBe(1);
    await expect(repository.likeContent('post', 'post-1', 'actor-2')).resolves.toBe(2);
    await expect(repository.likeContent('note', 'note-1', 'actor-1')).resolves.toBe(1);
  });

  test('counts views per content target', async () => {
    const repository = new InMemoryInteractionsRepository();

    await expect(repository.recordView('post', 'post-1')).resolves.toBe(1);
    await expect(repository.recordView('post', 'post-1')).resolves.toBe(2);
    await expect(repository.getViewCount('post', 'post-1')).resolves.toBe(2);
    await expect(repository.getViewCount('note', 'note-1')).resolves.toBe(0);
  });

  test('deduplicates views per actor and content target', async () => {
    const repository = new InMemoryInteractionsRepository();

    await expect(repository.recordView('post', 'post-1', 'viewer-1')).resolves.toBe(1);
    await expect(repository.recordView('post', 'post-1', 'viewer-1')).resolves.toBe(1);
    await expect(repository.recordView('post', 'post-1', 'viewer-2')).resolves.toBe(2);
    await expect(repository.recordView('project', 'project-1', 'viewer-1')).resolves.toBe(1);
  });
});
