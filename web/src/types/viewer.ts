export type BuildingId = "E";

export const BUILDING_E_FLOOR_IDS = [
  "12",
  "11",
  "10",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
  "1",
  "G",
] as const;

export type FloorId = (typeof BUILDING_E_FLOOR_IDS)[number];

export type ViewerView = "campus" | "floor-detail";

export interface FloorClickedPayload {
  schemaVersion: 1;
  buildingId: BuildingId;
  floorId: FloorId;
}

export type ViewerRoute =
  | {
      schemaVersion: 1;
      requestId?: string;
      view: "campus";
    }
  | {
      schemaVersion: 1;
      requestId?: string;
      view: "floor-detail";
      buildingId: BuildingId;
      floorId: FloorId;
    };

export type ViewerStateChangedPayload =
  | {
      schemaVersion: 1;
      requestId?: string;
      view: "campus";
      sceneName: "Campus";
    }
  | {
      schemaVersion: 1;
      requestId?: string;
      view: "floor-detail";
      sceneName: "FloorDetail";
      buildingId: BuildingId;
      floorId: FloorId;
    };

export interface ViewerErrorPayload {
  schemaVersion: 1;
  code: string;
  message: string;
}

export type FloorContentStatus = "loading" | "ready" | "unavailable" | "error";

export interface FloorContentStateChangedPayload {
  schemaVersion: 1;
  requestId?: string;
  buildingId: BuildingId;
  floorId: FloorId;
  status: FloorContentStatus;
  contentVersion?: number;
  coordinateFrameId?: string;
  coordinateFrameVersion?: number;
  calibrationStatus?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface ActiveFloorMetadata {
  buildingId: BuildingId;
  floorId: FloorId;
  contentVersion: number;
  coordinateFrameId: string;
  coordinateFrameVersion: number;
  calibrationStatus: string;
}

export type ViewerRuntimeStatus =
  | "initial-loading"
  | "campus-ready"
  | "loading-floor"
  | "floor-ready"
  | "floor-unavailable"
  | "error";

export interface FloorObjectFilters {
  ceilling: boolean;
  interior: boolean;
  wall: boolean;
}

export interface FloorSensorFilters {
  waterMeter: boolean;
  temperatureHumidity: boolean;
  smartBuilding: boolean;
  rfUhfReader: boolean;
  camera: boolean;
  solar: boolean;
  avc: boolean;
  nfc: boolean;
  unknown: boolean;
}

export interface ApplyFloorFiltersPayload {
  schemaVersion: 1;
  routeRequestId?: string;
  buildingId: BuildingId;
  floorId: FloorId;
  filterRevision: number;
  objects: FloorObjectFilters;
  sensors: FloorSensorFilters;
}

export interface FloorFiltersAppliedPayload {
  schemaVersion: 1;
  routeRequestId?: string;
  buildingId: BuildingId;
  floorId: FloorId;
  filterRevision: number;
  status: "applied" | "rejected";
  errorCode?: string | null;
}


