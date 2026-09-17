import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('live')
  @ApiOperation({ summary: 'Process liveness check' })
  @ApiResponse({ status: 200, description: 'Application process is live' })
  getLive() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Application and database readiness check' })
  @ApiResponse({ status: 200, description: 'Application is ready to serve requests' })
  @ApiResponse({ status: 503, description: 'Database or dependencies not ready' })
  async getReady(@Res() res: Response) {
    try {
      // 1. Check DB connectivity
      await this.dataSource.query('SELECT 1');

      // 2. Check if tables exist
      const tableCheck = await this.dataSource.query(`
        SELECT count(*)::int as count FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'device_bindings';
      `);

      const tablesReady = tableCheck[0]?.count > 0;
      if (!tablesReady) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: 'not_ready',
          database: 'connected_but_unmigrated',
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(HttpStatus.OK).json({
        status: 'ready',
        database: 'connected',
        migrations: 'applied',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Database check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

