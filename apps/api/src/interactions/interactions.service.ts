import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ContentType, ModerationStatus } from '@starry-summer/shared';

import { INTERACTIONS_REPOSITORY, type InteractionsRepository } from './interactions.repository.js';

export interface CommentRecord {
  id: string;
  targetType: Extract<ContentType, 'post' | 'note' | 'project'>;
  targetId: string;
  authorName: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
}

export interface CreateCommentInput {
  targetType: CommentRecord['targetType'];
  targetId: string;
  authorName: string;
  body: string;
}

export interface GuestbookEntryRecord {
  id: string;
  authorName: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
}

export interface CreateGuestbookEntryInput {
  authorName: string;
  body: string;
}

export interface ModerationListFilter {
  status?: ModerationStatus;
}

@Injectable()
export class InteractionsService {
  constructor(
    @Inject(INTERACTIONS_REPOSITORY)
    private readonly repository: InteractionsRepository,
  ) {}

  async createComment(input: CreateCommentInput): Promise<CommentRecord> {
    return this.repository.createComment(input);
  }

  async moderateComment(id: string, status: ModerationStatus): Promise<CommentRecord> {
    const comment = await this.repository.moderateComment(id, status);

    if (!comment) {
      throw new NotFoundException(`Comment ${id} was not found`);
    }

    return comment;
  }

  async listAdminComments(filter: ModerationListFilter = {}): Promise<CommentRecord[]> {
    return this.repository.listAdminComments(filter);
  }

  async listApprovedComments(
    targetType: CommentRecord['targetType'],
    targetId: string,
  ): Promise<CommentRecord[]> {
    return this.repository.listApprovedComments(targetType, targetId);
  }

  async likeContent(targetType: ContentType, targetId: string): Promise<number> {
    return this.repository.likeContent(targetType, targetId);
  }

  async getLikeCount(targetType: ContentType, targetId: string): Promise<number> {
    return this.repository.getLikeCount(targetType, targetId);
  }

  async recordView(targetType: ContentType, targetId: string): Promise<number> {
    return this.repository.recordView(targetType, targetId);
  }

  async getViewCount(targetType: ContentType, targetId: string): Promise<number> {
    return this.repository.getViewCount(targetType, targetId);
  }

  async createGuestbookEntry(input: CreateGuestbookEntryInput): Promise<GuestbookEntryRecord> {
    return this.repository.createGuestbookEntry(input);
  }

  async moderateGuestbookEntry(id: string, status: ModerationStatus): Promise<GuestbookEntryRecord> {
    const entry = await this.repository.moderateGuestbookEntry(id, status);

    if (!entry) {
      throw new NotFoundException(`Guestbook entry ${id} was not found`);
    }

    return entry;
  }

  async listAdminGuestbookEntries(filter: ModerationListFilter = {}): Promise<GuestbookEntryRecord[]> {
    return this.repository.listAdminGuestbookEntries(filter);
  }

  async listApprovedGuestbookEntries(): Promise<GuestbookEntryRecord[]> {
    return this.repository.listApprovedGuestbookEntries();
  }
}
