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
import { DashboardIotCatalogueQueryDto } from './dto/dashboard-iot-catalogue-query.dto';
import { DashboardDeviceCatalogueResponseDto } from './dto/dashboard-device-catalogue-response.dto';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
export class DashboardIotController {
  constructor(private readonly catalogueService: DashboardIotCatalogueService) {}

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
}
