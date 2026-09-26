import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DashboardIotCatalogueService } from '../dashboard-iot-catalogue.service';
import { DashboardIotTelemetryService } from '../dashboard-iot-telemetry.service';
import { DashboardIotController } from '../dashboard-iot.controller';
import { IotClientService } from '../../iot/services/iot-client.service';
import { IotMapperService } from '../../iot/services/iot-mapper.service';
import { IoTUpstreamDeviceListResponse } from '../../iot/dto/iot-devices.dto';

describe('DashboardIotCatalogueService & Controller (Big Phase 02 / Phase 02)', () => {
  let service: DashboardIotCatalogueService;
  let controller: DashboardIotController;
  let mockClient: jest.Mocked<Partial<IotClientService>>;
  let mapperService: IotMapperService;
  let mockConfigValues: Record<string, any>;

  const validSnapshot: IoTUpstreamDeviceListResponse = {
    data: [
      {
        device_id: '70B3D57ED0073E9D',
        device_type: 'solar',
        create_timestamp: '2026-09-20T19:09:17.355Z',
        last_updated_timestamp: '2026-09-20T19:09:17.355Z',
        install_location: { install_x: 10.5, install_y: 2.1, install_z: 15.3, install_floor_level: 4 },
        is_active: true,
      },
      {
        device_id: 'dummy-opaque-sensor-123',
        device_type: 'avc',
        create_timestamp: '2026-09-21T08:00:00.000Z',
        last_updated_timestamp: '2026-09-21T09:30:00.000Z',
        install_location: { install_x: 0, install_y: 0, install_z: 0, install_floor_level: 6 },
        is_active: false,
      },
    ],
    meta: {
      count: 2,
      truncated: false,
    },
  };

  beforeEach(async () => {
    mockConfigValues = {
      'fixtures.mode': 'iot',
      'iot.floorMode': 'TEST_CURRENT_FLOOR_4_6_V1',
      'iot.coordinateMode': 'TEST_PREFAB_CENTER_XZ_V1',
      'iot.masterToken': 'mock-secret-master-token-12345',
      'iot.baseUrl': 'https://api.ttlab.manhthao.uk',
      'iot.timeoutMs': 10000,
    };

    const configServiceMock = {
      get: jest.fn((key: string, defaultValue?: any) => {
        return mockConfigValues[key] !== undefined ? mockConfigValues[key] : defaultValue;
      }),
    };

    mockClient = {
      fetchRawDevices: jest.fn().mockResolvedValue(validSnapshot),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardIotController],
      providers: [
        DashboardIotCatalogueService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: IotClientService,
          useValue: mockClient,
        },
        IotMapperService,
        {
          provide: DashboardIotTelemetryService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DashboardIotCatalogueService>(DashboardIotCatalogueService);
    controller = module.get<DashboardIotController>(DashboardIotController);
    mapperService = module.get<IotMapperService>(IotMapperService);
  });

  // BP2-P02-T01: Dashboard catalogue route is GET-only and resolves through the existing IoT integration
  it('BP2-P02-T01: Controller calls catalogue service and resolves through existing IoT integration', async () => {
    const res = await controller.getCatalogue('E', {});
    expect(res).toBeDefined();
    expect(res.schemaVersion).toBe(1);
    expect(res.buildingId).toBe('E');
    expect(mockClient.fetchRawDevices).toHaveBeenCalled();
  });

  // BP2-P02-T02: Omitting floorId performs exactly one unfiltered /api/v1/devices read
  it('BP2-P02-T02: Omitting floorId performs exactly one unfiltered read without floor_level query', async () => {
    const res = await service.getCatalogue('E');
    expect(mockClient.fetchRawDevices).toHaveBeenCalledTimes(1);
    expect(mockClient.fetchRawDevices).toHaveBeenCalledWith();
    expect(res.requestedFloorId).toBeNull();
    expect(res.mapping.requestedUpstreamFloorLevel).toBeNull();
  });

  // BP2-P02-T03: floorId=4 and floorId=6 resolve to scoped integer upstream queries
  it('BP2-P02-T03: floorId=4 and floorId=6 resolve to scoped integer upstream queries', async () => {
    await service.getCatalogue('E', '4');
    expect(mockClient.fetchRawDevices).toHaveBeenCalledWith({ floorLevel: 4 });

    (mockClient.fetchRawDevices as jest.Mock).mockClear();
    await service.getCatalogue('E', '6');
    expect(mockClient.fetchRawDevices).toHaveBeenCalledWith({ floorLevel: 6 });
  });

  // BP2-P02-T04: Building outside E, floorId=G, malformed floor, and unsupported floor fail before upstream access
  it('BP2-P02-T04: Invalid building, floor G, and unsupported floors fail before calling upstream', async () => {
    // Building outside E
    await expect(service.getCatalogue('B', '4')).rejects.toThrow(BadRequestException);
    expect(mockClient.fetchRawDevices).not.toHaveBeenCalled();

    // Floor G
    await expect(service.getCatalogue('E', 'G')).rejects.toThrow(BadRequestException);
    expect(mockClient.fetchRawDevices).not.toHaveBeenCalled();

    // Malformed floor string
    await expect(service.getCatalogue('E', 'invalid_floor')).rejects.toThrow(BadRequestException);
    expect(mockClient.fetchRawDevices).not.toHaveBeenCalled();

    // Unsupported floor (e.g. 5 under TEST_CURRENT_FLOOR_4_6_V1)
    await expect(service.getCatalogue('E', '5')).rejects.toThrow(BadRequestException);
    expect(mockClient.fetchRawDevices).not.toHaveBeenCalled();
  });

  // BP2-P02-T05: Opaque IDs including non-UUID/dummy values are preserved
  it('BP2-P02-T05: Preserves non-UUID and dummy opaque device IDs', async () => {
    const res = await service.getCatalogue('E');
    expect(res.devices).toHaveLength(2);
    expect(res.devices[0].externalDeviceId).toBe('70B3D57ED0073E9D');
    expect(res.devices[1].externalDeviceId).toBe('dummy-opaque-sensor-123');
  });

  // BP2-P02-T06: ID, type, activity, source timestamps, fetch time, floor, and X/Y/Z map correctly
  it('BP2-P02-T06: All required fields map correctly with valid types and values', async () => {
    const res = await service.getCatalogue('E');
    const first = res.devices[0];

    expect(first.externalDeviceId).toBe('70B3D57ED0073E9D');
    expect(first.sourceDeviceType).toBe('solar');
    expect(first.category).toBe('solar');
    expect(first.active).toBe(true);
    expect(first.sourceCreatedAt).toBe('2026-09-20T19:09:17.355Z');
    expect(first.sourceUpdatedAt).toBe('2026-09-20T19:09:17.355Z');
    expect(first.sourceLocation).toEqual({
      x: 10.5,
      y: 2.1,
      z: 15.3,
      floorLevel: 4,
    });
    expect(first.displayFloorId).toBe('4');
    expect(first.floorAssignment).toBe('source');

    // Provenance fetchedAt
    expect(res.provenance.mode).toBe('live');
    expect(res.provenance.sourceId).toBe('iot-device-catalogue');
    expect(res.provenance.sourceType).toBe('iot_backend');
    expect(Date.parse(res.provenance.fetchedAt)).not.toBeNaN();
  });

  // BP2-P02-T07: sourceUpdatedAt is not labeled or treated as telemetry last-seen
  it('BP2-P02-T07: sourceUpdatedAt preserves source metadata timestamp and does not claim telemetry last-seen', async () => {
    const res = await service.getCatalogue('E');
    expect(res.devices[1].sourceUpdatedAt).toBe('2026-09-21T09:30:00.000Z');
    expect((res.devices[1] as any).lastSeen).toBeUndefined();
    expect((res.devices[1] as any).lastTransmission).toBeUndefined();
  });

  // BP2-P02-T08: Duplicate IDs keep the first valid item and increment duplicateCount
  it('BP2-P02-T08: Duplicate device IDs keep first record and increment duplicateCount', async () => {
    (mockClient.fetchRawDevices as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          device_id: 'DUP-01',
          device_type: 'solar',
          create_timestamp: '2026-09-20T10:00:00.000Z',
          last_updated_timestamp: '2026-09-20T10:00:00.000Z',
          install_location: { install_x: 1, install_y: 2, install_z: 3, install_floor_level: 4 },
          is_active: true,
        },
        {
          device_id: 'DUP-01', // duplicate
          device_type: 'solar',
          create_timestamp: '2026-09-20T11:00:00.000Z',
          last_updated_timestamp: '2026-09-20T11:00:00.000Z',
          install_location: { install_x: 9, install_y: 9, install_z: 9, install_floor_level: 4 },
          is_active: false,
        },
        {
          device_id: 'UNIQUE-02',
          device_type: 'avc',
          create_timestamp: '2026-09-20T10:00:00.000Z',
          last_updated_timestamp: '2026-09-20T10:00:00.000Z',
          install_location: { install_x: 4, install_y: 5, install_z: 6, install_floor_level: 4 },
          is_active: true,
        },
      ],
      meta: { count: 3, truncated: false },
    });

    const res = await service.getCatalogue('E');
    expect(res.summary.receivedCount).toBe(3);
    expect(res.summary.acceptedCount).toBe(2);
    expect(res.summary.duplicateCount).toBe(1);
    expect(res.devices).toHaveLength(2);
    expect(res.devices[0].externalDeviceId).toBe('DUP-01');
    expect(res.devices[0].sourceLocation.x).toBe(1); // kept first
    expect(res.provenance.caveats).toBeDefined();
    expect(res.provenance.caveats?.some((c) => c.includes('trùng lặp'))).toBe(true);
  });

  // BP2-P02-T09: Malformed item fields never become default/fabricated values and are reflected in quality summary/error behavior
  it('BP2-P02-T09: Malformed records are skipped without fabrication; all-malformed payload throws 502', async () => {
    (mockClient.fetchRawDevices as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          device_id: '', // empty ID
          device_type: 'solar',
          create_timestamp: '2026-09-20T10:00:00.000Z',
          last_updated_timestamp: '2026-09-20T10:00:00.000Z',
          install_location: { install_x: 1, install_y: 2, install_z: 3, install_floor_level: 4 },
          is_active: true,
        },
        {
          device_id: 'VALID-01',
          device_type: 'solar',
          create_timestamp: 'not-a-date', // malformed timestamp
          last_updated_timestamp: '2026-09-20T10:00:00.000Z',
          install_location: { install_x: 1, install_y: 2, install_z: 3, install_floor_level: 4 },
          is_active: true,
        },
        {
          device_id: 'VALID-02',
          device_type: 'solar',
          create_timestamp: '2026-09-20T10:00:00.000Z',
          last_updated_timestamp: '2026-09-20T10:00:00.000Z',
          install_location: { install_x: NaN, install_y: 2, install_z: 3, install_floor_level: 4 }, // non-finite
          is_active: true,
        },
        {
          device_id: 'VALID-03',
          device_type: 'solar',
          create_timestamp: '2026-09-20T10:00:00.000Z',
          last_updated_timestamp: '2026-09-20T10:00:00.000Z',
          install_location: { install_x: 10, install_y: 20, install_z: 30, install_floor_level: 4 },
          is_active: true,
        },
      ],
      meta: { count: 4, truncated: false },
    });

    const res = await service.getCatalogue('E');
    expect(res.summary.receivedCount).toBe(4);
    expect(res.summary.skippedCount).toBe(3);
    expect(res.summary.acceptedCount).toBe(1);
    expect(res.devices[0].externalDeviceId).toBe('VALID-03');

    // All received rows malformed -> throws BadGatewayException
    (mockClient.fetchRawDevices as jest.Mock).mockResolvedValueOnce({
      data: [{ device_id: '' }],
      meta: { count: 1 },
    });
    await expect(service.getCatalogue('E')).rejects.toThrow(BadGatewayException);
  });

  // BP2-P02-T10: Empty successful upstream response yields availability: empty rather than an error or demo data
  it('BP2-P02-T10: Clean empty upstream response yields availability: empty and zero devices', async () => {
    (mockClient.fetchRawDevices as jest.Mock).mockResolvedValueOnce({
      data: [],
      meta: { count: 0, truncated: false },
    });

    const res = await service.getCatalogue('E');
    expect(res.availability).toBe('empty');
    expect(res.summary.receivedCount).toBe(0);
    expect(res.summary.acceptedCount).toBe(0);
    expect(res.devices).toEqual([]);
    expect(res.provenance.mode).toBe('live');
  });

  // BP2-P02-T11: Missing/tolerant meta fields are accepted; truncated: true produces a visible caveat
  it('BP2-P02-T11: Accepts missing meta fields and flags truncated: true in caveats', async () => {
    (mockClient.fetchRawDevices as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          device_id: 'TRUNC-01',
          device_type: 'solar',
          create_timestamp: '2026-09-20T10:00:00.000Z',
          last_updated_timestamp: '2026-09-20T10:00:00.000Z',
          install_location: { install_x: 1, install_y: 2, install_z: 3, install_floor_level: 4 },
          is_active: true,
        },
      ],
      meta: { truncated: true }, // missing count
    });

    const res = await service.getCatalogue('E');
    expect(res.summary.truncated).toBe(true);
    expect(res.provenance.caveats?.some((c) => c.includes('bị cắt ngắn'))).toBe(true);
  });

  // BP2-P02-T12: Development floor-0 fallback preserves source floor 0 and is explicitly marked, never silently rewritten
  it('BP2-P02-T12: Development floor 0 fallback preserves sourceLocation.floorLevel == 0 and marks development-fallback', async () => {
    // When floor 4 returns 0 devices, falls back to floor 0
    (mockClient.fetchRawDevices as jest.Mock)
      .mockResolvedValueOnce({ data: [], meta: { count: 0 } }) // initial floorLevel 4
      .mockResolvedValueOnce({
        data: [
          {
            device_id: 'FALLBACK-DEV-01',
            device_type: 'solar',
            create_timestamp: '2026-09-20T10:00:00.000Z',
            last_updated_timestamp: '2026-09-20T10:00:00.000Z',
            install_location: { install_x: 5, install_y: 6, install_z: 7, install_floor_level: 0 },
            is_active: true,
          },
        ],
        meta: { count: 1 },
      });

    const res = await service.getCatalogue('E', '4');
    expect(mockClient.fetchRawDevices).toHaveBeenCalledTimes(2);
    expect(mockClient.fetchRawDevices).toHaveBeenNthCalledWith(1, { floorLevel: 4 });
    expect(mockClient.fetchRawDevices).toHaveBeenNthCalledWith(2, { floorLevel: 0 });

    expect(res.mapping.developmentFallbackApplied).toBe(true);
    expect(res.devices[0].sourceLocation.floorLevel).toBe(0); // preserved!
    expect(res.devices[0].displayFloorId).toBe('4');
    expect(res.devices[0].floorAssignment).toBe('development-fallback');
    expect(res.provenance.caveats?.some((c) => c.includes('development fallback'))).toBe(true);
  });

  // BP2-P02-T13: Unmapped full-catalogue floors do not guess a display floor, especially no implicit 0 -> G
  it('BP2-P02-T13: Full-catalogue items with source floor 0 or unmapped floor have displayFloorId: null and floorAssignment: unmapped', async () => {
    (mockClient.fetchRawDevices as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          device_id: 'FLOOR-0-DEV',
          device_type: 'solar',
          create_timestamp: '2026-09-20T10:00:00.000Z',
          last_updated_timestamp: '2026-09-20T10:00:00.000Z',
          install_location: { install_x: 1, install_y: 2, install_z: 3, install_floor_level: 0 },
          is_active: true,
        },
        {
          device_id: 'FLOOR-4-DEV',
          device_type: 'solar',
          create_timestamp: '2026-09-20T10:00:00.000Z',
          last_updated_timestamp: '2026-09-20T10:00:00.000Z',
          install_location: { install_x: 1, install_y: 2, install_z: 3, install_floor_level: 4 },
          is_active: true,
        },
      ],
      meta: { count: 2 },
    });

    const res = await service.getCatalogue('E');
    expect(res.devices[0].displayFloorId).toBeNull();
    expect(res.devices[0].floorAssignment).toBe('unmapped');
    expect(res.devices[0].displayFloorId).not.toBe('G'); // never guess G!

    expect(res.devices[1].displayFloorId).toBe('4');
    expect(res.devices[1].floorAssignment).toBe('source');
  });

  // BP2-P02-T14: DEVICE_SOURCE_MODE=disabled and fixture cannot return rows labeled live
  it('BP2-P02-T14: Rejects when DEVICE_SOURCE_MODE is disabled or fixture with 503', async () => {
    mockConfigValues['fixtures.mode'] = 'disabled';
    await expect(service.getCatalogue('E')).rejects.toThrow(ServiceUnavailableException);

    mockConfigValues['fixtures.mode'] = 'fixture';
    await expect(service.getCatalogue('E')).rejects.toThrow(ServiceUnavailableException);
  });

  // BP2-P02-T15: Missing credential, upstream 401, timeout/network error, invalid JSON, and schema drift yield sanitized application errors
  it('BP2-P02-T15: Sanitizes upstream errors and never leaks token, URLs, or secrets', async () => {
    // Missing credential error from client
    (mockClient.fetchRawDevices as jest.Mock).mockRejectedValueOnce(
      new ServiceUnavailableException('IoT API master token is not configured on the backend server.'),
    );
    try {
      await service.getCatalogue('E');
      fail('Expected ServiceUnavailableException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ServiceUnavailableException);
      expect(err.message).not.toContain('mock-secret-master-token-12345');
      expect(err.message).not.toContain('master token');
    }

    // Upstream 401 error
    (mockClient.fetchRawDevices as jest.Mock).mockRejectedValueOnce(
      new BadGatewayException('Upstream IoT API authentication failed (401 Unauthorized). Please check master token.'),
    );
    try {
      await service.getCatalogue('E');
      fail('Expected BadGatewayException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadGatewayException);
      expect(err.message).not.toContain('check master token');
    }
  });

  // BP2-P02-T16: The implementation performs no PostgreSQL write and adds no migration/entity
  it('BP2-P02-T16: Zero database persistence: service does not interact with any repository or entity', () => {
    // Verify service has no TypeORM or repository dependencies
    expect((service as any).repo).toBeUndefined();
    expect((service as any).dataSource).toBeUndefined();
    expect((service as any).entityManager).toBeUndefined();
  });
});
