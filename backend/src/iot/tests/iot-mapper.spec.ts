import { ConfigService } from '@nestjs/config';
import { BadRequestException, BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { IotMapperService } from '../services/iot-mapper.service';
import { IotClientService } from '../services/iot-client.service';
import { IoTUpstreamDeviceListResponse } from '../dto/iot-devices.dto';

describe('IotMapperService & IotClientService (Small Phase 06)', () => {
  let mapper: IotMapperService;
  let mockConfig: Partial<ConfigService>;

  const snapshotFixture: IoTUpstreamDeviceListResponse = {
    data: [
      {
        device_id: '70B3D57ED0073E9D',
        device_type: 'solar',
        create_timestamp: '2026-09-20T19:09:17.355Z',
        last_updated_timestamp: '2026-09-20T19:09:17.355Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
      {
        device_id: '70B3D57ED0076947',
        device_type: 'solar',
        create_timestamp: '2026-09-20T19:09:17.566Z',
        last_updated_timestamp: '2026-09-20T19:09:17.566Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
      {
        device_id: '70B3D57ED0076948',
        device_type: 'solar',
        create_timestamp: '2026-09-20T19:09:17.773Z',
        last_updated_timestamp: '2026-09-20T19:09:17.773Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
      {
        device_id: '70B3D57ED0076949',
        device_type: 'solar',
        create_timestamp: '2026-09-20T19:09:17.979Z',
        last_updated_timestamp: '2026-09-20T19:09:17.979Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
      {
        device_id: '70B3D57ED007694A',
        device_type: 'solar',
        create_timestamp: '2026-09-20T19:09:18.188Z',
        last_updated_timestamp: '2026-09-20T19:09:18.188Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
      {
        device_id: 'dummy01801182ed2814',
        device_type: 'avc',
        create_timestamp: '2026-09-20T19:09:18.399Z',
        last_updated_timestamp: '2026-09-20T19:09:18.399Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
      {
        device_id: 'dummy01801182ed2815',
        device_type: 'avc',
        create_timestamp: '2026-09-20T19:09:18.604Z',
        last_updated_timestamp: '2026-09-20T19:09:18.604Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
      {
        device_id: 'dummy01801182ed2816',
        device_type: 'nfc',
        create_timestamp: '2026-09-20T19:09:18.810Z',
        last_updated_timestamp: '2026-09-20T19:09:18.810Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
      {
        device_id: 'dummy01801182ed2817',
        device_type: 'nfc',
        create_timestamp: '2026-09-20T19:09:19.018Z',
        last_updated_timestamp: '2026-09-20T19:09:19.018Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
      {
        device_id: 'dummy01801182ed2818',
        device_type: 'nfc',
        create_timestamp: '2026-09-20T19:09:19.224Z',
        last_updated_timestamp: '2026-09-20T19:09:19.224Z',
        install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
        is_active: true,
      },
    ],
    meta: {
      count: 10,
      truncated: false,
    },
  };

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key: string, defaultVal: any) => {
        if (key === 'iot.floorMode') return 'TEST_CURRENT_FLOOR_4_6_V1';
        if (key === 'iot.coordinateMode') return 'TEST_PREFAB_CENTER_XZ_V1';
        if (key === 'iot.baseUrl') return 'https://api.ttlab.manhthao.uk';
        if (key === 'iot.masterToken') return '';
        if (key === 'iot.timeoutMs') return 10000;
        return defaultVal;
      }) as any,
    };
    mapper = new IotMapperService(mockConfig as ConfigService);
  });

  describe('mapResponse with 2026-09-21 upstream snapshot', () => {
    it('correctly projects 10 snapshot records onto Floor 4 with category unknown', () => {
      const res = mapper.mapResponse(snapshotFixture, 'E', '4');

      expect(res.schemaVersion).toBe(1);
      expect(res.buildingId).toBe('E');
      expect(res.floorId).toBe('4');
      expect(res.devices).toHaveLength(10);
      expect(res.summary).toEqual({
        receivedCount: 10,
        acceptedCount: 10,
        skippedCount: 0,
        duplicateCount: 0,
        truncated: false,
      });

      // Check first record
      const first = res.devices[0];
      expect(first.deviceId).toBe('70B3D57ED0073E9D');
      expect(first.sourceDeviceType).toBe('solar');
      expect(first.category).toBe('solar');
      expect(first.sourceLocation).toEqual({ x: 0, y: 0, floorLevel: 0 });
      expect(first.displayFloorId).toBe('4');

      // Check dummy ID opaque preservation
      const dummyRecord = res.devices.find((d) => d.deviceId === 'dummy01801182ed2814');
      expect(dummyRecord).toBeDefined();
      expect(dummyRecord?.sourceDeviceType).toBe('avc');
      expect(dummyRecord?.category).toBe('avc');
    });

    it('projects same snapshot onto Floor 6 with displayFloorId 6', () => {
      const res = mapper.mapResponse(snapshotFixture, 'E', '6');
      expect(res.floorId).toBe('6');
      expect(res.devices.every((d) => d.displayFloorId === '6')).toBe(true);
    });

    it('rejects unsupported floor or building with BadRequestException', () => {
      expect(() => mapper.mapResponse(snapshotFixture, 'E', '2')).toThrow(BadRequestException);
      expect(() => mapper.mapResponse(snapshotFixture, 'E', 'G')).toThrow(BadRequestException);
      expect(() => mapper.mapResponse(snapshotFixture, 'A', '4')).toThrow(BadRequestException);
    });

    it('rejects malformed envelope with BadGatewayException', () => {
      expect(() => mapper.mapResponse(null as any, 'E', '4')).toThrow(BadGatewayException);
      expect(() => mapper.mapResponse({ data: 'not-array' } as any, 'E', '4')).toThrow(BadGatewayException);
    });
  });

  describe('Category mapping and edge cases', () => {
    it('maps known 8 categories accurately', () => {
      expect(mapper.mapCategory('water_meter')).toBe('water_meter');
      expect(mapper.mapCategory('temperature_humidity')).toBe('temperature_humidity');
      expect(mapper.mapCategory('smart_building')).toBe('smart_building');
      expect(mapper.mapCategory('rf_uhf_reader')).toBe('rf_uhf_reader');
      expect(mapper.mapCategory('uhf_reader')).toBe('rf_uhf_reader');
      expect(mapper.mapCategory('camera')).toBe('camera');
      expect(mapper.mapCategory('CAMERA')).toBe('camera');
      expect(mapper.mapCategory('solar')).toBe('solar');
      expect(mapper.mapCategory('avc')).toBe('avc');
      expect(mapper.mapCategory('nfc')).toBe('nfc');
    });

    it('maps unknown / new raw types to unknown', () => {
      expect(mapper.mapCategory('future_sensor_99')).toBe('unknown');
      expect(mapper.mapCategory(null)).toBe('unknown');
      expect(mapper.mapCategory('')).toBe('unknown');
    });

    it('handles negative, non-zero, and zero finite coordinates properly', () => {
      const payload: IoTUpstreamDeviceListResponse = {
        data: [
          {
            device_id: 'dev-neg',
            device_type: 'water_meter',
            install_location: { install_x: -12.34, install_y: 56.78, install_floor_level: 0 },
          },
          {
            device_id: 'dev-zero',
            device_type: 'camera',
            install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
          },
        ],
      };

      const res = mapper.mapResponse(payload, 'E', '4');
      expect(res.devices).toHaveLength(2);
      expect(res.devices[0].sourceLocation.x).toBe(-12.34);
      expect(res.devices[0].sourceLocation.y).toBe(56.78);
      expect(res.devices[0].category).toBe('water_meter');
      expect(res.devices[1].sourceLocation.x).toBe(0);
      expect(res.devices[1].category).toBe('camera');
    });

    it('skips records with non-finite coordinates or missing ID and counts them', () => {
      const payload: IoTUpstreamDeviceListResponse = {
        data: [
          {
            device_id: 'dev-ok',
            device_type: 'solar',
            install_location: { install_x: 1, install_y: 2, install_floor_level: 0 },
          },
          {
            device_id: '',
            device_type: 'solar',
            install_location: { install_x: 1, install_y: 2, install_floor_level: 0 },
          },
          {
            device_id: 'dev-nan',
            device_type: 'solar',
            install_location: { install_x: NaN, install_y: 2, install_floor_level: 0 },
          },
          {
            device_id: 'dev-no-loc',
            device_type: 'solar',
          },
        ],
      };

      const res = mapper.mapResponse(payload, 'E', '4');
      expect(res.devices).toHaveLength(1);
      expect(res.summary.receivedCount).toBe(4);
      expect(res.summary.acceptedCount).toBe(1);
      expect(res.summary.skippedCount).toBe(3);
    });

    it('deduplicates duplicate device IDs keeping the first valid record', () => {
      const payload: IoTUpstreamDeviceListResponse = {
        data: [
          {
            device_id: 'dup-1',
            device_type: 'solar',
            install_location: { install_x: 1, install_y: 1, install_floor_level: 0 },
          },
          {
            device_id: 'dup-1',
            device_type: 'avc',
            install_location: { install_x: 2, install_y: 2, install_floor_level: 0 },
          },
        ],
      };

      const res = mapper.mapResponse(payload, 'E', '4');
      expect(res.devices).toHaveLength(1);
      expect(res.devices[0].sourceDeviceType).toBe('solar');
      expect(res.summary.duplicateCount).toBe(1);
      expect(res.summary.acceptedCount).toBe(1);
    });

    it('ignores is_active field entirely for display and classification', () => {
      const payload: IoTUpstreamDeviceListResponse = {
        data: [
          {
            device_id: 'dev-active-true',
            device_type: 'camera',
            install_location: { install_x: 0, install_y: 0, install_floor_level: 0 },
            is_active: true,
          },
          {
            device_id: 'dev-active-false',
            device_type: 'camera',
            install_location: { install_x: 1, install_y: 1, install_floor_level: 0 },
            is_active: false,
          },
        ],
      };

      const res = mapper.mapResponse(payload, 'E', '4');
      expect(res.devices).toHaveLength(2);
      expect(res.devices[0].category).toBe('camera');
      expect(res.devices[1].category).toBe('camera');
    });

    it('records meta truncated flag accurately', () => {
      const payloadWithTruncated: IoTUpstreamDeviceListResponse = {
        data: [],
        meta: { truncated: true },
      };
      const res = mapper.mapResponse(payloadWithTruncated, 'E', '4');
      expect(res.summary.truncated).toBe(true);

      const payloadNoMeta: IoTUpstreamDeviceListResponse = {
        data: [],
      };
      const res2 = mapper.mapResponse(payloadNoMeta, 'E', '4');
      expect(res2.summary.truncated).toBeNull();
    });
  });

  describe('IotClientService token guard', () => {
    it('throws ServiceUnavailableException when masterToken is empty', async () => {
      const client = new IotClientService(mockConfig as ConfigService);
      await expect(client.fetchRawDevices()).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
