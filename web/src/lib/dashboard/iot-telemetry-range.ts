import { DashboardTelemetryPreset } from '@/types/dashboard-iot-telemetry';

export interface PresetConfig {
  id: DashboardTelemetryPreset;
  label: string;
  durationHours: number;
}

export const DASHBOARD_TELEMETRY_PRESETS: PresetConfig[] = [
  { id: 'last-24h', label: '24 giờ qua', durationHours: 24 },
  { id: 'last-72h', label: '72 giờ qua', durationHours: 72 },
  { id: 'last-7d', label: '7 ngày qua', durationHours: 168 },
];

export const DEFAULT_TELEMETRY_PRESET: DashboardTelemetryPreset = 'last-72h';

/**
 * Computes an exact UTC ISO start/stop range from a single reference date.
 * Preserves pure UTC timestamps without timezone drift.
 */
export function computeTelemetryRange(
  preset: DashboardTelemetryPreset,
  refDate: Date = new Date(),
): { start: string; stop: string } {
  const config = DASHBOARD_TELEMETRY_PRESETS.find((p) => p.id === preset) ?? {
    id: 'last-72h' as const,
    label: '72 giờ qua',
    durationHours: 72,
  };

  const stopIso = refDate.toISOString();
  const startTimeMs = refDate.getTime() - config.durationHours * 60 * 60 * 1000;
  const startIso = new Date(startTimeMs).toISOString();

  return {
    start: startIso,
    stop: stopIso,
  };
}
