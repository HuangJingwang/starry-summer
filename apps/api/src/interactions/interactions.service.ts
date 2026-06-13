import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PUBLIC_SUBMISSION_LIMITS, type ContentType, type ModerationStatus } from '@starry-summer/shared';

import { ContentService } from '../content/content.service.js';
import { INTERACTIONS_REPOSITORY, type InteractionsRepository } from './interactions.repository.js';

export interface CommentRecord {
  id: string;
  targetType: Extract<ContentType, 'post' | 'note' | 'project'>;
  targetId: string;
  authorName: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
  anchor?: CommentAnchor;
  ipHash?: string;
  userAgent?: string;
}

export interface CommentAnchor {
  text: string;
  prefix: string;
  suffix: string;
  start: number;
  end: number;
  hash: string;
}

export interface CreateCommentInput {
  targetType: CommentRecord['targetType'];
  targetId: string;
  authorName: string;
  body: string;
  anchor?: CommentAnchor;
  ipHash?: string;
  userAgent?: string;
}

export interface GuestbookEntryRecord {
  id: string;
  authorName: string;
  body: string;
  status: ModerationStatus;
  createdAt: string;
  ipHash?: string;
  userAgent?: string;
}

export interface CreateGuestbookEntryInput {
  authorName: string;
  body: string;
  ipHash?: string;
  userAgent?: string;
}

export interface ModerationListFilter {
  status?: ModerationStatus;
}

export interface CommentTargetPolicy {
  ensureCanComment(targetType: CommentRecord['targetType'], targetId: string): Promise<void>;
}

@Injectable()
export class InteractionsService {
  constructor(
    @Inject(INTERACTIONS_REPOSITORY)
    private readonly repository: InteractionsRepository,
    @Optional()
    @Inject(ContentService)
    private readonly commentTargetPolicy?: CommentTargetPolicy,
  ) {}

  async createComment(input: CreateCommentInput): Promise<CommentRecord> {
    const submission = normalizePublicSubmission(input);
    const anchor = normalizeCommentAnchor(input.anchor);

    await this.commentTargetPolicy?.ensureCanComment(input.targetType, input.targetId);

    return this.repository.createComment({
      ...input,
      ...submission,
      ...(anchor ? { anchor } : {}),
    });
  }

  async moderateComment(id: string, status: ModerationStatus): Promise<CommentRecord> {
    const comment = await this.repository.moderateComment(id, status);

    if (!comment) {
      throw new NotFoundException(`Comment ${id} was not found`);
    }

    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    const deleted = await this.repository.deleteComment(id);

    if (!deleted) {
      throw new NotFoundException(`Comment ${id} was not found`);
    }
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

  async likeContent(targetType: ContentType, targetId: string, actorHash?: string): Promise<number> {
    return this.repository.likeContent(targetType, targetId, actorHash);
  }

  async getLikeCount(targetType: ContentType, targetId: string): Promise<number> {
    return this.repository.getLikeCount(targetType, targetId);
  }

  async recordView(targetType: ContentType, targetId: string, actorHash?: string): Promise<number> {
    return this.repository.recordView(targetType, targetId, actorHash);
  }

  async getViewCount(targetType: ContentType, targetId: string): Promise<number> {
    return this.repository.getViewCount(targetType, targetId);
  }

  async createGuestbookEntry(input: CreateGuestbookEntryInput): Promise<GuestbookEntryRecord> {
    return this.repository.createGuestbookEntry({
      ...input,
      ...normalizePublicSubmission(input),
    });
  }

  async moderateGuestbookEntry(id: string, status: ModerationStatus): Promise<GuestbookEntryRecord> {
    const entry = await this.repository.moderateGuestbookEntry(id, status);

    if (!entry) {
      throw new NotFoundException(`Guestbook entry ${id} was not found`);
    }

    return entry;
  }

  async deleteGuestbookEntry(id: string): Promise<void> {
    const deleted = await this.repository.deleteGuestbookEntry(id);

    if (!deleted) {
      throw new NotFoundException(`Guestbook entry ${id} was not found`);
    }
  }

  async listAdminGuestbookEntries(filter: ModerationListFilter = {}): Promise<GuestbookEntryRecord[]> {
    return this.repository.listAdminGuestbookEntries(filter);
  }

  async listApprovedGuestbookEntries(): Promise<GuestbookEntryRecord[]> {
    return this.repository.listApprovedGuestbookEntries();
  }
}

function normalizePublicSubmission<T extends { authorName: string; body: string }>(input: T): Pick<T, 'authorName' | 'body'> {
  const authorName = input.authorName.trim();
  const body = input.body.trim();

  if (!authorName) {
    throw new BadRequestException('Author name is required');
  }

  if (!body) {
    throw new BadRequestException('Submission body is required');
  }

  if (authorName.length > PUBLIC_SUBMISSION_LIMITS.authorName) {
    throw new BadRequestException(`Author name must be at most ${PUBLIC_SUBMISSION_LIMITS.authorName} characters`);
  }

  if (body.length > PUBLIC_SUBMISSION_LIMITS.body) {
    throw new BadRequestException(`Submission body must be at most ${PUBLIC_SUBMISSION_LIMITS.body} characters`);
  }

  return { authorName, body };
}

function normalizeCommentAnchor(anchor: CommentAnchor | undefined): CommentAnchor | undefined {
  if (!anchor) {
    return undefined;
  }

  const text = anchor.text.trim().replace(/\s+/g, ' ');
  const prefix = anchor.prefix.trim().replace(/\s+/g, ' ');
  const suffix = anchor.suffix.trim().replace(/\s+/g, ' ');
  const start = Number(anchor.start);
  const end = Number(anchor.end);
  const hash = anchor.hash.trim().toLowerCase();

  if (!text) {
    throw new BadRequestException('Anchor text is required');
  }

  if (text.length > 500) {
    throw new BadRequestException('Anchor text must be at most 500 characters');
  }

  if (prefix.length > 160 || suffix.length > 160) {
    throw new BadRequestException('Anchor context must be at most 160 characters');
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end - start > 1_000) {
    throw new BadRequestException('Anchor range is invalid');
  }

  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new BadRequestException('Anchor hash is invalid');
  }

  return {
    text,
    prefix,
    suffix,
    start,
    end,
    hash,
  };
}
