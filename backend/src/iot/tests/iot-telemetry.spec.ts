import { BadRequestException } from '@nestjs/common';
import { IotTelemetryService } from '../services/iot-telemetry.service';
import { IotClientService } from '../services/iot-client.service';
import {
  IoTUpstreamSolarResponse,
  IoTUpstreamAvcResponse,
  IoTUpstreamNfcResponse,
  IoTUpstreamDeviceDetailResponse,
} from '../dto/iot-telemetry.dto';

describe('IotTelemetryService (Small Phase 07)', () => {
  let service: IotTelemetryService;
  let mockClient: jest.Mocked<IotClientService>;

  beforeEach(() => {
    mockClient = {
      fetchRawDevices: jest.fn(),
      fetchDeviceDetail: jest.fn(),
      fetchSolarReadings: jest.fn(),
      fetchAvcReadings: jest.fn(),
      fetchNfcEvents: jest.fn(),
    } as unknown as jest.Mocked<IotClientService>;

    service = new IotTelemetryService(mockClient);
  });

  describe('Query validation (T02, T17)', () => {
    it('throws BadRequestException if start or stop is missing', async () => {
      await expect(
        service.getDeviceTelemetry('dev-1', { start: '', stop: '2026-09-22T00:00:00Z' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getDeviceTelemetry('dev-1', { start: '2026-09-22T00:00:00Z', stop: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid date format', async () => {
      await expect(
        service.getDeviceTelemetry('dev-1', { start: 'invalid-date', stop: '2026-09-22T00:00:00Z' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if start >= stop', async () => {
      await expect(
        service.getDeviceTelemetry('dev-1', {
          start: '2026-09-22T10:00:00Z',
          stop: '2026-09-22T09:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getDeviceTelemetry('dev-1', {
          start: '2026-09-22T10:00:00Z',
          stop: '2026-09-22T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if limit is invalid or outside 1..10000', async () => {
      await expect(
        service.getDeviceTelemetry('dev-1', {
          start: '2026-09-19T00:00:00Z',
          stop: '2026-09-22T00:00:00Z',
          limit: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getDeviceTelemetry('dev-1', {
          start: '2026-09-19T00:00:00Z',
          stop: '2026-09-22T00:00:00Z',
          limit: 10001,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getDeviceTelemetry('dev-1', {
          start: '2026-09-19T00:00:00Z',
          stop: '2026-09-22T00:00:00Z',
          limit: 1.5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Type resolution & routing (T01, T15, T16)', () => {
    it('uses RAM registered type from catalogue without calling detail API', async () => {
      service.registerDeviceType('dev-solar-1', 'solar');
      mockClient.fetchSolarReadings.mockResolvedValueOnce({
        data: [],
        meta: { count: 0, truncated: false },
      });

      const res = await service.getDeviceTelemetry('dev-solar-1', {
        start: '2026-09-19T00:00:00Z',
        stop: '2026-09-22T00:00:00Z',
      });

      expect(mockClient.fetchDeviceDetail).not.toHaveBeenCalled();
      expect(mockClient.fetchSolarReadings).toHaveBeenCalledWith(
        'dev-solar-1',
        '2026-09-19T00:00:00.000Z',
        '2026-09-22T00:00:00.000Z',
        1000,
      );
      expect(res.deviceType).toBe('solar');
    });

    it('resolves type via fetchDeviceDetail if not pre-registered', async () => {
      mockClient.fetchDeviceDetail.mockResolvedValueOnce({
        data: {
          device_id: 'dev-avc-1',
          device_type: 'avc',
        },
      } as IoTUpstreamDeviceDetailResponse);

      mockClient.fetchAvcReadings.mockResolvedValueOnce({
        data: [],
        meta: { count: 0, truncated: false },
      });

      const res = await service.getDeviceTelemetry('dev-avc-1', {
        start: '2026-09-19T00:00:00Z',
        stop: '2026-09-22T00:00:00Z',
      });

      expect(mockClient.fetchDeviceDetail).toHaveBeenCalledWith('dev-avc-1');
      expect(mockClient.fetchAvcReadings).toHaveBeenCalledWith(
        'dev-avc-1',
        '2026-09-19T00:00:00.000Z',
        '2026-09-22T00:00:00.000Z',
        1000,
      );
      expect(res.deviceType).toBe('avc');
    });

    it('handles unknown device_type safely without guessing endpoints', async () => {
      service.registerDeviceType('dev-unknown-1', 'unsupported_sensor');

      const res = await service.getDeviceTelemetry('dev-unknown-1', {
        start: '2026-09-19T00:00:00Z',
        stop: '2026-09-22T00:00:00Z',
      });

      expect(mockClient.fetchSolarReadings).not.toHaveBeenCalled();
      expect(mockClient.fetchAvcReadings).not.toHaveBeenCalled();
      expect(mockClient.fetchNfcEvents).not.toHaveBeenCalled();
      expect(res.deviceType).toBe('unknown');
      expect(res.telemetry.type).toBe('unknown');
    });
  });

  describe('Solar telemetry normalization (T07, T08, T18)', () => {
    it('correctly maps solar readings, preserves 0, nulls, and selects newest hero value', async () => {
      service.registerDeviceType('solar-100', 'solar');

      const mockData: IoTUpstreamSolarResponse = {
        data: [
          {
            dev_eui: 'solar-100',
            timestamp: '2026-09-20T10:00:00.000Z',
            device_id: 'solar-node-01',
            current_uA: 1500,
            lux: 800,
            voltage: 3.3,
            temperature: 28.5,
            humidity: 60,
            state: 1,
            f_cnt: 10,
          },
          {
            dev_eui: 'solar-100',
            timestamp: '2026-09-21T12:00:00.000Z', // Newest
            device_id: 'solar-node-01',
            current_uA: 0, // Valid 0
            lux: 0,        // Valid 0
            voltage: 3.1,
            temperature: 30,
            humidity: 55,
            state: 0,
            f_cnt: 20,
          },
        ],
        meta: { count: 2, truncated: false },
      };

      mockClient.fetchSolarReadings.mockResolvedValueOnce(mockData);

      const res = await service.getDeviceTelemetry('solar-100', {
        start: '2026-09-19T00:00:00Z',
        stop: '2026-09-22T00:00:00Z',
      });

      expect(res.deviceType).toBe('solar');
      expect(res.coverage.returnedCount).toBe(2);
      expect(res.coverage.validCount).toBe(2);
      expect(res.coverage.invalidCount).toBe(0);

      const solar = res.telemetry as any;
      expect(solar.hero.metric).toBe('current_uA');
      expect(solar.hero.value).toBe(0); // newest is 0, not coerced to null
      expect(solar.hero.sampleTimestamp).toBe('2026-09-21T12:00:00.000Z');
      expect(solar.secondarySelector.value).toBe(0);
      expect(solar.status.rawState).toBe(0);
      expect(solar.status.label).toContain('Mã trạng thái: 0');
    });
  });

  describe('AVC (water meter) telemetry normalization (T07, T18, T19)', () => {
    it('normalizes water meter readings with pending hardware badge and raw flags', async () => {
      service.registerDeviceType('avc-200', 'avc');

      const mockData: IoTUpstreamAvcResponse = {
        data: [
          {
            dev_eui: 'avc-200',
            timestamp: '2026-09-22T08:00:00.000Z',
            device_name: 'WaterMeter-L4',
            meter_sn: 'WM-998877',
            instant_flow_m3h: 1.25,
            fwd_volume_m3: 150.4,
            rev_volume_m3: 0,
            temp_c: 24.5,
            valve_open: 1,
            pipe_leak: 0,
            pipe_burst: 0,
            battery_low: 0,
            frozen: 0,
            tamper: 0,
            reverse_flow: 0,
            spreading_factor: 0, // SF=0 handled without rejection
          },
        ],
        meta: { count: 1, truncated: false },
      };

      mockClient.fetchAvcReadings.mockResolvedValueOnce(mockData);

      const res = await service.getDeviceTelemetry('avc-200', {
        start: '2026-09-19T00:00:00Z',
        stop: '2026-09-22T00:00:00Z',
      });

      expect(res.deviceType).toBe('avc');
      const avc = res.telemetry as any;
      expect(avc.hero.metric).toBe('instant_flow_m3h');
      expect(avc.hero.value).toBe(1.25);
      expect(avc.hero.pendingHardwareBadge).toBe(true);
      expect(avc.secondarySelectors.tempC.value).toBe(24.5);
      expect(avc.secondarySelectors.tempC.pendingHardwareBadge).toBe(false);
      expect(avc.status.label).toBe('Chưa xác nhận mã cảnh báo');
      expect(avc.status.rawFlags.valveOpen).toBe(1);
    });
  });

  describe('NFC door scan normalization (T08, T20)', () => {
    it('normalizes scan events, tracks in/out counts, and drops invalid directions', async () => {
      service.registerDeviceType('nfc-300', 'nfc');

      const mockData: IoTUpstreamNfcResponse = {
        data: [
          {
            dev_eui: 'nfc-300',
            timestamp: '2026-09-22T07:15:00.000Z',
            detected_card_id: 'CARD-AAA',
            moving_direction: 'in',
            batch_id: 'B-01',
          },
          {
            dev_eui: 'nfc-300',
            timestamp: '2026-09-22T08:30:00.000Z',
            detected_card_id: 'CARD-BBB',
            moving_direction: 'out',
            batch_id: 'B-02',
          },
          {
            dev_eui: 'nfc-300',
            timestamp: '2026-09-22T09:00:00.000Z',
            detected_card_id: 'CARD-CCC',
            moving_direction: 'sideways', // Invalid direction
            batch_id: 'B-03',
          },
        ],
        meta: { count: 3, truncated: false },
      };

      mockClient.fetchNfcEvents.mockResolvedValueOnce(mockData);

      const res = await service.getDeviceTelemetry('nfc-300', {
        start: '2026-09-19T00:00:00Z',
        stop: '2026-09-22T00:00:00Z',
      });

      expect(res.deviceType).toBe('nfc');
      expect(res.coverage.returnedCount).toBe(3);
      expect(res.coverage.validCount).toBe(2);
      expect(res.coverage.invalidCount).toBe(1);

      const nfc = res.telemetry as any;
      expect(nfc.hero.totalInCount).toBe(1);
      expect(nfc.hero.totalOutCount).toBe(1);
      expect(nfc.hero.latestEvent.detectedCardId).toBe('CARD-BBB'); // Newest valid
      expect(nfc.hero.latestEvent.movingDirection).toBe('out');
    });
  });

  describe('Coverage & truncation indicators (T09)', () => {
    it('flags reachedLimit when returned count >= limit', async () => {
      service.registerDeviceType('solar-cap', 'solar');
      const dummyReadings = Array.from({ length: 1000 }, (_, i) => ({
        dev_eui: 'solar-cap',
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        current_uA: 100,
      }));

      mockClient.fetchSolarReadings.mockResolvedValueOnce({
        data: dummyReadings,
        meta: { count: 1000, truncated: false },
      });

      const res = await service.getDeviceTelemetry('solar-cap', {
        start: '2026-09-19T00:00:00Z',
        stop: '2026-09-22T00:00:00Z',
        limit: 1000,
      });

      expect(res.coverage.returnedCount).toBe(1000);
      expect(res.coverage.reachedLimit).toBe(true);
      expect(res.coverage.isTruncated).toBe(true);
    });
  });
});

