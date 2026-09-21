import { redirect } from "next/navigation";
import { isValidBuildingId, isValidFloorId } from "@/config/buildings";
import { FloorNavigationPanel } from "@/components/floor/FloorNavigationPanel";
import { FloorContentStatusOverlay } from "@/components/floor/FloorContentStatusOverlay";
import { FloorDetailDeviceSection } from "@/components/devices/FloorDetailDeviceSection.client";
import { FloorFilterSidebar } from "@/components/floor/FloorFilterSidebar";
import { FloorId } from "@/types/viewer";

interface FloorDetailPageProps {
  params: Promise<{
    buildingId: string;
    floorId: string;
  }>;
}

export default async function FloorDetailPage({ params }: FloorDetailPageProps) {
  const { buildingId, floorId } = await params;

  if (!isValidBuildingId(buildingId) || !isValidFloorId(floorId)) {
    redirect("/viewer/campus");
  }

  return (
    <>
      <FloorContentStatusOverlay floorId={floorId as FloorId} />
      <div className="absolute top-4 left-4 z-20">
        <FloorFilterSidebar buildingId={buildingId} floorId={floorId} />
      </div>
      <FloorDetailDeviceSection buildingId={buildingId} floorId={floorId} />
      <div className="absolute top-4 right-4 z-20">
        <FloorNavigationPanel buildingId={buildingId} currentFloorId={floorId} />
      </div>
    </>
  );
}


