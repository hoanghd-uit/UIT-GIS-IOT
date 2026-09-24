import { DeviceCategory } from './iot-devices';

export interface TelemetryCoverageSummary {
  returnedCount: number;
  validCount: number;
  invalidCount: number;
  isTruncated: boolean;
  earliestTimestamp: string | null;
  latestTimestamp: string | null;
  reachedLimit: boolean;
}

export interface NormalizedSolarReading {
  timestamp: string;
  devEui: string;
  deviceIdFriendly: string | null;
  currentUa: number | null;
  lux: number | null;
  rssi: number | null;
  snr: number | null;
  rawState: number | null;
  rawVoltage: number | null;
  rawTemperature: number | null;
  rawHumidity: number | null;
  fCnt: number | null;
  applicationId: string | null;
  gatewayId: string | null;
}

export interface NormalizedAvcReading {
  timestamp: string;
  devEui: string;
  deviceName: string | null;
  meterSn: string | null;
  instantFlowM3h: number | null;
  fwdVolumeM3: number | null;
  revVolumeM3: number | null;
  tempC: number | null;
  rawValveOpen: number | null;
  rawPipeLeak: number | null;
  rawPipeBurst: number | null;
  rawBatteryLow: number | null;
  rawFrozen: number | null;
  rawTamper: number | null;
  rawReverseFlow: number | null;
  rssi: number | null;
  snr: number | null;
  fcnt: number | null;
  devAddr: string | null;
  gatewayId: string | null;
  region: string | null;
  frequencyHz: number | null;
  spreadingFactor: number | null;
  dr: number | null;
}

export interface NormalizedNfcEvent {
  timestamp: string;
  devEui: string;
  detectedCardId: string;
  movingDirection: 'in' | 'out';
  batchId: string | null;
}

export interface SolarTelemetryData {
  type: 'solar';
  category: DeviceCategory;
  hero: {
    metric: 'current_uA';
    label: string;
    unit: string;
    value: number | null;
    sampleTimestamp: string | null;
  };
  secondarySelector: {
    metric: 'lux';
    label: string;
    unit: string;
    value: number | null;
    sampleTimestamp: string | null;
  };
  status: {
    label: string;
    rawState: number | null;
    isConfirmed: false;
  };
  readings: NormalizedSolarReading[];
}

export interface AvcTelemetryData {
  type: 'avc';
  category: DeviceCategory;
  hero: {
    metric: 'instant_flow_m3h';
    label: string;
    unit: string;
    value: number | null;
    sampleTimestamp: string | null;
    pendingHardwareBadge: true;
  };
  secondarySelectors: {
    tempC: {
      metric: 'temp_c';
      label: string;
      unit: string;
      value: number | null;
      sampleTimestamp: string | null;
      pendingHardwareBadge: false;
    };
    fwdVolume: {
      metric: 'fwd_volume_m3';
      label: string;
      unit: string;
      value: number | null;
      sampleTimestamp: string | null;
      pendingHardwareBadge: true;
    };
    revVolume: {
      metric: 'rev_volume_m3';
      label: string;
      unit: string;
      value: number | null;
      sampleTimestamp: string | null;
      pendingHardwareBadge: true;
    };
  };
  status: {
    label: string;
    isConfirmed: false;
    rawFlags: {
      valveOpen: number | null;
      pipeLeak: number | null;
      pipeBurst: number | null;
      batteryLow: number | null;
      frozen: number | null;
      tamper: number | null;
      reverseFlow: number | null;
    };
  };
  readings: NormalizedAvcReading[];
}

export interface NfcTelemetryData {
  type: 'nfc';
  category: DeviceCategory;
  hero: {
    latestEvent: NormalizedNfcEvent | null;
    totalInCount: number;
    totalOutCount: number;
    loadedEventCount: number;
  };
  status: {
    label: string;
    isConfirmed: false;
  };
  events: NormalizedNfcEvent[];
}

export interface UnknownTelemetryData {
  type: 'unknown';
  category: DeviceCategory;
  rawType: string;
  message: string;
  status: {
    label: string;
    isConfirmed: false;
  };
}


export type NormalizedTelemetryPayload =
  | SolarTelemetryData
  | AvcTelemetryData
  | NfcTelemetryData
  | UnknownTelemetryData;

export interface DeviceTelemetryResponseDto {
  schemaVersion: 1;
  deviceId: string;
  deviceType: 'solar' | 'avc' | 'nfc' | 'unknown';
  fetchedAt: string;
  queryRange: {
    start: string;
    stop: string;
    limit: number;
  };
  coverage: TelemetryCoverageSummary;
  telemetry: NormalizedTelemetryPayload;
}
