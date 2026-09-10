import { isValidBuildingId, isValidFloorId } from "@/config/buildings";
import { BuildingId, FloorId, ViewerRoute } from "@/types/viewer";

export const CAMPUS_ROUTE = "/viewer/campus";

export function buildCampusRoute(): string {
  return CAMPUS_ROUTE;
}

export function buildFloorRoute(buildingId: BuildingId, floorId: FloorId): string {
  return `/viewer/buildings/${buildingId}/floors/${floorId}`;
}

export function parseViewerRoute(pathname: string): ViewerRoute | null {
  if (!pathname) {
    return null;
  }

  // Normalize trailing slash (except root)
  const normalizedPath = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (normalizedPath === CAMPUS_ROUTE) {
    return {
      schemaVersion: 1,
      view: "campus",
    };
  }

  const floorRouteMatch = normalizedPath.match(
    /^\/viewer\/buildings\/([^/]+)\/floors\/([^/]+)$/
  );

  if (!floorRouteMatch) {
    return null;
  }

  const [, rawBuildingId, rawFloorId] = floorRouteMatch;

  if (!isValidBuildingId(rawBuildingId) || !isValidFloorId(rawFloorId)) {
    return null;
  }

  return {
    schemaVersion: 1,
    view: "floor-detail",
    buildingId: rawBuildingId,
    floorId: rawFloorId,
  };
}

