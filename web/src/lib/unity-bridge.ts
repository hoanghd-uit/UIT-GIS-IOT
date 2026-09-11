import { isValidBuildingId, isValidFloorId } from "@/config/buildings";
import {
  FloorClickedPayload,
  FloorContentStateChangedPayload,
  ViewerErrorPayload,
  ViewerStateChangedPayload,
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

