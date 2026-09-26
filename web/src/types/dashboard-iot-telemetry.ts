import {
  TelemetryCoverageSummary,
  SolarTelemetryData,
  AvcTelemetryData,
} from '@/types/iot-telemetry';

export type DashboardTelemetryPreset = 'last-24h' | 'last-72h' | 'last-7d';

export interface DashboardTelemetryLatestSample {
  observedAt: string;
  gatewayId: string | null;
  rssiDbm: number | null;
  snrDb: number | null;
}

export interface DashboardTelemetryProvenance {
  mode: 'live';
  sourceId: string;
  sourceType: 'iot_backend_telemetry';
  observedAt?: string;
  windowStart: string;
  windowEnd: string;
  fetchedAt: string;
  caveats?: string[];
}

export interface DashboardDeviceTelemetryResponse {
  schemaVersion: 1;
  buildingId: string;
  deviceId: string;
  deviceType: 'solar' | 'avc';
  availability: 'ready' | 'empty';
  provenance: DashboardTelemetryProvenance;
  queryRange: {
    start: string;
    stop: string;
    limit: number;
  };
  coverage: TelemetryCoverageSummary;
  latestSample: DashboardTelemetryLatestSample | null;
  telemetry: SolarTelemetryData | AvcTelemetryData;
}
