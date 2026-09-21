import { Injectable, Logger } from '@nestjs/common';
import { IotClientService } from './services/iot-client.service';
import { IotMapperService } from './services/iot-mapper.service';
import { FloorDeviceResponse, IoTUpstreamDeviceListResponse } from './dto/iot-devices.dto';

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  constructor(
    private readonly client: IotClientService,
    private readonly mapper: IotMapperService,
  ) {}

  /**
   * Fetches fresh device list from upstream IoT backend and projects onto the requested floor.
   * Zero database persistence: data is strictly in-memory for the current view.
   */
  async getFloorDevices(buildingId: string, floorId: string): Promise<FloorDeviceResponse> {
    this.logger.log(`Fetching IoT devices for ${buildingId}/${floorId} from upstream...`);
    const raw = await this.client.fetchRawDevices();
    return this.mapper.mapResponse(raw, buildingId, floorId);
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

