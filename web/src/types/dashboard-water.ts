import { TelemetryCoverageSummary } from './iot-telemetry';

export type WaterTimeRangePreset =
  | 'today'
  | '7d'
  | '30d'
  | 'custom'
  | 'last-24h'
  | 'last-72h'
  | 'last-7d';

export type WaterMetricKey =
  | 'instantFlowM3h'
  | 'forwardVolumeM3'
  | 'reverseVolumeM3'
  | 'temperatureC';

export interface DashboardWaterMeterItem {
  deviceId: string;
  sourceDeviceType: 'avc';
  catalogueActive: boolean;
  sourceCreatedAt: string;
  sourceUpdatedAt: string;
  sourceLocation: {
    x: number;
    y: number;
    z: number;
    floorLevel: number;
  };
  displayFloorId: string | null;
  floorAssignment: 'source' | 'development-fallback' | 'unmapped';
}

export interface DashboardWaterMeterListResponse {
  schemaVersion: 1;
  buildingId: string;
  requestedFloorId: string | null;
  availability: 'ready' | 'empty';
  provenance: {
    mode: 'live';
    sourceId: string;
    sourceType: string;
    fetchedAt: string;
    caveats?: string[];
  };
  summary: {
    receivedCount: number;
    acceptedCount: number;
    skippedCount: number;
    duplicateCount: number;
    truncated: boolean | null;
  };
  meters: DashboardWaterMeterItem[];
}

export interface DashboardWaterReadingRawFlags {
  valveOpen: number | null;
  pipeLeak: number | null;
  pipeBurst: number | null;
  batteryLow: number | null;
  frozen: number | null;
  tamper: number | null;
  reverseFlow: number | null;
}

export interface DashboardWaterRadioMetadata {
  devAddr?: string | null;
  fcnt?: number | null;
  region?: string | null;
  frequencyHz?: number | null;
  spreadingFactor?: number | null;
  dr?: number | null;
}

export interface DashboardWaterReadingItem {
  observedAt: string;
  instantFlowM3h: number | null;
  forwardVolumeM3: number | null;
  reverseVolumeM3: number | null;
  temperatureC: number | null;
  rssiDbm: number | null;
  snrDb: number | null;
  gatewayId: string | null;
  rawFlags: DashboardWaterReadingRawFlags;
  radioMetadata?: DashboardWaterRadioMetadata;
}

export interface DashboardWaterLatestSample {
  observedAt: string;
  deviceName: string | null;
  meterSerial: string | null;
  gatewayId: string | null;
  rssiDbm: number | null;
  snrDb: number | null;
  instantFlowM3h: number | null;
  forwardVolumeM3: number | null;
  reverseVolumeM3: number | null;
  temperatureC: number | null;
  rawFlags: DashboardWaterReadingRawFlags;
}

export interface DashboardWaterReadingsResponse {
  schemaVersion: 1;
  buildingId: string;
  meterId: string;
  availability: 'ready' | 'empty';
  provenance: {
    mode: 'live';
    sourceId: string;
    sourceType: string;
    observedAt?: string;
    windowStart: string;
    windowEnd: string;
    fetchedAt: string;
    caveats?: string[];
  };
  queryRange: {
    start: string;
    stop: string;
    limit: number;
  };
  coverage: TelemetryCoverageSummary;
  latestSample: DashboardWaterLatestSample | null;
  readings: DashboardWaterReadingItem[];
}
