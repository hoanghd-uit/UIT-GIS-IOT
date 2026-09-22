import {
  Injectable,
  Logger,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoTUpstreamDeviceListResponse } from '../dto/iot-devices.dto';

@Injectable()
export class IotClientService {
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
   * Performs read-only GET /api/v1/devices from the upstream IoT backend.
   * Master bearer token is strictly maintained server-side.
   */
  async fetchRawDevices(): Promise<IoTUpstreamDeviceListResponse> {
    const baseUrl = this.getBaseUrl().replace(/\/+$/, '');
    const token = this.getMasterToken();
    const timeoutMs = this.getTimeoutMs();

    if (!token) {
      this.logger.warn('IoT master bearer token is not configured.');
      throw new ServiceUnavailableException(
        'IoT API master token is not configured on the backend server.',
      );
    }

    const endpoint = `${baseUrl}/api/v1/devices`;
    this.logger.log(`Fetching upstream IoT devices from: ${endpoint}`);

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
      this.logger.error(`Network or timeout error when contacting upstream IoT API: ${error.message}`);
      throw new BadGatewayException(
        'Failed to connect to upstream IoT backend: network error or timeout.',
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.logger.error('Upstream IoT API rejected credentials (401 Unauthorized).');
        throw new BadGatewayException(
          'Upstream IoT API authentication failed (401 Unauthorized). Please check master token.',
        );
      }

      this.logger.error(`Upstream IoT API returned HTTP ${response.status} ${response.statusText}`);
      throw new BadGatewayException(
        `Upstream IoT API error: status ${response.status}`,
      );
    }

    try {
      const json = await response.json();
      return json as IoTUpstreamDeviceListResponse;
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Failed to parse JSON from upstream IoT API: ${error.message}`);
      throw new BadGatewayException('Malformed JSON response from upstream IoT API.');
    }
  }
}

