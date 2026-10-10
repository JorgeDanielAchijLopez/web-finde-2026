import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { AppService } from './app.service.js';
import { HealthDto } from './health.dto.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ZodResponse({
    status: 200,
    description: 'API metadata and available resources',
    type: HealthDto,
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
