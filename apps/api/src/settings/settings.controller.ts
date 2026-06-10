import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { SettingsService } from './settings.service.js';
import type { UpdateSiteSettingsInput } from './settings.repository.js';

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings')
  getPublicSettings() {
    return this.settingsService.getSettings();
  }

  @Get('admin/settings')
  @UseGuards(AdminAuthGuard)
  getAdminSettings() {
    return this.settingsService.getSettings();
  }

  @Patch('admin/settings')
  @UseGuards(AdminAuthGuard)
  updateAdminSettings(@Body() input: UpdateSiteSettingsInput) {
    return this.settingsService.updateSettings(input);
  }
}
