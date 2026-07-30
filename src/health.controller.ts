import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from './auth/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verifica se a API está disponível' })
  public check(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'market-api',
      timestamp: new Date().toISOString(),
    };
  }
}
