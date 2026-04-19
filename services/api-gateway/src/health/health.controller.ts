import { Controller, Get } from '@nestjs/common';
import { buildHealthResponse } from '@findnmeet/utils';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return buildHealthResponse('api-gateway');
  }
}
