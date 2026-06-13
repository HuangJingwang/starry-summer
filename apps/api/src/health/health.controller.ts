import { Controller, Get, Inject, Res } from '@nestjs/common';

import { HealthService, type HealthReport } from './health.service.js';

interface HttpStatusResponse {
  status: (statusCode: number) => unknown;
}

@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  async check(@Res({ passthrough: true }) response: HttpStatusResponse): Promise<HealthReport> {
    const report = await this.healthService.check();

    response.status(report.status === 'ok' ? 200 : 503);

    return report;
  }
}
