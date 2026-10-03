import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Header,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
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
import { DashboardIotCatalogueService } from './dashboard-iot-catalogue.service';
import { DashboardIotTelemetryService } from './dashboard-iot-telemetry.service';
import { DashboardIotCatalogueQueryDto } from './dto/dashboard-iot-catalogue-query.dto';
import { DashboardDeviceCatalogueResponseDto } from './dto/dashboard-device-catalogue-response.dto';
import { DashboardIotTelemetryQueryDto } from './dto/dashboard-iot-telemetry-query.dto';
import { DashboardDeviceTelemetryResponseDto } from './dto/dashboard-iot-telemetry-response.dto';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@RequireAbility('read', 'Dashboard')
export class DashboardIotController {
  constructor(
    private readonly catalogueService: DashboardIotCatalogueService,
    private readonly telemetryService: DashboardIotTelemetryService,
  ) {}

  @Get('buildings/:buildingId/iot/devices')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get Dashboard IoT device catalogue (read-only, live provenance)',
    description:
      'Returns a normalized active device catalogue for Dashboard Page 07. Supports full-building catalogue (omitting floorId) and approved floor-scoped queries (floorId=4, 6) as well as exact room-level filter (roomId). Zero database persistence.',
  })
  @ApiParam({ name: 'buildingId', example: 'E', description: 'Building identifier (currently E only)' })
  @ApiQuery({
    name: 'floorId',
    required: false,
    example: '4',
    description: 'Application floor ID (4, 6). When omitted, returns full unfiltered catalogue.',
  })
  @ApiQuery({
    name: 'roomId',
    required: false,
    example: 'E4.08',
    description: 'Exact source room ID filter. When omitted, returns devices across all rooms.',
  })
  @ApiResponse({
    status: 200,
    description: 'Device catalogue returned successfully with live provenance',
    type: DashboardDeviceCatalogueResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid buildingId, unsupported floor, floor G, or malformed/duplicate roomId',
  })
  @ApiResponse({
    status: 502,
    description: 'Upstream IoT service error, timeout, or malformed payload',
  })
  @ApiResponse({
    status: 503,
    description: 'IoT integration disabled, fixture mode, or missing credentials',
  })
  async getCatalogue(
    @Param('buildingId') buildingId: string,
    @Query() query: DashboardIotCatalogueQueryDto,
    @Req() req?: Request,
  ): Promise<DashboardDeviceCatalogueResponseDto> {
    const rawUrl = req?.originalUrl || req?.url || '';
    const roomMatches = rawUrl.match(/(?:[?&])roomId=/g);
    if (roomMatches && roomMatches.length > 1) {
      throw new BadRequestException('Duplicate roomId query parameter is not allowed.');
    }
    return this.catalogueService.getCatalogue(buildingId, query.floorId, query.roomId);
  }

  @Get('buildings/:buildingId/iot/devices/:deviceId/telemetry')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get Dashboard IoT device telemetry (read-only, live provenance)',
    description:
      'Returns normalized telemetry readings and coherent latest sample for a supported device (solar, avc, sb, or smoke). Strictly read-only and in-memory.',
  })
  @ApiParam({ name: 'buildingId', example: 'E', description: 'Building identifier (currently E only)' })
  @ApiParam({ name: 'deviceId', example: '70B3D57ED0073E9D', description: 'Device EUI / ID' })
  @ApiResponse({
    status: 200,
    description: 'Telemetry readings returned successfully with live provenance',
    type: DashboardDeviceTelemetryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid buildingId, deviceId, range duration (>7d), limit (>1000), or unsupported device type',
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
  async getTelemetry(
    @Param('buildingId') buildingId: string,
    @Param('deviceId') deviceId: string,
    @Query() query: DashboardIotTelemetryQueryDto,
  ): Promise<DashboardDeviceTelemetryResponseDto> {
    return this.telemetryService.getTelemetry(buildingId, deviceId, query);
  }
}
