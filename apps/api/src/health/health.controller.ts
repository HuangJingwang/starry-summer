import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok'; service: 'starry-summer-api' } {
    return {
      status: 'ok',
      service: 'starry-summer-api',
    };
  }
}
