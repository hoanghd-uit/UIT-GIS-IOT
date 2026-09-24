import { DeviceCategory } from './iot-devices.dto';

// --- Upstream Response Definitions ---

export interface IoTUpstreamDeviceDetailResponse {
  data: {
    device_id: string;
    device_type: string;
    create_timestamp?: string;
    last_updated_timestamp?: string;
    install_location?: {
      install_x?: number;
      install_y?: number;
      install_z?: number;
      install_floor_level?: number;
    };
    is_active?: boolean;
    [key: string]: unknown;
  };
  meta?: Record<string, unknown>;
}

export interface IoTSolarRawReading {
  dev_eui: string;
  timestamp: string;
  device_id?: string;
  application_id?: string;
  gateway_id?: string;
  current_uA?: number;
  voltage?: number;
  temperature?: number;
  humidity?: number;
  lux?: number;
  rssi?: number;
  snr?: number;
  state?: number;
  f_cnt?: number;
  [key: string]: unknown;
}

export interface IoTUpstreamSolarResponse {
  data: IoTSolarRawReading[];
  meta?: {
    count?: number;
    truncated?: boolean;
    [key: string]: unknown;
  };
}

export interface IoTAvcRawReading {
  dev_eui: string;
  timestamp: string;
  dev_addr?: string;
  device_name?: string;
  gateway_id?: string;
  meter_sn?: string;
  region?: string;
  tag_source?: string;
  fwd_volume_m3?: number;
  rev_volume_m3?: number;
  instant_flow_m3h?: number;
  valve_open?: number;
  pipe_leak?: number;
  pipe_burst?: number;
  battery_low?: number;
  frozen?: number;
  tamper?: number;
  reverse_flow?: number;
  frequency_hz?: number;
  spreading_factor?: number;
  dr?: number;
  fcnt?: number;
  rssi?: number;
  snr?: number;
  temp_c?: number;
  [key: string]: unknown;
}

export interface IoTUpstreamAvcResponse {
  data: IoTAvcRawReading[];
  meta?: {
    count?: number;
    truncated?: boolean;
    [key: string]: unknown;
  };
}

export interface IoTNfcRawEvent {
  dev_eui: string;
  timestamp: string;
  batch_id?: string;
  detected_card_id: string;
  moving_direction: 'in' | 'out' | string;
  [key: string]: unknown;
}

export interface IoTUpstreamNfcResponse {
  data: IoTNfcRawEvent[];
  meta?: {
    count?: number;
    truncated?: boolean;
    [key: string]: unknown;
  };
}

// --- Application Query DTO ---

export interface DeviceTelemetryQueryDto {
  start: string; // ISO-8601 UTC string
  stop: string;  // ISO-8601 UTC string
  limit?: number; // Integer, default 1000, cap 10000
  deviceTypeHint?: string;
}

// --- Normalized Telemetry Data Models ---

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
