import {
  DashboardEnvironmentReadingItem,
  EnvironmentRawMetricKey,
} from '@/types/dashboard-environment';

export interface EnvironmentChartPoint {
  timestamp: string;
  value: number;
  metricLabel: string;
  [key: string]: unknown;
}

const METRIC_LABELS: Record<EnvironmentRawMetricKey, string> = {
  rawTemperature: 'Raw temperature',
  rawHumidity: 'Raw humidity',
  lux: 'Độ rọi',
  rssi: 'RSSI',
  snr: 'SNR',
};

/**
 * Transforms newest-first API readings into sorted oldest-first chart data points.
 * Preserves zero values and drops null/undefined/non-finite readings for the selected metric.
 * Does NOT mutate the input array.
 */
export function prepareEnvironmentChartData(
  readings: DashboardEnvironmentReadingItem[],
  metricKey: EnvironmentRawMetricKey,
): EnvironmentChartPoint[] {
  if (!Array.isArray(readings) || readings.length === 0) {
    return [];
  }

  // Clone array to avoid mutating newest-first source
  const copy = [...readings];

  // Sort oldest-first for chronological time-series chart
  copy.sort((a, b) => {
    const timeA = new Date(a.observedAt).getTime();
    const timeB = new Date(b.observedAt).getTime();
    return timeA - timeB;
  });

  const metricLabel = METRIC_LABELS[metricKey] || metricKey;
  const result: EnvironmentChartPoint[] = [];

  for (const item of copy) {
    let rawVal: number | null | undefined = null;
    if (metricKey === 'rawTemperature') rawVal = item.rawTemperature;
    else if (metricKey === 'rawHumidity') rawVal = item.rawHumidity;
    else if (metricKey === 'lux') rawVal = item.lux;
    else if (metricKey === 'rssi') rawVal = item.rssiDbm;
    else if (metricKey === 'snr') rawVal = item.snrDb;

    if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
      result.push({
        timestamp: item.observedAt,
        value: rawVal,
        metricLabel,
      });
    }
  }

  return result;
}
