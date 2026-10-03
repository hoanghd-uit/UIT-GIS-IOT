import { WaterTimeRangePreset } from '@/types/dashboard-water';

export interface WaterPresetConfig {
  id: WaterTimeRangePreset;
  label: string;
  durationHours: number;
}

export const WATER_TIME_RANGE_PRESETS: WaterPresetConfig[] = [
  { id: 'today', label: 'Hôm nay', durationHours: 24 },
  { id: '7d', label: '7 ngày', durationHours: 168 },
  { id: '30d', label: '30 ngày', durationHours: 168 }, // Telemetry query max duration is 7 days
  { id: 'custom', label: 'Tùy chọn', durationHours: 24 },
  // Backward compatibility presets
  { id: 'last-24h', label: '24 giờ', durationHours: 24 },
  { id: 'last-72h', label: '72 giờ', durationHours: 72 },
  { id: 'last-7d', label: '7 ngày', durationHours: 168 },
];

export const DEFAULT_WATER_PRESET: WaterTimeRangePreset = 'today';

/**
 * Computes an exact UTC ISO start/stop range from a single reference date.
 * Preserves pure UTC timestamps without timezone drift.
 */
export function computeWaterTimeRange(
  preset: WaterTimeRangePreset,
  refDate: Date = new Date(),
): { start: string; stop: string } {
  const config =
    WATER_TIME_RANGE_PRESETS.find((p) => p.id === preset) ?? {
      id: 'today' as const,
      label: 'Hôm nay',
      durationHours: 24,
    };

  const stopIso = refDate.toISOString();
  const startTimeMs = refDate.getTime() - config.durationHours * 60 * 60 * 1000;
  const startIso = new Date(startTimeMs).toISOString();

  return {
    start: startIso,
    stop: stopIso,
  };
}
