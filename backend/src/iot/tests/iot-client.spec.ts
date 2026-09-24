import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { IotClientService } from '../services/iot-client.service';
import { IotService } from '../iot.service';
import { IotMapperService } from '../services/iot-mapper.service';
import { IotTelemetryService } from '../services/iot-telemetry.service';

describe('IotClientService & IotService (Small Phase 08 Contract Adaptation)', () => {
  let client: IotClientService;
  let mockConfig: Partial<ConfigService>;
  let globalFetchMock: jest.Mock;

  const mockToken = 'secret-test-master-token-12345';
  const mockBaseUrl = 'https://api.ttlab.manhthao.uk';

  beforeEach(() => {
    globalFetchMock = jest.fn();
    (global as any).fetch = globalFetchMock;

    mockConfig = {
      get: jest.fn((key: string, defaultVal: any) => {
        if (key === 'iot.floorMode') return 'TEST_CURRENT_FLOOR_4_6_V1';
        if (key === 'iot.coordinateMode') return 'TEST_PREFAB_CENTER_XZ_V1';
        if (key === 'iot.baseUrl') return mockBaseUrl;
        if (key === 'iot.masterToken') return mockToken;
        if (key === 'iot.timeoutMs') return 5000;
        return defaultVal;
      }) as any,
    };

    client = new IotClientService(mockConfig as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Query Serialization (Phase B & J1)', () => {
    it('serializes listDevices() without filter to /api/v1/devices', async () => {
      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { count: 0 } }),
      });

      await client.listDevices();

      expect(globalFetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = globalFetchMock.mock.calls[0];
      expect(calledUrl).toBe(`${mockBaseUrl}/api/v1/devices`);
      expect(calledInit.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('serializes listDevices({ floorLevel: 6 }) to /api/v1/devices?floor_level=6', async () => {
      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { count: 0 } }),
      });

      await client.listDevices({ floorLevel: 6 });

      expect(globalFetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = globalFetchMock.mock.calls[0];
      expect(calledUrl).toBe(`${mockBaseUrl}/api/v1/devices?floor_level=6`);
    });

    it('serializes listDevices({ floorLevel: -1 }) to /api/v1/devices?floor_level=-1', async () => {
      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { count: 0 } }),
      });

      await client.listDevices({ floorLevel: -1 });

      expect(globalFetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = globalFetchMock.mock.calls[0];
      expect(calledUrl).toBe(`${mockBaseUrl}/api/v1/devices?floor_level=-1`);
    });

    it('rejects locally without calling upstream when floorLevel is NaN', async () => {
      await expect(client.listDevices({ floorLevel: NaN })).rejects.toThrow(BadRequestException);
      expect(globalFetchMock).not.toHaveBeenCalled();
    });

    it('rejects locally without calling upstream when floorLevel is a float (e.g. 1.5)', async () => {
      await expect(client.listDevices({ floorLevel: 1.5 })).rejects.toThrow(BadRequestException);
      expect(globalFetchMock).not.toHaveBeenCalled();
    });

    it('rejects locally without calling upstream when floorLevel is string or non-number', async () => {
      await expect(client.listDevices({ floorLevel: 'G' as any })).rejects.toThrow(BadRequestException);
      expect(globalFetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling (Phase I & J4)', () => {
    it('handles upstream 400 Bad Request by throwing BadGatewayException without leaking token', async () => {
      globalFetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      try {
        await client.listDevices({ floorLevel: 99 });
        fail('Should have thrown BadGatewayException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadGatewayException);
        expect(err.message).toContain('invalid query parameters (400 Bad Request)');
        expect(err.message).not.toContain(mockToken);
      }
    });

    it('handles upstream 401 Unauthorized by throwing BadGatewayException without leaking token', async () => {
      globalFetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      try {
        await client.listDevices();
        fail('Should have thrown BadGatewayException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadGatewayException);
        expect(err.message).toContain('Upstream IoT API authentication failed (401 Unauthorized)');
        expect(err.message).not.toContain(mockToken);
      }
    });

    it('handles network or timeout errors cleanly', async () => {
      globalFetchMock.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(client.listDevices()).rejects.toThrow(BadGatewayException);
    });

    it('throws ServiceUnavailableException when master token is not configured', async () => {
      const emptyConfig = {
        get: jest.fn((key: string, defaultVal: any) => {
          if (key === 'iot.masterToken') return '';
          return defaultVal;
        }),
      } as any;
      const noTokenClient = new IotClientService(emptyConfig);

      await expect(noTokenClient.listDevices()).rejects.toThrow(ServiceUnavailableException);
      expect(globalFetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Detail Endpoint Compatibility (Phase C2 & J3)', () => {
    it('supports detail lookup without install_z', async () => {
      const detailPayload = {
        data: {
          device_id: '70B3D57ED0073E9D',
          device_type: 'solar',
          install_location: {
            install_x: 1.0,
            install_y: 2.0,
            install_floor_level: 6,
          },
          is_active: true,
        },
      };

      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => detailPayload,
      });

      const res = await client.getDevice('70B3D57ED0073E9D');
      expect(res.data.device_id).toBe('70B3D57ED0073E9D');
      expect(res.data.install_location?.install_x).toBe(1.0);
      expect(res.data.install_location?.install_z).toBeUndefined();
    });

    it('supports detail lookup with optional install_z', async () => {
      const detailPayload = {
        data: {
          device_id: '70B3D57ED0073E9D',
          device_type: 'solar',
          install_location: {
            install_x: 1.0,
            install_y: 2.0,
            install_z: 3.5,
            install_floor_level: 6,
          },
          is_active: true,
        },
      };

      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => detailPayload,
      });

      const res = await client.getDevice('70B3D57ED0073E9D');
      expect(res.data.device_id).toBe('70B3D57ED0073E9D');
      expect(res.data.install_location?.install_z).toBe(3.5);
    });
  });

  describe('Floor-Scoped Fetch Flow in IotService (Phase F & J5)', () => {
    let service: IotService;
    let mapper: IotMapperService;
    let telemetryService: IotTelemetryService;

    beforeEach(() => {
      mapper = new IotMapperService(mockConfig as ConfigService);
      telemetryService = new IotTelemetryService(client);
      service = new IotService(client, mapper, telemetryService);
    });

    it('routes floor 4 load to upstream GET /api/v1/devices?floor_level=4 and accepts direct devices', async () => {
      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              device_id: 'dev-floor-4',
              device_type: 'solar',
              install_location: { install_x: 1, install_y: 2, install_z: 0.5, install_floor_level: 4 },
              is_active: true,
            },
          ],
          meta: { count: 1 },
        }),
      });

      const res = await service.getFloorDevices('E', '4');

      expect(globalFetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = globalFetchMock.mock.calls[0];
      expect(calledUrl).toBe(`${mockBaseUrl}/api/v1/devices?floor_level=4`);
      expect(res.floorId).toBe('4');
      expect(res.devices).toHaveLength(1);
      expect(res.devices[0].sourceLocation.z).toBe(0.5);
    });

    it('TEST scenario: when upstream floor_level=4 returns empty because developing devices have install_floor_level == 0, falls back to floor_level=0 and treats as floor 4', async () => {
      // 1st call: GET /api/v1/devices?floor_level=4 -> empty
      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { count: 0 } }),
      });
      // 2nd call: fallback GET /api/v1/devices?floor_level=0 -> returns developing devices with install_floor_level == 0
      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              device_id: 'dev-dev-01',
              device_type: 'solar',
              install_location: { install_x: 0, install_y: 0, install_z: 0, install_floor_level: 0 },
              is_active: true,
            },
          ],
          meta: { count: 1 },
        }),
      });

      const res = await service.getFloorDevices('E', '4');

      expect(globalFetchMock).toHaveBeenCalledTimes(2);
      expect(globalFetchMock.mock.calls[0][0]).toBe(`${mockBaseUrl}/api/v1/devices?floor_level=4`);
      expect(globalFetchMock.mock.calls[1][0]).toBe(`${mockBaseUrl}/api/v1/devices?floor_level=0`);
      expect(res.floorId).toBe('4');
      expect(res.devices).toHaveLength(1);
      expect(res.devices[0].sourceLocation.floorLevel).toBe(0); // raw upstream level preserved
      expect(res.devices[0].displayFloorId).toBe('4'); // mapped to Floor 4 under TEST scenario
    });

    it('TEST scenario: when upstream floor_level=6 returns empty because developing devices have install_floor_level == 0, falls back to floor_level=0 and treats as floor 6', async () => {
      // 1st call: GET /api/v1/devices?floor_level=6 -> empty
      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { count: 0 } }),
      });
      // 2nd call: fallback GET /api/v1/devices?floor_level=0 -> returns developing devices with install_floor_level == 0
      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              device_id: 'dev-dev-02',
              device_type: 'avc',
              install_location: { install_x: 0, install_y: 0, install_z: 0, install_floor_level: 0 },
              is_active: true,
            },
          ],
          meta: { count: 1 },
        }),
      });

      const res = await service.getFloorDevices('E', '6');

      expect(globalFetchMock).toHaveBeenCalledTimes(2);
      expect(globalFetchMock.mock.calls[0][0]).toBe(`${mockBaseUrl}/api/v1/devices?floor_level=6`);
      expect(globalFetchMock.mock.calls[1][0]).toBe(`${mockBaseUrl}/api/v1/devices?floor_level=0`);
      expect(res.floorId).toBe('6');
      expect(res.devices).toHaveLength(1);
      expect(res.devices[0].sourceLocation.floorLevel).toBe(0); // raw upstream level preserved
      expect(res.devices[0].displayFloorId).toBe('6'); // mapped to Floor 6 under TEST scenario
    });

    it('rejects floor G locally before making an upstream request', async () => {
      await expect(service.getFloorDevices('E', 'G')).rejects.toThrow(BadRequestException);
      expect(globalFetchMock).not.toHaveBeenCalled();
    });

    it('supports full catalogue retrieval without floor filter', async () => {
      globalFetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { count: 0 } }),
      });

      await service.getFullCatalogue();

      expect(globalFetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = globalFetchMock.mock.calls[0];
      expect(calledUrl).toBe(`${mockBaseUrl}/api/v1/devices`);
    });
  });
});
