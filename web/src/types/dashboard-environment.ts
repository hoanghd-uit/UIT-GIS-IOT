/**
 * Types for Dashboard Page 03 — Environment (IAQ)
 * Big Phase 02 / Phase 05
 */

export type EnvironmentTimeRangePreset = '24h' | '72h' | '7d';

export type EnvironmentSourceDeviceType = 'solar' | 'sb';

export interface DashboardEnvironmentSourceItem {
  deviceId: string;
  sourceDeviceType: EnvironmentSourceDeviceType;
  catalogueActive: boolean;
  sourceCreatedAt: string | null;
  sourceUpdatedAt: string | null;
  sourceLocation: {
    x?: number;
    y?: number;
    z?: number;
    floorLevel?: number;
    roomId?: string | null;
  };
  displayFloorId: string | null;
  floorAssignment: 'source' | 'development-fallback' | 'unmapped';
  semanticStatus: 'unconfirmed_environment_candidate';
  supportedMetrics?: string[];
}

export interface DashboardEnvironmentSourceListResponse {
  schemaVersion: number;
  buildingId: string;
  requestedFloorId: string | null;
  availability: 'ready' | 'empty';
  provenance: {
    mode: 'live';
    sourceType: string;
    fetchedAt: string;
    caveats?: string[];
  };
  summary: {
    receivedCount: number;
    acceptedSolarCount: number;
    acceptedSbCount?: number;
    skippedCount: number;
    duplicateCount: number;
    truncated: boolean | null;
  };
  sources: DashboardEnvironmentSourceItem[];
}

export interface DashboardEnvironmentMetricSummary {
  mean: number | null;
  min: number | null;
  max: number | null;
  contributingSourceCount: number;
  unit: string | null;
  semanticStatus?: string;
  observedAt?: string | null;
}

export interface DashboardEnvironmentSummaryResponse {
  schemaVersion: number;
  buildingId: string;
  availability: 'ready' | 'partial' | 'empty';
  queryRange: {
    start: string;
    stop: string;
    limitPerSource: number;
  };
  provenance: {
    mode: 'derived';
    sourceType: string;
    calculation: string;
    fetchedAt: string;
    calculatedAt: string;
    caveats: string[];
    mappingVersion?: string;
  };
  coverage: {
    catalogueSolarCount: number;
    catalogueSbCount?: number;
    attemptedSourceCount: number;
    attemptedSolarCount?: number;
    attemptedSbCount?: number;
    successfulSourceCount: number;
    emptySourceCount: number;
    failedSourceCount: number;
    sourcesTruncated: boolean;
    selectionPolicy?: string;
  };
  metrics: {
    rawTemperature: DashboardEnvironmentMetricSummary;
    rawHumidity: DashboardEnvironmentMetricSummary;
    lux: DashboardEnvironmentMetricSummary;
    co2?: DashboardEnvironmentMetricSummary;
  };
  latestObservedAt: string | null;
  sourceResults: Array<{
    deviceId: string;
    sourceDeviceType?: EnvironmentSourceDeviceType;
    status: 'ready' | 'empty' | 'error';
    observedAt: string | null;
    co2?: number | null;
  }>;
}

export interface DashboardEnvironmentLatestSample {
  observedAt: string;
  // Solar fields
  rawTemperature?: number | null;
  rawHumidity?: number | null;
  lux?: number | null;
  currentUa?: number | null;
  rawVoltage?: number | null;
  rawState?: number | null;
  gatewayId?: string | null;
  rssiDbm?: number | null;
  snrDb?: number | null;
  // SB fields
  rawCo2?: number | null;
  rawVoc?: number | null;
  rawVisible?: number | null;
  rawIr?: number | null;
  networkDeviceName?: string | null;
  applicationId?: string | null;
  fCnt?: number | null;
}

export interface DashboardEnvironmentReadingItem {
  observedAt: string;
  // Solar fields
  rawTemperature?: number | null;
  rawHumidity?: number | null;
  lux?: number | null;
  currentUa?: number | null;
  rawVoltage?: number | null;
  rawState?: number | null;
  gatewayId?: string | null;
  rssiDbm?: number | null;
  snrDb?: number | null;
  fCnt?: number | null;
  // SB fields
  rawCo2?: number | null;
  rawVoc?: number | null;
  rawVisible?: number | null;
  rawIr?: number | null;
  networkDeviceName?: string | null;
  applicationId?: string | null;
}

export interface DashboardEnvironmentReadingsResponse {
  schemaVersion: number;
  buildingId: string;
  sourceId: string;
  sourceDeviceType: EnvironmentSourceDeviceType;
  availability: 'ready' | 'empty';
  queryRange: {
    start: string;
    stop: string;
    limit: number;
  };
  provenance: {
    mode: 'live';
    sourceId: string;
    sourceType: string;
    observedAt?: string | null;
    windowStart: string;
    windowEnd: string;
    fetchedAt: string;
    caveats: string[];
  };
  coverage: {
    returnedCount: number;
    validCount: number;
    invalidCount: number;
    isTruncated: boolean;
    earliestTimestamp: string | null;
    latestTimestamp: string | null;
    reachedLimit: boolean;
  };
  latestSample: DashboardEnvironmentLatestSample | null;
  readings: DashboardEnvironmentReadingItem[];
}

export type EnvironmentRawMetricKey =
  | 'rawTemperature'
  | 'rawHumidity'
  | 'lux'
  | 'rawCo2'
  | 'rawVoc'
  | 'rawVoltage'
  | 'rawVisible'
  | 'rawIr'
  | 'rssi'
  | 'snr';

export interface Co2DemoRoomData {
  roomId: string;
  roomName: string;
  floor: string;
  hourlyValues: Array<{ hour: string; value: number }>;
}

export interface Co2DemoRoomRanking {
  roomId: string;
  roomName: string;
  floor: string;
  latestValue: number;
  status: 'good' | 'moderate' | 'warning';
}

export interface Co2FloorComplianceItem {
  floor: string;
  compliancePercent: number;
  sampleCount: number;
}

export interface Co2DemoFixtureData {
  fixtureId: 'page03-co2-demo-v1';
  version: '1.0.0';
  hours: string[];
  floors: string[];
  rooms: Co2DemoRoomData[];
  rankings: Co2DemoRoomRanking[];
  compliance: Co2FloorComplianceItem[];
  kpis: {
    averageCo2: number;
    peakRoom: string;
    peakCo2: number;
    vocIndex: number;
    vocLabel: string;
    maxCo2: number;
  };
  thresholds: {
    co2GoodMax: number;
    co2ModerateMax: number;
    vocGoodMax: number;
  };
}
