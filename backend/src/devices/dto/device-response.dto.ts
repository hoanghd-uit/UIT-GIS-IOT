export interface DeviceDto {
  id: string;
  externalId: string;
  name: string;
  kind: string;
  buildingId: string;
  floorId: string;
  dataOrigin: string;
  operatingStatus: string;
  telemetry: null;
  placementRevision: number;
  originalPosition: {
    space: string;
    frameId: string;
    frameVersion: number;
    coordinates: { x: number; y: number; z: number };
  };
  displayOverride: {
    frameId: string;
    frameVersion: number;
    coordinates: { x: number; y: number; z: number };
    validityStatus: 'active' | 'needs_review';
    updatedAt: string;
  } | null;
  effectivePosition: {
    source: 'original' | 'override';
    frameId: string;
    frameVersion: number;
    coordinates: { x: number; y: number; z: number };
  } | null;
  placementStatus: 'placed' | 'unplaced' | 'needs_review';
  overrideStatus: 'none' | 'active' | 'needs_review';
  calibrationStatus: string;
  lastIotFetchAt: string | null;
}

export interface FloorDevicesResponseDto {
  schemaVersion: 1;
  buildingId: string;
  floorId: string;
  source: {
    mode: string;
    namespace: string;
    sourceState: 'disabled' | 'fixture' | 'live' | 'not_configured';
    inventoryState: 'ready' | 'unknown' | 'empty' | 'error';
    lastIotFetchAt: string | null;
    lastSuccessfulIngestionAt: string | null;
  };
  devices: DeviceDto[];
}

