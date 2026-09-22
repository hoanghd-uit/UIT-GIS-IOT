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

export interface FloorDeviceView {
  deviceId: string;
  sourceDeviceType: string;
  category: DeviceCategory;
  sourceLocation: {
    x: number;
    y: number;
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
    floorMode: string;
    coordinateMode: string;
  };
  devices: FloorDeviceView[];
  summary: FloorDeviceSummary;
}

export interface FloorDeviceMarkersAppliedPayload {
  schemaVersion: 1;
  routeRequestId?: string;
  loadGeneration: number;
  buildingId: string;
  floorId: string;
  appliedCount: number;
  status: 'applied' | 'rejected';
  errorCode?: string | null;
}

export interface DeviceMarkerGroupClickedPayload {
  schemaVersion: 1;
  buildingId: string;
  floorId: string;
  count: number;
  deviceIds: string[];
}

