import { beforeEach, describe, expect, test, vi } from 'vitest';

import { InteractionsController } from './interactions.controller';

describe('InteractionsController', () => {
  const interactionsService = {
    createComment: vi.fn(),
    listApprovedComments: vi.fn(),
    moderateComment: vi.fn(),
    listAdminComments: vi.fn(),
    likeContent: vi.fn(),
    recordView: vi.fn(),
    createGuestbookEntry: vi.fn(),
    listApprovedGuestbookEntries: vi.fn(),
    listAdminGuestbookEntries: vi.fn(),
    moderateGuestbookEntry: vi.fn(),
    deleteComment: vi.fn(),
    deleteGuestbookEntry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('accepts supported comment targets', () => {
    const controller = new InteractionsController(interactionsService as never);

    controller.createComment({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Ada',
      body: 'Nice',
    });
    controller.listApprovedComments('note', 'note-1');

    expect(interactionsService.createComment).toHaveBeenCalledWith({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Ada',
      body: 'Nice',
    });
    expect(interactionsService.listApprovedComments).toHaveBeenCalledWith('note', 'note-1');
  });

  test('rejects unsupported comment targets', () => {
    const controller = new InteractionsController(interactionsService as never);

    expect(() => controller.createComment({
      targetType: 'page',
      targetId: 'about',
      authorName: 'Ada',
      body: 'Nice',
    })).toThrow('Unsupported comment target type: page');
    expect(() => controller.listApprovedComments('moment', 'daily-1')).toThrow('Unsupported comment target type: moment');
    expect(interactionsService.createComment).not.toHaveBeenCalled();
    expect(interactionsService.listApprovedComments).not.toHaveBeenCalled();
  });

  test('validates moderation statuses', () => {
    const controller = new InteractionsController(interactionsService as never);

    controller.moderateComment('comment-1', 'approved');
    controller.listAdminComments('pending');
    controller.listAdminGuestbookEntries('spam');
    controller.moderateGuestbookEntry('entry-1', 'rejected');

    expect(interactionsService.moderateComment).toHaveBeenCalledWith('comment-1', 'approved');
    expect(interactionsService.listAdminComments).toHaveBeenCalledWith({ status: 'pending' });
    expect(interactionsService.listAdminGuestbookEntries).toHaveBeenCalledWith({ status: 'spam' });
    expect(interactionsService.moderateGuestbookEntry).toHaveBeenCalledWith('entry-1', 'rejected');
  });

  test('rejects unsupported moderation statuses', () => {
    const controller = new InteractionsController(interactionsService as never);

    expect(() => controller.moderateComment('comment-1', 'hidden')).toThrow('Unsupported moderation status: hidden');
    expect(() => controller.listAdminComments('hidden')).toThrow('Unsupported moderation status: hidden');
    expect(() => controller.listAdminGuestbookEntries('hidden')).toThrow('Unsupported moderation status: hidden');
    expect(() => controller.moderateGuestbookEntry('entry-1', 'hidden')).toThrow('Unsupported moderation status: hidden');
  });

  test('validates engagement content targets', () => {
    const controller = new InteractionsController(interactionsService as never);
    const request = {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      },
      ip: '127.0.0.1',
    };

    controller.likeContent('project', 'project-1', request);
    controller.recordView('post', 'post-1', request);

    const likeActorHash = interactionsService.likeContent.mock.calls[0]?.[2];
    const viewActorHash = interactionsService.recordView.mock.calls[0]?.[2];

    expect(interactionsService.likeContent).toHaveBeenCalledWith('project', 'project-1', expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(interactionsService.recordView).toHaveBeenCalledWith('post', 'post-1', expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(likeActorHash).toBe(viewActorHash);
    expect(() => controller.likeContent('essay', 'essay-1', request)).toThrow('Unsupported content type: essay');
    expect(() => controller.recordView('essay', 'essay-1', request)).toThrow('Unsupported content type: essay');
  });

  test('deletes moderated submissions from admin routes', () => {
    const controller = new InteractionsController(interactionsService as never);

    controller.deleteComment('comment-1');
    controller.deleteGuestbookEntry('entry-1');

    expect(interactionsService.deleteComment).toHaveBeenCalledWith('comment-1');
    expect(interactionsService.deleteGuestbookEntry).toHaveBeenCalledWith('entry-1');
  });
});
