import { isValidBuildingId, isValidFloorId } from "@/config/buildings";
import {
  FloorClickedPayload,
  FloorContentStateChangedPayload,
  ViewerErrorPayload,
  ViewerStateChangedPayload,
  FloorFiltersAppliedPayload,
  FloorSensorFilters,
} from "@/types/viewer";

function toObject(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  } else if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

export function parseFloorClickedPayload(raw: unknown): FloorClickedPayload | null {
  const obj = toObject(raw);
  if (!obj) return null;

  if (obj.schemaVersion !== 1) return null;

  const { buildingId, floorId } = obj;
  if (!isValidBuildingId(buildingId) || !isValidFloorId(floorId)) {
    return null;
  }

  return {
    schemaVersion: 1,
    buildingId,
    floorId,
  };
}

export function parseViewerStateChangedPayload(
  raw: unknown
): ViewerStateChangedPayload | null {
  const obj = toObject(raw);
  if (!obj) return null;

  if (obj.schemaVersion !== 1) return null;
  const requestId = typeof obj.requestId === "string" ? obj.requestId : undefined;

  if (obj.view === "campus") {
    if (obj.sceneName !== "Campus") return null;
    return {
      schemaVersion: 1,
      requestId,
      view: "campus",
      sceneName: "Campus",
    };
  }

  if (obj.view === "floor-detail") {
    if (obj.sceneName !== "FloorDetail") return null;
    if (!isValidBuildingId(obj.buildingId) || !isValidFloorId(obj.floorId)) return null;

    return {
      schemaVersion: 1,
      requestId,
      view: "floor-detail",
      sceneName: "FloorDetail",
      buildingId: obj.buildingId,
      floorId: obj.floorId,
    };
  }

  return null;
}

export function parseFloorContentStateChangedPayload(
  raw: unknown
): FloorContentStateChangedPayload | null {
  const obj = toObject(raw);
  if (!obj) return null;

  if (obj.schemaVersion !== 1) return null;
  if (!isValidBuildingId(obj.buildingId) || !isValidFloorId(obj.floorId)) return null;

  const validStatuses = ["loading", "ready", "unavailable", "error"] as const;
  if (typeof obj.status !== "string" || !validStatuses.includes(obj.status as (typeof validStatuses)[number])) {
    return null;
  }

  const payload: FloorContentStateChangedPayload = {
    schemaVersion: 1,
    requestId: typeof obj.requestId === "string" ? obj.requestId : undefined,
    buildingId: obj.buildingId,
    floorId: obj.floorId,
    status: obj.status as FloorContentStateChangedPayload["status"],
  };

  if (obj.status === "ready") {
    if (typeof obj.contentVersion === "number") payload.contentVersion = obj.contentVersion;
    if (typeof obj.coordinateFrameId === "string") payload.coordinateFrameId = obj.coordinateFrameId;
    if (typeof obj.coordinateFrameVersion === "number") payload.coordinateFrameVersion = obj.coordinateFrameVersion;
    if (typeof obj.calibrationStatus === "string") payload.calibrationStatus = obj.calibrationStatus;
  } else if (obj.status === "error") {
    if (typeof obj.errorCode === "string") payload.errorCode = obj.errorCode;
    if (typeof obj.errorMessage === "string") payload.errorMessage = obj.errorMessage;
  }

  return payload;
}

export function parseViewerErrorPayload(raw: unknown): ViewerErrorPayload | null {
  const obj = toObject(raw);
  if (!obj) return null;

  if (obj.schemaVersion !== 1) return null;
  if (typeof obj.code !== "string" || !obj.code) return null;
  if (typeof obj.message !== "string") return null;

  return {
    schemaVersion: 1,
    code: obj.code,
    message: obj.message,
  };
}

export interface DeviceMarkerClickedPayload {
  schemaVersion: 1;
  buildingId: string;
  floorId: string;
  deviceId: string;
  externalId: string;
}

export function parseDeviceMarkerClickedPayload(
  raw: unknown,
): DeviceMarkerClickedPayload | null {
  const obj = toObject(raw);
  if (!obj) return null;

  if (obj.schemaVersion !== 1) return null;
  if (typeof obj.deviceId !== "string" || !obj.deviceId) return null;

  return {
    schemaVersion: 1,
    buildingId: String(obj.buildingId),
    floorId: String(obj.floorId),
    deviceId: obj.deviceId,
    externalId: String(obj.externalId || ""),
  };
}

export function parseFloorFiltersAppliedPayload(
  raw: unknown,
): FloorFiltersAppliedPayload | null {
  const obj = toObject(raw);
  if (!obj) return null;

  if (obj.schemaVersion !== 1) return null;
  if (typeof obj.buildingId !== "string" || typeof obj.floorId !== "string") return null;

  return {
    schemaVersion: 1,
    routeRequestId: typeof obj.routeRequestId === "string" ? obj.routeRequestId : undefined,
    buildingId: obj.buildingId as any,
    floorId: obj.floorId as any,
    filterRevision: typeof obj.filterRevision === "number" ? obj.filterRevision : 0,
    status: obj.status === "rejected" ? "rejected" : "applied",
    errorCode: typeof obj.errorCode === "string" ? obj.errorCode : null,
  };
}

export function isDeviceKindVisible(
  kind: string | undefined | null,
  filters: FloorSensorFilters,
): boolean {
  switch (kind?.toLowerCase()) {
    case "water_meter":
      return filters.waterMeter;
    case "temperature_humidity":
      return filters.temperatureHumidity;
    case "smart_building":
      return filters.smartBuilding;
    case "uhf_reader":
      return filters.rfUhfReader;
    case "camera":
      return filters.camera;
    default:
      // Unknown kind: visible only if all 5 filters are enabled, otherwise hidden
      return (
        filters.waterMeter &&
        filters.temperatureHumidity &&
        filters.smartBuilding &&
        filters.rfUhfReader &&
        filters.camera
      );
  }
}



