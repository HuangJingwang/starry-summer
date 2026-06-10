import { BadRequestException, Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { ContentType, ModerationStatus } from '@starry-summer/shared';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { PublicInteractionRateLimitGuard } from '../security/public-interaction-rate-limit.guard.js';
import {
  InteractionsService,
  type CreateCommentInput,
  type CreateGuestbookEntryInput,
} from './interactions.service.js';

type CreateCommentRequest = Omit<CreateCommentInput, 'targetType'> & { targetType: string };

@Controller()
export class InteractionsController {
  constructor(@Inject(InteractionsService) private readonly interactionsService: InteractionsService) {}

  @Post('comments')
  @UseGuards(PublicInteractionRateLimitGuard)
  createComment(@Body() input: CreateCommentRequest) {
    return this.interactionsService.createComment({
      ...input,
      targetType: parseCommentTargetType(input.targetType),
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

  @Get('admin/comments')
  @UseGuards(AdminAuthGuard)
  listAdminComments(@Query('status') status?: string) {
    return this.interactionsService.listAdminComments({ status: parseOptionalModerationStatus(status) });
  }

  @Post('likes/:targetType/:targetId')
  @UseGuards(PublicInteractionRateLimitGuard)
  likeContent(@Param('targetType') targetType: string, @Param('targetId') targetId: string) {
    return this.interactionsService.likeContent(parseContentType(targetType), targetId);
  }

  @Post('views/:targetType/:targetId')
  @UseGuards(PublicInteractionRateLimitGuard)
  recordView(@Param('targetType') targetType: string, @Param('targetId') targetId: string) {
    return this.interactionsService.recordView(parseContentType(targetType), targetId);
  }

  @Post('guestbook')
  @UseGuards(PublicInteractionRateLimitGuard)
  createGuestbookEntry(@Body() input: CreateGuestbookEntryInput) {
    return this.interactionsService.createGuestbookEntry(input);
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
