import { Injectable, Logger } from '@nestjs/common';
import { IotClientService } from './services/iot-client.service';
import { IotMapperService } from './services/iot-mapper.service';
import { IotTelemetryService } from './services/iot-telemetry.service';
import { FloorDeviceResponse, IoTUpstreamDeviceListResponse } from './dto/iot-devices.dto';
import { DeviceTelemetryQueryDto, DeviceTelemetryResponseDto } from './dto/iot-telemetry.dto';

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  constructor(
    private readonly client: IotClientService,
    private readonly mapper: IotMapperService,
    private readonly telemetryService: IotTelemetryService,
  ) {}

  /**
   * Fetches fresh device list from upstream IoT backend filtered by requested floor and projects onto the view.
   * Under TEST_CURRENT_FLOOR_4_6_V1: Upstream devices are currently set with install_floor_level == 0 during development.
   * If floor-specific query returns empty, falls back to floor_level=0 and treats the response as the dataset for floor 4 and 6.
   * Zero database persistence: data is strictly in-memory for the current view.
   */
  async getFloorDevices(buildingId: string, floorId: string): Promise<FloorDeviceResponse> {
    const floorMode = this.mapper.getFloorMappingMode();
    const floorLevel = this.mapper.resolveUpstreamFloorLevel(buildingId, floorId);
    this.logger.log(`Fetching IoT devices for ${buildingId}/${floorId} (upstream floor_level=${floorLevel})...`);
    
    let raw = await this.client.fetchRawDevices({ floorLevel });

    // Under TEST_CURRENT_FLOOR_4_6_V1:
    // The upstream devices API currently has install_floor_level == 0 during development.
    // If the floor-specific query returns empty, fall back to querying development devices (floor_level=0)
    // and treat that response as the active device dataset for floor level 4 and 6.
    if (
      (!raw || !Array.isArray(raw.data) || raw.data.length === 0) &&
      floorMode === 'TEST_CURRENT_FLOOR_4_6_V1'
    ) {
      this.logger.log(
        `TEST scenario (${floorMode}): upstream returned 0 devices for floor_level=${floorLevel}. ` +
        `Falling back to development devices (install_floor_level == 0) and treating as response for floor ${floorId}...`,
      );
      raw = await this.client.fetchRawDevices({ floorLevel: 0 });
    }
    
    // Warm up RAM device type cache for subsequent telemetry clicks
    if (raw && Array.isArray(raw.data)) {
      for (const dev of raw.data) {
        if (dev.device_id && dev.device_type) {
          this.telemetryService.registerDeviceType(dev.device_id, dev.device_type);
        }
      }
    }

    return this.mapper.mapResponse(raw, buildingId, floorId);
  }

  /**
   * Performs read-only fetch of active device catalogue without floor filter.
   */
  async getFullCatalogue(): Promise<IoTUpstreamDeviceListResponse> {
    this.logger.log('Fetching full active device catalogue from upstream (no floor filter)...');
    return this.client.fetchRawDevices();
  }

  /**
   * Fetches telemetry readings/events for a selected device within a 72-hour window.
   * Zero database persistence: strictly in-memory processing.
   */
  async getDeviceTelemetry(
    deviceId: string,
    query: DeviceTelemetryQueryDto,
  ): Promise<DeviceTelemetryResponseDto> {
    return this.telemetryService.getDeviceTelemetry(deviceId, query);
  }

  /**
   * Helper for testing/fixture mapping without calling live upstream.
   */
  mapFixtureDevices(
    rawFixture: IoTUpstreamDeviceListResponse,
    buildingId: string,
    floorId: string,
  ): FloorDeviceResponse {
    return this.mapper.mapResponse(rawFixture, buildingId, floorId);
  }
}


