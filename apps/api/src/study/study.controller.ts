import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { StudyProblemPatch, StudyReportPeriod, StudySettingsPatch } from '@starry-summer/shared';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { StudyService } from './study.service.js';

@Controller('study')
export class StudyController {
  constructor(@Inject(StudyService) private readonly studyService: StudyService) {}

  @Get()
  getPublicDashboard() {
    return this.studyService.getDashboard();
  }
}

@Controller('admin/study')
@UseGuards(AdminAuthGuard)
export class AdminStudyController {
  constructor(@Inject(StudyService) private readonly studyService: StudyService) {}

  @Get()
  getAdminDashboard() {
    return this.studyService.getDashboard();
  }

  @Patch('settings')
  updateSettings(@Body() input: StudySettingsPatch) {
    return this.studyService.updateSettings(input);
  }

  @Post('sync')
  syncRecentSubmissions() {
    return this.studyService.syncRecentSubmissions();
  }

  @Patch('problems/:slug')
  updateProblem(@Param('slug') slug: string, @Body() input: StudyProblemPatch) {
    return this.studyService.updateProblem(slug, input);
  }

  @Post('problems/:slug/draft')
  createProblemDraft(@Param('slug') slug: string) {
    return this.studyService.createProblemDraft(slug);
  }

  @Post('reports')
  createReportDraft(@Body('period') period: StudyReportPeriod = 'week') {
    return this.studyService.createReportDraft(period === 'month' ? 'month' : 'week');
  }
}
