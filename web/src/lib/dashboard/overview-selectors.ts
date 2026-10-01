/**
 * GIS-UIT Building E Digital Twin - Page 01 Overview Pure Selectors
 * Big Phase 02 / Phase 07 Composition
 *
 * CRITICAL INVARIANTS:
 * - Pure functions with zero side effects and zero mutations of input data
 * - Zero pseudorandom numbers or render-time timestamp invocations
 * - Reuses Page 03 CO2 demo fixtures and Page 06 Alert demo fixtures in read-only mode
 * - Energy calculations strictly consistent between KPI summary and chart data
 */

import {
  FloorCell,
  CellCo2State,
  OverviewTimeRangePreset,
  OverviewEnergySummary,
} from '@/types/dashboard-overview';
import { DemoAlertEvent } from '@/types/dashboard-alerts';
import { CO2_DEMO_FIXTURE } from './environment-demo-fixtures';
import { DEMO_ALERT_EVENTS, ALERT_DEMO_FIXTURE_ID } from './alert-demo-fixtures';
import { OVERVIEW_ENERGY_FIXTURE, OVERVIEW_DEMO_FIXTURE_ID } from './overview-demo-fixtures';

/**
 * Derives CO2 state for a single logical grid cell.
 * Corridor, service, or unmapped rooms remain honestly unavailable.
 */
export function getCellCo2State(cell: FloorCell): CellCo2State {
  // If not a room or no roomDemoId assigned, cell has no CO2 sensor
  if (cell.kind !== 'room' || !cell.roomDemoId) {
    return {
      cellId: cell.cellId,
      label: cell.label,
      kind: cell.kind,
      floor: cell.floorId,
      roomDemoId: null,
      co2Value: null,
      status: 'unavailable',
      hourlyValues: [],
    };
  }

  // Look up room in Page 03 deterministic fixture
  const room = CO2_DEMO_FIXTURE.rooms.find((r) => r.roomId === cell.roomDemoId);
  if (!room || !room.hourlyValues.length) {
    return {
      cellId: cell.cellId,
      label: cell.label,
      kind: 'room',
      floor: cell.floorId,
      roomDemoId: cell.roomDemoId,
      co2Value: null,
      status: 'unavailable',
      hourlyValues: [],
    };
  }

  const latestValue = room.hourlyValues[room.hourlyValues.length - 1].value;
  const status: 'good' | 'moderate' | 'warning' =
    latestValue <= CO2_DEMO_FIXTURE.thresholds.co2GoodMax
      ? 'good'
      : latestValue <= CO2_DEMO_FIXTURE.thresholds.co2ModerateMax
        ? 'moderate'
        : 'warning';

  return {
    cellId: cell.cellId,
    label: cell.label,
    kind: 'room',
    floor: cell.floorId,
    roomDemoId: cell.roomDemoId,
    co2Value: latestValue,
    status,
    hourlyValues: room.hourlyValues,
  };
}

/**
 * Derives overall CO2 KPI metrics from Page 03 demo fixture.
 */
export function getOverviewCo2Kpis(): {
  averageCo2: number;
  roomsOverWarningThreshold: number;
  warningThreshold: number;
  roomsOverModerateThreshold: number;
  moderateThreshold: number;
  totalRoomsWithData: number;
  fixtureId: string;
} {
  const rankings = CO2_DEMO_FIXTURE.rankings;
  const warningThresh = CO2_DEMO_FIXTURE.thresholds.co2ModerateMax; // 1000 ppm
  const moderateThresh = CO2_DEMO_FIXTURE.thresholds.co2GoodMax; // 800 ppm

  const roomsOverWarning = rankings.filter((r) => r.latestValue > warningThresh).length;
  const roomsOverModerate = rankings.filter((r) => r.latestValue > moderateThresh).length;

  return {
    averageCo2: CO2_DEMO_FIXTURE.kpis.averageCo2,
    roomsOverWarningThreshold: roomsOverWarning,
    warningThreshold: warningThresh,
    roomsOverModerateThreshold: roomsOverModerate,
    moderateThreshold: moderateThresh,
    totalRoomsWithData: rankings.length,
    fixtureId: CO2_DEMO_FIXTURE.fixtureId,
  };
}

/**
 * Derives Energy summary and series strictly from Page 01 deterministic fixture.
 */
export function getOverviewEnergySummary(range: OverviewTimeRangePreset): OverviewEnergySummary {
  let series = OVERVIEW_ENERGY_FIXTURE.hourlyToday;
  if (range === '7d') {
    series = OVERVIEW_ENERGY_FIXTURE.daily7d;
  } else if (range === '30d') {
    series = OVERVIEW_ENERGY_FIXTURE.daily30d;
  }

  let totalKwh = 0;
  let baselineTotalKwh = 0;
  let maxKwh = -Infinity;
  let peakTime = '—';

  for (const pt of series) {
    totalKwh += pt.value;
    baselineTotalKwh += pt.baseline;
    if (pt.value > maxKwh) {
      maxKwh = pt.value;
      peakTime = pt.timestamp;
    }
  }

  totalKwh = Math.round(totalKwh * 10) / 10;
  baselineTotalKwh = Math.round(baselineTotalKwh * 10) / 10;
  const differenceKwh = Math.round((totalKwh - baselineTotalKwh) * 10) / 10;

  return {
    range,
    totalKwh,
    baselineTotalKwh,
    differenceKwh,
    peakHourOrDay: peakTime,
    peakKwh: maxKwh > -Infinity ? maxKwh : 0,
    series,
  };
}

/**
 * Returns latest open alert events from Page 06 fixture without mutating it.
 */
export function getOverviewLatestAlerts(limit: number = 3): DemoAlertEvent[] {
  const openEvents = DEMO_ALERT_EVENTS.filter(
    (ev) => ev.lifecycleStatus === 'new' || ev.lifecycleStatus === 'acknowledged',
  );

  const sorted = [...openEvents].sort((a, b) => {
    return Date.parse(b.detectedAt) - Date.parse(a.detectedAt);
  });

  return sorted.slice(0, limit);
}

/**
 * Returns summary KPI of open alerts from Page 06 fixture.
 */
export function getOverviewOpenAlertsKpi(): {
  openCount: number;
  dangerCount: number;
  warningCount: number;
  infoCount: number;
  fixtureId: string;
} {
  const openEvents = DEMO_ALERT_EVENTS.filter(
    (ev) => ev.lifecycleStatus === 'new' || ev.lifecycleStatus === 'acknowledged',
  );

  let dangerCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const ev of openEvents) {
    if (ev.severity === 'danger') dangerCount++;
    else if (ev.severity === 'warning') warningCount++;
    else if (ev.severity === 'info') infoCount++;
  }

  return {
    openCount: openEvents.length,
    dangerCount,
    warningCount,
    infoCount,
    fixtureId: ALERT_DEMO_FIXTURE_ID,
  };
}
