/**
 * Parking Demo Selectors (Phase 08 — Page 09)
 *
 * Pure selector functions for deriving consistent Parking KPIs,
 * charts, slot summaries, and camera device statistics.
 * No side effects, no mutations, no external dependencies.
 */

import type {
  ParkingDemoFixture,
  ParkingTimeRangePreset,
  ParkingCarSummary,
  ParkingMotorcycleSummary,
  ParkingEntriesSummary,
  ParkingCameraSummary,
  ParkingDurationSummary,
  ParkingKpiStripData,
  ParkingCarSlot,
} from '@/types/dashboard-parking';
import { PARKING_DEMO_FIXTURE } from './parking-demo-fixtures';

/**
 * Derives car slot occupancy metrics across all configured car areas.
 */
export function getParkingCarSummary(
  fixture: ParkingDemoFixture = PARKING_DEMO_FIXTURE
): ParkingCarSummary {
  let totalSlots = 0;
  let occupiedCount = 0;
  let evSlotsTotal = 0;
  let evSlotsOccupied = 0;

  for (const area of fixture.carAreas) {
    for (const slot of area.slots) {
      totalSlots += 1;
      if (slot.occupied) {
        occupiedCount += 1;
      }
      if (slot.vehicleType === 'ev') {
        evSlotsTotal += 1;
        if (slot.occupied) {
          evSlotsOccupied += 1;
        }
      }
    }
  }

  const freeCount = totalSlots - occupiedCount;
  const occupancyRatePercent =
    totalSlots > 0 ? Math.round((occupiedCount / totalSlots) * 1000) / 10 : 0;

  return {
    totalSlots,
    occupiedCount,
    freeCount,
    occupancyRatePercent,
    evSlotsTotal,
    evSlotsOccupied,
  };
}

/**
 * Derives motorcycle density metrics and identifies peak zone.
 */
export function getParkingMotorcycleSummary(
  fixture: ParkingDemoFixture = PARKING_DEMO_FIXTURE
): ParkingMotorcycleSummary {
  const zones = fixture.motorcycleZones;
  if (!zones || zones.length === 0) {
    return {
      highestDensityZone: {
        zoneId: 'DEMO-ZONE-NONE',
        label: 'Không có dữ liệu',
        estimatedDensityPercent: 0,
        capacityEstimate: 0,
        status: 'normal',
        statusLabel: 'Chưa có dữ liệu',
        cameraDemoId: null,
      },
      highestDensityPercent: 0,
      averageDensityPercent: 0,
      totalEstimatedCapacity: 0,
    };
  }

  let highestZone = zones[0];
  let sumDensity = 0;
  let totalCapacity = 0;

  for (const zone of zones) {
    sumDensity += zone.estimatedDensityPercent;
    totalCapacity += zone.capacityEstimate;
    if (zone.estimatedDensityPercent > highestZone.estimatedDensityPercent) {
      highestZone = zone;
    }
  }

  const averageDensityPercent = Math.round((sumDensity / zones.length) * 10) / 10;

  return {
    highestDensityZone: highestZone,
    highestDensityPercent: highestZone.estimatedDensityPercent,
    averageDensityPercent,
    totalEstimatedCapacity: totalCapacity,
  };
}

/**
 * Derives vehicle entries metrics and identifies peak period for the selected range.
 */
export function getParkingEntriesSummary(
  fixture: ParkingDemoFixture = PARKING_DEMO_FIXTURE,
  range: ParkingTimeRangePreset = 'today'
): ParkingEntriesSummary {
  const series = fixture.entriesByRange[range] || [];
  let totalEntries = 0;
  let peakHourOrLabel = '—';
  let peakCount = 0;

  for (const item of series) {
    totalEntries += item.entryCount;
    if (item.entryCount > peakCount) {
      peakCount = item.entryCount;
      peakHourOrLabel = item.timeLabel;
    }
  }

  return {
    range,
    totalEntries,
    peakHourOrLabel,
    peakCount,
    series,
  };
}

/**
 * Derives camera device counts and demo statuses.
 */
export function getParkingCameraSummary(
  fixture: ParkingDemoFixture = PARKING_DEMO_FIXTURE
): ParkingCameraSummary {
  let activeCount = 0;
  let inspectionCount = 0;
  let standbyCount = 0;

  for (const cam of fixture.cameraDevices) {
    if (cam.demoStatus === 'simulated_active') {
      activeCount += 1;
    } else if (cam.demoStatus === 'simulated_inspection') {
      inspectionCount += 1;
    } else if (cam.demoStatus === 'simulated_standby') {
      standbyCount += 1;
    }
  }

  return {
    totalCount: fixture.cameraDevices.length,
    activeCount,
    inspectionCount,
    standbyCount,
  };
}

/**
 * Extracts explicit fixture-backed duration metrics.
 */
export function getParkingDurationSummary(
  fixture: ParkingDemoFixture = PARKING_DEMO_FIXTURE
): ParkingDurationSummary {
  return {
    averageMinutes: fixture.demoSessionDurationSummary.averageMinutes,
    formatted: fixture.demoSessionDurationSummary.formattedDuration,
    sampleSessionsCount: fixture.demoSessionDurationSummary.totalSampleSessions,
  };
}

/**
 * Aggregates all KPI models into a single coherent state.
 */
export function getParkingKpiStripData(
  fixture: ParkingDemoFixture = PARKING_DEMO_FIXTURE,
  range: ParkingTimeRangePreset = 'today'
): ParkingKpiStripData {
  return {
    carSummary: getParkingCarSummary(fixture),
    motorcycleSummary: getParkingMotorcycleSummary(fixture),
    entriesSummary: getParkingEntriesSummary(fixture, range),
    durationSummary: getParkingDurationSummary(fixture),
    cameraSummary: getParkingCameraSummary(fixture),
  };
}

/**
 * Flattens all car slots with their parent area context.
 */
export function getAllCarSlots(
  fixture: ParkingDemoFixture = PARKING_DEMO_FIXTURE
): ParkingCarSlot[] {
  const result: ParkingCarSlot[] = [];
  for (const area of fixture.carAreas) {
    result.push(...area.slots);
  }
  return result;
}
