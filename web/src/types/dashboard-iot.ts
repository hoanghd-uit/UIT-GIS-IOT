import { DashboardProvenance } from './dashboard';

export type IotDeviceCategory =
  | 'water_meter'
  | 'temperature_humidity'
  | 'smart_building'
  | 'rf_uhf_reader'
  | 'camera'
  | 'solar'
  | 'avc'
  | 'nfc'
  | 'unknown';

export interface DashboardDeviceSourceLocation {
  x: number;
  y: number;
  z: number;
  floorLevel: number;
}

export interface DashboardDeviceCatalogueItem {
  externalDeviceId: string;
  sourceDeviceType: string;
  category: IotDeviceCategory;
  active: boolean;
  sourceCreatedAt: string;
  sourceUpdatedAt: string;
  sourceLocation: DashboardDeviceSourceLocation;
  displayFloorId: string | null;
  floorAssignment: 'source' | 'development-fallback' | 'unmapped';
}

export interface DashboardCatalogueMapping {
  floorMode: string;
  developmentFallbackApplied: boolean;
  requestedUpstreamFloorLevel: number | null;
}

export interface DashboardCatalogueSummary {
  receivedCount: number;
  acceptedCount: number;
  skippedCount: number;
  duplicateCount: number;
  truncated: boolean | null;
}

export interface DashboardDeviceCatalogueResponse {
  schemaVersion: 1;
  buildingId: string;
  requestedFloorId: string | null;
  availability: 'ready' | 'empty';
  provenance: DashboardProvenance;
  mapping: DashboardCatalogueMapping;
  summary: DashboardCatalogueSummary;
  devices: DashboardDeviceCatalogueItem[];
}
