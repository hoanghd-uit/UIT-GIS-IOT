import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  BadGatewayException,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { DashboardEnvironmentService } from '../dashboard-environment.service';
import { DashboardEnvironmentController } from '../dashboard-environment.controller';
import { DashboardIotCatalogueService } from '../dashboard-iot-catalogue.service';
import { IotTelemetryService } from '../../iot/services/iot-telemetry.service';
import { DeviceTelemetryResponseDto } from '../../iot/dto/iot-telemetry.dto';
import { DashboardDeviceCatalogueResponse } from '../dto/dashboard-device-catalogue-response.dto';
import { calculateEnvironmentSummary } from '../dashboard-environment-summary';

describe('DashboardEnvironmentService & Controller (Big Phase 02 / Phase 05)', () => {
  let environmentService: DashboardEnvironmentService;
  let controller: DashboardEnvironmentController;
  let mockCatalogueService: jest.Mocked<Partial<DashboardIotCatalogueService>>;
  let mockTelemetryService: jest.Mocked<Partial<IotTelemetryService>>;
  let mockConfigValues: Record<string, any>;

  const mockMixedCatalogueResponse: DashboardDeviceCatalogueResponse = {
    schemaVersion: 1,
    buildingId: 'E',
    requestedFloorId: null,
    availability: 'ready',
    provenance: {
      mode: 'live',
      sourceId: 'iot-device-catalogue',
      sourceType: 'iot_backend',
      fetchedAt: '2026-09-27T10:00:00.000Z',
    },
    mapping: {
      floorMode: 'DEFAULT',
      developmentFallbackApplied: false,
      requestedUpstreamFloorLevel: null,
    },
    summary: {
      receivedCount: 3,
      acceptedCount: 3,
      skippedCount: 0,
      duplicateCount: 0,
      truncated: false,
    },
    devices: [
      {
        externalDeviceId: 'solar-eui-01',
        sourceDeviceType: 'solar',
        category: 'solar',
        active: true,
        sourceCreatedAt: '2026-09-20T10:00:00.000Z',
        sourceUpdatedAt: '2026-09-20T10:00:00.000Z',
        sourceLocation: { x: 1, y: 2, z: 3, floorLevel: 4 },
        displayFloorId: '4',
        floorAssignment: 'source',
      },
      {
        externalDeviceId: 'solar-eui-02',
        sourceDeviceType: 'solar',
        category: 'solar',
        active: false,
        sourceCreatedAt: '2026-09-21T10:00:00.000Z',
        sourceUpdatedAt: '2026-09-21T10:00:00.000Z',
        sourceLocation: { x: 4, y: 5, z: 6, floorLevel: 6 },
        displayFloorId: '6',
        floorAssignment: 'source',
      },
      {
        externalDeviceId: 'avc-water-01',
        sourceDeviceType: 'avc',
        category: 'water_meter',
        active: true,
        sourceCreatedAt: '2026-09-22T10:00:00.000Z',
        sourceUpdatedAt: '2026-09-22T10:00:00.000Z',
        sourceLocation: { x: 7, y: 8, z: 9, floorLevel: 4 },
        displayFloorId: '4',
        floorAssignment: 'source',
      },
    ],
  };

  const mockSolarTelemetryResponse: DeviceTelemetryResponseDto = {
    schemaVersion: 1,
    deviceId: 'solar-eui-01',
    deviceType: 'solar',
    fetchedAt: '2026-09-27T10:00:00.000Z',
    queryRange: {
      start: '2026-09-26T10:00:00.000Z',
      stop: '2026-09-27T10:00:00.000Z',
      limit: 1000,
    },
    coverage: {
      returnedCount: 2,
      validCount: 2,
      invalidCount: 0,
      isTruncated: false,
      earliestTimestamp: '2026-09-26T11:00:00.000Z',
      latestTimestamp: '2026-09-27T09:00:00.000Z',
      reachedLimit: false,
    },
    telemetry: {
      type: 'solar',
      category: 'solar',
      hero: {
        metric: 'current_uA',
        label: 'Current',
        unit: 'uA',
        value: 1200,
        sampleTimestamp: '2026-09-27T09:00:00.000Z',
      },
      secondarySelector: {
        metric: 'lux',
        label: 'Lux',
        unit: 'lux',
        value: 450,
        sampleTimestamp: '2026-09-27T09:00:00.000Z',
      },
      status: {
        label: 'Normal',
        rawState: 1,
        isConfirmed: false,
      },
      readings: [
        {
          timestamp: '2026-09-27T09:00:00.000Z',
          devEui: 'solar-eui-01',
          deviceIdFriendly: 'Solar-01',
          currentUa: 1200,
          lux: 450,
          rssi: -82,
          snr: 9.1,
          rawState: 1,
          rawVoltage: 3300,
          rawTemperature: 26.5,
          rawHumidity: 62.0,
          fCnt: 105,
          applicationId: 'app-01',
          gatewayId: 'gw-01',
        },
        {
          timestamp: '2026-09-26T11:00:00.000Z',
          devEui: 'solar-eui-01',
          deviceIdFriendly: 'Solar-01',
          currentUa: 800,
          lux: 300,
          rssi: -85,
          snr: 8.4,
          rawState: 1,
          rawVoltage: 3250,
          rawTemperature: 25.1,
          rawHumidity: 65.5,
          fCnt: 104,
          applicationId: 'app-01',
          gatewayId: 'gw-01',
        },
      ],
    },
  };

  beforeEach(async () => {
    mockConfigValues = {
      'fixtures.mode': 'iot',
    };

    mockCatalogueService = {
      getCatalogue: jest.fn().mockResolvedValue(mockMixedCatalogueResponse),
    };

    mockTelemetryService = {
      resolveDeviceType: jest.fn().mockResolvedValue('solar'),
      getDeviceTelemetry: jest.fn().mockResolvedValue(mockSolarTelemetryResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardEnvironmentController],
      providers: [
        DashboardEnvironmentService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              return mockConfigValues[key] !== undefined ? mockConfigValues[key] : defaultValue;
            }),
          },
        },
        {
          provide: DashboardIotCatalogueService,
          useValue: mockCatalogueService,
        },
        {
          provide: IotTelemetryService,
          useValue: mockTelemetryService,
        },
      ],
    }).compile();

    environmentService = module.get<DashboardEnvironmentService>(DashboardEnvironmentService);
    controller = module.get<DashboardEnvironmentController>(DashboardEnvironmentController);
  });

  describe('GET /api/v1/dashboard/buildings/:buildingId/environment/sources', () => {
    it('returns only authoritative Solar sources from catalogue, filtering out AVC devices', async () => {
      const result = await controller.getSources('E', {});

      expect(result.schemaVersion).toBe(1);
      expect(result.buildingId).toBe('E');
      expect(result.availability).toBe('ready');
      expect(result.summary.acceptedSolarCount).toBe(2);
      expect(result.sources).toHaveLength(2);
      expect(result.sources.map((s) => s.deviceId)).toEqual(['solar-eui-01', 'solar-eui-02']);
      expect(result.sources.every((s) => s.sourceDeviceType === 'solar')).toBe(true);
      expect(result.sources.every((s) => s.semanticStatus === 'unconfirmed_environment_candidate')).toBe(true);
      expect(result.sources[0].catalogueActive).toBe(true);
      expect(result.sources[1].catalogueActive).toBe(false);
    });

    it('rejects any buildingId other than E', async () => {
      await expect(controller.getSources('A', {})).rejects.toThrow(BadRequestException);
      await expect(controller.getSources('B', {})).rejects.toThrow(
        /Dashboard Environment sources currently supports Building E only/i,
      );
    });

    it('returns empty availability when no solar devices exist', async () => {
      mockCatalogueService.getCatalogue!.mockResolvedValueOnce({
        ...mockMixedCatalogueResponse,
        devices: [mockMixedCatalogueResponse.devices[2]], // only AVC
      });

      const result = await controller.getSources('E', {});
      expect(result.availability).toBe('empty');
      expect(result.sources).toHaveLength(0);
      expect(result.summary.acceptedSolarCount).toBe(0);
    });
  });

  describe('GET /api/v1/dashboard/buildings/:buildingId/environment/summary', () => {
    const validSummaryQuery = {
      start: '2026-09-26T12:00:00.000Z',
      stop: '2026-09-27T12:00:00.000Z',
    };

    it('calculates request-scoped in-memory population summary with derived provenance', async () => {
      const result = await controller.getSummary('E', validSummaryQuery);

      expect(result.schemaVersion).toBe(1);
      expect(result.buildingId).toBe('E');
      expect(result.availability).toBe('ready');
      expect(result.provenance.mode).toBe('derived');
      expect(result.provenance.calculation).toBe('latest_sample_population_summary_v1');
      expect(result.coverage.catalogueSolarCount).toBe(2);
      expect(result.coverage.attemptedSourceCount).toBe(2);
      expect(result.coverage.successfulSourceCount).toBe(2);
      expect(result.coverage.failedSourceCount).toBe(0);
      expect(result.coverage.sourcesTruncated).toBe(false);

      // Latest reading in mock is 26.5 temp, 62.0 humidity, 450 lux
      expect(result.metrics.rawTemperature.mean).toBe(26.5);
      expect(result.metrics.rawTemperature.unit).toBeNull();
      expect(result.metrics.rawHumidity.mean).toBe(62.0);
      expect(result.metrics.rawHumidity.unit).toBeNull();
      expect(result.metrics.lux.mean).toBe(450);
      expect(result.metrics.lux.unit).toBe('lux');
      expect(result.latestObservedAt).toBe('2026-09-27T09:00:00.000Z');
    });

    it('enforces duration cap of max 24 hours', async () => {
      const tooLongQuery = {
        start: '2026-09-20T00:00:00.000Z',
        stop: '2026-09-25T00:00:00.000Z', // 5 days
      };

      await expect(controller.getSummary('E', tooLongQuery)).rejects.toThrow(BadRequestException);
      await expect(controller.getSummary('E', tooLongQuery)).rejects.toThrow(
        /Query range duration cannot exceed 24 hours for summary/i,
      );
    });

    it('requires start to be strictly before stop', async () => {
      const invalidOrder = {
        start: '2026-09-27T12:00:00.000Z',
        stop: '2026-09-26T12:00:00.000Z',
      };

      await expect(controller.getSummary('E', invalidOrder)).rejects.toThrow(BadRequestException);
    });

    it('handles partial failures gracefully without failing the entire summary request', async () => {
      mockTelemetryService.getDeviceTelemetry!.mockImplementation(async (id) => {
        if (id === 'solar-eui-02') {
          throw new BadGatewayException('Upstream device timeout');
        }
        return mockSolarTelemetryResponse;
      });

      const result = await controller.getSummary('E', validSummaryQuery);

      expect(result.availability).toBe('partial');
      expect(result.coverage.successfulSourceCount).toBe(1);
      expect(result.coverage.failedSourceCount).toBe(1);
      expect(result.metrics.rawTemperature.contributingSourceCount).toBe(1);
      expect(result.sourceResults).toEqual([
        { deviceId: 'solar-eui-01', status: 'ready', observedAt: '2026-09-27T09:00:00.000Z' },
        { deviceId: 'solar-eui-02', status: 'error', observedAt: null },
      ]);
      expect(result.provenance.caveats.some((c) => c.includes('1 nguồn Solar gặp lỗi'))).toBe(true);
    });

    it('caps candidate devices at 20 and flags sourcesTruncated', async () => {
      const manySolarDevices = Array.from({ length: 25 }, (_, i) => ({
        externalDeviceId: `solar-${i}`,
        sourceDeviceType: 'solar' as const,
        category: 'solar' as const,
        active: true,
        sourceCreatedAt: '2026-09-20T10:00:00.000Z',
        sourceUpdatedAt: '2026-09-20T10:00:00.000Z',
        sourceLocation: { x: 0, y: 0, z: 0, floorLevel: 4 },
        displayFloorId: '4',
        floorAssignment: 'source' as const,
      }));

      mockCatalogueService.getCatalogue!.mockResolvedValueOnce({
        ...mockMixedCatalogueResponse,
        devices: manySolarDevices,
      });

      const result = await controller.getSummary('E', validSummaryQuery);

      expect(result.coverage.catalogueSolarCount).toBe(25);
      expect(result.coverage.attemptedSourceCount).toBe(20);
      expect(result.coverage.sourcesTruncated).toBe(true);
      expect(result.availability).toBe('partial');
    });

    it('blocks request when DEVICE_SOURCE_MODE is disabled or fixture', async () => {
      mockConfigValues['fixtures.mode'] = 'disabled';
      await expect(controller.getSummary('E', validSummaryQuery)).rejects.toThrow(ServiceUnavailableException);

      mockConfigValues['fixtures.mode'] = 'fixture';
      await expect(controller.getSummary('E', validSummaryQuery)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('calculateEnvironmentSummary unit tests', () => {
    it('preserves valid 0, ignores null/non-finite, and computes correct mean/min/max', () => {
      const samples = [
        {
          deviceId: 'dev-1',
          status: 'ready' as const,
          reading: {
            timestamp: '2026-09-27T01:00:00.000Z',
            devEui: 'dev-1',
            deviceIdFriendly: null,
            currentUa: null,
            lux: 0, // Valid 0 for lux!
            rssi: null,
            snr: null,
            rawState: null,
            rawVoltage: null,
            rawTemperature: 0, // Valid 0 for temp!
            rawHumidity: 50,
            fCnt: null,
            applicationId: null,
            gatewayId: null,
          },
        },
        {
          deviceId: 'dev-2',
          status: 'ready' as const,
          reading: {
            timestamp: '2026-09-27T02:00:00.000Z',
            devEui: 'dev-2',
            deviceIdFriendly: null,
            currentUa: null,
            lux: 200,
            rssi: null,
            snr: null,
            rawState: null,
            rawVoltage: null,
            rawTemperature: 30,
            rawHumidity: null, // null humidity
            fCnt: null,
            applicationId: null,
            gatewayId: null,
          },
        },
        {
          deviceId: 'dev-3',
          status: 'empty' as const,
          reading: null,
        },
      ];

      const res = calculateEnvironmentSummary(samples);

      // Temperature: 0 and 30 -> mean 15, min 0, max 30, count 2
      expect(res.metrics.rawTemperature.contributingSourceCount).toBe(2);
      expect(res.metrics.rawTemperature.min).toBe(0);
      expect(res.metrics.rawTemperature.max).toBe(30);
      expect(res.metrics.rawTemperature.mean).toBe(15);
      expect(res.metrics.rawTemperature.unit).toBeNull();

      // Humidity: only 50 contributes -> mean 50, count 1
      expect(res.metrics.rawHumidity.contributingSourceCount).toBe(1);
      expect(res.metrics.rawHumidity.mean).toBe(50);
      expect(res.metrics.rawHumidity.min).toBe(50);
      expect(res.metrics.rawHumidity.max).toBe(50);

      // Lux: 0 and 200 -> mean 100, min 0, max 200, count 2
      expect(res.metrics.lux.contributingSourceCount).toBe(2);
      expect(res.metrics.lux.min).toBe(0);
      expect(res.metrics.lux.max).toBe(200);
      expect(res.metrics.lux.mean).toBe(100);
      expect(res.metrics.lux.unit).toBe('lux');

      expect(res.latestObservedAt).toBe('2026-09-27T02:00:00.000Z');
    });
  });

  describe('GET /api/v1/dashboard/buildings/:buildingId/environment/sources/:deviceId/readings', () => {
    const validReadingsQuery = {
      start: '2026-09-26T12:00:00.000Z',
      stop: '2026-09-27T12:00:00.000Z',
      limit: 1000,
    };

    it('returns normalized readings for a single selected Solar device', async () => {
      const result = await controller.getReadings('E', 'solar-eui-01', validReadingsQuery);

      expect(result.schemaVersion).toBe(1);
      expect(result.buildingId).toBe('E');
      expect(result.sourceId).toBe('solar-eui-01');
      expect(result.sourceDeviceType).toBe('solar');
      expect(result.availability).toBe('ready');
      expect(result.provenance.mode).toBe('live');
      expect(result.latestSample).not.toBeNull();
      expect(result.latestSample?.rawTemperature).toBe(26.5);
      expect(result.latestSample?.rawHumidity).toBe(62.0);
      expect(result.latestSample?.lux).toBe(450);
      expect(result.readings).toHaveLength(2);
      // Newest-first preservation
      expect(result.readings[0].observedAt).toBe('2026-09-27T09:00:00.000Z');
      expect(result.readings[1].observedAt).toBe('2026-09-26T11:00:00.000Z');
    });

    it('rejects devices that are not of type solar', async () => {
      mockTelemetryService.resolveDeviceType!.mockResolvedValue('avc');

      await expect(controller.getReadings('E', 'avc-water-01', validReadingsQuery)).rejects.toThrow(
        /is not a Solar device \(supported: solar\)/i,
      );
    });

    it('enforces 7-day duration cap on single source readings', async () => {
      const longQuery = {
        start: '2026-09-01T00:00:00.000Z',
        stop: '2026-09-20T00:00:00.000Z', // 19 days
      };

      await expect(controller.getReadings('E', 'solar-eui-01', longQuery)).rejects.toThrow(
        /Query range duration cannot exceed 7 days/i,
      );
    });

    it('sanitizes upstream exceptions to prevent secret/token leaks', async () => {
      mockTelemetryService.getDeviceTelemetry!.mockRejectedValue(
        new BadGatewayException('Upstream Bearer eyJhbGciOiJIUzI1Ni... token rejected at https://api.iot.example.com'),
      );

      await expect(controller.getReadings('E', 'solar-eui-01', validReadingsQuery)).rejects.toThrow(
        'Upstream IoT API authentication failed (401 Unauthorized).',
      );
    });
  });
});
