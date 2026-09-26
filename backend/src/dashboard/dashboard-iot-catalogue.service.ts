import {
  Injectable,
  Logger,
  BadRequestException,
  BadGatewayException,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IotClientService } from '../iot/services/iot-client.service';
import { IotMapperService } from '../iot/services/iot-mapper.service';
import {
  DashboardDeviceCatalogueItem,
  DashboardDeviceCatalogueResponse,
} from './dto/dashboard-device-catalogue-response.dto';
import { IoTUpstreamDeviceListResponse } from '../iot/dto/iot-devices.dto';

function isValidIsoDate(str: unknown): boolean {
  if (typeof str !== 'string' || str.trim().length === 0) return false;
  const parsed = Date.parse(str);
  return !Number.isNaN(parsed);
}

import { Optional } from '@nestjs/common';
import { IotTelemetryService } from '../iot/services/iot-telemetry.service';

@Injectable()
export class DashboardIotCatalogueService {
  private readonly logger = new Logger(DashboardIotCatalogueService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly iotClient: IotClientService,
    private readonly iotMapper: IotMapperService,
    @Optional() private readonly telemetryService?: IotTelemetryService,
  ) {}

  /**
   * Reads, validates, and normalizes the active IoT device catalogue for Dashboard Page 07.
   * Strictly read-only, request-time and in-memory. Zero database writes.
   */
  async getCatalogue(
    buildingId: string,
    floorId?: string,
  ): Promise<DashboardDeviceCatalogueResponse> {
    // 1. Source-mode gate: Live catalogue requires DEVICE_SOURCE_MODE=iot
    const mode = this.config.get<string>('fixtures.mode', 'disabled');
    if (mode === 'disabled') {
      throw new ServiceUnavailableException(
        'IoT device integration is disabled (DEVICE_SOURCE_MODE=disabled).',
      );
    }
    if (mode === 'fixture') {
      throw new ServiceUnavailableException(
        'Live IoT catalogue is unavailable in fixture mode (DEVICE_SOURCE_MODE=fixture).',
      );
    }

    // 2. Validate buildingId: currently Building E only
    const normalizedBuilding = (buildingId || '').trim().toUpperCase();
    if (normalizedBuilding !== 'E') {
      throw new BadRequestException(
        `Dashboard IoT catalogue currently supports Building E only (requested: ${buildingId}).`,
      );
    }

    // 3. Validate floorId if provided
    let requestedFloorId: string | null = null;
    let requestedUpstreamFloorLevel: number | null = null;

    if (floorId !== undefined && floorId !== null && floorId.trim() !== '') {
      const normalizedFloor = floorId.trim();
      if (normalizedFloor === 'G') {
        throw new BadRequestException(
          `Viewer floor 'G' does not have an approved upstream floor_level mapping yet.`,
        );
      }

      // Reuses centralized floor validation and resolution
      requestedUpstreamFloorLevel = this.iotMapper.resolveUpstreamFloorLevel(
        normalizedBuilding,
        normalizedFloor,
      );
      requestedFloorId = normalizedFloor;
    }

    // 4. Fetch upstream data through reused IotClientService
    let raw: IoTUpstreamDeviceListResponse;
    let developmentFallbackApplied = false;
    const floorMode = this.iotMapper.getFloorMappingMode();

    try {
      if (requestedUpstreamFloorLevel === null) {
        this.logger.log('Fetching full unfiltered active device catalogue from upstream for Dashboard...');
        raw = await this.iotClient.fetchRawDevices();
      } else {
        this.logger.log(
          `Fetching scoped active device catalogue for ${normalizedBuilding}/${requestedFloorId} (upstream floor_level=${requestedUpstreamFloorLevel})...`,
        );
        raw = await this.iotClient.fetchRawDevices({ floorLevel: requestedUpstreamFloorLevel });

        // Development fallback under TEST_CURRENT_FLOOR_4_6_V1
        if (
          (!raw || !Array.isArray(raw.data) || raw.data.length === 0) &&
          floorMode === 'TEST_CURRENT_FLOOR_4_6_V1'
        ) {
          this.logger.log(
            `TEST scenario (${floorMode}): upstream returned 0 devices for floor_level=${requestedUpstreamFloorLevel}. Falling back to floor_level=0...`,
          );
          raw = await this.iotClient.fetchRawDevices({ floorLevel: 0 });
          developmentFallbackApplied = true;
        }
      }
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        // Sanitize error messages to avoid leaking tokens, internal URLs, or credentials
        const status = err.getStatus();
        const rawRes = err.getResponse();
        let message = typeof rawRes === 'string' ? rawRes : (rawRes as any)?.message || err.message;
        if (Array.isArray(message)) message = message.join('; ');

        if (/token/i.test(message) || /bearer/i.test(message) || /https?:\/\//i.test(message)) {
          if (status === 503) {
            throw new ServiceUnavailableException('IoT service credential is not configured on the server.');
          }
          if (status === 502) {
            throw new BadGatewayException('Upstream IoT API authentication failed (401 Unauthorized).');
          }
          throw new HttpException('Upstream IoT service error.', status);
        }
        throw err;
      }
      this.logger.error(`Unhandled error contacting upstream IoT service: ${(err as Error)?.message}`);
      throw new BadGatewayException('Failed to communicate with upstream IoT service.');
    }

    // 5. Envelope validation
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.data)) {
      throw new BadGatewayException('Invalid upstream IoT envelope: missing or invalid "data" array.');
    }

    // 6. Item-level validation and normalization
    const receivedCount = raw.data.length;
    let skippedCount = 0;
    let duplicateCount = 0;
    const seenIds = new Set<string>();
    const devices: DashboardDeviceCatalogueItem[] = [];

    for (const item of raw.data) {
      if (!item || typeof item !== 'object') {
        skippedCount++;
        continue;
      }

      // device_id: opaque non-empty string
      const deviceId = typeof item.device_id === 'string' ? item.device_id.trim() : '';
      if (!deviceId) {
        skippedCount++;
        continue;
      }

      // device_type: non-empty string
      const deviceType = typeof item.device_type === 'string' ? item.device_type.trim() : '';
      if (!deviceType) {
        skippedCount++;
        continue;
      }

      // is_active: boolean
      if (typeof item.is_active !== 'boolean') {
        skippedCount++;
        continue;
      }

      // source timestamps: valid ISO-8601 strings
      if (!isValidIsoDate(item.create_timestamp)) {
        skippedCount++;
        continue;
      }
      if (!isValidIsoDate(item.last_updated_timestamp)) {
        skippedCount++;
        continue;
      }

      // install_location: finite x, y, z and integer floor_level
      const loc = item.install_location;
      if (
        !loc ||
        typeof loc !== 'object' ||
        typeof loc.install_x !== 'number' ||
        !Number.isFinite(loc.install_x) ||
        typeof loc.install_y !== 'number' ||
        !Number.isFinite(loc.install_y) ||
        typeof loc.install_z !== 'number' ||
        !Number.isFinite(loc.install_z) ||
        typeof loc.install_floor_level !== 'number' ||
        !Number.isInteger(loc.install_floor_level)
      ) {
        skippedCount++;
        continue;
      }

      // Duplicate check: keep the first valid record
      if (seenIds.has(deviceId)) {
        duplicateCount++;
        continue;
      }
      seenIds.add(deviceId);

      // Reused category mapping
      const category = this.iotMapper.mapCategory(deviceType);

      // Floor assignment logic
      let displayFloorId: string | null = null;
      let floorAssignment: 'source' | 'development-fallback' | 'unmapped' = 'unmapped';

      if (developmentFallbackApplied) {
        // Preserves raw sourceLocation.floorLevel (0), displays in requested floor scope as fallback
        displayFloorId = requestedFloorId;
        floorAssignment = 'development-fallback';
      } else if (requestedFloorId !== null) {
        if (loc.install_floor_level === requestedUpstreamFloorLevel) {
          displayFloorId = requestedFloorId;
          floorAssignment = 'source';
        } else {
          displayFloorId = null;
          floorAssignment = 'unmapped';
        }
      } else {
        // Full catalogue read: map only known approved floors (4, 6), never guess 0 -> G
        if (loc.install_floor_level === 4) {
          displayFloorId = '4';
          floorAssignment = 'source';
        } else if (loc.install_floor_level === 6) {
          displayFloorId = '6';
          floorAssignment = 'source';
        } else {
          displayFloorId = null;
          floorAssignment = 'unmapped';
        }
      }

      devices.push({
        externalDeviceId: deviceId,
        sourceDeviceType: deviceType,
        category,
        active: item.is_active,
        sourceCreatedAt: item.create_timestamp,
        sourceUpdatedAt: item.last_updated_timestamp,
        sourceLocation: {
          x: loc.install_x,
          y: loc.install_y,
          z: loc.install_z,
          floorLevel: loc.install_floor_level,
        },
        displayFloorId,
        floorAssignment,
      });

      if (this.telemetryService) {
        this.telemetryService.registerDeviceType(deviceId, deviceType);
      }
    }

    const acceptedCount = devices.length;
    const truncated = typeof raw.meta?.truncated === 'boolean' ? raw.meta.truncated : null;

    // Quality gate: if received items exist but all are malformed, fail upstream contract
    if (receivedCount > 0 && acceptedCount === 0) {
      throw new BadGatewayException('Upstream IoT catalogue payload contains only malformed records.');
    }

    const availability = acceptedCount > 0 ? 'ready' : 'empty';

    // Build caveats
    const caveats: string[] = [];
    if (truncated === true) {
      caveats.push('Dữ liệu danh mục bị cắt ngắn từ nguồn upstream (truncated: true).');
    }
    if (skippedCount > 0) {
      caveats.push(`Bỏ qua ${skippedCount} bản ghi không hợp lệ hoặc thiếu trường bắt buộc.`);
    }
    if (duplicateCount > 0) {
      caveats.push(`Bỏ qua ${duplicateCount} bản ghi trùng lặp mã thiết bị.`);
    }
    if (developmentFallbackApplied) {
      caveats.push(`Áp dụng dữ liệu development fallback từ tầng 0 cho tầng ${requestedFloorId}.`);
    }

    return {
      schemaVersion: 1,
      buildingId: normalizedBuilding,
      requestedFloorId,
      availability,
      provenance: {
        mode: 'live',
        sourceId: 'iot-device-catalogue',
        sourceType: 'iot_backend',
        fetchedAt: new Date().toISOString(),
        ...(caveats.length > 0 ? { caveats } : {}),
      },
      mapping: {
        floorMode,
        developmentFallbackApplied,
        requestedUpstreamFloorLevel,
      },
      summary: {
        receivedCount,
        acceptedCount,
        skippedCount,
        duplicateCount,
        truncated,
      },
      devices,
    };
  }
}
