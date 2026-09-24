import React from "react";
import { ViewerShell } from "@/components/layout/ViewerShell";
import { UnityViewerRuntime } from "@/components/unity/UnityViewerRuntime.client";
import { UnityViewerCanvas } from "@/components/unity/UnityViewerCanvas.client";
import { UnityRouteSynchronizer } from "@/components/unity/UnityRouteSynchronizer.client";
import { IotToastProvider } from "@/context/IotToastContext";
import { IotToastContainer } from "@/components/common/IotToastContainer";

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnityViewerRuntime>
      <IotToastProvider>
        <UnityRouteSynchronizer />
        <ViewerShell unityCanvasSlot={<UnityViewerCanvas />}>
          {children}
        </ViewerShell>
        <IotToastContainer />
      </IotToastProvider>
    </UnityViewerRuntime>
  );
}

