import { TrendDataPoint } from '@/components/dashboard/charts/MetricTrendChart';

export interface PrepareChartDataOptions {
  readings: Record<string, any>[];
  metricKey: string;
  metricLabel: string;
  unit?: string;
  queryRange?: {
    start: string;
    stop: string;
  };
  isTruncated?: boolean;
}

export interface ChartDataResult {
  points: TrendDataPoint[];
  accessibleSummary: string;
}

function formatAccessibleDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return isoString;
  }
}

/**
 * Transforms backend telemetry readings (newest-first) into chronological trend points (oldest-first)
 * for MetricTrendChart / @ant-design/charts.
 *
 * Guarantees:
 * 1. Non-mutating: creates a shallow copy of source readings.
 * 2. Filters strictly to finite numbers (preserves 0, drops null/NaN/Infinity).
 * 3. Does NOT synthesize gap points, fill zeroes, or interpolate missing intervals.
 * 4. Produces a screen-reader accessible Vietnamese summary.
 */
export function prepareTelemetryChartData({
  readings,
  metricKey,
  metricLabel,
  unit,
  queryRange,
  isTruncated = false,
}: PrepareChartDataOptions): ChartDataResult {
  if (!Array.isArray(readings) || readings.length === 0) {
    return {
      points: [],
      accessibleSummary: `Không có dữ liệu xu hướng cho ${metricLabel}.`,
    };
  }

  // 1. Filter points where the metric value is a finite number (0 is valid!)
  const eligibleRows = readings.filter((r) => {
    if (!r || typeof r !== 'object') return false;
    const val = r[metricKey];
    return typeof val === 'number' && Number.isFinite(val);
  });

  // 2. Clone and sort oldest-first chronologically
  const sortedCopy = [...eligibleRows].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // 3. Map to TrendDataPoint without altering real timestamps
  const points: TrendDataPoint[] = sortedCopy.map((r) => ({
    timestamp: r.timestamp,
    value: r[metricKey],
  }));

  // 4. Construct accessible summary
  const unitLabel = unit ? ` (${unit})` : '';
  const rangeInfo = queryRange
    ? ` trong khoảng từ ${formatAccessibleDate(queryRange.start)} đến ${formatAccessibleDate(queryRange.stop)}`
    : '';
  const truncationWarning = isTruncated
    ? ' Cảnh báo: dữ liệu bị cắt ngắn từ nguồn upstream (truncated/reached-limit).'
    : '';

  const accessibleSummary =
    points.length === 0
      ? `Không có điểm dữ liệu hợp lệ nào cho ${metricLabel}${unitLabel}${rangeInfo}.`
      : `Biểu đồ xu hướng ${metricLabel}${unitLabel} gồm ${points.length} điểm dữ liệu${rangeInfo}.${truncationWarning}`;

  return {
    points,
    accessibleSummary,
  };
}
