import { EnvironmentTimeRangePreset } from '@/types/dashboard-environment';

export interface CalculatedEnvironmentRange {
  start: string;
  stop: string;
}

const PRESET_DURATIONS_MS: Record<EnvironmentTimeRangePreset, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '72h': 72 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

/**
 * Calculates start and stop ISO-8601 UTC strings for a given preset.
 * Accepts optional `now` instance for deterministic testing.
 */
export function calculateEnvironmentRange(
  preset: EnvironmentTimeRangePreset = '24h',
  now: Date = new Date(),
): CalculatedEnvironmentRange {
  const durationMs = PRESET_DURATIONS_MS[preset] || PRESET_DURATIONS_MS['24h'];
  const stopDate = new Date(now.getTime());
  const startDate = new Date(stopDate.getTime() - durationMs);

  return {
    start: startDate.toISOString(),
    stop: stopDate.toISOString(),
  };
}

/**
 * Returns fixed 24-hour window for summary queries regardless of active page preset.
 * Per Section 9: "Summary endpoint dùng range tối đa 24h ngay cả khi selected trend là 72h/7d".
 */
export function getSummaryRange(now: Date = new Date()): CalculatedEnvironmentRange {
  return calculateEnvironmentRange('24h', now);
}
