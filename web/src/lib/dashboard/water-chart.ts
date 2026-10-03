import {
  DashboardWaterReadingItem,
  DashboardWaterReadingsResponse,
  DashboardWaterLatestSample,
  WaterMetricKey,
} from '@/types/dashboard-water';

export interface WaterMetricConfig {
  key: WaterMetricKey;
  label: string;
  unit: string;
  isCumulative?: boolean;
  qualifier?: string;
}

export const WATER_METRICS_MAP: Record<WaterMetricKey, WaterMetricConfig> = {
  instantFlowM3h: {
    key: 'instantFlowM3h',
    label: 'Lưu lượng tức thời',
    unit: 'm³/h',
    //qualifier: 'Ý nghĩa lưu lượng đang chờ xác nhận phần cứng',
  },
  forwardVolumeM3: {
    key: 'forwardVolumeM3',
    label: 'Chỉ số tích lũy chiều thuận',
    unit: 'm³',
    isCumulative: true,
    qualifier: 'Giá trị tích lũy nguồn — chưa dùng tính tiêu thụ',
  },
  reverseVolumeM3: {
    key: 'reverseVolumeM3',
    label: 'Chỉ số tích lũy chiều ngược',
    unit: 'm³',
    isCumulative: true,
    qualifier: 'Giá trị tích lũy nguồn — chưa dùng tính tiêu thụ',
  },
  temperatureC: {
    key: 'temperatureC',
    label: 'Nhiệt độ nguồn',
    unit: '°C',
    qualifier: 'Vị trí đo chưa xác nhận: môi trường hay thân đồng hồ',
  },
};

export interface WaterChartPoint {
  timestamp: string;
  time: string;
  value: number;
  metric: string;
  [key: string]: unknown;
}

export interface WaterChartAdapterResult {
  chartPoints: WaterChartPoint[];
  hasData: boolean;
  pointCount: number;
  latestValue: number | null;
  accessibleSummary: string;
}

/**
 * Prepares chart data for Dashboard Water metric trend.
 * - Non-mutating: creates a clean oldest-first copy from newest-first readings.
 * - Strict integrity: preserves valid zero (0), never interpolates or replaces missing with 0.
 * - Preserves raw counter discontinuity without derived consumption calculations.
 */
export function prepareWaterChartData(
  readings: DashboardWaterReadingItem[] | undefined | null,
  metricKey: WaterMetricKey,
): WaterChartAdapterResult {
  const metricCfg = WATER_METRICS_MAP[metricKey] || WATER_METRICS_MAP.instantFlowM3h;

  if (!Array.isArray(readings) || readings.length === 0) {
    return {
      chartPoints: [],
      hasData: false,
      pointCount: 0,
      latestValue: null,
      accessibleSummary: `Không có dữ liệu cho chỉ số ${metricCfg.label}.`,
    };
  }

  // Create a separate copy and sort chronological oldest-first for chart display
  const sorted = [...readings].sort((a, b) => {
    const ta = new Date(a.observedAt).getTime();
    const tb = new Date(b.observedAt).getTime();
    return ta - tb;
  });

  const chartPoints: WaterChartPoint[] = [];

  for (const row of sorted) {
    const rawVal = row[metricKey];
    if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
      chartPoints.push({
        timestamp: row.observedAt,
        time: row.observedAt,
        value: rawVal,
        metric: metricCfg.label,
      });
    }
  }

  const pointCount = chartPoints.length;
  const hasData = pointCount > 0;
  const latestValue = hasData ? chartPoints[chartPoints.length - 1].value : null;

  const accessibleSummary = hasData
    ? `Biểu đồ ${metricCfg.label} (${metricCfg.unit}) gồm ${pointCount} điểm từ ${chartPoints[0].time} đến ${chartPoints[pointCount - 1].time}. Điểm mới nhất: ${latestValue} ${metricCfg.unit}.`
    : `Không có điểm dữ liệu hợp lệ cho ${metricCfg.label}.`;

  return {
    chartPoints,
    hasData,
    pointCount,
    latestValue,
    accessibleSummary,
  };
}

/**
 * Aggregates water readings from multiple AVC meters into a single consolidated timeline.
 * - Sums instantFlowM3h, forwardVolumeM3, reverseVolumeM3 across all reporting meters.
 * - Averages temperatureC across reporting meters.
 * - Buckets into 15-minute time intervals to align asynchronous LoRaWAN uplinks.
 */
export function aggregateWaterReadings(
  responses: DashboardWaterReadingsResponse[],
): DashboardWaterReadingsResponse | null {
  if (!Array.isArray(responses) || responses.length === 0) {
    return null;
  }

  const validResponses = responses.filter(
    (r) => r && Array.isArray(r.readings) && r.readings.length > 0,
  );

  if (validResponses.length === 0) {
    const fallback = responses[0];
    return {
      ...fallback,
      meterId: 'ALL',
      availability: 'empty',
      latestSample: null,
      readings: [],
    };
  }

  // 1. Compute aggregate latestSample
  let sumLatestFlow: number | null = null;
  let sumLatestForward: number | null = null;
  let sumLatestReverse: number | null = null;
  let sumLatestTemp = 0;
  let countLatestTemp = 0;
  let latestObservedTime = 0;

  for (const res of validResponses) {
    const sample = res.latestSample;
    if (!sample) continue;
    const timeMs = new Date(sample.observedAt).getTime();
    if (timeMs > latestObservedTime) latestObservedTime = timeMs;

    if (typeof sample.instantFlowM3h === 'number') {
      sumLatestFlow = (sumLatestFlow ?? 0) + sample.instantFlowM3h;
    }
    if (typeof sample.forwardVolumeM3 === 'number') {
      sumLatestForward = (sumLatestForward ?? 0) + sample.forwardVolumeM3;
    }
    if (typeof sample.reverseVolumeM3 === 'number') {
      sumLatestReverse = (sumLatestReverse ?? 0) + sample.reverseVolumeM3;
    }
    if (typeof sample.temperatureC === 'number') {
      sumLatestTemp += sample.temperatureC;
      countLatestTemp++;
    }
  }

  const latestSample: DashboardWaterLatestSample = {
    observedAt: latestObservedTime > 0 ? new Date(latestObservedTime).toISOString() : new Date().toISOString(),
    deviceName: 'Tất cả đồng hồ AVC (Tổng hợp)',
    meterSerial: `${validResponses.length} đồng hồ`,
    gatewayId: null,
    rssiDbm: null,
    snrDb: null,
    instantFlowM3h: sumLatestFlow,
    forwardVolumeM3: sumLatestForward != null ? Math.round(sumLatestForward * 1000) / 1000 : null,
    reverseVolumeM3: sumLatestReverse != null ? Math.round(sumLatestReverse * 1000) / 1000 : null,
    temperatureC: countLatestTemp > 0 ? Math.round((sumLatestTemp / countLatestTemp) * 10) / 10 : null,
    rawFlags: {
      valveOpen: 1,
      pipeLeak: 0,
      pipeBurst: 0,
      batteryLow: 0,
      frozen: 0,
      tamper: 0,
      reverseFlow: 0,
    },
  };

  // 2. Bucket readings by 15-minute intervals
  const BUCKET_MS = 15 * 60 * 1000;
  const buckets = new Map<number, Map<string, DashboardWaterReadingItem>>();

  for (const res of validResponses) {
    const meterId = res.meterId;
    for (const r of res.readings) {
      const timeMs = new Date(r.observedAt).getTime();
      if (isNaN(timeMs)) continue;
      const bucketKey = Math.floor(timeMs / BUCKET_MS) * BUCKET_MS;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, new Map());
      }
      const meterMap = buckets.get(bucketKey)!;
      const existing = meterMap.get(meterId);
      if (!existing || new Date(r.observedAt).getTime() > new Date(existing.observedAt).getTime()) {
        meterMap.set(meterId, r);
      }
    }
  }

  const sortedBucketKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
  const aggregatedReadings: DashboardWaterReadingItem[] = [];

  for (const bKey of sortedBucketKeys) {
    const meterMap = buckets.get(bKey)!;
    let sumFlow: number | null = null;
    let sumForward: number | null = null;
    let sumReverse: number | null = null;
    let tempSum = 0;
    let tempCount = 0;

    for (const item of meterMap.values()) {
      if (typeof item.instantFlowM3h === 'number') {
        sumFlow = (sumFlow ?? 0) + item.instantFlowM3h;
      }
      if (typeof item.forwardVolumeM3 === 'number') {
        sumForward = (sumForward ?? 0) + item.forwardVolumeM3;
      }
      if (typeof item.reverseVolumeM3 === 'number') {
        sumReverse = (sumReverse ?? 0) + item.reverseVolumeM3;
      }
      if (typeof item.temperatureC === 'number') {
        tempSum += item.temperatureC;
        tempCount++;
      }
    }

    aggregatedReadings.push({
      observedAt: new Date(bKey).toISOString(),
      instantFlowM3h: sumFlow != null ? Math.round(sumFlow * 1000) / 1000 : null,
      forwardVolumeM3: sumForward != null ? Math.round(sumForward * 1000) / 1000 : null,
      reverseVolumeM3: sumReverse != null ? Math.round(sumReverse * 1000) / 1000 : null,
      temperatureC: tempCount > 0 ? Math.round((tempSum / tempCount) * 10) / 10 : null,
      rssiDbm: null,
      snrDb: null,
      gatewayId: 'all',
      rawFlags: {
        valveOpen: 1,
        pipeLeak: 0,
        pipeBurst: 0,
        batteryLow: 0,
        frozen: 0,
        tamper: 0,
        reverseFlow: 0,
      },
    });
  }

  return {
    schemaVersion: 1,
    buildingId: validResponses[0]?.buildingId || 'E',
    meterId: 'ALL',
    availability: aggregatedReadings.length > 0 ? 'ready' : 'empty',
    provenance: {
      mode: 'live',
      sourceId: 'dashboard-water-aggregated',
      sourceType: 'avc_total_aggregate',
      windowStart: validResponses[0]?.queryRange?.start || '',
      windowEnd: validResponses[0]?.queryRange?.stop || '',
      fetchedAt: new Date().toISOString(),
      caveats: ['Tổng hợp số liệu từ toàn bộ đồng hồ AVC đang hoạt động'],
    },
    queryRange: validResponses[0]?.queryRange ?? { start: '', stop: '', limit: 1000 },
    coverage: validResponses[0]?.coverage ?? {
      intervalMinutes: 15,
      actualSamples: aggregatedReadings.length,
      coveragePercent: 100,
      quality: 'full',
    },
    latestSample,
    readings: aggregatedReadings,
  };
}
