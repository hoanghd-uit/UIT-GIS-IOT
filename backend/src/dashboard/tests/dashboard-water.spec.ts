import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  BadGatewayException,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { DashboardWaterService } from '../dashboard-water.service';
import { DashboardWaterController } from '../dashboard-water.controller';
import { DashboardIotCatalogueService } from '../dashboard-iot-catalogue.service';
import { IotTelemetryService } from '../../iot/services/iot-telemetry.service';
import { DeviceTelemetryResponseDto } from '../../iot/dto/iot-telemetry.dto';
import { DashboardDeviceCatalogueResponse } from '../dto/dashboard-device-catalogue-response.dto';

describe('DashboardWaterService & Controller (Big Phase 02 / Phase 04)', () => {
  let waterService: DashboardWaterService;
  let controller: DashboardWaterController;
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
      fetchedAt: '2026-09-26T10:00:00.000Z',
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
        externalDeviceId: 'solar-01',
        sourceDeviceType: 'solar',
        category: 'solar',
        active: true,
        sourceCreatedAt: '2026-09-20T10:00:00.000Z',
        sourceUpdatedAt: '2026-09-20T10:00:00.000Z',
        sourceLocation: { x: 1, y: 2, z: 3, floorLevel: 6 },
        displayFloorId: '6',
        floorAssignment: 'source',
      },
      {
        externalDeviceId: '8cf9572000149bd3',
        sourceDeviceType: 'avc',
        category: 'avc',
        active: true,
        sourceCreatedAt: '2026-09-20T10:00:00.000Z',
        sourceUpdatedAt: '2026-09-20T10:00:00.000Z',
        sourceLocation: { x: 10, y: 20, z: 0, floorLevel: 0 },
        displayFloorId: null,
        floorAssignment: 'unmapped',
      },
      {
        externalDeviceId: '8cf9572000149d1f',
        sourceDeviceType: 'avc',
        category: 'avc',
        active: false,
        sourceCreatedAt: '2026-09-20T10:00:00.000Z',
        sourceUpdatedAt: '2026-09-20T10:00:00.000Z',
        sourceLocation: { x: 12, y: 22, z: 0, floorLevel: 0 },
        displayFloorId: null,
        floorAssignment: 'unmapped',
      },
    ],
  };

  const mockAvcTelemetryResponse: DeviceTelemetryResponseDto = {
    schemaVersion: 1,
    deviceId: '8cf9572000149bd3',
    deviceType: 'avc',
    fetchedAt: '2026-09-26T12:00:00.000Z',
    queryRange: {
      start: '2026-09-25T12:00:00.000Z',
      stop: '2026-09-26T12:00:00.000Z',
      limit: 1000,
    },
    coverage: {
      returnedCount: 2,
      validCount: 2,
      invalidCount: 0,
      isTruncated: false,
      earliestTimestamp: '2026-09-25T14:00:00.000Z',
      latestTimestamp: '2026-09-26T11:45:00.000Z',
      reachedLimit: false,
    },
    telemetry: {
      type: 'avc',
      category: 'avc',
      hero: {
        metric: 'instant_flow_m3h',
        label: 'Lưu lượng tức thời',
        unit: 'm³/h',
        value: 0,
        sampleTimestamp: '2026-09-26T11:45:00.000Z',
        pendingHardwareBadge: true,
      },
      secondarySelectors: {
        tempC: {
          metric: 'temp_c',
          label: 'Nhiệt độ',
          unit: '°C',
          value: 27,
          sampleTimestamp: '2026-09-26T11:45:00.000Z',
          pendingHardwareBadge: false,
        },
        fwdVolume: {
          metric: 'fwd_volume_m3',
          label: 'Thể tích thuận',
          unit: 'm³',
          value: 16.636,
          sampleTimestamp: '2026-09-26T11:45:00.000Z',
          pendingHardwareBadge: true,
        },
        revVolume: {
          metric: 'rev_volume_m3',
          label: 'Thể tích nghịch',
          unit: 'm³',
          value: 0,
          sampleTimestamp: '2026-09-26T11:45:00.000Z',
          pendingHardwareBadge: true,
        },
      },
      status: {
        label: 'Mã van: 1 (chưa xác nhận)',
        isConfirmed: false,
        rawFlags: {
          valveOpen: 1,
          pipeLeak: 0,
          pipeBurst: 0,
          batteryLow: 0,
          frozen: 1,
          tamper: 0,
          reverseFlow: 0,
        },
      },
      readings: [
        {
          timestamp: '2026-09-26T11:45:00.000Z',
          devEui: '8cf9572000149bd3',
          deviceName: 'testavc2',
          meterSn: '00000025870203',
          instantFlowM3h: 0, // valid zero
          fwdVolumeM3: 16.636,
          revVolumeM3: 0, // valid zero
          tempC: 27,
          rawValveOpen: 1,
          rawPipeLeak: 0,
          rawPipeBurst: 0,
          rawBatteryLow: 0,
          rawFrozen: 1,
          rawTamper: 0,
          rawReverseFlow: 0,
          rssi: -105,
          snr: 11.75,
          fcnt: 556,
          devAddr: '01ca3fa4',
          gatewayId: '58bf25fffee73060',
          region: 'as923_2',
          frequencyHz: 921400000,
          spreadingFactor: 7,
          dr: 5,
        },
        {
          timestamp: '2026-09-25T14:00:00.000Z',
          devEui: '8cf9572000149bd3',
          deviceName: 'testavc2',
          meterSn: '00000025870203',
          instantFlowM3h: 0.15,
          fwdVolumeM3: 16.201,
          revVolumeM3: 0,
          tempC: 26,
          rawValveOpen: 1,
          rawPipeLeak: 0,
          rawPipeBurst: 0,
          rawBatteryLow: 0,
          rawFrozen: 0,
          rawTamper: 0,
          rawReverseFlow: 0,
          rssi: -107,
          snr: 10.5,
          fcnt: 550,
          devAddr: '01ca3fa4',
          gatewayId: '58bf25fffee73060',
          region: 'as923_2',
          frequencyHz: 921400000,
          spreadingFactor: 7,
          dr: 5,
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
      resolveDeviceType: jest.fn().mockResolvedValue('avc'),
      getDeviceTelemetry: jest.fn().mockResolvedValue(mockAvcTelemetryResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardWaterController],
      providers: [
        DashboardWaterService,
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

    waterService = module.get<DashboardWaterService>(DashboardWaterService);
    controller = module.get<DashboardWaterController>(DashboardWaterController);
  });

  describe('Meter list: GET /api/v1/dashboard/buildings/:buildingId/water/meters', () => {
    it('returns only AVC devices, filtering out non-AVC catalogue devices', async () => {
      const res = await controller.getMeters('E', {});
      expect(res.buildingId).toBe('E');
      expect(res.availability).toBe('ready');
      expect(res.summary.acceptedCount).toBe(2);
      expect(res.meters.length).toBe(2);
      expect(res.meters.every((m) => m.sourceDeviceType === 'avc')).toBe(true);
      expect(res.meters[0].deviceId).toBe('8cf9572000149bd3');
      expect(res.meters[1].deviceId).toBe('8cf9572000149d1f');
    });

    it('preserves catalogue active flag without mapping to online/offline', async () => {
      const res = await controller.getMeters('E', {});
      expect(res.meters[0].catalogueActive).toBe(true);
      expect(res.meters[1].catalogueActive).toBe(false);
      // Ensure no online/offline fields
      expect((res.meters[0] as any).online).toBeUndefined();
      expect((res.meters[0] as any).status).toBeUndefined();
    });

    it('rejects unsupported building IDs with BadRequestException', async () => {
      await expect(controller.getMeters('A', {})).rejects.toThrow(BadRequestException);
      await expect(controller.getMeters('', {})).rejects.toThrow(BadRequestException);
    });

    it('returns availability: empty when catalogue has 0 AVC meters', async () => {
      mockCatalogueService.getCatalogue!.mockResolvedValueOnce({
        ...mockMixedCatalogueResponse,
        devices: [mockMixedCatalogueResponse.devices[0]], // only solar
      });

      const res = await controller.getMeters('E', {});
      expect(res.availability).toBe('empty');
      expect(res.meters.length).toBe(0);
      expect(res.summary.acceptedCount).toBe(0);
    });

    it('forwards floorId filter to catalogue service', async () => {
      await controller.getMeters('E', { floorId: '4' });
      expect(mockCatalogueService.getCatalogue).toHaveBeenCalledWith('E', '4');
    });
  });

  describe('Selected readings: GET /api/v1/dashboard/buildings/:buildingId/water/meters/:deviceId/readings', () => {
    const validQuery = {
      start: '2026-09-25T12:00:00.000Z',
      stop: '2026-09-26T12:00:00.000Z',
      limit: 1000,
    };

    it('returns normalized AVC readings preserving newest-first order and valid zero values', async () => {
      const res = await controller.getReadings('E', '8cf9572000149bd3', validQuery);

      expect(res.schemaVersion).toBe(1);
      expect(res.buildingId).toBe('E');
      expect(res.meterId).toBe('8cf9572000149bd3');
      expect(res.availability).toBe('ready');

      // Latest sample from newest row
      expect(res.latestSample).not.toBeNull();
      expect(res.latestSample?.observedAt).toBe('2026-09-26T11:45:00.000Z');
      expect(res.latestSample?.deviceName).toBe('testavc2');
      expect(res.latestSample?.meterSerial).toBe('00000025870203');
      expect(res.latestSample?.instantFlowM3h).toBe(0); // Valid zero preserved!
      expect(res.latestSample?.forwardVolumeM3).toBe(16.636);
      expect(res.latestSample?.reverseVolumeM3).toBe(0); // Valid zero preserved!
      expect(res.latestSample?.temperatureC).toBe(27);

      // Raw flags remain numeric codes with unconfirmed semantics
      expect(res.latestSample?.rawFlags.valveOpen).toBe(1);
      expect(res.latestSample?.rawFlags.frozen).toBe(1);
      expect(res.latestSample?.rawFlags.pipeLeak).toBe(0);

      // Readings array order: newest first
      expect(res.readings.length).toBe(2);
      expect(res.readings[0].observedAt).toBe('2026-09-26T11:45:00.000Z');
      expect(res.readings[1].observedAt).toBe('2026-09-25T14:00:00.000Z');
    });

    it('strictly enforces server-authoritative type and rejects non-AVC devices before telemetry fetch', async () => {
      mockTelemetryService.resolveDeviceType!.mockResolvedValueOnce('solar');

      await expect(
        controller.getReadings('E', '70B3D57ED0073E9D', validQuery),
      ).rejects.toThrow(BadRequestException);

      // Must NOT call getDeviceTelemetry for non-AVC device!
      expect(mockTelemetryService.getDeviceTelemetry).not.toHaveBeenCalled();
    });

    it('rejects NFC device ID before calling telemetry', async () => {
      mockTelemetryService.resolveDeviceType!.mockResolvedValueOnce('nfc');

      await expect(
        controller.getReadings('E', 'dummy01801182ed2814', validQuery),
      ).rejects.toThrow(BadRequestException);

      expect(mockTelemetryService.getDeviceTelemetry).not.toHaveBeenCalled();
    });

    it('rejects start >= stop', async () => {
      await expect(
        controller.getReadings('E', '8cf9572000149bd3', {
          start: '2026-09-26T12:00:00.000Z',
          stop: '2026-09-25T12:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects range duration > 7 days', async () => {
      await expect(
        controller.getReadings('E', '8cf9572000149bd3', {
          start: '2026-09-10T12:00:00.000Z',
          stop: '2026-09-26T12:00:00.000Z', // 16 days
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects limit > 1000', async () => {
      await expect(
        controller.getReadings('E', '8cf9572000149bd3', {
          ...validQuery,
          limit: 1001,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ServiceUnavailableException when mode is disabled', async () => {
      mockConfigValues['fixtures.mode'] = 'disabled';
      await expect(
        controller.getReadings('E', '8cf9572000149bd3', validQuery),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('throws ServiceUnavailableException when mode is fixture', async () => {
      mockConfigValues['fixtures.mode'] = 'fixture';
      await expect(
        controller.getReadings('E', '8cf9572000149bd3', validQuery),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('sanitizes upstream errors and never leaks bearer tokens or URLs', async () => {
      mockTelemetryService.resolveDeviceType!.mockRejectedValueOnce(
        new BadGatewayException('Error connecting to https://api.ttlab.manhthao.uk with Bearer secret-token-xyz'),
      );

      await expect(
        controller.getReadings('E', '8cf9572000149bd3', validQuery),
      ).rejects.toThrow(BadGatewayException);

      try {
        await controller.getReadings('E', '8cf9572000149bd3', validQuery);
      } catch (err: any) {
        expect(err.message).not.toContain('secret-token');
        expect(err.message).not.toContain('https://');
      }
    });
  });
});
