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
  deleteComment(id: string): Promise<boolean>;
  listAdminComments(filter?: ModerationListFilter): Promise<CommentRecord[]>;
  listApprovedComments(targetType: CommentRecord['targetType'], targetId: string): Promise<CommentRecord[]>;
  likeContent(targetType: ContentType, targetId: string, actorHash?: string): Promise<number>;
  getLikeCount(targetType: ContentType, targetId: string): Promise<number>;
  recordView(targetType: ContentType, targetId: string, actorHash?: string): Promise<number>;
  getViewCount(targetType: ContentType, targetId: string): Promise<number>;
  createGuestbookEntry(input: CreateGuestbookEntryInput): Promise<GuestbookEntryRecord>;
  moderateGuestbookEntry(id: string, status: ModerationStatus): Promise<GuestbookEntryRecord | null>;
  deleteGuestbookEntry(id: string): Promise<boolean>;
  listAdminGuestbookEntries(filter?: ModerationListFilter): Promise<GuestbookEntryRecord[]>;
  listApprovedGuestbookEntries(): Promise<GuestbookEntryRecord[]>;
}

export const INTERACTIONS_REPOSITORY = Symbol('INTERACTIONS_REPOSITORY');

export class InMemoryInteractionsRepository implements InteractionsRepository {
  private readonly comments = new Map<string, CommentRecord>();
  private readonly guestbookEntries = new Map<string, GuestbookEntryRecord>();
  private readonly anonymousLikes = new Map<string, number>();
  private readonly anonymousViews = new Map<string, number>();
  private readonly actorLikes = new Map<string, Set<string>>();
  private readonly actorViews = new Map<string, Set<string>>();
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
      ...buildModerationMetadata(input),
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

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
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
    ).map(stripModerationMetadata);
  }

  async likeContent(targetType: ContentType, targetId: string, actorHash?: string): Promise<number> {
    const key = this.targetKey(targetType, targetId);

    if (actorHash) {
      const actors = this.actorLikes.get(key) ?? new Set<string>();
      actors.add(actorHash);
      this.actorLikes.set(key, actors);

      return this.getLikeCount(targetType, targetId);
    }

    this.anonymousLikes.set(key, (this.anonymousLikes.get(key) ?? 0) + 1);

    return this.getLikeCount(targetType, targetId);
  }

  async getLikeCount(targetType: ContentType, targetId: string): Promise<number> {
    const key = this.targetKey(targetType, targetId);

    return (this.anonymousLikes.get(key) ?? 0) + (this.actorLikes.get(key)?.size ?? 0);
  }

  async recordView(targetType: ContentType, targetId: string, actorHash?: string): Promise<number> {
    const key = this.targetKey(targetType, targetId);

    if (actorHash) {
      const actors = this.actorViews.get(key) ?? new Set<string>();
      actors.add(actorHash);
      this.actorViews.set(key, actors);

      return this.getViewCount(targetType, targetId);
    }

    this.anonymousViews.set(key, (this.anonymousViews.get(key) ?? 0) + 1);

    return this.getViewCount(targetType, targetId);
  }

  async getViewCount(targetType: ContentType, targetId: string): Promise<number> {
    const key = this.targetKey(targetType, targetId);

    return (this.anonymousViews.get(key) ?? 0) + (this.actorViews.get(key)?.size ?? 0);
  }

  async createGuestbookEntry(input: CreateGuestbookEntryInput): Promise<GuestbookEntryRecord> {
    const entry: GuestbookEntryRecord = {
      id: String(this.nextGuestbookId++),
      authorName: input.authorName,
      body: input.body,
      status: 'pending',
      createdAt: this.now(),
      ...buildModerationMetadata(input),
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

  async deleteGuestbookEntry(id: string): Promise<boolean> {
    return this.guestbookEntries.delete(id);
  }

  async listAdminGuestbookEntries(filter: ModerationListFilter = {}): Promise<GuestbookEntryRecord[]> {
    return [...this.guestbookEntries.values()]
      .filter((entry) => (filter.status ? entry.status === filter.status : true))
      .sort(sortNewestModerationFirst);
  }

  async listApprovedGuestbookEntries(): Promise<GuestbookEntryRecord[]> {
    return [...this.guestbookEntries.values()].filter(isVisibleSubmission).map(stripModerationMetadata);
  }

  private targetKey(targetType: ContentType, targetId: string): string {
    return `${targetType}:${targetId}`;
  }
}

function buildModerationMetadata(input: { ipHash?: string; userAgent?: string }): Pick<CommentRecord, 'ipHash' | 'userAgent'> {
  return {
    ...(input.ipHash ? { ipHash: input.ipHash } : {}),
    ...(input.userAgent ? { userAgent: input.userAgent } : {}),
  };
}

function stripModerationMetadata<T extends CommentRecord | GuestbookEntryRecord>(record: T): T {
  const { ipHash: _ipHash, userAgent: _userAgent, ...publicRecord } = record;

  return publicRecord as T;
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
