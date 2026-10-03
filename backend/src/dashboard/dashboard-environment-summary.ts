import {
  NormalizedSolarReading,
  NormalizedSmartBuildingReading,
} from '../iot/dto/iot-telemetry.dto';
import {
  DashboardEnvironmentMetricSummaryDto,
  DashboardEnvironmentSummaryMetricsDto,
  DashboardEnvironmentSourceResultDto,
} from './dto/dashboard-environment-summary-response.dto';

export interface DeviceSampleResult {
  deviceId: string;
  sourceDeviceType?: 'solar' | 'sb';
  status: 'ready' | 'empty' | 'error';
  reading: NormalizedSolarReading | NormalizedSmartBuildingReading | any | null;
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
  observedAt: string | null = null,
): DashboardEnvironmentMetricSummaryDto {
  if (values.length === 0) {
    return {
      mean: null,
      min: null,
      max: null,
      contributingSourceCount: 0,
      unit,
      ...(semanticStatus ? { semanticStatus } : {}),
      ...(observedAt ? { observedAt } : {}),
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
    ...(observedAt ? { observedAt } : {}),
  };
}

export function calculateEnvironmentSummary(
  results: DeviceSampleResult[],
): SummaryCalculationResult {
  const sourceResults: DashboardEnvironmentSourceResultDto[] = [];
  const tempValues: number[] = [];
  const humidityValues: number[] = [];
  const luxValues: number[] = [];
  const co2Values: number[] = [];
  let maxObservedTime: number | null = null;
  let latestObservedAt: string | null = null;
  let maxTempTime: number | null = null;
  let latestTempObservedAt: string | null = null;
  let maxHumidityTime: number | null = null;
  let latestHumidityObservedAt: string | null = null;
  let maxLuxTime: number | null = null;
  let latestLuxObservedAt: string | null = null;
  let maxCo2Time: number | null = null;
  let latestCo2ObservedAt: string | null = null;

  for (const res of results) {
    const observedAt = res.reading?.timestamp ?? null;
    const deviceType = res.sourceDeviceType || 'solar';
    let co2Val: number | null = null;

    if (res.status === 'ready' && res.reading) {
      const r = res.reading;
      if (observedAt) {
        const time = new Date(observedAt).getTime();
        if (!isNaN(time) && (maxObservedTime === null || time > maxObservedTime)) {
          maxObservedTime = time;
          latestObservedAt = observedAt;
        }
      }

      if (deviceType === 'sb') {
        // SB only contributes CO2. Solar does NOT contribute CO2; SB does NOT contribute temp/humidity/lux
        if (typeof r.rawCo2 === 'number' && Number.isFinite(r.rawCo2)) {
          co2Values.push(r.rawCo2);
          co2Val = r.rawCo2;
          if (observedAt) {
            const time = new Date(observedAt).getTime();
            if (!isNaN(time) && (maxCo2Time === null || time > maxCo2Time)) {
              maxCo2Time = time;
              latestCo2ObservedAt = observedAt;
            }
          }
        }
      } else {
        // Solar contributes temp, humidity, lux. Valid 0 is preserved.
        if (typeof r.rawTemperature === 'number' && Number.isFinite(r.rawTemperature)) {
          tempValues.push(r.rawTemperature);
          if (observedAt) {
            const time = new Date(observedAt).getTime();
            if (!isNaN(time) && (maxTempTime === null || time > maxTempTime)) {
              maxTempTime = time;
              latestTempObservedAt = observedAt;
            }
          }
        }
        if (typeof r.rawHumidity === 'number' && Number.isFinite(r.rawHumidity)) {
          humidityValues.push(r.rawHumidity);
          if (observedAt) {
            const time = new Date(observedAt).getTime();
            if (!isNaN(time) && (maxHumidityTime === null || time > maxHumidityTime)) {
              maxHumidityTime = time;
              latestHumidityObservedAt = observedAt;
            }
          }
        }
        if (typeof r.lux === 'number' && Number.isFinite(r.lux)) {
          luxValues.push(r.lux);
          if (observedAt) {
            const time = new Date(observedAt).getTime();
            if (!isNaN(time) && (maxLuxTime === null || time > maxLuxTime)) {
              maxLuxTime = time;
              latestLuxObservedAt = observedAt;
            }
          }
        }
      }
    }

    sourceResults.push({
      deviceId: res.deviceId,
      sourceDeviceType: deviceType,
      status: res.status,
      observedAt,
      ...(deviceType === 'sb' ? { co2: co2Val } : {}),
    });
  }

  const rawTemperature = calculateMetricSummary(
    tempValues,
    '°C',
    'documented_contract',
    latestTempObservedAt,
  );
  const rawHumidity = calculateMetricSummary(
    humidityValues,
    '%',
    'documented_contract',
    latestHumidityObservedAt,
  );
  const lux = calculateMetricSummary(
    luxValues,
    'lux',
    'documented_contract',
    latestLuxObservedAt,
  );
  const co2 = calculateMetricSummary(
    co2Values,
    'ppm',
    'assumed_standard',
    latestCo2ObservedAt,
  );

  return {
    metrics: {
      rawTemperature,
      rawHumidity,
      lux,
      co2,
    },
    latestObservedAt,
    sourceResults,
  };
}
