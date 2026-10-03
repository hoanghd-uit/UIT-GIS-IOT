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
  DashboardEnvironmentSourceListResponseDto,
  DashboardEnvironmentSourceItemDto,
} from './dto/dashboard-environment-source-list-response.dto';
import { DashboardEnvironmentSummaryQueryDto } from './dto/dashboard-environment-summary-query.dto';
import {
  DashboardEnvironmentSummaryResponseDto,
} from './dto/dashboard-environment-summary-response.dto';
import { DashboardEnvironmentReadingsQueryDto } from './dto/dashboard-environment-readings-query.dto';
import {
  DashboardEnvironmentReadingsResponseDto,
  DashboardEnvironmentLatestSampleDto,
  DashboardEnvironmentReadingItemDto,
} from './dto/dashboard-environment-readings-response.dto';
import {
  SolarTelemetryData,
  NormalizedSolarReading,
  SmartBuildingTelemetryData,
  NormalizedSmartBuildingReading,
} from '../iot/dto/iot-telemetry.dto';
import { DashboardDeviceCatalogueItem } from './dto/dashboard-device-catalogue-response.dto';
import {
  DeviceSampleResult,
  calculateEnvironmentSummary,
} from './dashboard-environment-summary';

const MAX_READINGS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days max for single source readings
const MAX_SUMMARY_DURATION_MS = 24 * 60 * 60 * 1000;     // 24 hours max for population summary
const MAX_SUMMARY_SOURCES = 20;                          // Cap candidates at 20
const SUMMARY_CONCURRENCY = 2;                           // Concurrency cap 2

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  const execute = async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  };
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => execute(),
  );
  await Promise.all(workers);
  return results;
}

@Injectable()
export class DashboardEnvironmentService {
  private readonly logger = new Logger(DashboardEnvironmentService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly catalogueService: DashboardIotCatalogueService,
    private readonly telemetryService: IotTelemetryService,
  ) {}

  /**
   * Returns list of authoritative Solar and SB environment candidate sources for Building E.
   * Reuses existing catalogue service, floor mapping, and room filtering.
   * Strictly read-only, request-time and in-memory. Zero database writes.
   */
  async getSources(
    buildingId: string,
    floorId?: string,
    roomId?: string,
  ): Promise<DashboardEnvironmentSourceListResponseDto> {
    const normalizedBuilding = (buildingId || '').trim().toUpperCase();
    if (normalizedBuilding !== 'E') {
      throw new BadRequestException(
        `Dashboard Environment sources currently supports Building E only (requested: ${buildingId}).`,
      );
    }

    const catalogue = await this.catalogueService.getCatalogue(normalizedBuilding, floorId, roomId);

    // Strictly filter candidate environment sources: solar and sb
    const envDevices = catalogue.devices.filter(
      (device) => device.sourceDeviceType === 'solar' || device.sourceDeviceType === 'sb',
    );

    const sources: DashboardEnvironmentSourceItemDto[] = envDevices.map((d) => {
      const sourceDeviceType = d.sourceDeviceType as 'solar' | 'sb';
      return {
        deviceId: d.externalDeviceId,
        sourceDeviceType,
        catalogueActive: d.active,
        sourceCreatedAt: d.sourceCreatedAt,
        sourceUpdatedAt: d.sourceUpdatedAt,
        sourceLocation: {
          x: d.sourceLocation.x,
          y: d.sourceLocation.y,
          z: d.sourceLocation.z,
          floorLevel: d.sourceLocation.floorLevel,
          ...(d.sourceLocation.roomId !== undefined ? { roomId: d.sourceLocation.roomId } : {}),
        },
        displayFloorId: d.displayFloorId,
        floorAssignment: d.floorAssignment,
        semanticStatus: 'unconfirmed_environment_candidate',
        supportedMetrics:
          sourceDeviceType === 'sb'
            ? ['co2', 'voc', 'voltage', 'visible', 'ir']
            : ['temperature', 'humidity', 'lux'],
      };
    });

    const acceptedSolarCount = sources.filter((s) => s.sourceDeviceType === 'solar').length;
    const acceptedSbCount = sources.filter((s) => s.sourceDeviceType === 'sb').length;
    const availability = sources.length > 0 ? 'ready' : 'empty';

    const caveats: string[] = [
      ...(catalogue.provenance.caveats || []),
      'Nguồn Solar và SB với các trường dữ liệu môi trường raw đang chờ xác nhận semantics từ đội ngũ phần cứng.',
    ];

    return {
      schemaVersion: 1,
      buildingId: normalizedBuilding,
      requestedFloorId: catalogue.requestedFloorId,
      availability,
      provenance: {
        mode: 'live',
        sourceType: 'iot_backend_catalogue',
        fetchedAt: catalogue.provenance.fetchedAt,
        caveats,
      },
      summary: {
        receivedCount: envDevices.length,
        acceptedSolarCount,
        acceptedSbCount,
        skippedCount: 0,
        duplicateCount: 0,
        truncated: catalogue.summary.truncated,
      },
      sources,
    };
  }

  /**
   * Bounded in-memory latest population summary over Solar and SB candidate sources.
   * Total cap 20 sources, deterministic type interleaving, max concurrency 2, limit=1 per source, max 24h duration.
   * Zero database writes.
   */
  async getSummary(
    buildingId: string,
    query: DashboardEnvironmentSummaryQueryDto,
  ): Promise<DashboardEnvironmentSummaryResponseDto> {
    const mode = this.config.get<string>('fixtures.mode', 'disabled');
    if (mode === 'disabled') {
      throw new ServiceUnavailableException(
        'IoT device integration is disabled (DEVICE_SOURCE_MODE=disabled).',
      );
    }
    if (mode === 'fixture') {
      throw new ServiceUnavailableException(
        'Live IoT environment telemetry is unavailable in fixture mode (DEVICE_SOURCE_MODE=fixture).',
      );
    }

    const normalizedBuilding = (buildingId || '').trim().toUpperCase();
    if (normalizedBuilding !== 'E') {
      throw new BadRequestException(
        `Dashboard Environment summary currently supports Building E only (requested: ${buildingId}).`,
      );
    }

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
    if (durationMs > MAX_SUMMARY_DURATION_MS) {
      throw new BadRequestException('Query range duration cannot exceed 24 hours for summary.');
    }

    const startIso = startDate.toISOString();
    const stopIso = endDate.toISOString();

    // 1. Fetch catalogue to identify candidate Solar and SB devices
    const catalogue = await this.catalogueService.getCatalogue(normalizedBuilding);
    const solarDevices = catalogue.devices.filter(
      (d) => d.sourceDeviceType === 'solar',
    );
    const sbDevices = catalogue.devices.filter(
      (d) => d.sourceDeviceType === 'sb',
    );

    const catalogueSolarCount = solarDevices.length;
    const catalogueSbCount = sbDevices.length;
    const totalCandidateCount = catalogueSolarCount + catalogueSbCount;
    const sourcesTruncated = totalCandidateCount > MAX_SUMMARY_SOURCES;

    // Deterministic fair type-interleaving selection:
    // Sort opaque IDs in each type, alternating Solar/SB up to total cap 20
    const sortedSolar = [...solarDevices].sort((a, b) =>
      a.externalDeviceId.localeCompare(b.externalDeviceId),
    );
    const sortedSb = [...sbDevices].sort((a, b) =>
      a.externalDeviceId.localeCompare(b.externalDeviceId),
    );

    const candidateDevices: DashboardDeviceCatalogueItem[] = [];
    let sIdx = 0;
    let bIdx = 0;
    while (
      candidateDevices.length < MAX_SUMMARY_SOURCES &&
      (sIdx < sortedSolar.length || bIdx < sortedSb.length)
    ) {
      if (sIdx < sortedSolar.length) {
        candidateDevices.push(sortedSolar[sIdx++]);
      }
      if (candidateDevices.length < MAX_SUMMARY_SOURCES && bIdx < sortedSb.length) {
        candidateDevices.push(sortedSb[bIdx++]);
      }
    }

    const attemptedSourceCount = candidateDevices.length;
    const attemptedSolarCount = candidateDevices.filter((d) => d.sourceDeviceType === 'solar').length;
    const attemptedSbCount = candidateDevices.filter((d) => d.sourceDeviceType === 'sb').length;

    const fetchedAt = new Date().toISOString();

    if (attemptedSourceCount === 0) {
      const summaryResult = calculateEnvironmentSummary([]);
      return {
        schemaVersion: 1,
        buildingId: normalizedBuilding,
        availability: 'empty',
        queryRange: {
          start: startIso,
          stop: stopIso,
          limitPerSource: 1,
        },
        provenance: {
          mode: 'derived',
          sourceType: 'iot_backend_environment',
          calculation: 'latest_sample_population_summary_v1',
          fetchedAt,
          calculatedAt: new Date().toISOString(),
          caveats: ['Không tìm thấy thiết bị Solar hoặc SB nào trong catalogue của tòa nhà.'],
        },
        coverage: {
          catalogueSolarCount: 0,
          catalogueSbCount: 0,
          attemptedSourceCount: 0,
          attemptedSolarCount: 0,
          attemptedSbCount: 0,
          successfulSourceCount: 0,
          emptySourceCount: 0,
          failedSourceCount: 0,
          sourcesTruncated: false,
          selectionPolicy: 'type_interleaving_v1',
        },
        metrics: summaryResult.metrics,
        latestObservedAt: null,
        sourceResults: [],
      };
    }

    // 2. Fetch history bounded with limit=1, max concurrency 2
    const deviceResults: DeviceSampleResult[] = await runWithConcurrency(
      candidateDevices,
      SUMMARY_CONCURRENCY,
      async (device): Promise<DeviceSampleResult> => {
        try {
          const telemetryResult = await this.telemetryService.getDeviceTelemetry(
            device.externalDeviceId,
            {
              start: startIso,
              stop: stopIso,
              limit: 1,
            },
          );

          if (device.sourceDeviceType === 'sb') {
            const sbData = telemetryResult.telemetry as SmartBuildingTelemetryData;
            const readings = Array.isArray(sbData?.readings) ? sbData.readings : [];
            if (readings.length > 0) {
              return {
                deviceId: device.externalDeviceId,
                sourceDeviceType: 'sb',
                status: 'ready',
                reading: readings[0],
              };
            }
            return {
              deviceId: device.externalDeviceId,
              sourceDeviceType: 'sb',
              status: 'empty',
              reading: null,
            };
          } else {
            const solarData = telemetryResult.telemetry as SolarTelemetryData;
            const readings = Array.isArray(solarData?.readings) ? solarData.readings : [];
            if (readings.length > 0) {
              return {
                deviceId: device.externalDeviceId,
                sourceDeviceType: 'solar',
                status: 'ready',
                reading: readings[0],
              };
            }
            return {
              deviceId: device.externalDeviceId,
              sourceDeviceType: 'solar',
              status: 'empty',
              reading: null,
            };
          }
        } catch (err: unknown) {
          this.logger.warn(
            `Failed to fetch latest sample for ${device.sourceDeviceType} candidate ${device.externalDeviceId}: ${(err as Error)?.message}`,
          );
          return {
            deviceId: device.externalDeviceId,
            sourceDeviceType: device.sourceDeviceType as 'solar' | 'sb',
            status: 'error',
            reading: null,
          };
        }
      },
    );

    const calculatedAt = new Date().toISOString();
    const summaryResult = calculateEnvironmentSummary(deviceResults);

    const successfulSourceCount = deviceResults.filter((r) => r.status === 'ready').length;
    const emptySourceCount = deviceResults.filter((r) => r.status === 'empty').length;
    const failedSourceCount = deviceResults.filter((r) => r.status === 'error').length;

    // Determine availability
    let availability: 'ready' | 'partial' | 'empty';
    if (successfulSourceCount > 0 && failedSourceCount === 0 && !sourcesTruncated) {
      const hasData =
        summaryResult.metrics.rawTemperature.contributingSourceCount > 0 ||
        summaryResult.metrics.rawHumidity.contributingSourceCount > 0 ||
        summaryResult.metrics.lux.contributingSourceCount > 0 ||
        (summaryResult.metrics.co2?.contributingSourceCount ?? 0) > 0;
      availability = hasData ? 'ready' : 'empty';
    } else if (failedSourceCount > 0 || sourcesTruncated) {
      availability = successfulSourceCount > 0 ? 'partial' : 'empty';
    } else {
      availability = 'empty';
    }

    // Caveats
    const caveats: string[] = [];
    caveats.push(
      'Các trường rawTemperature và rawHumidity là số đo thô từ Solar telemetry theo hợp đồng kỹ thuật §3.6.',
    );
    caveats.push(
      'Chỉ số CO₂ từ Smart Building (SB) được giả định dùng đơn vị tiêu chuẩn ppm.',
    );
    caveats.push(
      'Chỉ số trung bình là tổng hợp thống kê theo request trên các mẫu mới nhất, không phải giá trị trung bình phòng hoặc tòa nhà.',
    );
    if (sourcesTruncated) {
      caveats.push(
        `Tổng số nguồn môi trường (${totalCandidateCount}) vượt giới hạn ${MAX_SUMMARY_SOURCES} nguồn/yêu cầu; áp dụng chính sách type interleaving trên ${MAX_SUMMARY_SOURCES} nguồn đầu tiên.`,
      );
    }
    if (failedSourceCount > 0) {
      caveats.push(
        `${failedSourceCount} nguồn môi trường gặp lỗi hoặc timeout khi truy vấn và đã được loại khỏi thống kê.`,
      );
    }

    return {
      schemaVersion: 1,
      buildingId: normalizedBuilding,
      availability,
      queryRange: {
        start: startIso,
        stop: stopIso,
        limitPerSource: 1,
      },
      provenance: {
        mode: 'derived',
        sourceType: 'iot_backend_environment',
        calculation: 'latest_sample_population_summary_v1',
        fetchedAt,
        calculatedAt,
        caveats,
      },
      coverage: {
        catalogueSolarCount,
        catalogueSbCount,
        attemptedSourceCount,
        attemptedSolarCount,
        attemptedSbCount,
        successfulSourceCount,
        emptySourceCount,
        failedSourceCount,
        sourcesTruncated,
        selectionPolicy: 'type_interleaving_v1',
      },
      metrics: summaryResult.metrics,
      latestObservedAt: summaryResult.latestObservedAt,
      sourceResults: summaryResult.sourceResults,
    };
  }

  /**
   * Fetches, validates, and normalizes live readings for a single selected Solar or SB device.
   * Strictly read-only, request-time and in-memory. Zero database writes.
   */
  async getReadings(
    buildingId: string,
    deviceId: string,
    query: DashboardEnvironmentReadingsQueryDto,
  ): Promise<DashboardEnvironmentReadingsResponseDto> {
    const mode = this.config.get<string>('fixtures.mode', 'disabled');
    if (mode === 'disabled') {
      throw new ServiceUnavailableException(
        'IoT device integration is disabled (DEVICE_SOURCE_MODE=disabled).',
      );
    }
    if (mode === 'fixture') {
      throw new ServiceUnavailableException(
        'Live IoT environment telemetry is unavailable in fixture mode (DEVICE_SOURCE_MODE=fixture).',
      );
    }

    const normalizedBuilding = (buildingId || '').trim().toUpperCase();
    if (normalizedBuilding !== 'E') {
      throw new BadRequestException(
        `Dashboard Environment readings currently supports Building E only (requested: ${buildingId}).`,
      );
    }

    const trimmedDeviceId = (deviceId || '').trim();
    if (!trimmedDeviceId) {
      throw new BadRequestException('Device ID must be a non-empty string.');
    }

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
    if (durationMs > MAX_READINGS_DURATION_MS) {
      throw new BadRequestException('Query range duration cannot exceed 7 days.');
    }

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

    // Server-authoritative type resolution: must strictly be 'solar' or 'sb'
    let resolvedType: string;
    try {
      resolvedType = await this.telemetryService.resolveDeviceType(trimmedDeviceId);
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw this.sanitizeError(err);
      }
      throw new BadGatewayException('Failed to resolve device metadata from upstream IoT service.');
    }

    if (resolvedType !== 'solar' && resolvedType !== 'sb') {
      throw new BadRequestException(
        `Device '${trimmedDeviceId}' has type '${resolvedType}', which is not an Environment device (supported: solar, sb).`,
      );
    }

    // Fetch telemetry through shared IotTelemetryService
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
      this.logger.error(`Error fetching environment telemetry for ${trimmedDeviceId}: ${(err as Error)?.message}`);
      throw new BadGatewayException('Failed to communicate with upstream IoT service.');
    }

    let latestSample: DashboardEnvironmentLatestSampleDto | null = null;
    let readings: DashboardEnvironmentReadingItemDto[] = [];
    const caveats: string[] = [];

    if (rawResult.coverage.isTruncated) {
      caveats.push('Dữ liệu telemetry bị giới hạn hoặc cắt bớt bởi giới hạn truy vấn.');
    }
    if (rawResult.coverage.invalidCount > 0) {
      caveats.push(`${rawResult.coverage.invalidCount} bản ghi telemetry không hợp lệ đã bị bỏ qua.`);
    }

    if (resolvedType === 'sb') {
      const sbTelemetry = rawResult.telemetry as SmartBuildingTelemetryData;
      const rawReadings: NormalizedSmartBuildingReading[] = Array.isArray(sbTelemetry?.readings)
        ? sbTelemetry.readings
        : [];

      const newestRow = rawReadings.length > 0 ? rawReadings[0] : null;

      latestSample = newestRow
        ? {
            observedAt: newestRow.timestamp,
            rawCo2: newestRow.rawCo2 ?? null,
            rawVoc: newestRow.rawVoc ?? null,
            rawVoltage: newestRow.rawVoltage ?? null,
            rawVisible: newestRow.rawVisible ?? null,
            rawIr: newestRow.rawIr ?? null,
            networkDeviceName: newestRow.networkDeviceName ?? null,
            applicationId: newestRow.applicationId ?? null,
            gatewayId: newestRow.gatewayId ?? null,
            rssiDbm: newestRow.rssi ?? null,
            snrDb: newestRow.snr ?? null,
            fCnt: newestRow.fCnt ?? null,
          }
        : null;

      readings = rawReadings.map((r) => ({
        observedAt: r.timestamp,
        rawCo2: r.rawCo2 ?? null,
        rawVoc: r.rawVoc ?? null,
        rawVoltage: r.rawVoltage ?? null,
        rawVisible: r.rawVisible ?? null,
        rawIr: r.rawIr ?? null,
        networkDeviceName: r.networkDeviceName ?? null,
        applicationId: r.applicationId ?? null,
        gatewayId: r.gatewayId ?? null,
        rssiDbm: r.rssi ?? null,
        snrDb: r.snr ?? null,
        fCnt: r.fCnt ?? null,
      }));

      caveats.push(
        'Chỉ số CO₂ của nguồn Smart Building được giả định dùng đơn vị tiêu chuẩn ppm (chưa có xác nhận kỹ thuật từ đội ngũ phần cứng).',
      );
      caveats.push(
        'Chỉ số VOC là chỉ số tương đối (VOC index), không biểu thị nồng độ tuyệt đối.',
      );
    } else {
      const solarTelemetry = rawResult.telemetry as SolarTelemetryData;
      const rawReadings: NormalizedSolarReading[] = Array.isArray(solarTelemetry?.readings)
        ? solarTelemetry.readings
        : [];

      const newestRow = rawReadings.length > 0 ? rawReadings[0] : null;

      latestSample = newestRow
        ? {
            observedAt: newestRow.timestamp,
            rawTemperature: newestRow.rawTemperature ?? null,
            rawHumidity: newestRow.rawHumidity ?? null,
            lux: newestRow.lux ?? null,
            currentUa: newestRow.currentUa ?? null,
            rawVoltage: newestRow.rawVoltage ?? null,
            rawState: newestRow.rawState ?? null,
            gatewayId: newestRow.gatewayId ?? null,
            rssiDbm: newestRow.rssi ?? null,
            snrDb: newestRow.snr ?? null,
          }
        : null;

      readings = rawReadings.map((r) => ({
        observedAt: r.timestamp,
        rawTemperature: r.rawTemperature ?? null,
        rawHumidity: r.rawHumidity ?? null,
        lux: r.lux ?? null,
        currentUa: r.currentUa ?? null,
        rawVoltage: r.rawVoltage ?? null,
        rawState: r.rawState ?? null,
        gatewayId: r.gatewayId ?? null,
        rssiDbm: r.rssi ?? null,
        snrDb: r.snr ?? null,
        fCnt: r.fCnt ?? null,
      }));

      caveats.push(
        'Thông số nhiệt độ và độ ẩm của nguồn Solar chưa được xác nhận ý nghĩa vật lý (chưa có đơn vị đo chuẩn).',
      );
      caveats.push(
        'Nhiệt độ và độ ẩm chưa đại diện cho điều kiện vi khí hậu phòng cụ thể.',
      );
    }

    const availability = rawResult.coverage.validCount > 0 ? 'ready' : 'empty';

    return {
      schemaVersion: 1,
      buildingId: normalizedBuilding,
      sourceId: trimmedDeviceId,
      sourceDeviceType: resolvedType as 'solar' | 'sb',
      availability,
      queryRange: {
        start: startIso,
        stop: stopIso,
        limit,
      },
      provenance: {
        mode: 'live',
        sourceId: `environment_readings_${trimmedDeviceId}`,
        sourceType: resolvedType === 'sb' ? 'iot_backend_sb' : 'iot_backend_solar',
        observedAt: latestSample?.observedAt,
        windowStart: startIso,
        windowEnd: stopIso,
        fetchedAt: rawResult.fetchedAt,
        caveats,
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
