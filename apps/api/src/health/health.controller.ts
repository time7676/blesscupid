import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('healthz')
  healthz(): { ok: true; service: string; version: string } {
    return {
      ok: true,
      service: 'blesscupid-api',
      version: process.env.npm_package_version ?? '0.0.0',
    };
  }
}
