export interface Coordinate3D {
  x: number;
  y: number;
  z: number;
}

export interface DeviceMarkerDto {
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
    coordinates: Coordinate3D;
  };
  displayOverride: {
    frameId: string;
    frameVersion: number;
    coordinates: Coordinate3D;
    validityStatus: 'active' | 'needs_review';
    updatedAt: string;
  } | null;
  effectivePosition: {
    source: 'original' | 'override';
    frameId: string;
    frameVersion: number;
    coordinates: Coordinate3D;
  } | null;
  placementStatus: 'placed' | 'unplaced' | 'needs_review';
  overrideStatus: 'none' | 'active' | 'needs_review';
  calibrationStatus: string;
  lastIotFetchAt: string | null;
}

export interface FloorDevicesResponse {
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
  devices: DeviceMarkerDto[];
}

export interface UpdateDisplayPositionPayload {
  buildingId: string;
  floorId: string;
  frameId: string;
  frameVersion: number;
  position: Coordinate3D;
}

