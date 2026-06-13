import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { GUARDS_METADATA } from '@nestjs/common/constants';

import { ReaderAuthGuard } from '../auth/reader-auth.guard';
import { PublicInteractionRateLimitGuard } from '../security/public-interaction-rate-limit.guard';
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

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('requires GitHub reader auth before creating comments', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, InteractionsController.prototype.createComment)).toEqual([
      ReaderAuthGuard,
      PublicInteractionRateLimitGuard,
    ]);
  });

  test('allows public likes and views without GitHub reader auth', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, InteractionsController.prototype.likeContent)).toEqual([
      PublicInteractionRateLimitGuard,
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, InteractionsController.prototype.recordView)).toEqual([
      PublicInteractionRateLimitGuard,
    ]);
  });

  test('accepts supported comment targets from GitHub readers', () => {
    const controller = new InteractionsController(interactionsService as never);
    const request = {
      readerSession: {
        kind: 'reader',
        provider: 'github',
        providerId: '123',
        login: 'ada',
        displayName: 'Ada Lovelace',
        profileUrl: 'https://github.com/ada',
        expiresAt: '2026-06-12T00:00:00.000Z',
      } as const,
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      },
      ip: '127.0.0.1',
    };

    controller.createComment({
      targetType: 'post',
      targetId: 'post-1',
      body: 'Nice',
    }, request);
    controller.listApprovedComments('note', 'note-1');

    expect(interactionsService.createComment).toHaveBeenCalledWith({
      targetType: 'post',
      targetId: 'post-1',
      authorName: 'Ada Lovelace',
      body: 'Nice',
      ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      userAgent: 'Mozilla/5.0',
    });
    expect(interactionsService.listApprovedComments).toHaveBeenCalledWith('note', 'note-1');
  });

  test('passes inline comment anchors from GitHub readers', () => {
    const controller = new InteractionsController(interactionsService as never);
    const anchor = {
      text: 'selected passage',
      prefix: 'before',
      suffix: 'after',
      start: 12,
      end: 28,
      hash: 'a'.repeat(64),
    };

    controller.createComment({
      targetType: 'post',
      targetId: 'post-1',
      body: 'Nice',
      anchor,
    }, {
      readerSession: {
        kind: 'reader',
        provider: 'github',
        providerId: '123',
        login: 'ada',
        displayName: 'Ada Lovelace',
        profileUrl: 'https://github.com/ada',
        expiresAt: '2026-06-12T00:00:00.000Z',
      },
      headers: {},
    });

    expect(interactionsService.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: 'post',
        targetId: 'post-1',
        body: 'Nice',
        anchor,
      }),
    );
  });

  test('rejects unsupported comment targets', () => {
    const controller = new InteractionsController(interactionsService as never);

    expect(() => controller.createComment({
      targetType: 'page',
      targetId: 'about',
      body: 'Nice',
    }, { headers: {} })).toThrow('Unsupported comment target type: page');
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

  test('rejects unsafe public interaction target ids before repository calls', () => {
    const controller = new InteractionsController(interactionsService as never);
    const request = {
      readerSession: {
        kind: 'reader',
        provider: 'github',
        providerId: '123',
        login: 'ada',
        displayName: 'Ada Lovelace',
        profileUrl: 'https://github.com/ada',
        expiresAt: '2026-06-12T00:00:00.000Z',
      } as const,
      headers: {},
    };
    const publicRequest = { headers: {} };

    expect(() =>
      controller.createComment(
        {
          targetType: 'post',
          targetId: '../admin',
          body: 'Nice',
        },
        request,
      ),
    ).toThrow('Public interaction target id is invalid');
    expect(() => controller.listApprovedComments('post', 'post id')).toThrow(
      'Public interaction target id is invalid',
    );
    expect(() => controller.likeContent('post', 'a'.repeat(129), publicRequest)).toThrow(
      'Public interaction target id is invalid',
    );
    expect(() => controller.recordView('post', '', publicRequest)).toThrow(
      'Public interaction target id is invalid',
    );
    expect(interactionsService.createComment).not.toHaveBeenCalled();
    expect(interactionsService.listApprovedComments).not.toHaveBeenCalled();
    expect(interactionsService.likeContent).not.toHaveBeenCalled();
    expect(interactionsService.recordView).not.toHaveBeenCalled();
  });

  test('rejects weak interaction hash secrets in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('INTERACTION_HASH_SECRET', 'change-me-before-production');
    const controller = new InteractionsController(interactionsService as never);

    expect(() => controller.likeContent('post', 'post-1', { headers: {} })).toThrow(
      'INTERACTION_HASH_SECRET must be at least 32 characters and not a placeholder in production',
    );
    expect(interactionsService.likeContent).not.toHaveBeenCalled();
  });

  test('requires a dedicated interaction hash secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('INTERACTION_HASH_SECRET', undefined);
    vi.stubEnv('SESSION_SECRET', '12345678901234567890123456789012');
    const controller = new InteractionsController(interactionsService as never);

    expect(() => controller.likeContent('post', 'post-1', { headers: {} })).toThrow(
      'INTERACTION_HASH_SECRET must be configured separately in production',
    );
    expect(interactionsService.likeContent).not.toHaveBeenCalled();
  });

  test('requires GitHub reader auth before creating guestbook entries', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, InteractionsController.prototype.createGuestbookEntry)).toEqual([
      ReaderAuthGuard,
      PublicInteractionRateLimitGuard,
    ]);
  });

  test('adds moderation metadata and GitHub identity to guestbook entries', () => {
    const controller = new InteractionsController(interactionsService as never);

    controller.createGuestbookEntry(
      {
        body: 'Hello',
      },
      {
        readerSession: {
          kind: 'reader',
          provider: 'github',
          providerId: '123',
          login: 'ada',
          displayName: 'Ada Lovelace',
          profileUrl: 'https://github.com/ada',
          expiresAt: '2026-06-12T00:00:00.000Z',
        },
        headers: {
          'user-agent': 'Safari',
          'x-real-ip': '198.51.100.9',
        },
      },
    );

    expect(interactionsService.createGuestbookEntry).toHaveBeenCalledWith({
      authorName: 'Ada Lovelace',
      body: 'Hello',
      ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      userAgent: 'Safari',
    });
  });

  test('deletes moderated submissions from admin routes', () => {
    const controller = new InteractionsController(interactionsService as never);

    controller.deleteComment('comment-1');
    controller.deleteGuestbookEntry('entry-1');

    expect(interactionsService.deleteComment).toHaveBeenCalledWith('comment-1');
    expect(interactionsService.deleteGuestbookEntry).toHaveBeenCalledWith('entry-1');
  });
});
