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
  NormalizedSmartBuildingReading,
  SmartBuildingTelemetryData,
  NormalizedSmokeReading,
  SmokeTelemetryData,
  SolarTelemetryData,
  AvcTelemetryData,
  NfcTelemetryData,
  UnknownTelemetryData,
  IoTSolarRawReading,
  IoTAvcRawReading,
  IoTNfcRawEvent,
  IoTUpstreamSmartBuildingResponse,
  IoTUpstreamSmokeResponse,
} from '../dto/iot-telemetry.dto';

function toFiniteNumber(val: unknown): number | null {
  return typeof val === 'number' && Number.isFinite(val) ? val : null;
}

function toValidFiniteNumberOrInvalid(val: unknown): number | null | undefined {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  return undefined;
}

function toValidStringOrInvalid(val: unknown): string | null | undefined {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string') return val;
  return undefined;
}

@Injectable()
export class IotTelemetryService {
  private readonly logger = new Logger(IotTelemetryService.name);

  // In-memory cache for device types to avoid redundant GET /api/v1/devices/{dev_eui} roundtrips.
  // Strictly in RAM; zero database persistence.
  private readonly deviceTypeCache = new Map<string, string>();

  constructor(private readonly client: IotClientService) {}

  /**
   * Caches device type from catalogue loading (e.g. from Phase 02 or Phase 06).
   */
  registerDeviceType(deviceId: string, deviceType: string): void {
    if (deviceId && deviceType) {
      this.deviceTypeCache.set(deviceId, deviceType.toLowerCase().trim());
    }
  }

  /**
   * Resolves the authoritative device type from RAM cache or upstream GET /api/v1/devices/{dev_eui}.
   * Public/client hints are never accepted or trusted for routing.
   */
  async resolveDeviceType(deviceId: string): Promise<string> {
    if (this.deviceTypeCache.has(deviceId)) {
      return this.deviceTypeCache.get(deviceId)!;
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

    const deviceType = await this.resolveDeviceType(deviceId);

    switch (deviceType) {
      case 'solar': {
        const raw = await this.client.fetchSolarReadings(deviceId, startIso, stopIso, limit);
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
        return this.normalizeSolarResponse(deviceId, raw, baseResponse);
      }

      case 'avc': {
        const raw = await this.client.fetchAvcReadings(deviceId, startIso, stopIso, limit);
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
        return this.normalizeAvcResponse(deviceId, raw, baseResponse);
      }

      case 'nfc': {
        const raw = await this.client.fetchNfcEvents(deviceId, startIso, stopIso, limit);
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
        return this.normalizeNfcResponse(deviceId, raw, baseResponse);
      }

      case 'sb': {
        const raw = await this.client.fetchSmartBuildingReadings(deviceId, startIso, stopIso, limit);
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
        return this.normalizeSmartBuildingResponse(deviceId, raw, baseResponse);
      }

      case 'smoke': {
        const raw = await this.client.fetchSmokeReadings(deviceId, startIso, stopIso, limit);
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
        return this.normalizeSmokeResponse(deviceId, raw, baseResponse);
      }

      default: {
        this.logger.warn(`Device ${deviceId} has unknown or unsupported device_type: ${deviceType}`);
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

      const rowEui = typeof row.dev_eui === 'string' ? row.dev_eui.trim() : '';
      if (!rowEui || rowEui.toLowerCase() !== deviceId.toLowerCase()) {
        invalidCount++;
        continue;
      }

      if (!row.timestamp || typeof row.timestamp !== 'string') {
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
        devEui: rowEui,
        deviceIdFriendly: row.device_id ? String(row.device_id) : null,
        currentUa: toFiniteNumber(row.current_uA),
        lux: toFiniteNumber(row.lux),
        rssi: toFiniteNumber(row.rssi),
        snr: toFiniteNumber(row.snr),
        rawState: toFiniteNumber(row.state),
        rawVoltage: toFiniteNumber(row.voltage),
        rawTemperature: toFiniteNumber(row.temperature),
        rawHumidity: toFiniteNumber(row.humidity),
        fCnt: toFiniteNumber(row.f_cnt),
        applicationId: row.application_id ? String(row.application_id) : null,
        gatewayId: row.gateway_id ? String(row.gateway_id) : null,
      });
    }

    if (raw.data.length > 0 && validCount === 0) {
      throw new BadGatewayException('All returned upstream telemetry rows were invalid or malformed.');
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

      const rowEui = typeof row.dev_eui === 'string' ? row.dev_eui.trim() : '';
      if (!rowEui || rowEui.toLowerCase() !== deviceId.toLowerCase()) {
        invalidCount++;
        continue;
      }

      if (!row.timestamp || typeof row.timestamp !== 'string') {
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
        devEui: rowEui,
        deviceName: row.device_name ? String(row.device_name) : null,
        meterSn: row.meter_sn ? String(row.meter_sn) : null,
        instantFlowM3h: toFiniteNumber(row.instant_flow_m3h),
        fwdVolumeM3: toFiniteNumber(row.fwd_volume_m3),
        revVolumeM3: toFiniteNumber(row.rev_volume_m3),
        tempC: toFiniteNumber(row.temp_c),
        rawValveOpen: toFiniteNumber(row.valve_open),
        rawPipeLeak: toFiniteNumber(row.pipe_leak),
        rawPipeBurst: toFiniteNumber(row.pipe_burst),
        rawBatteryLow: toFiniteNumber(row.battery_low),
        rawFrozen: toFiniteNumber(row.frozen),
        rawTamper: toFiniteNumber(row.tamper),
        rawReverseFlow: toFiniteNumber(row.reverse_flow),
        rssi: toFiniteNumber(row.rssi),
        snr: toFiniteNumber(row.snr),
        fcnt: toFiniteNumber(row.fcnt),
        devAddr: row.dev_addr ? String(row.dev_addr) : null,
        gatewayId: row.gateway_id ? String(row.gateway_id) : null,
        region: row.region ? String(row.region) : null,
        frequencyHz: toFiniteNumber(row.frequency_hz),
        spreadingFactor: toFiniteNumber(row.spreading_factor),
        dr: toFiniteNumber(row.dr),
      });
    }

    if (raw.data.length > 0 && validCount === 0) {
      throw new BadGatewayException('All returned upstream telemetry rows were invalid or malformed.');
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

      const rowEui = typeof row.dev_eui === 'string' ? row.dev_eui.trim() : '';
      if (!rowEui || rowEui.toLowerCase() !== deviceId.toLowerCase()) {
        invalidCount++;
        continue;
      }

      if (!row.timestamp || typeof row.timestamp !== 'string') {
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
        devEui: rowEui,
        detectedCardId: cardId,
        movingDirection: direction,
        batchId: row.batch_id ? String(row.batch_id) : null,
      });
    }

    if (raw.data.length > 0 && validCount === 0) {
      throw new BadGatewayException('All returned upstream telemetry rows were invalid or malformed.');
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

  /**
   * Normalizes upstream smart building (sb) telemetry readings.
   */
  private normalizeSmartBuildingResponse(
    deviceId: string,
    raw: IoTUpstreamSmartBuildingResponse,
    base: Omit<DeviceTelemetryResponseDto, 'deviceType' | 'coverage' | 'telemetry'>,
  ): DeviceTelemetryResponseDto {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray(raw.data)) {
      throw new BadGatewayException('Malformed smart building response: envelope must be an object with data array.');
    }

    if (raw.meta !== undefined && raw.meta !== null) {
      if (typeof raw.meta !== 'object' || Array.isArray(raw.meta)) {
        throw new BadGatewayException('Malformed smart building response: meta must be an object.');
      }
      if (raw.meta.count !== undefined && raw.meta.count !== null) {
        if (!Number.isInteger(raw.meta.count) || raw.meta.count < 0) {
          throw new BadGatewayException('Malformed smart building response: meta.count must be a non-negative integer.');
        }
      }
      if (raw.meta.truncated !== undefined && raw.meta.truncated !== null) {
        if (typeof raw.meta.truncated !== 'boolean') {
          throw new BadGatewayException('Malformed smart building response: meta.truncated must be a boolean.');
        }
      }
    }

    const sourceCount = (raw.meta?.count !== undefined && raw.meta?.count !== null) ? raw.meta.count : null;
    const sourceTruncated = (raw.meta?.truncated !== undefined && raw.meta?.truncated !== null) ? raw.meta.truncated : null;

    const trimmedDeviceId = deviceId.trim();
    const startMs = new Date(base.queryRange.start).getTime();
    const stopMs = new Date(base.queryRange.stop).getTime();

    let validCount = 0;
    let invalidCount = 0;
    const normalizedList: NormalizedSmartBuildingReading[] = [];
    let earliestTs: string | null = null;
    let latestTs: string | null = null;

    for (const row of raw.data) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        invalidCount++;
        continue;
      }

      // Exact case-sensitive match with trimmed deviceId
      if (typeof row.dev_eui !== 'string' || row.dev_eui !== trimmedDeviceId) {
        invalidCount++;
        continue;
      }

      if (!row.timestamp || typeof row.timestamp !== 'string') {
        invalidCount++;
        continue;
      }
      const tsDate = new Date(row.timestamp);
      const tsMs = tsDate.getTime();
      if (isNaN(tsMs) || tsMs < startMs || tsMs > stopMs) {
        invalidCount++;
        continue;
      }

      // Validate sparse fields: string or null
      const networkDeviceName = toValidStringOrInvalid(row.device_id);
      if (networkDeviceName === undefined) {
        invalidCount++;
        continue;
      }
      const applicationId = toValidStringOrInvalid(row.application_id);
      if (applicationId === undefined) {
        invalidCount++;
        continue;
      }
      const gatewayId = toValidStringOrInvalid(row.gateway_id);
      if (gatewayId === undefined) {
        invalidCount++;
        continue;
      }

      // Validate sparse fields: finite number or null
      const rssi = toValidFiniteNumberOrInvalid(row.rssi);
      if (rssi === undefined) {
        invalidCount++;
        continue;
      }
      const snr = toValidFiniteNumberOrInvalid(row.snr);
      if (snr === undefined) {
        invalidCount++;
        continue;
      }
      const rawVoltage = toValidFiniteNumberOrInvalid(row.voltage);
      if (rawVoltage === undefined) {
        invalidCount++;
        continue;
      }
      const rawVisible = toValidFiniteNumberOrInvalid(row.visible);
      if (rawVisible === undefined) {
        invalidCount++;
        continue;
      }
      const rawIr = toValidFiniteNumberOrInvalid(row.ir);
      if (rawIr === undefined) {
        invalidCount++;
        continue;
      }
      const rawCo2 = toValidFiniteNumberOrInvalid(row.co2);
      if (rawCo2 === undefined) {
        invalidCount++;
        continue;
      }
      const rawVoc = toValidFiniteNumberOrInvalid(row.voc);
      if (rawVoc === undefined) {
        invalidCount++;
        continue;
      }
      const fCnt = toValidFiniteNumberOrInvalid(row.f_cnt);
      if (fCnt === undefined) {
        invalidCount++;
        continue;
      }

      const tsIso = tsDate.toISOString();
      if (!earliestTs || tsIso < earliestTs) earliestTs = tsIso;
      if (!latestTs || tsIso > latestTs) latestTs = tsIso;

      validCount++;
      normalizedList.push({
        timestamp: tsIso,
        devEui: row.dev_eui,
        networkDeviceName,
        applicationId,
        gatewayId,
        rssi,
        snr,
        rawVoltage,
        rawVisible,
        rawIr,
        rawCo2,
        rawVoc,
        fCnt,
      });
    }

    if (raw.data.length > 0 && validCount === 0) {
      throw new BadGatewayException('All returned upstream telemetry rows were invalid or malformed.');
    }

    normalizedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const returnedCount = raw.data.length;
    const reachedLimit = returnedCount >= base.queryRange.limit;
    const isTruncated = sourceTruncated === true || reachedLimit;

    const coverage: TelemetryCoverageSummary = {
      returnedCount,
      validCount,
      invalidCount,
      isTruncated,
      earliestTimestamp: earliestTs,
      latestTimestamp: latestTs,
      reachedLimit,
      sourceCount,
      sourceTruncated,
    };

    const latestReading = normalizedList[0] || null;

    const telemetry: SmartBuildingTelemetryData = {
      type: 'sb',
      category: 'smart_building',
      latest: {
        timestamp: latestReading?.timestamp ?? null,
        rawVoltage: latestReading?.rawVoltage ?? null,
        rawVisible: latestReading?.rawVisible ?? null,
        rawIr: latestReading?.rawIr ?? null,
        rawCo2: latestReading?.rawCo2 ?? null,
        rawVoc: latestReading?.rawVoc ?? null,
        fCnt: latestReading?.fCnt ?? null,
      },
      status: {
        label: 'Dữ liệu thô chưa xác nhận thang đo',
        isConfirmed: false,
      },
      readings: normalizedList,
    };

    return {
      ...base,
      deviceType: 'sb',
      coverage,
      telemetry,
    };
  }

  /**
   * Normalizes upstream smoke telemetry readings.
   */
  private normalizeSmokeResponse(
    deviceId: string,
    raw: IoTUpstreamSmokeResponse,
    base: Omit<DeviceTelemetryResponseDto, 'deviceType' | 'coverage' | 'telemetry'>,
  ): DeviceTelemetryResponseDto {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray(raw.data)) {
      throw new BadGatewayException('Malformed smoke response: envelope must be an object with data array.');
    }

    if (raw.meta !== undefined && raw.meta !== null) {
      if (typeof raw.meta !== 'object' || Array.isArray(raw.meta)) {
        throw new BadGatewayException('Malformed smoke response: meta must be an object.');
      }
      if (raw.meta.count !== undefined && raw.meta.count !== null) {
        if (!Number.isInteger(raw.meta.count) || raw.meta.count < 0) {
          throw new BadGatewayException('Malformed smoke response: meta.count must be a non-negative integer.');
        }
      }
      if (raw.meta.truncated !== undefined && raw.meta.truncated !== null) {
        if (typeof raw.meta.truncated !== 'boolean') {
          throw new BadGatewayException('Malformed smoke response: meta.truncated must be a boolean.');
        }
      }
    }

    const sourceCount = (raw.meta?.count !== undefined && raw.meta?.count !== null) ? raw.meta.count : null;
    const sourceTruncated = (raw.meta?.truncated !== undefined && raw.meta?.truncated !== null) ? raw.meta.truncated : null;

    const trimmedDeviceId = deviceId.trim();
    const startMs = new Date(base.queryRange.start).getTime();
    const stopMs = new Date(base.queryRange.stop).getTime();

    let validCount = 0;
    let invalidCount = 0;
    const normalizedList: NormalizedSmokeReading[] = [];
    let earliestTs: string | null = null;
    let latestTs: string | null = null;

    for (const row of raw.data) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        invalidCount++;
        continue;
      }

      // Exact case-sensitive match with trimmed deviceId
      if (typeof row.dev_eui !== 'string' || row.dev_eui !== trimmedDeviceId) {
        invalidCount++;
        continue;
      }

      if (!row.timestamp || typeof row.timestamp !== 'string') {
        invalidCount++;
        continue;
      }
      const tsDate = new Date(row.timestamp);
      const tsMs = tsDate.getTime();
      if (isNaN(tsMs) || tsMs < startMs || tsMs > stopMs) {
        invalidCount++;
        continue;
      }

      // Validate sparse fields: string or null
      const networkDeviceName = toValidStringOrInvalid(row.device_id);
      if (networkDeviceName === undefined) {
        invalidCount++;
        continue;
      }
      const applicationId = toValidStringOrInvalid(row.application_id);
      if (applicationId === undefined) {
        invalidCount++;
        continue;
      }
      const gatewayId = toValidStringOrInvalid(row.gateway_id);
      if (gatewayId === undefined) {
        invalidCount++;
        continue;
      }

      // Validate sparse fields: finite number or null
      const rssi = toValidFiniteNumberOrInvalid(row.rssi);
      if (rssi === undefined) {
        invalidCount++;
        continue;
      }
      const snr = toValidFiniteNumberOrInvalid(row.snr);
      if (snr === undefined) {
        invalidCount++;
        continue;
      }
      const rawStatus = toValidFiniteNumberOrInvalid(row.status);
      if (rawStatus === undefined) {
        invalidCount++;
        continue;
      }
      const rawState = toValidFiniteNumberOrInvalid(row.state);
      if (rawState === undefined) {
        invalidCount++;
        continue;
      }

      const tsIso = tsDate.toISOString();
      if (!earliestTs || tsIso < earliestTs) earliestTs = tsIso;
      if (!latestTs || tsIso > latestTs) latestTs = tsIso;

      validCount++;
      normalizedList.push({
        timestamp: tsIso,
        devEui: row.dev_eui,
        networkDeviceName,
        applicationId,
        gatewayId,
        rssi,
        snr,
        rawStatus,
        rawState,
      });
    }

    if (raw.data.length > 0 && validCount === 0) {
      throw new BadGatewayException('All returned upstream telemetry rows were invalid or malformed.');
    }

    normalizedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const returnedCount = raw.data.length;
    const reachedLimit = returnedCount >= base.queryRange.limit;
    const isTruncated = sourceTruncated === true || reachedLimit;

    const coverage: TelemetryCoverageSummary = {
      returnedCount,
      validCount,
      invalidCount,
      isTruncated,
      earliestTimestamp: earliestTs,
      latestTimestamp: latestTs,
      reachedLimit,
      sourceCount,
      sourceTruncated,
    };

    const latestReading = normalizedList[0] || null;

    const telemetry: SmokeTelemetryData = {
      type: 'smoke',
      category: 'unknown',
      latest: {
        timestamp: latestReading?.timestamp ?? null,
        rawStatus: latestReading?.rawStatus ?? null,
        rawState: latestReading?.rawState ?? null,
      },
      status: {
        label: 'Mã thô chưa xác nhận ý nghĩa',
        isConfirmed: false,
      },
      readings: normalizedList,
    };

    return {
      ...base,
      deviceType: 'smoke',
      coverage,
      telemetry,
    };
  }
}

