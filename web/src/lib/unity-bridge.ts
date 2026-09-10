import { isValidBuildingId, isValidFloorId } from "@/config/buildings";
import {
  FloorClickedPayload,
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

  if (obj.view === "campus") {
    if (obj.sceneName !== "Campus") return null;
    return {
      schemaVersion: 1,
      view: "campus",
      sceneName: "Campus",
    };
  }

  if (obj.view === "floor-detail") {
    if (obj.sceneName !== "FloorDetail") return null;
    if (!isValidBuildingId(obj.buildingId) || !isValidFloorId(obj.floorId)) return null;

    return {
      schemaVersion: 1,
      view: "floor-detail",
      sceneName: "FloorDetail",
      buildingId: obj.buildingId,
      floorId: obj.floorId,
    };
  }

  return null;
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

