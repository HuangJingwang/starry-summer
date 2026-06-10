import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { ContentType, ModerationStatus } from '@starry-summer/shared';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { PublicInteractionRateLimitGuard } from '../security/public-interaction-rate-limit.guard.js';
import {
  InteractionsService,
  type CreateCommentInput,
  type CreateGuestbookEntryInput,
} from './interactions.service.js';

@Controller()
export class InteractionsController {
  constructor(@Inject(InteractionsService) private readonly interactionsService: InteractionsService) {}

  @Post('comments')
  @UseGuards(PublicInteractionRateLimitGuard)
  createComment(@Body() input: CreateCommentInput) {
    return this.interactionsService.createComment(input);
  }

  @Get('comments/:targetType/:targetId')
  listApprovedComments(@Param('targetType') targetType: CreateCommentInput['targetType'], @Param('targetId') targetId: string) {
    return this.interactionsService.listApprovedComments(targetType, targetId);
  }

  @Patch('admin/comments/:id/moderate')
  @UseGuards(AdminAuthGuard)
  moderateComment(@Param('id') id: string, @Body('status') status: ModerationStatus) {
    return this.interactionsService.moderateComment(id, status);
  }

  @Get('admin/comments')
  @UseGuards(AdminAuthGuard)
  listAdminComments(@Query('status') status?: ModerationStatus) {
    return this.interactionsService.listAdminComments({ status });
  }

  @Post('likes/:targetType/:targetId')
  @UseGuards(PublicInteractionRateLimitGuard)
  likeContent(@Param('targetType') targetType: ContentType, @Param('targetId') targetId: string) {
    return this.interactionsService.likeContent(targetType, targetId);
  }

  @Post('views/:targetType/:targetId')
  @UseGuards(PublicInteractionRateLimitGuard)
  recordView(@Param('targetType') targetType: ContentType, @Param('targetId') targetId: string) {
    return this.interactionsService.recordView(targetType, targetId);
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
  listAdminGuestbookEntries(@Query('status') status?: ModerationStatus) {
    return this.interactionsService.listAdminGuestbookEntries({ status });
  }

  @Patch('admin/guestbook/:id/moderate')
  @UseGuards(AdminAuthGuard)
  moderateGuestbookEntry(@Param('id') id: string, @Body('status') status: ModerationStatus) {
    return this.interactionsService.moderateGuestbookEntry(id, status);
  }
}
