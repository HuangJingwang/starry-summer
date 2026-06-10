import { Injectable, NotFoundException } from '@nestjs/common';
import type { ContentType, ModerationStatus } from '@starry-summer/shared';
import { isVisibleSubmission } from '@starry-summer/shared';

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
  private readonly comments = new Map<string, CommentRecord>();
  private readonly guestbookEntries = new Map<string, GuestbookEntryRecord>();
  private readonly likes = new Map<string, number>();
  private nextCommentId = 1;
  private nextGuestbookId = 1;

  async createComment(input: CreateCommentInput): Promise<CommentRecord> {
    const comment: CommentRecord = {
      id: String(this.nextCommentId++),
      targetType: input.targetType,
      targetId: input.targetId,
      authorName: input.authorName,
      body: input.body,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.comments.set(comment.id, comment);
    return comment;
  }

  async moderateComment(id: string, status: ModerationStatus): Promise<CommentRecord> {
    const comment = this.comments.get(id);

    if (!comment) {
      throw new NotFoundException(`Comment ${id} was not found`);
    }

    const updated = { ...comment, status };
    this.comments.set(id, updated);

    return updated;
  }

  async listAdminComments(filter: ModerationListFilter = {}): Promise<CommentRecord[]> {
    return [...this.comments.values()]
      .filter((comment) => (filter.status ? comment.status === filter.status : true))
      .sort(sortNewestModerationFirst);
  }

  async listApprovedComments(
    targetType: CommentRecord['targetType'],
    targetId: string,
  ): Promise<CommentRecord[]> {
    return [...this.comments.values()].filter(
      (comment) =>
        comment.targetType === targetType &&
        comment.targetId === targetId &&
        isVisibleSubmission(comment),
    );
  }

  async likeContent(targetType: ContentType, targetId: string): Promise<number> {
    const key = this.likeKey(targetType, targetId);
    const count = (this.likes.get(key) ?? 0) + 1;
    this.likes.set(key, count);

    return count;
  }

  async getLikeCount(targetType: ContentType, targetId: string): Promise<number> {
    return this.likes.get(this.likeKey(targetType, targetId)) ?? 0;
  }

  async createGuestbookEntry(input: CreateGuestbookEntryInput): Promise<GuestbookEntryRecord> {
    const entry: GuestbookEntryRecord = {
      id: String(this.nextGuestbookId++),
      authorName: input.authorName,
      body: input.body,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.guestbookEntries.set(entry.id, entry);
    return entry;
  }

  async moderateGuestbookEntry(id: string, status: ModerationStatus): Promise<GuestbookEntryRecord> {
    const entry = this.guestbookEntries.get(id);

    if (!entry) {
      throw new NotFoundException(`Guestbook entry ${id} was not found`);
    }

    const updated = { ...entry, status };
    this.guestbookEntries.set(id, updated);

    return updated;
  }

  async listAdminGuestbookEntries(filter: ModerationListFilter = {}): Promise<GuestbookEntryRecord[]> {
    return [...this.guestbookEntries.values()]
      .filter((entry) => (filter.status ? entry.status === filter.status : true))
      .sort(sortNewestModerationFirst);
  }

  async listApprovedGuestbookEntries(): Promise<GuestbookEntryRecord[]> {
    return [...this.guestbookEntries.values()].filter(isVisibleSubmission);
  }

  private likeKey(targetType: ContentType, targetId: string): string {
    return `${targetType}:${targetId}`;
  }
}

function sortNewestModerationFirst(
  a: Pick<CommentRecord, 'id' | 'createdAt'>,
  b: Pick<CommentRecord, 'id' | 'createdAt'>,
): number {
  const dateOrder = b.createdAt.localeCompare(a.createdAt);

  if (dateOrder !== 0) {
    return dateOrder;
  }

  return Number(b.id) - Number(a.id);
}
