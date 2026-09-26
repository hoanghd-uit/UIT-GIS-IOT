import {
  Injectable,
  Logger,
  BadRequestException,
  BadGatewayException,
  ServiceUnavailableException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IotTelemetryService } from '../iot/services/iot-telemetry.service';
import { DashboardIotTelemetryQueryDto } from './dto/dashboard-iot-telemetry-query.dto';
import {
  DashboardDeviceTelemetryResponseDto,
  DashboardTelemetryLatestSampleDto,
} from './dto/dashboard-iot-telemetry-response.dto';
import { SolarTelemetryData, AvcTelemetryData } from '../iot/dto/iot-telemetry.dto';

const MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days max for Dashboard Phase 03

@Injectable()
export class DashboardIotTelemetryService {
  private readonly logger = new Logger(DashboardIotTelemetryService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly telemetryService: IotTelemetryService,
  ) {}

  /**
   * Fetches, validates, and normalizes live telemetry for a single selected device for Dashboard Page 07.
   * Strictly read-only, request-time and in-memory. Zero database writes.
   */
  async getTelemetry(
    buildingId: string,
    deviceId: string,
    query: DashboardIotTelemetryQueryDto,
  ): Promise<DashboardDeviceTelemetryResponseDto> {
    // 1. Source-mode gate: Live telemetry requires DEVICE_SOURCE_MODE=iot
    const mode = this.config.get<string>('fixtures.mode', 'disabled');
    if (mode === 'disabled') {
      throw new ServiceUnavailableException(
        'IoT device integration is disabled (DEVICE_SOURCE_MODE=disabled).',
      );
    }
    if (mode === 'fixture') {
      throw new ServiceUnavailableException(
        'Live IoT telemetry is unavailable in fixture mode (DEVICE_SOURCE_MODE=fixture).',
      );
    }

    // 2. Validate buildingId: currently Building E only
    const normalizedBuilding = (buildingId || '').trim().toUpperCase();
    if (normalizedBuilding !== 'E') {
      throw new BadRequestException(
        `Dashboard IoT telemetry currently supports Building E only (requested: ${buildingId}).`,
      );
    }

    // 3. Validate deviceId: non-empty string
    const trimmedDeviceId = (deviceId || '').trim();
    if (!trimmedDeviceId) {
      throw new BadRequestException('Device ID must be a non-empty string.');
    }

    // 4. Validate query range
    if (!query.start || !query.stop) {
      throw new BadRequestException('Both start and stop ISO-8601 query parameters are required.');
    }

    const startDate = new Date(query.start);
    const endDate = new Date(query.stop);

    if (isNaN(startDate.getTime())) {
      throw new BadRequestException(`Invalid start date format: ${query.start}`);
    }
    if (isNaN(endDate.getTime())) {
      throw new BadRequestException(`Invalid stop date format: ${query.stop}`);
    }

    if (startDate.getTime() >= endDate.getTime()) {
      throw new BadRequestException('Query parameter start must be strictly before stop.');
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    if (durationMs > MAX_DURATION_MS) {
      throw new BadRequestException('Query range duration cannot exceed 7 days.');
    }

    // 5. Validate limit: integer 1..1000
    let limit = 1000;
    if (query.limit !== undefined) {
      const parsed = Number(query.limit);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
        throw new BadRequestException('Query parameter limit must be an integer between 1 and 1000.');
      }
      limit = parsed;
    }

    const startIso = startDate.toISOString();
    const stopIso = endDate.toISOString();

    // 6. Server-authoritative type resolution
    let resolvedType: string;
    try {
      resolvedType = await this.telemetryService.resolveDeviceType(trimmedDeviceId);
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw this.sanitizeError(err);
      }
      throw new BadGatewayException('Failed to resolve device metadata from upstream IoT service.');
    }

    if (resolvedType !== 'solar' && resolvedType !== 'avc') {
      throw new BadRequestException(
        `Device '${trimmedDeviceId}' has type '${resolvedType}' which is not supported for Dashboard telemetry (supported: solar, avc).`,
      );
    }

    // 7. Fetch telemetry through shared IotTelemetryService
    let rawResult;
    try {
      rawResult = await this.telemetryService.getDeviceTelemetry(trimmedDeviceId, {
        start: startIso,
        stop: stopIso,
        limit,
      });
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw this.sanitizeError(err);
      }
      this.logger.error(`Error fetching telemetry for ${trimmedDeviceId}: ${(err as Error)?.message}`);
      throw new BadGatewayException('Failed to communicate with upstream IoT service.');
    }

    // 8. Derive latest coherent sample from newest valid reading
    const readings = (rawResult.telemetry as any)?.readings;
    const newestRow = Array.isArray(readings) && readings.length > 0 ? readings[0] : null;

    const latestSample: DashboardTelemetryLatestSampleDto | null = newestRow
      ? {
          observedAt: newestRow.timestamp,
          gatewayId: newestRow.gatewayId ?? null,
          rssiDbm: newestRow.rssi ?? null,
          snrDb: newestRow.snr ?? null,
        }
      : null;

    const availability = rawResult.coverage.validCount > 0 ? 'ready' : 'empty';

    // 9. Build caveats
    const caveats: string[] = [];
    if (rawResult.coverage.isTruncated) {
      caveats.push('Dữ liệu telemetry bị giới hạn hoặc cắt bớt bởi giới hạn truy vấn.');
    }
    if (rawResult.coverage.invalidCount > 0) {
      caveats.push(`${rawResult.coverage.invalidCount} bản ghi telemetry không hợp lệ đã bị bỏ qua.`);
    }
    if (resolvedType === 'solar') {
      caveats.push('Thông số điện áp, nhiệt độ, độ ẩm và mã trạng thái của tấm pin mặt trời đang chờ xác nhận phần cứng.');
    } else if (resolvedType === 'avc') {
      caveats.push('Ý nghĩa lưu lượng tức thời, thể tích tích lũy và các mã cờ của đồng hồ nước đang chờ xác nhận phần cứng.');
      caveats.push('Nhiệt độ đo được (°C) chưa xác định là nhiệt độ môi trường hay nhiệt độ thân đồng hồ.');
    }

    return {
      schemaVersion: 1,
      buildingId: normalizedBuilding,
      deviceId: trimmedDeviceId,
      deviceType: resolvedType as 'solar' | 'avc',
      availability,
      provenance: {
        mode: 'live',
        sourceId: `iot_telemetry_${trimmedDeviceId}`,
        sourceType: 'iot_backend_telemetry',
        observedAt: latestSample?.observedAt,
        windowStart: startIso,
        windowEnd: stopIso,
        fetchedAt: rawResult.fetchedAt,
        caveats,
      },
      queryRange: {
        start: startIso,
        stop: stopIso,
        limit,
      },
      coverage: rawResult.coverage,
      latestSample,
      telemetry: rawResult.telemetry as SolarTelemetryData | AvcTelemetryData,
    };
  }

  /**
   * Sanitizes exceptions to prevent leaking bearer tokens, URLs, or internal paths.
   */
  private sanitizeError(err: HttpException): HttpException {
    const status = err.getStatus();
    const rawRes = err.getResponse();
    let message = typeof rawRes === 'string' ? rawRes : (rawRes as any)?.message || err.message;
    if (Array.isArray(message)) message = message.join('; ');

    if (/token/i.test(message) || /bearer/i.test(message) || /https?:\/\//i.test(message)) {
      if (status === 503) {
        return new ServiceUnavailableException('IoT service credential is not configured on the server.');
      }
      if (status === 502) {
        return new BadGatewayException('Upstream IoT API authentication failed (401 Unauthorized).');
      }
      return new HttpException('Upstream IoT service error.', status);
    }

    if (status === 404) {
      return new NotFoundException('Device not found on the upstream IoT service.');
    }

    return err;
  }
}
