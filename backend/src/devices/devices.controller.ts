import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Headers,
  Header,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { UpdateDisplayPositionDto } from './dto/update-display-position.dto';
import { FloorDevicesResponseDto, DeviceDto } from './dto/device-response.dto';
import { FloorDeviceResponse } from '../iot/dto/iot-devices.dto';
import { DeviceTelemetryResponseDto } from '../iot/dto/iot-telemetry.dto';

@ApiTags('Devices')
@Controller('api/v1')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('buildings/:buildingId/floors/:floorId/devices')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get catalogue and effective marker positions for a floor' })
  @ApiParam({ name: 'buildingId', example: 'E' })
  @ApiParam({ name: 'floorId', example: '4' })
  @ApiResponse({ status: 200, description: 'Devices catalogue returned successfully' })
  @ApiResponse({ status: 404, description: 'Floor not found' })
  async getFloorDevices(
    @Param('buildingId') buildingId: string,
    @Param('floorId') floorId: string,
  ): Promise<FloorDevicesResponseDto | FloorDeviceResponse> {
    return this.devicesService.getFloorDevices(buildingId, floorId);
  }

  @Get('iot/buildings/:buildingId/floors/:floorId/devices')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get IoT devices list directly from upstream API (Phase 06, no persistence)' })
  @ApiParam({ name: 'buildingId', example: 'E' })
  @ApiParam({ name: 'floorId', example: '4' })
  @ApiResponse({ status: 200, description: 'IoT floor devices returned successfully' })
  async getIotFloorDevices(
    @Param('buildingId') buildingId: string,
    @Param('floorId') floorId: string,
  ): Promise<FloorDeviceResponse> {
    return this.devicesService.getIotFloorDevices(buildingId, floorId);
  }

  @Get('iot/devices/:deviceId/telemetry')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Get IoT device telemetry readings/events within rolling 72-hour window (Phase 07, zero persistence)' })
  @ApiParam({ name: 'deviceId', example: 'd0ba7a2a-f40d-4b39-885b-6dc79815a104' })
  @ApiResponse({ status: 200, description: 'Telemetry readings returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters (range, limit)' })
  @ApiResponse({ status: 404, description: 'Device not found in registry' })
  async getDeviceTelemetry(
    @Param('deviceId') deviceId: string,
    @Query('start') start: string,
    @Query('stop') stop: string,
    @Query('limit') limit?: string,
  ): Promise<DeviceTelemetryResponseDto> {
    const parsedLimit = limit !== undefined ? parseInt(limit, 10) : undefined;
    return this.devicesService.getDeviceTelemetry(deviceId, {
      start,
      stop,
      limit: parsedLimit,
    });
  }


  @Get('devices/:deviceId')
  @ApiOperation({ summary: 'Get device metadata and placement detail' })
  @ApiParam({ name: 'deviceId', example: 'd0ba7a2a-f40d-4b39-885b-6dc79815a104' })
  @ApiResponse({ status: 200, description: 'Device details returned successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDevice(@Param('deviceId') deviceId: string): Promise<DeviceDto> {
    return this.devicesService.getDevice(deviceId);
  }

  @Put('devices/:deviceId/display-position')
  @ApiOperation({ summary: 'Create or update display position override' })
  @ApiParam({ name: 'deviceId' })
  @ApiHeader({
    name: 'X-Expected-Placement-Revision',
    description: 'Current known revision number to prevent stale writes',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Position override saved successfully' })
  @ApiResponse({ status: 409, description: 'Revision conflict or floor context changed' })
  async updateDisplayPosition(
    @Param('deviceId') deviceId: string,
    @Body() dto: UpdateDisplayPositionDto,
    @Headers('x-expected-placement-revision') rawRevision: string,
  ): Promise<DeviceDto> {
    if (!rawRevision) {
      throw new BadRequestException('Header X-Expected-Placement-Revision is required');
    }
    const expectedRevision = parseInt(rawRevision, 10);
    if (isNaN(expectedRevision) || expectedRevision < 1) {
      throw new BadRequestException('Header X-Expected-Placement-Revision must be a positive integer');
    }

    return this.devicesService.updateDisplayPosition(deviceId, dto, expectedRevision);
  }

  @Delete('devices/:deviceId/display-position')
  @ApiOperation({ summary: 'Reset display position override back to original' })
  @ApiParam({ name: 'deviceId' })
  @ApiHeader({
    name: 'X-Expected-Placement-Revision',
    description: 'Current known revision number to prevent stale writes',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Position override reset successfully' })
  @ApiResponse({ status: 409, description: 'Revision conflict' })
  async resetDisplayPosition(
    @Param('deviceId') deviceId: string,
    @Headers('x-expected-placement-revision') rawRevision: string,
    @Query('buildingId') buildingId?: string,
    @Query('floorId') floorId?: string,
  ): Promise<DeviceDto> {
    if (!rawRevision) {
      throw new BadRequestException('Header X-Expected-Placement-Revision is required');
    }
    const expectedRevision = parseInt(rawRevision, 10);
    if (isNaN(expectedRevision) || expectedRevision < 1) {
      throw new BadRequestException('Header X-Expected-Placement-Revision must be a positive integer');
    }

    return this.devicesService.resetDisplayPosition(deviceId, expectedRevision, {
      buildingId,
      floorId,
    });
  }
}

