import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Status check' })
  getStatus() {
    return { status: 'ok' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Healthcheck' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
