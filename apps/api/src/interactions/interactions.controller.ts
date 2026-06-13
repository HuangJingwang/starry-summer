import { createHash } from 'node:crypto';

import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { ContentType, ModerationStatus } from '@starry-summer/shared';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { ReaderAuthGuard, type ReaderAuthenticatedRequest } from '../auth/reader-auth.guard.js';
import {
  resolvePublicClientAddress,
  resolvePublicUserAgent,
  type PublicClientRequest,
} from '../security/public-client.js';
import { PublicInteractionRateLimitGuard } from '../security/public-interaction-rate-limit.guard.js';
import {
  InteractionsService,
  type CreateCommentInput,
  type CreateGuestbookEntryInput,
} from './interactions.service.js';

type CreateCommentRequest = Omit<CreateCommentInput, 'targetType' | 'authorName'> & { targetType: string };
type CreateGuestbookRequest = Pick<CreateGuestbookEntryInput, 'body'>;
type ReaderPublicClientRequest = PublicClientRequest & ReaderAuthenticatedRequest;

@Controller()
export class InteractionsController {
  constructor(@Inject(InteractionsService) private readonly interactionsService: InteractionsService) {}

  @Post('comments')
  @UseGuards(ReaderAuthGuard, PublicInteractionRateLimitGuard)
  createComment(@Body() input: CreateCommentRequest, @Req() request: ReaderPublicClientRequest) {
    const reader = request.readerSession;

    return this.interactionsService.createComment({
      ...input,
      targetType: parseCommentTargetType(input.targetType),
      targetId: parsePublicInteractionTargetId(input.targetId),
      authorName: reader?.displayName || reader?.login || 'GitHub 用户',
      ...createPublicSubmissionMetadata(request),
    });
  }

  @Get('comments/:targetType/:targetId')
  listApprovedComments(@Param('targetType') targetType: string, @Param('targetId') targetId: string) {
    return this.interactionsService.listApprovedComments(
      parseCommentTargetType(targetType),
      parsePublicInteractionTargetId(targetId),
    );
  }

  @Patch('admin/comments/:id/moderate')
  @UseGuards(AdminAuthGuard)
  moderateComment(@Param('id') id: string, @Body('status') status: string) {
    return this.interactionsService.moderateComment(id, parseModerationStatus(status));
  }

  @Delete('admin/comments/:id')
  @UseGuards(AdminAuthGuard)
  deleteComment(@Param('id') id: string) {
    return this.interactionsService.deleteComment(id);
  }

  @Get('admin/comments')
  @UseGuards(AdminAuthGuard)
  listAdminComments(@Query('status') status?: string) {
    return this.interactionsService.listAdminComments({ status: parseOptionalModerationStatus(status) });
  }

  @Post('likes/:targetType/:targetId')
  @UseGuards(PublicInteractionRateLimitGuard)
  likeContent(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Req() request: PublicClientRequest,
  ) {
    return this.interactionsService.likeContent(
      parseContentType(targetType),
      parsePublicInteractionTargetId(targetId),
      createPublicActorHash(request),
    );
  }

  @Post('views/:targetType/:targetId')
  @UseGuards(PublicInteractionRateLimitGuard)
  recordView(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Req() request: PublicClientRequest,
  ) {
    return this.interactionsService.recordView(
      parseContentType(targetType),
      parsePublicInteractionTargetId(targetId),
      createPublicActorHash(request),
    );
  }

  @Post('guestbook')
  @UseGuards(ReaderAuthGuard, PublicInteractionRateLimitGuard)
  createGuestbookEntry(@Body() input: CreateGuestbookRequest, @Req() request: ReaderPublicClientRequest) {
    const reader = request.readerSession;

    return this.interactionsService.createGuestbookEntry({
      ...input,
      authorName: reader?.displayName || reader?.login || 'GitHub 用户',
      ...createPublicSubmissionMetadata(request),
    });
  }

  @Get('guestbook')
  listApprovedGuestbookEntries() {
    return this.interactionsService.listApprovedGuestbookEntries();
  }

  @Get('admin/guestbook')
  @UseGuards(AdminAuthGuard)
  listAdminGuestbookEntries(@Query('status') status?: string) {
    return this.interactionsService.listAdminGuestbookEntries({ status: parseOptionalModerationStatus(status) });
  }

  @Patch('admin/guestbook/:id/moderate')
  @UseGuards(AdminAuthGuard)
  moderateGuestbookEntry(@Param('id') id: string, @Body('status') status: string) {
    return this.interactionsService.moderateGuestbookEntry(id, parseModerationStatus(status));
  }

  @Delete('admin/guestbook/:id')
  @UseGuards(AdminAuthGuard)
  deleteGuestbookEntry(@Param('id') id: string) {
    return this.interactionsService.deleteGuestbookEntry(id);
  }
}

const contentTypes = new Set<ContentType>(['post', 'note', 'moment', 'page', 'project']);
const commentTargetTypes = new Set<CreateCommentInput['targetType']>(['post', 'note', 'project']);
const moderationStatuses = new Set<ModerationStatus>(['pending', 'approved', 'rejected', 'spam']);

function parseContentType(value: string): ContentType {
  if (!contentTypes.has(value as ContentType)) {
    throw new BadRequestException(`Unsupported content type: ${value}`);
  }

  return value as ContentType;
}

function parseCommentTargetType(value: string): CreateCommentInput['targetType'] {
  if (!commentTargetTypes.has(value as CreateCommentInput['targetType'])) {
    throw new BadRequestException(`Unsupported comment target type: ${value}`);
  }

  return value as CreateCommentInput['targetType'];
}

function parseModerationStatus(value: string): ModerationStatus {
  if (!moderationStatuses.has(value as ModerationStatus)) {
    throw new BadRequestException(`Unsupported moderation status: ${value}`);
  }

  return value as ModerationStatus;
}

function parseOptionalModerationStatus(value: string | undefined): ModerationStatus | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  return parseModerationStatus(value);
}

function parsePublicInteractionTargetId(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) {
    throw new BadRequestException('Public interaction target id is invalid');
  }

  return value;
}

function createPublicActorHash(request: PublicClientRequest): string {
  const ip = resolvePublicClientAddress(request);
  const userAgent = resolvePublicUserAgent(request);
  const secret = resolveInteractionHashSecret();

  assertProductionInteractionHashSecret(secret);

  return createHash('sha256').update(`${secret}\n${ip}\n${userAgent}`).digest('hex');
}

function createPublicSubmissionMetadata(request: PublicClientRequest): { ipHash: string; userAgent: string } {
  return {
    ipHash: createPublicActorHash(request),
    userAgent: resolvePublicUserAgent(request),
  };
}

function resolveInteractionHashSecret(): string {
  if (process.env.INTERACTION_HASH_SECRET) {
    return process.env.INTERACTION_HASH_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('INTERACTION_HASH_SECRET must be configured separately in production');
  }

  return process.env.SESSION_SECRET ?? 'development-interaction-secret';
}

function assertProductionInteractionHashSecret(secret: string): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (
    secret.length < 32 ||
    secret.startsWith('replace-') ||
    secret.startsWith('change-') ||
    secret === 'development-interaction-secret' ||
    secret === 'development-session-secret'
  ) {
    throw new Error('INTERACTION_HASH_SECRET must be at least 32 characters and not a placeholder in production');
  }
}
