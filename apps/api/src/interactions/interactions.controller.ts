import { createHash } from 'node:crypto';

import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { ContentType, ModerationStatus } from '@starry-summer/shared';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { PublicInteractionRateLimitGuard } from '../security/public-interaction-rate-limit.guard.js';
import {
  InteractionsService,
  type CreateCommentInput,
  type CreateGuestbookEntryInput,
} from './interactions.service.js';

type CreateCommentRequest = Omit<CreateCommentInput, 'targetType'> & { targetType: string };
type PublicInteractionRequest = {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

@Controller()
export class InteractionsController {
  constructor(@Inject(InteractionsService) private readonly interactionsService: InteractionsService) {}

  @Post('comments')
  @UseGuards(PublicInteractionRateLimitGuard)
  createComment(@Body() input: CreateCommentRequest, @Req() request: PublicInteractionRequest) {
    return this.interactionsService.createComment({
      ...input,
      targetType: parseCommentTargetType(input.targetType),
      ...createPublicSubmissionMetadata(request),
    });
  }

  @Get('comments/:targetType/:targetId')
  listApprovedComments(@Param('targetType') targetType: string, @Param('targetId') targetId: string) {
    return this.interactionsService.listApprovedComments(parseCommentTargetType(targetType), targetId);
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
    @Req() request: PublicInteractionRequest,
  ) {
    return this.interactionsService.likeContent(parseContentType(targetType), targetId, createPublicActorHash(request));
  }

  @Post('views/:targetType/:targetId')
  @UseGuards(PublicInteractionRateLimitGuard)
  recordView(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Req() request: PublicInteractionRequest,
  ) {
    return this.interactionsService.recordView(parseContentType(targetType), targetId, createPublicActorHash(request));
  }

  @Post('guestbook')
  @UseGuards(PublicInteractionRateLimitGuard)
  createGuestbookEntry(@Body() input: CreateGuestbookEntryInput, @Req() request: PublicInteractionRequest) {
    return this.interactionsService.createGuestbookEntry({
      ...input,
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

function createPublicActorHash(request: PublicInteractionRequest): string {
  const forwardedFor = firstHeaderValue(request.headers?.['x-forwarded-for'])?.split(',')[0]?.trim() ?? '';
  const realIp = firstHeaderValue(request.headers?.['x-real-ip'])?.trim() ?? '';
  const ip = forwardedFor || realIp || request.ip || request.socket?.remoteAddress || 'unknown-ip';
  const userAgent = firstHeaderValue(request.headers?.['user-agent'])?.trim() || 'unknown-agent';
  const secret = process.env.INTERACTION_HASH_SECRET ?? process.env.SESSION_SECRET ?? 'development-interaction-secret';

  return createHash('sha256').update(`${secret}\n${ip}\n${userAgent}`).digest('hex');
}

function createPublicSubmissionMetadata(request: PublicInteractionRequest): { ipHash: string; userAgent: string } {
  return {
    ipHash: createPublicActorHash(request),
    userAgent: normalizeUserAgent(firstHeaderValue(request.headers?.['user-agent'])),
  };
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeUserAgent(value: string | undefined): string {
  return (value?.trim() || 'unknown-agent').slice(0, 500);
}
