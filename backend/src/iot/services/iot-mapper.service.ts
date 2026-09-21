import { Injectable, BadRequestException, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeviceCategory,
  FloorDeviceResponse,
  FloorDeviceView,
  IoTUpstreamDeviceListResponse,
} from '../dto/iot-devices.dto';

@Injectable()
export class IotMapperService {
  constructor(private readonly config: ConfigService) {}

  private getFloorMappingMode(): string {
    return this.config.get<string>('iot.floorMode', 'TEST_CURRENT_FLOOR_4_6_V1');
  }

  private getCoordinateMappingMode(): string {
    return this.config.get<string>('iot.coordinateMode', 'TEST_PREFAB_CENTER_XZ_V1');
  }

  /**
   * Maps raw upstream device types to application DeviceCategory.
   * Unknown or unverified types (e.g. 'solar', 'avc', 'nfc') map to 'unknown'.
   */
  mapCategory(rawType: string | undefined | null): DeviceCategory {
    if (!rawType || typeof rawType !== 'string') {
      return 'unknown';
    }

    const normalized = rawType.trim().toLowerCase();
    switch (normalized) {
      case 'water_meter':
        return 'water_meter';
      case 'temperature_humidity':
        return 'temperature_humidity';
      case 'smart_building':
        return 'smart_building';
      case 'rf_uhf_reader':
      case 'uhf_reader':
        return 'rf_uhf_reader';
      case 'camera':
        return 'camera';
      case 'solar':
        return 'solar';
      case 'avc':
        return 'avc';
      case 'nfc':
        return 'nfc';
      default:
        // any other new/unverified types
        return 'unknown';
    }
  }

  /**
   * Projects raw upstream list response onto current floor view.
   * Applies TEST_CURRENT_FLOOR_4_6_V1 floor policy and TEST_PREFAB_CENTER_XZ_V1 coordinate mapping.
   */
  mapResponse(
    raw: IoTUpstreamDeviceListResponse,
    buildingId: string,
    floorId: string,
  ): FloorDeviceResponse {
    // 1. Validate envelope
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.data)) {
      throw new BadGatewayException('Invalid upstream IoT envelope: missing or invalid "data" array.');
    }

    // 2. Validate floor scope under TEST_CURRENT_FLOOR_4_6_V1
    const normalizedBuilding = (buildingId || '').toUpperCase();
    const normalizedFloor = (floorId || '').trim();

    if (normalizedBuilding !== 'E' || !['4', '6'].includes(normalizedFloor)) {
      throw new BadRequestException(
        `IoT floor integration is currently configured for Building E, floors 4 and 6 only (requested: ${buildingId}/${floorId}).`,
      );
    }

    const floorMode = this.getFloorMappingMode();
    const coordinateMode = this.getCoordinateMappingMode();

    const rawList = raw.data;
    const receivedCount = rawList.length;
    let skippedCount = 0;
    let duplicateCount = 0;

    const seenIds = new Set<string>();
    const devices: FloorDeviceView[] = [];

    for (const item of rawList) {
      // Validate device_id: must be non-empty string
      if (!item || typeof item.device_id !== 'string' || item.device_id.trim() === '') {
        skippedCount++;
        continue;
      }

      const deviceId = item.device_id;

      // Validate install_location: x, y, floorLevel must be finite numbers
      const loc = item.install_location;
      if (
        !loc ||
        typeof loc !== 'object' ||
        typeof loc.install_x !== 'number' ||
        !Number.isFinite(loc.install_x) ||
        typeof loc.install_y !== 'number' ||
        !Number.isFinite(loc.install_y) ||
        typeof loc.install_floor_level !== 'number' ||
        !Number.isFinite(loc.install_floor_level)
      ) {
        skippedCount++;
        continue;
      }

      // Check duplicate ID: keep first valid record
      if (seenIds.has(deviceId)) {
        duplicateCount++;
        continue;
      }
      seenIds.add(deviceId);

      const sourceDeviceType = typeof item.device_type === 'string' && item.device_type.trim() !== ''
        ? item.device_type.trim()
        : 'unknown';

      // Map record: is_active is deliberately omitted from display logic
      devices.push({
        deviceId,
        sourceDeviceType,
        category: this.mapCategory(sourceDeviceType),
        sourceLocation: {
          x: loc.install_x,
          y: loc.install_y,
          floorLevel: loc.install_floor_level,
        },
        displayFloorId: normalizedFloor,
      });
    }

    const acceptedCount = devices.length;
    const truncated = typeof raw.meta?.truncated === 'boolean' ? raw.meta.truncated : null;

    return {
      schemaVersion: 1,
      buildingId: normalizedBuilding,
      floorId: normalizedFloor,
      fetchedAt: new Date().toISOString(),
      mapping: {
        floorMode,
        coordinateMode,
      },
      devices,
      summary: {
        receivedCount,
        acceptedCount,
        skippedCount,
        duplicateCount,
        truncated,
      },
    };
  }
}

