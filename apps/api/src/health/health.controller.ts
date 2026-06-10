import { Controller, Get, Inject } from '@nestjs/common';

import { HealthService, type HealthReport } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthReport> {
    return this.healthService.check();
  }
}
