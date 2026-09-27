import { NormalizedSolarReading } from '../iot/dto/iot-telemetry.dto';
import {
  DashboardEnvironmentMetricSummaryDto,
  DashboardEnvironmentSummaryMetricsDto,
  DashboardEnvironmentSourceResultDto,
} from './dto/dashboard-environment-summary-response.dto';

export interface DeviceSampleResult {
  deviceId: string;
  status: 'ready' | 'empty' | 'error';
  reading: NormalizedSolarReading | null;
}

export interface SummaryCalculationResult {
  metrics: DashboardEnvironmentSummaryMetricsDto;
  latestObservedAt: string | null;
  sourceResults: DashboardEnvironmentSourceResultDto[];
}

export function calculateMetricSummary(
  values: number[],
  unit: string | null = null,
  semanticStatus?: string,
): DashboardEnvironmentMetricSummaryDto {
  if (values.length === 0) {
    return {
      mean: null,
      min: null,
      max: null,
      contributingSourceCount: 0,
      unit,
      ...(semanticStatus ? { semanticStatus } : {}),
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / values.length; // No rounding in backend (per Section 7.1)

  return {
    mean,
    min,
    max,
    contributingSourceCount: values.length,
    unit,
    ...(semanticStatus ? { semanticStatus } : {}),
  };
}

export function calculateEnvironmentSummary(
  results: DeviceSampleResult[],
): SummaryCalculationResult {
  const sourceResults: DashboardEnvironmentSourceResultDto[] = [];
  const tempValues: number[] = [];
  const humidityValues: number[] = [];
  const luxValues: number[] = [];
  let maxObservedTime: number | null = null;
  let latestObservedAt: string | null = null;

  for (const res of results) {
    const observedAt = res.reading?.timestamp ?? null;
    sourceResults.push({
      deviceId: res.deviceId,
      status: res.status,
      observedAt,
    });

    if (res.status === 'ready' && res.reading) {
      const r = res.reading;
      if (observedAt) {
        const time = new Date(observedAt).getTime();
        if (!isNaN(time) && (maxObservedTime === null || time > maxObservedTime)) {
          maxObservedTime = time;
          latestObservedAt = observedAt;
        }
      }

      // Valid 0 is preserved. Only non-null, finite numbers contribute.
      if (typeof r.rawTemperature === 'number' && Number.isFinite(r.rawTemperature)) {
        tempValues.push(r.rawTemperature);
      }
      if (typeof r.rawHumidity === 'number' && Number.isFinite(r.rawHumidity)) {
        humidityValues.push(r.rawHumidity);
      }
      if (typeof r.lux === 'number' && Number.isFinite(r.lux)) {
        luxValues.push(r.lux);
      }
    }
  }

  const rawTemperature = calculateMetricSummary(
    tempValues,
    null,
    'pending_hardware_confirmation',
  );
  const rawHumidity = calculateMetricSummary(
    humidityValues,
    null,
    'pending_hardware_confirmation',
  );
  const lux = calculateMetricSummary(luxValues, 'lux');

  return {
    metrics: {
      rawTemperature,
      rawHumidity,
      lux,
    },
    latestObservedAt,
    sourceResults,
  };
}
