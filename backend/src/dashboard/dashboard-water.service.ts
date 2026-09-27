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
import { DashboardIotCatalogueService } from './dashboard-iot-catalogue.service';
import { IotTelemetryService } from '../iot/services/iot-telemetry.service';
import {
  DashboardWaterMeterListResponseDto,
  DashboardWaterMeterListItemDto,
} from './dto/dashboard-water-meter-list-response.dto';
import { DashboardWaterReadingsQueryDto } from './dto/dashboard-water-readings-query.dto';
import {
  DashboardWaterReadingsResponseDto,
  DashboardWaterLatestSampleDto,
  DashboardWaterReadingItemDto,
} from './dto/dashboard-water-readings-response.dto';
import { AvcTelemetryData, NormalizedAvcReading } from '../iot/dto/iot-telemetry.dto';

const MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days max duration for Dashboard Phase 04

@Injectable()
export class DashboardWaterService {
  private readonly logger = new Logger(DashboardWaterService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly catalogueService: DashboardIotCatalogueService,
    private readonly telemetryService: IotTelemetryService,
  ) {}

  /**
   * Returns list of authoritative AVC water meters for Building E.
   * Strictly read-only, request-time and in-memory. Zero database writes.
   */
  async getMeters(
    buildingId: string,
    floorId?: string,
  ): Promise<DashboardWaterMeterListResponseDto> {
    const normalizedBuilding = (buildingId || '').trim().toUpperCase();
    if (normalizedBuilding !== 'E') {
      throw new BadRequestException(
        `Dashboard Water meters currently supports Building E only (requested: ${buildingId}).`,
      );
    }

    // Reuse existing catalogue retrieval and validation
    const catalogue = await this.catalogueService.getCatalogue(normalizedBuilding, floorId);

    // Filter strictly for authoritative AVC water meter devices
    const avcDevices = catalogue.devices.filter(
      (device) => device.sourceDeviceType === 'avc',
    );

    const meters: DashboardWaterMeterListItemDto[] = avcDevices.map((d) => ({
      deviceId: d.externalDeviceId,
      sourceDeviceType: 'avc',
      catalogueActive: d.active,
      sourceCreatedAt: d.sourceCreatedAt,
      sourceUpdatedAt: d.sourceUpdatedAt,
      sourceLocation: {
        x: d.sourceLocation.x,
        y: d.sourceLocation.y,
        z: d.sourceLocation.z,
        floorLevel: d.sourceLocation.floorLevel,
      },
      displayFloorId: d.displayFloorId,
      floorAssignment: d.floorAssignment,
    }));

    const acceptedCount = meters.length;
    const availability = acceptedCount > 0 ? 'ready' : 'empty';

    return {
      schemaVersion: 1,
      buildingId: normalizedBuilding,
      requestedFloorId: catalogue.requestedFloorId,
      availability,
      provenance: {
        mode: 'live',
        sourceId: 'dashboard-water-meters',
        sourceType: 'iot_backend_catalogue',
        fetchedAt: catalogue.provenance.fetchedAt,
        ...(catalogue.provenance.caveats ? { caveats: catalogue.provenance.caveats } : {}),
      },
      summary: {
        receivedCount: avcDevices.length,
        acceptedCount,
        skippedCount: 0,
        duplicateCount: 0,
        truncated: catalogue.summary.truncated,
      },
      meters,
    };
  }

  /**
   * Fetches, validates, and normalizes live readings for a single selected AVC water meter.
   * Strictly read-only, request-time and in-memory. Zero database writes.
   */
  async getReadings(
    buildingId: string,
    meterId: string,
    query: DashboardWaterReadingsQueryDto,
  ): Promise<DashboardWaterReadingsResponseDto> {
    // 1. Source-mode gate: Live telemetry requires DEVICE_SOURCE_MODE=iot
    const mode = this.config.get<string>('fixtures.mode', 'disabled');
    if (mode === 'disabled') {
      throw new ServiceUnavailableException(
        'IoT device integration is disabled (DEVICE_SOURCE_MODE=disabled).',
      );
    }
    if (mode === 'fixture') {
      throw new ServiceUnavailableException(
        'Live IoT water telemetry is unavailable in fixture mode (DEVICE_SOURCE_MODE=fixture).',
      );
    }

    // 2. Validate buildingId: currently Building E only
    const normalizedBuilding = (buildingId || '').trim().toUpperCase();
    if (normalizedBuilding !== 'E') {
      throw new BadRequestException(
        `Dashboard Water readings currently supports Building E only (requested: ${buildingId}).`,
      );
    }

    // 3. Validate meterId: non-empty string
    const trimmedMeterId = (meterId || '').trim();
    if (!trimmedMeterId) {
      throw new BadRequestException('Meter ID must be a non-empty string.');
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

    // 6. Server-authoritative type resolution: must strictly be 'avc'
    let resolvedType: string;
    try {
      resolvedType = await this.telemetryService.resolveDeviceType(trimmedMeterId);
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw this.sanitizeError(err);
      }
      throw new BadGatewayException('Failed to resolve device metadata from upstream IoT service.');
    }

    if (resolvedType !== 'avc') {
      throw new BadRequestException(
        `Device '${trimmedMeterId}' has type '${resolvedType}', which is not an AVC water meter (supported: avc).`,
      );
    }

    // 7. Fetch telemetry through shared IotTelemetryService
    let rawResult;
    try {
      rawResult = await this.telemetryService.getDeviceTelemetry(trimmedMeterId, {
        start: startIso,
        stop: stopIso,
        limit,
      });
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw this.sanitizeError(err);
      }
      this.logger.error(`Error fetching water telemetry for ${trimmedMeterId}: ${(err as Error)?.message}`);
      throw new BadGatewayException('Failed to communicate with upstream IoT service.');
    }

    const avcTelemetry = rawResult.telemetry as AvcTelemetryData;
    const rawReadings: NormalizedAvcReading[] = Array.isArray(avcTelemetry?.readings)
      ? avcTelemetry.readings
      : [];

    // Upstream readings are newest-first; preserve newest-first order in response
    const newestRow = rawReadings.length > 0 ? rawReadings[0] : null;

    const latestSample: DashboardWaterLatestSampleDto | null = newestRow
      ? {
          observedAt: newestRow.timestamp,
          deviceName: newestRow.deviceName ?? null,
          meterSerial: newestRow.meterSn ?? null,
          gatewayId: newestRow.gatewayId ?? null,
          rssiDbm: newestRow.rssi ?? null,
          snrDb: newestRow.snr ?? null,
          instantFlowM3h: newestRow.instantFlowM3h ?? null,
          forwardVolumeM3: newestRow.fwdVolumeM3 ?? null,
          reverseVolumeM3: newestRow.revVolumeM3 ?? null,
          temperatureC: newestRow.tempC ?? null,
          rawFlags: {
            valveOpen: newestRow.rawValveOpen ?? null,
            pipeLeak: newestRow.rawPipeLeak ?? null,
            pipeBurst: newestRow.rawPipeBurst ?? null,
            batteryLow: newestRow.rawBatteryLow ?? null,
            frozen: newestRow.rawFrozen ?? null,
            tamper: newestRow.rawTamper ?? null,
            reverseFlow: newestRow.rawReverseFlow ?? null,
          },
        }
      : null;

    const readings: DashboardWaterReadingItemDto[] = rawReadings.map((r) => ({
      observedAt: r.timestamp,
      instantFlowM3h: r.instantFlowM3h ?? null,
      forwardVolumeM3: r.fwdVolumeM3 ?? null,
      reverseVolumeM3: r.revVolumeM3 ?? null,
      temperatureC: r.tempC ?? null,
      rssiDbm: r.rssi ?? null,
      snrDb: r.snr ?? null,
      gatewayId: r.gatewayId ?? null,
      rawFlags: {
        valveOpen: r.rawValveOpen ?? null,
        pipeLeak: r.rawPipeLeak ?? null,
        pipeBurst: r.rawPipeBurst ?? null,
        batteryLow: r.rawBatteryLow ?? null,
        frozen: r.rawFrozen ?? null,
        tamper: r.rawTamper ?? null,
        reverseFlow: r.rawReverseFlow ?? null,
      },
      radioMetadata: {
        devAddr: r.devAddr ?? null,
        fcnt: r.fcnt ?? null,
        region: r.region ?? null,
        frequencyHz: r.frequencyHz ?? null,
        spreadingFactor: r.spreadingFactor ?? null,
        dr: r.dr ?? null,
      },
    }));

    const availability = rawResult.coverage.validCount > 0 ? 'ready' : 'empty';

    // Build caveats
    const caveats: string[] = [];
    if (rawResult.coverage.isTruncated) {
      caveats.push('Dữ liệu telemetry bị giới hạn hoặc cắt bớt bởi giới hạn truy vấn.');
    }
    if (rawResult.coverage.invalidCount > 0) {
      caveats.push(`${rawResult.coverage.invalidCount} bản ghi telemetry không hợp lệ đã bị bỏ qua.`);
    }
    caveats.push('Ý nghĩa lưu lượng tức thời, thể tích tích lũy và các mã cờ của đồng hồ nước đang chờ xác nhận phần cứng.');
    caveats.push('Nhiệt độ đo được (°C) chưa xác định là nhiệt độ môi trường hay nhiệt độ thân đồng hồ.');

    return {
      schemaVersion: 1,
      buildingId: normalizedBuilding,
      meterId: trimmedMeterId,
      availability,
      provenance: {
        mode: 'live',
        sourceId: `water_readings_${trimmedMeterId}`,
        sourceType: 'iot_backend_avc',
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
      readings,
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
