/**
 * Centralized Environment Metric and Unit Mapping
 * Version: environment-metric-units-v1
 * Big Phase 02 / Phase 12 (SP25)
 *
 * Distinguishes documented_contract vs assumed_standard.
 * Zero hidden multiply/divide scales (strictly identity mapping).
 */

export const ENVIRONMENT_METRIC_UNITS_VERSION = 'environment-metric-units-v1';

export type EnvironmentUnitStatus = 'documented_contract' | 'assumed_standard';

export interface EnvironmentMetricUnitMetadata {
  key: string;
  sourceType: 'solar' | 'sb' | 'shared';
  label: string;
  unit: string;
  unitStatus: EnvironmentUnitStatus;
  hardwareConfirmed: boolean;
  description: string;
}

export const ENVIRONMENT_METRIC_UNITS: Record<string, EnvironmentMetricUnitMetadata> = {
  rawCo2: {
    key: 'rawCo2',
    sourceType: 'sb',
    label: 'CO₂',
    unit: 'ppm',
    unitStatus: 'assumed_standard',
    hardwareConfirmed: false,
    description: 'Chỉ số CO₂ từ Smart Building (SB), giả định đơn vị ppm theo tiêu chuẩn (identity mapping).',
  },
  rawVoltage: {
    key: 'rawVoltage',
    sourceType: 'sb',
    label: 'Điện áp pin',
    unit: 'V',
    unitStatus: 'assumed_standard',
    hardwareConfirmed: false,
    description: 'Điện áp pin đo được từ thiết bị SB, đơn vị Volt (V).',
  },
  rawVoc: {
    key: 'rawVoc',
    sourceType: 'sb',
    label: 'Chỉ số VOC',
    unit: 'index',
    unitStatus: 'assumed_standard',
    hardwareConfirmed: false,
    description: 'Chỉ số VOC tương đối (dimensionless index), không biểu thị nồng độ tuyệt đối.',
  },
  rawVisible: {
    key: 'rawVisible',
    sourceType: 'sb',
    label: 'Kênh quang học (Visible)',
    unit: 'count',
    unitStatus: 'assumed_standard',
    hardwareConfirmed: false,
    description: 'Số đếm kênh quang phổ nhìn thấy (sensor channel count).',
  },
  rawIr: {
    key: 'rawIr',
    sourceType: 'sb',
    label: 'Kênh hồng ngoại (IR)',
    unit: 'count',
    unitStatus: 'assumed_standard',
    hardwareConfirmed: false,
    description: 'Số đếm kênh quang phổ hồng ngoại (sensor channel count).',
  },
  rawTemperature: {
    key: 'rawTemperature',
    sourceType: 'solar',
    label: 'Nhiệt độ thô',
    unit: '°C',
    unitStatus: 'documented_contract',
    hardwareConfirmed: false,
    description: 'Nhiệt độ môi trường từ Solar telemetry theo hợp đồng kỹ thuật §3.6.',
  },
  rawHumidity: {
    key: 'rawHumidity',
    sourceType: 'solar',
    label: 'Độ ẩm thô',
    unit: '%',
    unitStatus: 'documented_contract',
    hardwareConfirmed: false,
    description: 'Độ ẩm tương đối từ Solar telemetry theo hợp đồng kỹ thuật §3.6.',
  },
  lux: {
    key: 'lux',
    sourceType: 'solar',
    label: 'Độ rọi',
    unit: 'lux',
    unitStatus: 'documented_contract',
    hardwareConfirmed: false,
    description: 'Độ rọi sáng quang thông từ Solar telemetry, đơn vị lux.',
  },
  rssi: {
    key: 'rssi',
    sourceType: 'shared',
    label: 'RSSI',
    unit: 'dBm',
    unitStatus: 'documented_contract',
    hardwareConfirmed: false,
    description: 'Chỉ số cường độ tín hiệu vô tuyến LoRa, đơn vị dBm.',
  },
  snr: {
    key: 'snr',
    sourceType: 'shared',
    label: 'SNR',
    unit: 'dB',
    unitStatus: 'documented_contract',
    hardwareConfirmed: false,
    description: 'Tỷ số tín hiệu trên nhiễu vô tuyến LoRa, đơn vị dB.',
  },
};

/**
 * Pure identity value mapping. Preserves 0, null, and finite values.
 * Never multiplies or divides by hidden scale factors.
 */
export function identityMapMetricValue(val: number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number' && Number.isFinite(val)) {
    return val;
  }
  return null;
}
