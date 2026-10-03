import {
  Injectable,
  Logger,
  BadGatewayException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IotDeviceGateway,
  IotDeviceListFilter,
  IoTUpstreamDeviceListResponse,
} from '../dto/iot-devices.dto';
import {
  IoTUpstreamDeviceDetailResponse,
  IoTUpstreamSolarResponse,
  IoTUpstreamAvcResponse,
  IoTUpstreamNfcResponse,
  IoTUpstreamSmartBuildingResponse,
  IoTUpstreamSmokeResponse,
} from '../dto/iot-telemetry.dto';

@Injectable()
export class IotClientService implements IotDeviceGateway {
  private readonly logger = new Logger(IotClientService.name);

  constructor(private readonly config: ConfigService) {}

  private getBaseUrl(): string {
    return this.config.get<string>('iot.baseUrl', 'https://api.ttlab.manhthao.uk');
  }

  private getMasterToken(): string {
    return this.config.get<string>('iot.masterToken', '');
  }

  private getTimeoutMs(): number {
    return this.config.get<number>('iot.timeoutMs', 10000);
  }

  /**
   * Common executor for approved upstream read-only GET requests.
   * Master bearer token is strictly maintained server-side.
   */
  private async executeGet<T>(pathAndQuery: string, notFoundMessage?: string): Promise<T> {
    const baseUrl = this.getBaseUrl().replace(/\/+$/, '');
    const token = this.getMasterToken();
    const timeoutMs = this.getTimeoutMs();

    if (!token) {
      this.logger.warn('IoT master bearer token is not configured.');
      throw new ServiceUnavailableException(
        'IoT API master token is not configured on the backend server.',
      );
    }

    const endpoint = `${baseUrl}${pathAndQuery}`;
    this.logger.log(`Calling upstream IoT API: ${endpoint}`);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'User-Agent': 'GIS-UIT-BuildingE-DigitalTwin/1.0',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Network or timeout error when contacting upstream IoT API (${endpoint}): ${error.message}`);
      throw new BadGatewayException(
        'Failed to connect to upstream IoT backend: network error or timeout.',
      );
    }

    if (!response.ok) {
      if (response.status === 400) {
        this.logger.error(`Upstream IoT API rejected query parameters (400 Bad Request) for ${endpoint}`);
        throw new BadGatewayException(
          'Upstream IoT API reported invalid query parameters (400 Bad Request).',
        );
      }

      if (response.status === 401) {
        this.logger.error('Upstream IoT API rejected credentials (401 Unauthorized).');
        throw new BadGatewayException(
          'Upstream IoT API authentication failed (401 Unauthorized). Please check master token.',
        );
      }

      if (response.status === 404 && notFoundMessage) {
        throw new NotFoundException(notFoundMessage);
      }

      this.logger.error(`Upstream IoT API returned HTTP ${response.status} ${response.statusText} for ${endpoint}`);
      throw new BadGatewayException(
        `Upstream IoT API error: status ${response.status}`,
      );
    }

    try {
      const json = await response.json();
      return json as T;
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Failed to parse JSON from upstream IoT API: ${error.message}`);
      throw new BadGatewayException('Malformed JSON response from upstream IoT API.');
    }
  }

  /**
   * Performs read-only GET /api/v1/devices from the upstream IoT backend.
   * Optionally accepts floorLevel integer and roomId string filters.
   */
  async fetchRawDevices(filter?: IotDeviceListFilter): Promise<IoTUpstreamDeviceListResponse> {
    let path = '/api/v1/devices';
    const queryParts: string[] = [];

    if (filter) {
      if (filter.floorLevel !== undefined) {
        if (typeof filter.floorLevel !== 'number' || !Number.isInteger(filter.floorLevel)) {
          throw new BadRequestException(
            `Invalid floorLevel filter: must be an integer (received: ${filter.floorLevel})`,
          );
        }
        queryParts.push(`floor_level=${filter.floorLevel}`);
      }

      if (filter.roomId !== undefined) {
        if (typeof filter.roomId !== 'string' || filter.roomId.trim().length === 0) {
          throw new BadRequestException(
            `Invalid roomId filter: must be a non-empty string`,
          );
        }
        const trimmedRoom = filter.roomId.trim();
        queryParts.push(`room_id=${encodeURIComponent(trimmedRoom)}`);
      }
    }

    if (queryParts.length > 0) {
      path = `/api/v1/devices?${queryParts.join('&')}`;
    }

    return this.executeGet<IoTUpstreamDeviceListResponse>(path);
  }

  /**
   * Gateway-compatible alias for fetchRawDevices.
   */
  async listDevices(filter?: IotDeviceListFilter): Promise<IoTUpstreamDeviceListResponse> {
    return this.fetchRawDevices(filter);
  }

  /**
   * Performs read-only GET /api/v1/devices/{dev_eui} to resolve single device metadata.
   */
  async fetchDeviceDetail(devEui: string): Promise<IoTUpstreamDeviceDetailResponse> {
    const encoded = encodeURIComponent(devEui);
    return this.executeGet<IoTUpstreamDeviceDetailResponse>(
      `/api/v1/devices/${encoded}`,
      `Device ${devEui} not found in upstream IoT registry.`,
    );
  }

  /**
   * Gateway-compatible alias for fetchDeviceDetail.
   */
  async getDevice(devEui: string): Promise<IoTUpstreamDeviceDetailResponse> {
    return this.fetchDeviceDetail(devEui);
  }

  /**
   * Performs read-only GET /api/v1/solar with dev_eui, start, stop, and limit.
   */
  async fetchSolarReadings(
    devEui: string,
    start: string,
    stop: string,
    limit = 1000,
  ): Promise<IoTUpstreamSolarResponse> {
    const params = new URLSearchParams({
      dev_eui: devEui,
      start,
      stop,
      limit: String(limit),
    });
    return this.executeGet<IoTUpstreamSolarResponse>(`/api/v1/solar?${params.toString()}`);
  }

  /**
   * Performs read-only GET /api/v1/avc (water meter) with dev_eui, start, stop, and limit.
   */
  async fetchAvcReadings(
    devEui: string,
    start: string,
    stop: string,
    limit = 1000,
  ): Promise<IoTUpstreamAvcResponse> {
    const params = new URLSearchParams({
      dev_eui: devEui,
      start,
      stop,
      limit: String(limit),
    });
    return this.executeGet<IoTUpstreamAvcResponse>(`/api/v1/avc?${params.toString()}`);
  }

  /**
   * Performs read-only GET /api/v1/nfc (door scans) with dev_eui, start, stop, and limit.
   */
  async fetchNfcEvents(
    devEui: string,
    start: string,
    stop: string,
    limit = 1000,
  ): Promise<IoTUpstreamNfcResponse> {
    const params = new URLSearchParams({
      dev_eui: devEui,
      start,
      stop,
      limit: String(limit),
    });
    return this.executeGet<IoTUpstreamNfcResponse>(`/api/v1/nfc?${params.toString()}`);
  }

  /**
   * Performs read-only GET /api/v1/sb (Smart Building sensors) with dev_eui, start, stop, and limit.
   */
  async fetchSmartBuildingReadings(
    devEui: string,
    start: string,
    stop: string,
    limit = 1000,
  ): Promise<IoTUpstreamSmartBuildingResponse> {
    if (!devEui || typeof devEui !== 'string' || devEui.trim().length === 0) {
      throw new BadRequestException('Invalid devEui: must be a non-empty string');
    }
    if (!start || !stop || typeof start !== 'string' || typeof stop !== 'string') {
      throw new BadRequestException('Both start and stop are required strings');
    }
    const startDate = new Date(start);
    const endDate = new Date(stop);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid start or stop date format');
    }
    if (startDate.getTime() >= endDate.getTime()) {
      throw new BadRequestException('Query parameter start must be strictly before stop');
    }
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 10000) {
      throw new BadRequestException('Limit must be an integer between 1 and 10000');
    }

    const params = new URLSearchParams({
      dev_eui: devEui.trim(),
      start,
      stop,
      limit: String(limit),
    });
    return this.executeGet<IoTUpstreamSmartBuildingResponse>(`/api/v1/sb?${params.toString()}`);
  }

  /**
   * Performs read-only GET /api/v1/smoke with dev_eui, start, stop, and limit.
   */
  async fetchSmokeReadings(
    devEui: string,
    start: string,
    stop: string,
    limit = 1000,
  ): Promise<IoTUpstreamSmokeResponse> {
    if (!devEui || typeof devEui !== 'string' || devEui.trim().length === 0) {
      throw new BadRequestException('Invalid devEui: must be a non-empty string');
    }
    if (!start || !stop || typeof start !== 'string' || typeof stop !== 'string') {
      throw new BadRequestException('Both start and stop are required strings');
    }
    const startDate = new Date(start);
    const endDate = new Date(stop);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid start or stop date format');
    }
    if (startDate.getTime() >= endDate.getTime()) {
      throw new BadRequestException('Query parameter start must be strictly before stop');
    }
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 10000) {
      throw new BadRequestException('Limit must be an integer between 1 and 10000');
    }

    const params = new URLSearchParams({
      dev_eui: devEui.trim(),
      start,
      stop,
      limit: String(limit),
    });
    return this.executeGet<IoTUpstreamSmokeResponse>(`/api/v1/smoke?${params.toString()}`);
  }
}


