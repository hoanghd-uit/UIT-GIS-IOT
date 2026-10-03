/**
 * GIS-UIT Building E Digital Twin - Page 01 Overview Demo Fixtures
 * Fixture ID: page01-overview-demo-v1
 *
 * CRITICAL INVARIANTS:
 * - Deterministic, versioned, zero pseudorandom math, zero render-time timestamp calls
 * - Frozen reference instant for reproducible tests and screenshots
 * - Energy data is purely demo (Building E has no smart meter upstream)
 * - KPI total and chart values derive strictly from the same underlying series
 */

import { OverviewEnergyDataPoint, OverviewTimeRangePreset } from '@/types/dashboard-overview';

export const OVERVIEW_DEMO_FIXTURE_ID = 'page01-overview-demo-v1';
export const OVERVIEW_DEMO_VERSION = '1.0.0';

/**
 * Frozen reference instant for deterministic calculations.
 * Corresponds to 2026-09-29T10:00:00.000Z (17:00 ICT).
 */
export const OVERVIEW_REFERENCE_INSTANT = '2026-09-29T10:00:00.000Z';

/**
 * 24-hour deterministic profile for "Hôm nay" (kWh per hour)
 * Building E baseline: night minimal operations (8-11 kWh), classes/labs (22-38 kWh), evening (14-20 kWh).
 */
const HOURLY_ENERGY_RAW: Array<{ hour: string; value: number; baseline: number }> = [
  { hour: '00:00', value: 8.4, baseline: 9.0 },
  { hour: '01:00', value: 8.1, baseline: 8.8 },
  { hour: '02:00', value: 7.9, baseline: 8.5 },
  { hour: '03:00', value: 8.0, baseline: 8.5 },
  { hour: '04:00', value: 8.2, baseline: 8.7 },
  { hour: '05:00', value: 9.5, baseline: 9.8 },
  { hour: '06:00', value: 14.2, baseline: 15.0 },
  { hour: '07:00', value: 22.6, baseline: 24.0 },
  { hour: '08:00', value: 31.4, baseline: 33.5 },
  { hour: '09:00', value: 36.8, baseline: 38.0 },
  { hour: '10:00', value: 38.2, baseline: 39.5 },
  { hour: '11:00', value: 35.1, baseline: 36.0 },
  { hour: '12:00', value: 26.4, baseline: 28.0 },
  { hour: '13:00', value: 33.7, baseline: 35.0 },
  { hour: '14:00', value: 37.5, baseline: 39.0 },
  { hour: '15:00', value: 36.2, baseline: 37.5 },
  { hour: '16:00', value: 32.8, baseline: 34.0 },
  { hour: '17:00', value: 24.5, baseline: 26.0 },
  { hour: '18:00', value: 18.2, baseline: 19.5 },
  { hour: '19:00', value: 15.6, baseline: 16.5 },
  { hour: '20:00', value: 13.8, baseline: 14.2 },
  { hour: '21:00', value: 11.5, baseline: 12.0 },
  { hour: '22:00', value: 9.8, baseline: 10.5 },
  { hour: '23:00', value: 8.9, baseline: 9.5 },
];

/**
 * 7-day deterministic daily profile (kWh per day)
 */
const DAILY_7D_ENERGY_RAW: Array<{ date: string; label: string; value: number; baseline: number }> = [
  { date: '2026-09-23', label: '23/09', value: 495.2, baseline: 510.0 },
  { date: '2026-09-24', label: '24/09', value: 512.8, baseline: 515.0 },
  { date: '2026-09-25', label: '25/09', value: 504.6, baseline: 520.0 },
  { date: '2026-09-26', label: '26/09', value: 280.4, baseline: 290.0 }, // Thứ 7
  { date: '2026-09-27', label: '27/09', value: 210.2, baseline: 220.0 }, // Chủ nhật
  { date: '2026-09-28', label: '28/09', value: 488.5, baseline: 505.0 },
  { date: '2026-09-29', label: '29/09 (Nay)', value: 519.0, baseline: 532.5 },
];

/**
 * 30-day deterministic profile (kWh per day)
 */
const DAILY_30D_ENERGY_RAW: Array<{ date: string; label: string; value: number; baseline: number }> = Array.from(
  { length: 30 },
  (_, i) => {
    const day = 30 - i;
    // Generate deterministic variation without Math.random
    const isWeekend = (day % 7 === 3 || day % 7 === 4);
    const baseKwh = isWeekend ? 230 : 500;
    const variation = ((day * 13) % 45) - 20; // deterministic pseudo-cycle between -20 and +24
    const val = baseKwh + variation;
    const baseVal = baseKwh + 15;
    const dayStr = String(day).padStart(2, '0');
    return {
      date: `2026-09-${dayStr}`,
      label: `${dayStr}/09`,
      value: Math.round(val * 10) / 10,
      baseline: Math.round(baseVal * 10) / 10,
    };
  },
).reverse();

export interface OverviewEnergyFixture {
  fixtureId: string;
  version: string;
  referenceInstant: string;
  hourlyToday: OverviewEnergyDataPoint[];
  daily7d: OverviewEnergyDataPoint[];
  daily30d: OverviewEnergyDataPoint[];
}

export function buildOverviewEnergyFixture(): OverviewEnergyFixture {
  return {
    fixtureId: OVERVIEW_DEMO_FIXTURE_ID,
    version: OVERVIEW_DEMO_VERSION,
    referenceInstant: OVERVIEW_REFERENCE_INSTANT,
    hourlyToday: HOURLY_ENERGY_RAW.map((r) => ({
      timestamp: r.hour,
      value: r.value,
      baseline: r.baseline,
      category: 'Điện năng tiêu thụ',
    })),
    daily7d: DAILY_7D_ENERGY_RAW.map((r) => ({
      timestamp: r.label,
      value: r.value,
      baseline: r.baseline,
      category: 'Điện năng tiêu thụ',
    })),
    daily30d: DAILY_30D_ENERGY_RAW.map((r) => ({
      timestamp: r.label,
      value: r.value,
      baseline: r.baseline,
      category: 'Điện năng tiêu thụ',
    })),
  };
}

export const OVERVIEW_ENERGY_FIXTURE = buildOverviewEnergyFixture();
