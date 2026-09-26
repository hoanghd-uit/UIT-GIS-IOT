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
import { DashboardIotCatalogueService } from './dashboard-iot-catalogue.service';
import { DashboardIotTelemetryService } from './dashboard-iot-telemetry.service';
import { DashboardIotCatalogueQueryDto } from './dto/dashboard-iot-catalogue-query.dto';
import { DashboardDeviceCatalogueResponseDto } from './dto/dashboard-device-catalogue-response.dto';
import { DashboardIotTelemetryQueryDto } from './dto/dashboard-iot-telemetry-query.dto';
import { DashboardDeviceTelemetryResponseDto } from './dto/dashboard-iot-telemetry-response.dto';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
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
      'Returns a normalized active device catalogue for Dashboard Page 07. Supports full-building catalogue (omitting floorId) and approved floor-scoped queries (floorId=4, 6). Zero database persistence.',
  })
  @ApiParam({ name: 'buildingId', example: 'E', description: 'Building identifier (currently E only)' })
  @ApiQuery({
    name: 'floorId',
    required: false,
    example: '4',
    description: 'Application floor ID (4, 6). When omitted, returns full unfiltered catalogue.',
  })
  @ApiResponse({
    status: 200,
    description: 'Device catalogue returned successfully with live provenance',
    type: DashboardDeviceCatalogueResponseDto,
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
  async getCatalogue(
    @Param('buildingId') buildingId: string,
    @Query() query: DashboardIotCatalogueQueryDto,
  ): Promise<DashboardDeviceCatalogueResponseDto> {
    return this.catalogueService.getCatalogue(buildingId, query.floorId);
  }

  @Get('buildings/:buildingId/iot/devices/:deviceId/telemetry')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get Dashboard IoT device telemetry (read-only, live provenance)',
    description:
      'Returns normalized telemetry readings and coherent latest sample for a supported device (solar or avc). Strictly read-only and in-memory.',
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
