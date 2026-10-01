import {
  Controller,
  Get,
  Param,
  Query,
  Header,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { PoliciesGuard } from '../authorization/policies.guard';
import { RequireAbility } from '../authorization/require-ability.decorator';
import { DashboardEnvironmentService } from './dashboard-environment.service';
import { DashboardIotCatalogueQueryDto } from './dto/dashboard-iot-catalogue-query.dto';
import { DashboardEnvironmentSourceListResponseDto } from './dto/dashboard-environment-source-list-response.dto';
import { DashboardEnvironmentSummaryQueryDto } from './dto/dashboard-environment-summary-query.dto';
import { DashboardEnvironmentSummaryResponseDto } from './dto/dashboard-environment-summary-response.dto';
import { DashboardEnvironmentReadingsQueryDto } from './dto/dashboard-environment-readings-query.dto';
import { DashboardEnvironmentReadingsResponseDto } from './dto/dashboard-environment-readings-response.dto';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@RequireAbility('read', 'Dashboard')
export class DashboardEnvironmentController {
  constructor(private readonly environmentService: DashboardEnvironmentService) {}

  @Get('buildings/:buildingId/environment/sources')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get Dashboard Solar environment sources list (read-only, live provenance)',
    description:
      'Returns a list of registered Solar environment candidate sources for Building E. Reuses existing catalogue service and floor mapping. Strictly read-only and in-memory.',
  })
  @ApiParam({ name: 'buildingId', example: 'E', description: 'Building identifier (currently E only)' })
  @ApiQuery({
    name: 'floorId',
    required: false,
    example: '4',
    description: 'Application floor ID (4, 6). When omitted, returns full unfiltered catalogue of Solar sources.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solar environment candidate sources list returned successfully with live provenance',
    type: DashboardEnvironmentSourceListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid buildingId, unsupported floor, or floor G',
  })
  @ApiResponse({
    status: 502,
    description: 'Upstream IoT service error, timeout, or malformed payload',
  })
  @ApiResponse({
    status: 503,
    description: 'IoT integration disabled, fixture mode, or missing credentials',
  })
  async getSources(
    @Param('buildingId') buildingId: string,
    @Query() query: DashboardIotCatalogueQueryDto,
  ): Promise<DashboardEnvironmentSourceListResponseDto> {
    return this.environmentService.getSources(buildingId, query.floorId);
  }

  @Get('buildings/:buildingId/environment/summary')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get Dashboard bounded in-memory latest summary for Solar environment sources',
    description:
      'Calculates request-scoped population summary (mean, min, max) of latest valid raw samples across candidate Solar sources within a requested window (max 24h). Max 20 sources, concurrency 2. Strictly in-memory, zero database writes.',
  })
  @ApiParam({ name: 'buildingId', example: 'E', description: 'Building identifier (currently E only)' })
  @ApiResponse({
    status: 200,
    description: 'Environment summary returned successfully with derived provenance',
    type: DashboardEnvironmentSummaryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid buildingId, missing/invalid start/stop dates, or range duration > 24 hours',
  })
  @ApiResponse({
    status: 502,
    description: 'Upstream IoT service error, timeout, or malformed payload',
  })
  @ApiResponse({
    status: 503,
    description: 'IoT integration disabled, fixture mode, or missing credentials',
  })
  async getSummary(
    @Param('buildingId') buildingId: string,
    @Query() query: DashboardEnvironmentSummaryQueryDto,
  ): Promise<DashboardEnvironmentSummaryResponseDto> {
    return this.environmentService.getSummary(buildingId, query);
  }

  @Get('buildings/:buildingId/environment/sources/:deviceId/readings')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get Dashboard selected Solar source raw environment readings (read-only, live provenance)',
    description:
      'Returns normalized readings, latest sample, coverage, and caveats for a single selected Solar source. Enforces server-authoritative solar type. Range duration cap 7 days, limit cap 1000.',
  })
  @ApiParam({ name: 'buildingId', example: 'E', description: 'Building identifier (currently E only)' })
  @ApiParam({ name: 'deviceId', example: '8cf95720000a0123', description: 'Device EUI / ID of Solar source' })
  @ApiResponse({
    status: 200,
    description: 'Solar source environment readings returned successfully with live provenance',
    type: DashboardEnvironmentReadingsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid buildingId, deviceId, range duration (>7d), limit (>1000), or device is not a Solar device',
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found',
  })
  @ApiResponse({
    status: 502,
    description: 'Upstream IoT service error, timeout, or malformed payload',
  })
  @ApiResponse({
    status: 503,
    description: 'IoT integration disabled, fixture mode, or missing credentials',
  })
  async getReadings(
    @Param('buildingId') buildingId: string,
    @Param('deviceId') deviceId: string,
    @Query() query: DashboardEnvironmentReadingsQueryDto,
  ): Promise<DashboardEnvironmentReadingsResponseDto> {
    return this.environmentService.getReadings(buildingId, deviceId, query);
  }
}
