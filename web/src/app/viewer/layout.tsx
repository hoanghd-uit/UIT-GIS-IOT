import React from "react";
import { ViewerShell } from "@/components/layout/ViewerShell";
import { CampusUnityCanvasLoader } from "@/components/unity/CampusUnityCanvasLoader.client";

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewerShell unityCanvasSlot={<CampusUnityCanvasLoader />}>
      {children}
    </ViewerShell>
  );
}

