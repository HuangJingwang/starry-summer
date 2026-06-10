import type { ContentType, ModerationStatus } from '@starry-summer/shared';
import { isVisibleSubmission } from '@starry-summer/shared';

import type {
  CommentRecord,
  CreateCommentInput,
  CreateGuestbookEntryInput,
  GuestbookEntryRecord,
  ModerationListFilter,
} from './interactions.service';

export interface InteractionsRepository {
  createComment(input: CreateCommentInput): Promise<CommentRecord>;
  moderateComment(id: string, status: ModerationStatus): Promise<CommentRecord | null>;
  listAdminComments(filter?: ModerationListFilter): Promise<CommentRecord[]>;
  listApprovedComments(targetType: CommentRecord['targetType'], targetId: string): Promise<CommentRecord[]>;
  likeContent(targetType: ContentType, targetId: string): Promise<number>;
  getLikeCount(targetType: ContentType, targetId: string): Promise<number>;
  createGuestbookEntry(input: CreateGuestbookEntryInput): Promise<GuestbookEntryRecord>;
  moderateGuestbookEntry(id: string, status: ModerationStatus): Promise<GuestbookEntryRecord | null>;
  listAdminGuestbookEntries(filter?: ModerationListFilter): Promise<GuestbookEntryRecord[]>;
  listApprovedGuestbookEntries(): Promise<GuestbookEntryRecord[]>;
}

export const INTERACTIONS_REPOSITORY = Symbol('INTERACTIONS_REPOSITORY');

export class InMemoryInteractionsRepository implements InteractionsRepository {
  private readonly comments = new Map<string, CommentRecord>();
  private readonly guestbookEntries = new Map<string, GuestbookEntryRecord>();
  private readonly likes = new Map<string, number>();
  private nextCommentId = 1;
  private nextGuestbookId = 1;

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  async createComment(input: CreateCommentInput): Promise<CommentRecord> {
    const comment: CommentRecord = {
      id: String(this.nextCommentId++),
      targetType: input.targetType,
      targetId: input.targetId,
      authorName: input.authorName,
      body: input.body,
      status: 'pending',
      createdAt: this.now(),
    };

    this.comments.set(comment.id, comment);
    return comment;
  }

  async moderateComment(id: string, status: ModerationStatus): Promise<CommentRecord | null> {
    const comment = this.comments.get(id);

    if (!comment) {
      return null;
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

  async listApprovedComments(targetType: CommentRecord['targetType'], targetId: string): Promise<CommentRecord[]> {
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
      createdAt: this.now(),
    };

    this.guestbookEntries.set(entry.id, entry);
    return entry;
  }

  async moderateGuestbookEntry(id: string, status: ModerationStatus): Promise<GuestbookEntryRecord | null> {
    const entry = this.guestbookEntries.get(id);

    if (!entry) {
      return null;
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

  return b.id.localeCompare(a.id, undefined, { numeric: true });
}
