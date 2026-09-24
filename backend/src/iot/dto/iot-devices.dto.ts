export type DeviceCategory =
  | 'water_meter'
  | 'temperature_humidity'
  | 'smart_building'
  | 'rf_uhf_reader'
  | 'camera'
  | 'solar'
  | 'avc'
  | 'nfc'
  | 'unknown';

export interface IotDeviceListFilter {
  floorLevel?: number;
}

export interface FloorDeviceView {
  deviceId: string;
  sourceDeviceType: string;
  category: DeviceCategory;
  sourceLocation: {
    x: number;
    y: number;
    z?: number;
    floorLevel: number;
  };
  displayFloorId: string;
}

export interface FloorDeviceSummary {
  receivedCount: number;
  acceptedCount: number;
  skippedCount: number;
  duplicateCount: number;
  truncated: boolean | null;
}

export interface FloorDeviceResponse {
  schemaVersion: 1;
  buildingId: string;
  floorId: string;
  fetchedAt: string;
  mapping: {
    floorMode: 'TEST_CURRENT_FLOOR_4_6_V1' | string;
    coordinateMode: 'TEST_PREFAB_CENTER_XZ_V1' | string;
  };
  devices: FloorDeviceView[];
  summary: FloorDeviceSummary;
}

export interface IoTUpstreamLocation {
  install_x: number;
  install_y: number;
  install_z: number;
  install_floor_level: number;
}

export interface IoTUpstreamDevice {
  device_id: string;
  device_type: string;
  create_timestamp?: string;
  last_updated_timestamp?: string;
  install_location?: IoTUpstreamLocation;
  is_active?: boolean;
}

export interface IoTUpstreamDeviceListResponse {
  data: IoTUpstreamDevice[];
  meta?: {
    count?: number;
    truncated?: boolean;
    [key: string]: unknown;
  };
}

export interface IotDeviceGateway {
  listDevices(filter?: IotDeviceListFilter): Promise<IoTUpstreamDeviceListResponse>;
  getDevice(deviceId: string): Promise<unknown>;
}

