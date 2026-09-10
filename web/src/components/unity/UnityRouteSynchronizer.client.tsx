"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUnityViewer } from "./UnityViewerRuntime.client";
import { parseViewerRoute } from "@/lib/viewer-routes";

export function UnityRouteSynchronizer() {
  const pathname = usePathname();
  const { isLoaded, sendMessage, setViewerStatus } = useUnityViewer();
  const lastSentPayloadRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const route = parseViewerRoute(pathname);
    if (!route) {
      // Invalid or unrelated route: do not command Unity
      return;
    }

    const payloadJson = JSON.stringify(route);

    if (lastSentPayloadRef.current === payloadJson) {
      return;
    }

    lastSentPayloadRef.current = payloadJson;

    if (route.view === "floor-detail") {
      setViewerStatus("loading-floor");
    }

    sendMessage("_InitManager", "ApplyViewerRoute", payloadJson);
  }, [pathname, isLoaded, sendMessage, setViewerStatus]);

  return null;
}

