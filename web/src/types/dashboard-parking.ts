/**
 * Dashboard Parking Types (Phase 08 — Page 09)
 *
 * Types for deterministic demo Parking data, selectors, and UI states.
 * Fully frozen presentation demo — no backend API, no database entity,
 * no camera stream, and no personal data (PII).
 */

export type ParkingTimeRangePreset = 'today' | '7d' | '30d';

export type ParkingVehicleType = 'car' | 'ev';

export interface ParkingCarSlot {
  slotId: string; // Stable DEMO-SLOT-xxx
  label: string; // e.g. "A-01"
  areaId: string; // e.g. "DEMO-AREA-A"
  occupied: boolean;
  vehicleType: ParkingVehicleType;
  cameraDemoId: string | null;
  lastStatusChangeLabel?: string;
}

export interface ParkingCarArea {
  areaId: string; // e.g. "DEMO-AREA-A"
  label: string; // e.g. "Khu A · Ô tô"
  description: string;
  slots: ParkingCarSlot[];
}

export type ParkingMotorcycleStatus = 'normal' | 'moderate' | 'high';

export interface ParkingMotorcycleZone {
  zoneId: string; // e.g. "DEMO-ZONE-M1"
  label: string; // e.g. "Khu M1 · Sinh viên"
  estimatedDensityPercent: number; // 0 - 100
  capacityEstimate: number;
  status: ParkingMotorcycleStatus;
  statusLabel: string;
  cameraDemoId: string | null;
}

export interface ParkingHourlyEntry {
  timestamp: string;
  timeLabel: string; // e.g. "08:00" or "Thứ 2"
  entryCount: number;
}

export type ParkingCameraDemoStatus = 'simulated_active' | 'simulated_inspection' | 'simulated_standby';

export interface ParkingCameraDevice {
  cameraDemoId: string; // Stable DEMO-CAM-xxx
  label: string;
  demoCoverageLabel: string;
  demoInferenceIntervalSeconds: number;
  demoStatus: ParkingCameraDemoStatus;
  demoStatusLabel: string;
}

export interface ParkingTechnicalNote {
  id: string;
  title: string;
  description: string;
}

export interface ParkingDemoFixture {
  fixtureId: string;
  version: string;
  referenceInstant: string;
  timezone: string;
  scenarioLabel: string;
  caveats: string[];
  supportedRanges: ParkingTimeRangePreset[];
  carAreas: ParkingCarArea[];
  motorcycleZones: ParkingMotorcycleZone[];
  entriesByRange: Record<ParkingTimeRangePreset, ParkingHourlyEntry[]>;
  cameraDevices: ParkingCameraDevice[];
  technicalNotes: ParkingTechnicalNote[];
  demoSessionDurationSummary: {
    averageMinutes: number;
    formattedDuration: string;
    totalSampleSessions: number;
  };
}

export interface ParkingCarSummary {
  totalSlots: number;
  occupiedCount: number;
  freeCount: number;
  occupancyRatePercent: number;
  evSlotsTotal: number;
  evSlotsOccupied: number;
}

export interface ParkingMotorcycleSummary {
  highestDensityZone: ParkingMotorcycleZone;
  highestDensityPercent: number;
  averageDensityPercent: number;
  totalEstimatedCapacity: number;
}

export interface ParkingEntriesSummary {
  range: ParkingTimeRangePreset;
  totalEntries: number;
  peakHourOrLabel: string;
  peakCount: number;
  series: ParkingHourlyEntry[];
}

export interface ParkingCameraSummary {
  totalCount: number;
  activeCount: number;
  inspectionCount: number;
  standbyCount: number;
}

export interface ParkingDurationSummary {
  averageMinutes: number;
  formatted: string;
  sampleSessionsCount: number;
}

export interface ParkingKpiStripData {
  carSummary: ParkingCarSummary;
  motorcycleSummary: ParkingMotorcycleSummary;
  entriesSummary: ParkingEntriesSummary;
  durationSummary: ParkingDurationSummary;
  cameraSummary: ParkingCameraSummary;
}
