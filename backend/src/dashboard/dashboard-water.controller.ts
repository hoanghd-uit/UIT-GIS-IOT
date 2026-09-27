import {
  Controller,
  Get,
  Param,
  Query,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { DashboardWaterService } from './dashboard-water.service';
import { DashboardIotCatalogueQueryDto } from './dto/dashboard-iot-catalogue-query.dto';
import { DashboardWaterMeterListResponseDto } from './dto/dashboard-water-meter-list-response.dto';
import { DashboardWaterReadingsQueryDto } from './dto/dashboard-water-readings-query.dto';
import { DashboardWaterReadingsResponseDto } from './dto/dashboard-water-readings-response.dto';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
export class DashboardWaterController {
  constructor(private readonly waterService: DashboardWaterService) {}

  @Get('buildings/:buildingId/water/meters')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get Dashboard AVC water meter list (read-only, live provenance)',
    description:
      'Returns a list of registered AVC water meters for Building E. Reuses existing catalogue service and floor mapping. Strictly read-only and in-memory.',
  })
  @ApiParam({ name: 'buildingId', example: 'E', description: 'Building identifier (currently E only)' })
  @ApiQuery({
    name: 'floorId',
    required: false,
    example: '4',
    description: 'Application floor ID (4, 6). When omitted, returns full unfiltered catalogue of AVC meters.',
  })
  @ApiResponse({
    status: 200,
    description: 'AVC water meter list returned successfully with live provenance',
    type: DashboardWaterMeterListResponseDto,
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
  async getMeters(
    @Param('buildingId') buildingId: string,
    @Query() query: DashboardIotCatalogueQueryDto,
  ): Promise<DashboardWaterMeterListResponseDto> {
    return this.waterService.getMeters(buildingId, query.floorId);
  }

  @Get('buildings/:buildingId/water/meters/:deviceId/readings')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get Dashboard selected AVC water meter readings (read-only, live provenance)',
    description:
      'Returns normalized readings, latest sample, coverage, and raw flag disclosures for a single selected AVC water meter. Enforces server-authoritative AVC type. Range duration cap 7 days, limit cap 1000.',
  })
  @ApiParam({ name: 'buildingId', example: 'E', description: 'Building identifier (currently E only)' })
  @ApiParam({ name: 'deviceId', example: '8cf9572000149bd3', description: 'Device EUI / ID of AVC water meter' })
  @ApiResponse({
    status: 200,
    description: 'Water meter readings returned successfully with live provenance',
    type: DashboardWaterReadingsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid buildingId, deviceId, range duration (>7d), limit (>1000), or device is not an AVC water meter',
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
    @Query() query: DashboardWaterReadingsQueryDto,
  ): Promise<DashboardWaterReadingsResponseDto> {
    return this.waterService.getReadings(buildingId, deviceId, query);
  }
}
