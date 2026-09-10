import { redirect } from "next/navigation";
import { isValidBuildingId, isValidFloorId } from "@/config/buildings";
import { FloorNavigationPanel } from "@/components/floor/FloorNavigationPanel";

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
    <div className="absolute top-4 right-4">
      <FloorNavigationPanel buildingId={buildingId} currentFloorId={floorId} />
    </div>
  );
}

