import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { ContentType, ModerationStatus } from '@starry-summer/shared';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import {
  InteractionsService,
  type CreateCommentInput,
  type CreateGuestbookEntryInput,
} from './interactions.service.js';

@Controller()
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('comments')
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

  @Post('likes/:targetType/:targetId')
  likeContent(@Param('targetType') targetType: ContentType, @Param('targetId') targetId: string) {
    return this.interactionsService.likeContent(targetType, targetId);
  }

  @Post('guestbook')
  createGuestbookEntry(@Body() input: CreateGuestbookEntryInput) {
    return this.interactionsService.createGuestbookEntry(input);
  }

  @Get('guestbook')
  listApprovedGuestbookEntries() {
    return this.interactionsService.listApprovedGuestbookEntries();
  }
}
