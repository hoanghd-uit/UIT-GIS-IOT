import {
  BuildingId,
  BUILDING_E_FLOOR_IDS,
  FloorId,
} from "@/types/viewer";

export const SUPPORTED_BUILDING_ID: BuildingId = "E";

export interface FloorItem {
  floorId: FloorId;
  label: string;
}

export const BUILDING_E_NAME = "Tòa nhà E";

export function formatFloorLabel(floorId: FloorId): string {
  if (floorId === "G") {
    return "Tầng G";
  }
  return `Tầng ${floorId}`;
}

export const BUILDING_E_FLOORS: readonly FloorItem[] = BUILDING_E_FLOOR_IDS.map(
  (floorId) => ({
    floorId,
    label: formatFloorLabel(floorId),
  })
);

export function isValidBuildingId(value: unknown): value is BuildingId {
  return value === SUPPORTED_BUILDING_ID;
}

export function isValidFloorId(value: unknown): value is FloorId {
  return (
    typeof value === "string" &&
    (BUILDING_E_FLOOR_IDS as readonly string[]).includes(value)
  );
}

