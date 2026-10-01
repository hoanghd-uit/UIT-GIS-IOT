/**
 * GIS-UIT Building E Digital Twin - Page 01 Overview Types
 * Big Phase 02 / Phase 07 Composition
 */

import { DashboardProvenance } from './dashboard';

export type OverviewTimeRangePreset = 'today' | '7d' | '30d';

export type FloorCellKind = 'room' | 'corridor' | 'service' | 'empty';

export interface FloorCell {
  cellId: string;
  floorId: string;
  row: number;
  column: number;
  label: string;
  kind: FloorCellKind;
  roomDemoId: string | null;
  description?: string;
}

export interface FloorConfig {
  floorId: string;
  label: string;
  shortLabel: string;
  rows: number;
  columns: number;
  roomCount: number;
  levelNumber: number;
  cells: FloorCell[];
}

export interface CellCo2State {
  cellId: string;
  label: string;
  kind: FloorCellKind;
  floor: string;
  roomDemoId: string | null;
  co2Value: number | null;
  status: 'good' | 'moderate' | 'warning' | 'unavailable';
  hourlyValues: Array<{ hour: string; value: number }>;
}

export interface OverviewEnergyDataPoint {
  timestamp: string;
  value: number;
  baseline: number;
  category?: string;
  [key: string]: unknown;
}

export interface OverviewEnergySummary {
  range: OverviewTimeRangePreset;
  totalKwh: number;
  baselineTotalKwh: number;
  differenceKwh: number;
  peakHourOrDay: string;
  peakKwh: number;
  series: OverviewEnergyDataPoint[];
}

export interface OverviewKpiData {
  energy: {
    totalKwh: number;
    mode: 'demo';
    fixtureId: string;
  };
  water: {
    value: null;
    mode: 'unavailable';
    reason: string;
  };
  co2Average: {
    value: number;
    mode: 'demo';
    fixtureId: string;
  };
  co2RoomsOverThreshold: {
    count: number;
    thresholdPpm: number;
    mode: 'demo';
    fixtureId: string;
  };
  openAlerts: {
    count: number;
    mode: 'demo';
    fixtureId: string;
  };
  deviceCatalogue: {
    count: number | null;
    mode: 'live';
    status: 'idle' | 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';
  };
}

export interface OverviewIotHealthData {
  liveSummary: {
    receivedCount: number | null;
    acceptedCount: number | null;
    skippedCount: number | null;
    duplicateCount: number | null;
    truncated: boolean | null;
  };
  provenance: DashboardProvenance | null;
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';
}
