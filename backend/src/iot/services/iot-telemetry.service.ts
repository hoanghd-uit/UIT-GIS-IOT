import {
  Injectable,
  Logger,
  BadRequestException,
  BadGatewayException,
} from '@nestjs/common';
import { IotClientService } from './iot-client.service';
import {
  DeviceTelemetryQueryDto,
  DeviceTelemetryResponseDto,
  TelemetryCoverageSummary,
  NormalizedSolarReading,
  NormalizedAvcReading,
  NormalizedNfcEvent,
  SolarTelemetryData,
  AvcTelemetryData,
  NfcTelemetryData,
  UnknownTelemetryData,
  IoTSolarRawReading,
  IoTAvcRawReading,
  IoTNfcRawEvent,
} from '../dto/iot-telemetry.dto';

@Injectable()
export class IotTelemetryService {
  private readonly logger = new Logger(IotTelemetryService.name);

  // In-memory cache for device types to avoid redundant GET /api/v1/devices/{dev_eui} roundtrips.
  // Strictly in RAM; zero database persistence.
  private readonly deviceTypeCache = new Map<string, string>();

  constructor(private readonly client: IotClientService) {}

  /**
   * Caches device type from catalogue loading (e.g. from Phase 06).
   */
  registerDeviceType(deviceId: string, deviceType: string): void {
    if (deviceId && deviceType) {
      this.deviceTypeCache.set(deviceId, deviceType.toLowerCase().trim());
    }
  }

  /**
   * Resolves the authoritative device type from RAM cache or upstream GET /api/v1/devices/{dev_eui}.
   */
  async resolveDeviceType(deviceId: string, hint?: string): Promise<string> {
    if (this.deviceTypeCache.has(deviceId)) {
      return this.deviceTypeCache.get(deviceId)!;
    }

    if (hint && ['solar', 'avc', 'nfc'].includes(hint.toLowerCase().trim())) {
      const normalizedHint = hint.toLowerCase().trim();
      this.deviceTypeCache.set(deviceId, normalizedHint);
      return normalizedHint;
    }

    this.logger.log(`Resolving device type for ${deviceId} via upstream detail API...`);
    const detail = await this.client.fetchDeviceDetail(deviceId);
    const resolvedType = (detail.data?.device_type || 'unknown').toLowerCase().trim();
    this.deviceTypeCache.set(deviceId, resolvedType);
    return resolvedType;
  }

  /**
   * Validates query parameters according to Section 3.1 & 4.2 of Phase 07 plan.
   */
  private validateRange(query: DeviceTelemetryQueryDto): {
    startDate: Date;
    endDate: Date;
    limit: number;
  } {
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

    let limit = 1000;
    if (query.limit !== undefined) {
      const parsed = Number(query.limit);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10000) {
        throw new BadRequestException('Query parameter limit must be an integer between 1 and 10000.');
      }
      limit = parsed;
    }

    return { startDate, endDate, limit };
  }

  /**
   * Main telemetry dispatch and normalization method.
   * Zero DB persistence: entirely in-memory.
   */
  async getDeviceTelemetry(
    deviceId: string,
    query: DeviceTelemetryQueryDto,
  ): Promise<DeviceTelemetryResponseDto> {
    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestException('Device ID must be a non-empty string.');
    }

    const { startDate, endDate, limit } = this.validateRange(query);
    const startIso = startDate.toISOString();
    const stopIso = endDate.toISOString();

    const deviceType = await this.resolveDeviceType(deviceId, query.deviceTypeHint);
    const fetchedAt = new Date().toISOString();

    const baseResponse = {
      schemaVersion: 1 as const,
      deviceId,
      fetchedAt,
      queryRange: {
        start: startIso,
        stop: stopIso,
        limit,
      },
    };

    switch (deviceType) {
      case 'solar': {
        const raw = await this.client.fetchSolarReadings(deviceId, startIso, stopIso, limit);
        return this.normalizeSolarResponse(deviceId, raw, baseResponse);
      }

      case 'avc': {
        const raw = await this.client.fetchAvcReadings(deviceId, startIso, stopIso, limit);
        return this.normalizeAvcResponse(deviceId, raw, baseResponse);
      }

      case 'nfc': {
        const raw = await this.client.fetchNfcEvents(deviceId, startIso, stopIso, limit);
        return this.normalizeNfcResponse(deviceId, raw, baseResponse);
      }

      default: {
        this.logger.warn(`Device ${deviceId} has unknown or unsupported device_type: ${deviceType}`);
        const coverage: TelemetryCoverageSummary = {
          returnedCount: 0,
          validCount: 0,
          invalidCount: 0,
          isTruncated: false,
          earliestTimestamp: null,
          latestTimestamp: null,
          reachedLimit: false,
        };
        const unknownTelemetry: UnknownTelemetryData = {
          type: 'unknown',
          category: 'unknown',
          rawType: deviceType,
          message: `Loại thiết bị '${deviceType}' chưa có endpoint telemetry được hỗ trợ.`,
          status: {
            label: 'Chưa hỗ trợ',
            isConfirmed: false,
          },
        };

        return {
          ...baseResponse,
          deviceType: 'unknown',
          coverage,
          telemetry: unknownTelemetry,
        };
      }
    }
  }

  /**
   * Normalizes upstream solar telemetry readings.
   */
  private normalizeSolarResponse(
    deviceId: string,
    raw: { data: IoTSolarRawReading[]; meta?: { count?: number; truncated?: boolean } },
    base: Omit<DeviceTelemetryResponseDto, 'deviceType' | 'coverage' | 'telemetry'>,
  ): DeviceTelemetryResponseDto {
    if (!raw || !Array.isArray(raw.data)) {
      throw new BadGatewayException('Malformed solar response: data must be an array.');
    }

    let validCount = 0;
    let invalidCount = 0;
    const normalizedList: NormalizedSolarReading[] = [];
    let earliestTs: string | null = null;
    let latestTs: string | null = null;

    for (const row of raw.data) {
      // Validate device_id / dev_eui match
      if (!row || typeof row !== 'object') {
        invalidCount++;
        continue;
      }

      const rowEui = String(row.dev_eui || '').trim();
      if (rowEui && rowEui.toLowerCase() !== deviceId.toLowerCase()) {
        invalidCount++;
        continue;
      }

      const tsDate = new Date(row.timestamp);
      if (isNaN(tsDate.getTime())) {
        invalidCount++;
        continue;
      }

      const tsIso = tsDate.toISOString();
      if (!earliestTs || tsIso < earliestTs) earliestTs = tsIso;
      if (!latestTs || tsIso > latestTs) latestTs = tsIso;

      validCount++;
      normalizedList.push({
        timestamp: tsIso,
        devEui: rowEui || deviceId,
        deviceIdFriendly: row.device_id ? String(row.device_id) : null,
        currentUa: typeof row.current_uA === 'number' && !isNaN(row.current_uA) ? row.current_uA : null,
        lux: typeof row.lux === 'number' && !isNaN(row.lux) ? row.lux : null,
        rssi: typeof row.rssi === 'number' && !isNaN(row.rssi) ? row.rssi : null,
        snr: typeof row.snr === 'number' && !isNaN(row.snr) ? row.snr : null,
        rawState: typeof row.state === 'number' && !isNaN(row.state) ? row.state : null,
        rawVoltage: typeof row.voltage === 'number' && !isNaN(row.voltage) ? row.voltage : null,
        rawTemperature: typeof row.temperature === 'number' && !isNaN(row.temperature) ? row.temperature : null,
        rawHumidity: typeof row.humidity === 'number' && !isNaN(row.humidity) ? row.humidity : null,
        fCnt: typeof row.f_cnt === 'number' && !isNaN(row.f_cnt) ? row.f_cnt : null,
        applicationId: row.application_id ? String(row.application_id) : null,
        gatewayId: row.gateway_id ? String(row.gateway_id) : null,
      });
    }

    // Sort newest first to pick the latest valid reading
    normalizedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const latestWithCurrent = normalizedList.find((r) => r.currentUa !== null);
    const latestWithLux = normalizedList.find((r) => r.lux !== null);
    const latestAny = normalizedList[0] || null;

    const returnedCount = raw.data.length;
    const reachedLimit = returnedCount >= base.queryRange.limit;
    const isTruncated = Boolean(raw.meta?.truncated) || reachedLimit;

    const coverage: TelemetryCoverageSummary = {
      returnedCount,
      validCount,
      invalidCount,
      isTruncated,
      earliestTimestamp: earliestTs,
      latestTimestamp: latestTs,
      reachedLimit,
    };

    const telemetry: SolarTelemetryData = {
      type: 'solar',
      category: 'solar',
      hero: {
        metric: 'current_uA',
        label: 'Dòng điện mới nhất',
        unit: 'µA',
        value: latestWithCurrent ? latestWithCurrent.currentUa : null,
        sampleTimestamp: latestWithCurrent ? latestWithCurrent.timestamp : null,
      },
      secondarySelector: {
        metric: 'lux',
        label: 'Độ sáng',
        unit: 'lx',
        value: latestWithLux ? latestWithLux.lux : null,
        sampleTimestamp: latestWithLux ? latestWithLux.timestamp : null,
      },
      status: {
        label: latestAny?.rawState !== null && latestAny?.rawState !== undefined
          ? `Mã trạng thái: ${latestAny.rawState} (chưa xác nhận)`
          : 'Chưa có dữ liệu trạng thái',
        rawState: latestAny ? latestAny.rawState : null,
        isConfirmed: false,
      },
      readings: normalizedList,
    };

    return {
      ...base,
      deviceType: 'solar',
      coverage,
      telemetry,
    };
  }

  /**
   * Normalizes upstream AVC (water meter) telemetry readings.
   */
  private normalizeAvcResponse(
    deviceId: string,
    raw: { data: IoTAvcRawReading[]; meta?: { count?: number; truncated?: boolean } },
    base: Omit<DeviceTelemetryResponseDto, 'deviceType' | 'coverage' | 'telemetry'>,
  ): DeviceTelemetryResponseDto {
    if (!raw || !Array.isArray(raw.data)) {
      throw new BadGatewayException('Malformed AVC response: data must be an array.');
    }

    let validCount = 0;
    let invalidCount = 0;
    const normalizedList: NormalizedAvcReading[] = [];
    let earliestTs: string | null = null;
    let latestTs: string | null = null;

    for (const row of raw.data) {
      if (!row || typeof row !== 'object') {
        invalidCount++;
        continue;
      }

      const rowEui = String(row.dev_eui || '').trim();
      if (rowEui && rowEui.toLowerCase() !== deviceId.toLowerCase()) {
        invalidCount++;
        continue;
      }

      const tsDate = new Date(row.timestamp);
      if (isNaN(tsDate.getTime())) {
        invalidCount++;
        continue;
      }

      const tsIso = tsDate.toISOString();
      if (!earliestTs || tsIso < earliestTs) earliestTs = tsIso;
      if (!latestTs || tsIso > latestTs) latestTs = tsIso;

      validCount++;
      normalizedList.push({
        timestamp: tsIso,
        devEui: rowEui || deviceId,
        deviceName: row.device_name ? String(row.device_name) : null,
        meterSn: row.meter_sn ? String(row.meter_sn) : null,
        instantFlowM3h: typeof row.instant_flow_m3h === 'number' && !isNaN(row.instant_flow_m3h) ? row.instant_flow_m3h : null,
        fwdVolumeM3: typeof row.fwd_volume_m3 === 'number' && !isNaN(row.fwd_volume_m3) ? row.fwd_volume_m3 : null,
        revVolumeM3: typeof row.rev_volume_m3 === 'number' && !isNaN(row.rev_volume_m3) ? row.rev_volume_m3 : null,
        tempC: typeof row.temp_c === 'number' && !isNaN(row.temp_c) ? row.temp_c : null,
        rawValveOpen: typeof row.valve_open === 'number' && !isNaN(row.valve_open) ? row.valve_open : null,
        rawPipeLeak: typeof row.pipe_leak === 'number' && !isNaN(row.pipe_leak) ? row.pipe_leak : null,
        rawPipeBurst: typeof row.pipe_burst === 'number' && !isNaN(row.pipe_burst) ? row.pipe_burst : null,
        rawBatteryLow: typeof row.battery_low === 'number' && !isNaN(row.battery_low) ? row.battery_low : null,
        rawFrozen: typeof row.frozen === 'number' && !isNaN(row.frozen) ? row.frozen : null,
        rawTamper: typeof row.tamper === 'number' && !isNaN(row.tamper) ? row.tamper : null,
        rawReverseFlow: typeof row.reverse_flow === 'number' && !isNaN(row.reverse_flow) ? row.reverse_flow : null,
        rssi: typeof row.rssi === 'number' && !isNaN(row.rssi) ? row.rssi : null,
        snr: typeof row.snr === 'number' && !isNaN(row.snr) ? row.snr : null,
        fcnt: typeof row.fcnt === 'number' && !isNaN(row.fcnt) ? row.fcnt : null,
        devAddr: row.dev_addr ? String(row.dev_addr) : null,
        gatewayId: row.gateway_id ? String(row.gateway_id) : null,
        region: row.region ? String(row.region) : null,
        frequencyHz: typeof row.frequency_hz === 'number' && !isNaN(row.frequency_hz) ? row.frequency_hz : null,
        spreadingFactor: typeof row.spreading_factor === 'number' && !isNaN(row.spreading_factor) ? row.spreading_factor : null,
        dr: typeof row.dr === 'number' && !isNaN(row.dr) ? row.dr : null,
      });
    }

    normalizedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const latestWithFlow = normalizedList.find((r) => r.instantFlowM3h !== null);
    const latestWithTemp = normalizedList.find((r) => r.tempC !== null);
    const latestWithFwd = normalizedList.find((r) => r.fwdVolumeM3 !== null);
    const latestWithRev = normalizedList.find((r) => r.revVolumeM3 !== null);
    const latestAny = normalizedList[0] || null;

    const returnedCount = raw.data.length;
    const reachedLimit = returnedCount >= base.queryRange.limit;
    const isTruncated = Boolean(raw.meta?.truncated) || reachedLimit;

    const coverage: TelemetryCoverageSummary = {
      returnedCount,
      validCount,
      invalidCount,
      isTruncated,
      earliestTimestamp: earliestTs,
      latestTimestamp: latestTs,
      reachedLimit,
    };

    const telemetry: AvcTelemetryData = {
      type: 'avc',
      category: 'water_meter',
      hero: {
        metric: 'instant_flow_m3h',
        label: 'Lưu lượng tức thời',
        unit: 'm³/h',
        value: latestWithFlow ? latestWithFlow.instantFlowM3h : null,
        sampleTimestamp: latestWithFlow ? latestWithFlow.timestamp : null,
        pendingHardwareBadge: true,
      },
      secondarySelectors: {
        tempC: {
          metric: 'temp_c',
          label: 'Nhiệt độ đo được',
          unit: '°C',
          value: latestWithTemp ? latestWithTemp.tempC : null,
          sampleTimestamp: latestWithTemp ? latestWithTemp.timestamp : null,
          pendingHardwareBadge: false,
        },
        fwdVolume: {
          metric: 'fwd_volume_m3',
          label: 'Thể tích tích lũy chiều thuận',
          unit: 'm³',
          value: latestWithFwd ? latestWithFwd.fwdVolumeM3 : null,
          sampleTimestamp: latestWithFwd ? latestWithFwd.timestamp : null,
          pendingHardwareBadge: true,
        },
        revVolume: {
          metric: 'rev_volume_m3',
          label: 'Thể tích tích lũy chiều ngược',
          unit: 'm³',
          value: latestWithRev ? latestWithRev.revVolumeM3 : null,
          sampleTimestamp: latestWithRev ? latestWithRev.timestamp : null,
          pendingHardwareBadge: true,
        },
      },
      status: {
        label: 'Chưa xác nhận mã cảnh báo',
        isConfirmed: false,
        rawFlags: {
          valveOpen: latestAny ? latestAny.rawValveOpen : null,
          pipeLeak: latestAny ? latestAny.rawPipeLeak : null,
          pipeBurst: latestAny ? latestAny.rawPipeBurst : null,
          batteryLow: latestAny ? latestAny.rawBatteryLow : null,
          frozen: latestAny ? latestAny.rawFrozen : null,
          tamper: latestAny ? latestAny.rawTamper : null,
          reverseFlow: latestAny ? latestAny.rawReverseFlow : null,
        },
      },
      readings: normalizedList,
    };

    return {
      ...base,
      deviceType: 'avc',
      coverage,
      telemetry,
    };
  }

  /**
   * Normalizes upstream NFC door scan events.
   */
  private normalizeNfcResponse(
    deviceId: string,
    raw: { data: IoTNfcRawEvent[]; meta?: { count?: number; truncated?: boolean } },
    base: Omit<DeviceTelemetryResponseDto, 'deviceType' | 'coverage' | 'telemetry'>,
  ): DeviceTelemetryResponseDto {
    if (!raw || !Array.isArray(raw.data)) {
      throw new BadGatewayException('Malformed NFC response: data must be an array.');
    }

    let validCount = 0;
    let invalidCount = 0;
    let totalIn = 0;
    let totalOut = 0;
    const normalizedList: NormalizedNfcEvent[] = [];
    let earliestTs: string | null = null;
    let latestTs: string | null = null;

    for (const row of raw.data) {
      if (!row || typeof row !== 'object') {
        invalidCount++;
        continue;
      }

      const rowEui = String(row.dev_eui || '').trim();
      if (rowEui && rowEui.toLowerCase() !== deviceId.toLowerCase()) {
        invalidCount++;
        continue;
      }

      const tsDate = new Date(row.timestamp);
      if (isNaN(tsDate.getTime())) {
        invalidCount++;
        continue;
      }

      const cardId = String(row.detected_card_id || '').trim();
      if (!cardId) {
        invalidCount++;
        continue;
      }

      const rawDir = String(row.moving_direction || '').toLowerCase().trim();
      let direction: 'in' | 'out';
      if (rawDir === 'in') {
        direction = 'in';
        totalIn++;
      } else if (rawDir === 'out') {
        direction = 'out';
        totalOut++;
      } else {
        // Contract violation
        invalidCount++;
        continue;
      }

      const tsIso = tsDate.toISOString();
      if (!earliestTs || tsIso < earliestTs) earliestTs = tsIso;
      if (!latestTs || tsIso > latestTs) latestTs = tsIso;

      validCount++;
      normalizedList.push({
        timestamp: tsIso,
        devEui: rowEui || deviceId,
        detectedCardId: cardId,
        movingDirection: direction,
        batchId: row.batch_id ? String(row.batch_id) : null,
      });
    }

    normalizedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const returnedCount = raw.data.length;
    const reachedLimit = returnedCount >= base.queryRange.limit;
    const isTruncated = Boolean(raw.meta?.truncated) || reachedLimit;

    const coverage: TelemetryCoverageSummary = {
      returnedCount,
      validCount,
      invalidCount,
      isTruncated,
      earliestTimestamp: earliestTs,
      latestTimestamp: latestTs,
      reachedLimit,
    };

    const latestEvent = normalizedList[0] || null;

    const telemetry: NfcTelemetryData = {
      type: 'nfc',
      category: 'nfc',
      hero: {
        latestEvent,
        totalInCount: totalIn,
        totalOutCount: totalOut,
        loadedEventCount: validCount,
      },
      status: {
        label: 'Chưa có dữ liệu trạng thái',
        isConfirmed: false,
      },
      events: normalizedList,
    };

    return {
      ...base,
      deviceType: 'nfc',
      coverage,
      telemetry,
    };
  }
}
