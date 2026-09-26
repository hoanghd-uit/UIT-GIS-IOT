import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  BadGatewayException,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { DashboardIotTelemetryService } from '../dashboard-iot-telemetry.service';
import { DashboardIotController } from '../dashboard-iot.controller';
import { DashboardIotCatalogueService } from '../dashboard-iot-catalogue.service';
import { IotTelemetryService } from '../../iot/services/iot-telemetry.service';
import { DeviceTelemetryResponseDto } from '../../iot/dto/iot-telemetry.dto';

describe('DashboardIotTelemetryService & Controller (Big Phase 02 / Phase 03)', () => {
  let telemetryService: DashboardIotTelemetryService;
  let controller: DashboardIotController;
  let mockSharedTelemetryService: jest.Mocked<Partial<IotTelemetryService>>;
  let mockConfigValues: Record<string, any>;

  const mockSolarResponse: DeviceTelemetryResponseDto = {
    schemaVersion: 1,
    deviceId: '70B3D57ED0073E9D',
    deviceType: 'solar',
    fetchedAt: '2026-09-26T10:00:00.000Z',
    queryRange: {
      start: '2026-09-23T10:00:00.000Z',
      stop: '2026-09-26T10:00:00.000Z',
      limit: 1000,
    },
    coverage: {
      returnedCount: 2,
      validCount: 2,
      invalidCount: 0,
      isTruncated: false,
      earliestTimestamp: '2026-09-24T08:00:00.000Z',
      latestTimestamp: '2026-09-26T09:30:00.000Z',
      reachedLimit: false,
    },
    telemetry: {
      type: 'solar',
      category: 'solar',
      hero: {
        metric: 'current_uA',
        label: 'Dòng điện mới nhất',
        unit: 'µA',
        value: 1250,
        sampleTimestamp: '2026-09-26T09:30:00.000Z',
      },
      secondarySelector: {
        metric: 'lux',
        label: 'Độ sáng',
        unit: 'lx',
        value: 450,
        sampleTimestamp: '2026-09-26T09:30:00.000Z',
      },
      status: {
        label: 'Mã trạng thái: 0 (chưa xác nhận)',
        rawState: 0,
        isConfirmed: false,
      },
      readings: [
        {
          timestamp: '2026-09-26T09:30:00.000Z',
          devEui: '70B3D57ED0073E9D',
          deviceIdFriendly: 'solar-e-01',
          currentUa: 1250,
          lux: 450,
          rssi: -78,
          snr: 9.2,
          rawState: 0,
          rawVoltage: 3.3,
          rawTemperature: 29.5,
          rawHumidity: 62.0,
          fCnt: 104,
          applicationId: 'app-solar',
          gatewayId: 'gw-e-roof',
        },
        {
          timestamp: '2026-09-24T08:00:00.000Z',
          devEui: '70B3D57ED0073E9D',
          deviceIdFriendly: 'solar-e-01',
          currentUa: 0,
          lux: 0,
          rssi: -82,
          snr: 8.5,
          rawState: 0,
          rawVoltage: 3.2,
          rawTemperature: 26.0,
          rawHumidity: 70.0,
          fCnt: 103,
          applicationId: 'app-solar',
          gatewayId: 'gw-e-roof',
        },
      ],
    },
  };

  const mockAvcResponse: DeviceTelemetryResponseDto = {
    schemaVersion: 1,
    deviceId: 'avc-meter-01',
    deviceType: 'avc',
    fetchedAt: '2026-09-26T10:00:00.000Z',
    queryRange: {
      start: '2026-09-23T10:00:00.000Z',
      stop: '2026-09-26T10:00:00.000Z',
      limit: 1000,
    },
    coverage: {
      returnedCount: 1,
      validCount: 1,
      invalidCount: 0,
      isTruncated: false,
      earliestTimestamp: '2026-09-26T09:00:00.000Z',
      latestTimestamp: '2026-09-26T09:00:00.000Z',
      reachedLimit: false,
    },
    telemetry: {
      type: 'avc',
      category: 'water_meter',
      hero: {
        metric: 'instant_flow_m3h',
        label: 'Lưu lượng tức thời',
        unit: 'm³/h',
        value: 0.75,
        sampleTimestamp: '2026-09-26T09:00:00.000Z',
        pendingHardwareBadge: true,
      },
      secondarySelectors: {
        tempC: {
          metric: 'temp_c',
          label: 'Nhiệt độ đo được',
          unit: '°C',
          value: 28.5,
          sampleTimestamp: '2026-09-26T09:00:00.000Z',
          pendingHardwareBadge: false,
        },
        fwdVolume: {
          metric: 'fwd_volume_m3',
          label: 'Thể tích tích lũy chiều thuận',
          unit: 'm³',
          value: 124.5,
          sampleTimestamp: '2026-09-26T09:00:00.000Z',
          pendingHardwareBadge: true,
        },
        revVolume: {
          metric: 'rev_volume_m3',
          label: 'Thể tích tích lũy chiều ngược',
          unit: 'm³',
          value: 0,
          sampleTimestamp: '2026-09-26T09:00:00.000Z',
          pendingHardwareBadge: true,
        },
      },
      status: {
        label: 'Chưa xác nhận mã cảnh báo',
        isConfirmed: false,
        rawFlags: {
          valveOpen: 1,
          pipeLeak: 0,
          pipeBurst: 0,
          batteryLow: 0,
          frozen: 0,
          tamper: 0,
          reverseFlow: 0,
        },
      },
      readings: [
        {
          timestamp: '2026-09-26T09:00:00.000Z',
          devEui: 'avc-meter-01',
          deviceName: 'Meter Floor 4',
          meterSn: 'SN-445566',
          instantFlowM3h: 0.75,
          fwdVolumeM3: 124.5,
          revVolumeM3: 0,
          tempC: 28.5,
          rawValveOpen: 1,
          rawPipeLeak: 0,
          rawPipeBurst: 0,
          rawBatteryLow: 0,
          rawFrozen: 0,
          rawTamper: 0,
          rawReverseFlow: 0,
          rssi: -90,
          snr: 6.5,
          fcnt: 450,
          devAddr: '01ABCDEF',
          gatewayId: 'gw-fl-4',
          region: 'as923_2',
          frequencyHz: 923200000,
          spreadingFactor: 10,
          dr: 2,
        },
      ],
    },
  };

  beforeEach(async () => {
    mockConfigValues = {
      'fixtures.mode': 'iot',
    };

    mockSharedTelemetryService = {
      resolveDeviceType: jest.fn().mockResolvedValue('solar'),
      getDeviceTelemetry: jest.fn().mockResolvedValue(mockSolarResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardIotController],
      providers: [
        DashboardIotTelemetryService,
        {
          provide: DashboardIotCatalogueService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((k: string, d?: any) => mockConfigValues[k] ?? d),
          },
        },
        {
          provide: IotTelemetryService,
          useValue: mockSharedTelemetryService,
        },
      ],
    }).compile();

    telemetryService = module.get<DashboardIotTelemetryService>(DashboardIotTelemetryService);
    controller = module.get<DashboardIotController>(DashboardIotController);
  });

  describe('BP2-P03-T01: Route and Cache-Control', () => {
    it('returns telemetry with live provenance and Cache-Control: no-store', async () => {
      const res = await controller.getTelemetry('E', '70B3D57ED0073E9D', {
        start: '2026-09-23T10:00:00.000Z',
        stop: '2026-09-26T10:00:00.000Z',
        limit: 1000,
      });

      expect(res.schemaVersion).toBe(1);
      expect(res.buildingId).toBe('E');
      expect(res.deviceId).toBe('70B3D57ED0073E9D');
      expect(res.deviceType).toBe('solar');
      expect(res.availability).toBe('ready');
      expect(res.provenance.mode).toBe('live');
      expect(res.provenance.sourceType).toBe('iot_backend_telemetry');
      expect(res.provenance.windowStart).toBe('2026-09-23T10:00:00.000Z');
      expect(res.provenance.windowEnd).toBe('2026-09-26T10:00:00.000Z');
      expect(res.latestSample).toEqual({
        observedAt: '2026-09-26T09:30:00.000Z',
        gatewayId: 'gw-e-roof',
        rssiDbm: -78,
        snrDb: 9.2,
      });
    });
  });

  describe('BP2-P03-T02: Building and Device ID Validation', () => {
    it('rejects building outside E with BadRequestException', async () => {
      await expect(
        telemetryService.getTelemetry('A', '70B3D57ED0073E9D', {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects empty or whitespace deviceId with BadRequestException', async () => {
      await expect(
        telemetryService.getTelemetry('E', '   ', {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('BP2-P03-T03: Range, Duration, and Limit Validation', () => {
    it('rejects invalid date strings', async () => {
      await expect(
        telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
          start: 'invalid-date',
          stop: '2026-09-26T10:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects start >= stop', async () => {
      await expect(
        telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
          start: '2026-09-26T10:00:00.000Z',
          stop: '2026-09-23T10:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duration longer than 7 days', async () => {
      await expect(
        telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
          start: '2026-09-10T00:00:00.000Z',
          stop: '2026-09-26T00:00:00.000Z', // 16 days
        }),
      ).rejects.toThrow('Query range duration cannot exceed 7 days.');
    });

    it('rejects limit outside 1..1000', async () => {
      await expect(
        telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
          limit: 1001,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
          limit: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('BP2-P03-T05: Forwarding parameters', () => {
    it('forwards normalized start, stop, and limit to shared telemetry service', async () => {
      await telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
        start: '2026-09-23T10:00:00.000Z',
        stop: '2026-09-26T10:00:00.000Z',
        limit: 1000,
      });

      expect(mockSharedTelemetryService.getDeviceTelemetry).toHaveBeenCalledWith(
        '70B3D57ED0073E9D',
        {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
          limit: 1000,
        },
      );
    });
  });

  describe('BP2-P03-T09: NFC and Unknown Unsupported in Dashboard', () => {
    it('rejects NFC device type with BadRequestException without guessing endpoints', async () => {
      mockSharedTelemetryService.resolveDeviceType = jest.fn().mockResolvedValueOnce('nfc');

      await expect(
        telemetryService.getTelemetry('E', 'nfc-door-01', {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
        }),
      ).rejects.toThrow("Device 'nfc-door-01' has type 'nfc' which is not supported for Dashboard telemetry");

      expect(mockSharedTelemetryService.getDeviceTelemetry).not.toHaveBeenCalled();
    });

    it('rejects unknown device type with BadRequestException without guessing endpoints', async () => {
      mockSharedTelemetryService.resolveDeviceType = jest.fn().mockResolvedValueOnce('unknown');

      await expect(
        telemetryService.getTelemetry('E', 'unknown-dev', {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
        }),
      ).rejects.toThrow("Device 'unknown-dev' has type 'unknown' which is not supported for Dashboard telemetry");

      expect(mockSharedTelemetryService.getDeviceTelemetry).not.toHaveBeenCalled();
    });
  });

  describe('BP2-P03-T11 & T12: Solar readings, zero preservation, and caveats', () => {
    it('formats solar telemetry, preserves 0, and attaches unconfirmed caveats', async () => {
      const res = await telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
        start: '2026-09-23T10:00:00.000Z',
        stop: '2026-09-26T10:00:00.000Z',
      });

      expect(res.deviceType).toBe('solar');
      expect(res.provenance.caveats).toBeDefined();
      expect(
        res.provenance.caveats?.some((c) => c.includes('Thông số điện áp, nhiệt độ, độ ẩm')),
      ).toBe(true);

      const solar = res.telemetry as any;
      expect(solar.hero.value).toBe(1250);
      expect(solar.hero.unit).toBe('µA');
      expect(solar.readings[1].currentUa).toBe(0); // Valid zero preserved!
      expect(solar.readings[0].rawVoltage).toBe(3.3);
    });
  });

  describe('BP2-P03-T13 & T14: AVC water meter readings and raw flags', () => {
    it('formats AVC telemetry, preserves raw flag numbers, and attaches water caveats', async () => {
      mockSharedTelemetryService.resolveDeviceType = jest.fn().mockResolvedValueOnce('avc');
      mockSharedTelemetryService.getDeviceTelemetry = jest.fn().mockResolvedValueOnce(mockAvcResponse);

      const res = await telemetryService.getTelemetry('E', 'avc-meter-01', {
        start: '2026-09-23T10:00:00.000Z',
        stop: '2026-09-26T10:00:00.000Z',
      });

      expect(res.deviceType).toBe('avc');
      expect(
        res.provenance.caveats?.some((c) => c.includes('Ý nghĩa lưu lượng tức thời')),
      ).toBe(true);
      expect(
        res.provenance.caveats?.some((c) => c.includes('Nhiệt độ đo được (°C)')),
      ).toBe(true);

      const avc = res.telemetry as any;
      expect(avc.hero.metric).toBe('instant_flow_m3h');
      expect(avc.hero.value).toBe(0.75);
      expect(avc.hero.pendingHardwareBadge).toBe(true);
      expect(avc.status.rawFlags.valveOpen).toBe(1); // Numeric raw flag preserved
      expect(avc.status.rawFlags.pipeLeak).toBe(0); // Numeric raw flag preserved
    });
  });

  describe('BP2-P03-T19: Empty successful response', () => {
    it('sets availability to empty and preserves live source window when 0 rows returned', async () => {
      const emptySolar: DeviceTelemetryResponseDto = {
        ...mockSolarResponse,
        coverage: {
          returnedCount: 0,
          validCount: 0,
          invalidCount: 0,
          isTruncated: false,
          earliestTimestamp: null,
          latestTimestamp: null,
          reachedLimit: false,
        },
        telemetry: {
          ...mockSolarResponse.telemetry,
          readings: [],
        } as any,
      };

      mockSharedTelemetryService.resolveDeviceType = jest.fn().mockResolvedValueOnce('solar');
      mockSharedTelemetryService.getDeviceTelemetry = jest.fn().mockResolvedValueOnce(emptySolar);

      const res = await telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
        start: '2026-09-23T10:00:00.000Z',
        stop: '2026-09-26T10:00:00.000Z',
      });

      expect(res.availability).toBe('empty');
      expect(res.latestSample).toBeNull();
      expect(res.provenance.windowStart).toBe('2026-09-23T10:00:00.000Z');
      expect(res.provenance.windowEnd).toBe('2026-09-26T10:00:00.000Z');
      expect(res.provenance.observedAt).toBeUndefined();
    });
  });

  describe('BP2-P03-T20: Truncation caveats and error sanitization', () => {
    it('attaches truncation caveat when coverage isTruncated is true', async () => {
      const truncatedSolar: DeviceTelemetryResponseDto = {
        ...mockSolarResponse,
        coverage: {
          ...mockSolarResponse.coverage,
          isTruncated: true,
          reachedLimit: true,
        },
      };

      mockSharedTelemetryService.resolveDeviceType = jest.fn().mockResolvedValueOnce('solar');
      mockSharedTelemetryService.getDeviceTelemetry = jest.fn().mockResolvedValueOnce(truncatedSolar);

      const res = await telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
        start: '2026-09-23T10:00:00.000Z',
        stop: '2026-09-26T10:00:00.000Z',
      });

      expect(
        res.provenance.caveats?.some((c) => c.includes('Dữ liệu telemetry bị giới hạn')),
      ).toBe(true);
    });

    it('sanitizes upstream bearer token and URL from exception responses', async () => {
      mockSharedTelemetryService.resolveDeviceType = jest.fn().mockRejectedValueOnce(
        new BadGatewayException('Bearer secret-token-xyz failed at https://api.ttlab.manhthao.uk/api/v1/devices'),
      );

      try {
        await telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
        });
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).not.toContain('secret-token-xyz');
        expect(err.message).not.toContain('api.ttlab.manhthao.uk');
      }
    });
  });

  describe('Source Mode Gate', () => {
    it('throws ServiceUnavailableException when mode is disabled', async () => {
      mockConfigValues['fixtures.mode'] = 'disabled';

      await expect(
        telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('throws ServiceUnavailableException when mode is fixture', async () => {
      mockConfigValues['fixtures.mode'] = 'fixture';

      await expect(
        telemetryService.getTelemetry('E', '70B3D57ED0073E9D', {
          start: '2026-09-23T10:00:00.000Z',
          stop: '2026-09-26T10:00:00.000Z',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
