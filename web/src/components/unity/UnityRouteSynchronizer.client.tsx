"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUnityViewer } from "./UnityViewerRuntime.client";

export function UnityRouteSynchronizer() {
  const pathname = usePathname();
  const { isLoaded, dispatchRouteRequest } = useUnityViewer();
  const lastSentPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (lastSentPathnameRef.current === pathname) {
      return;
    }

    lastSentPathnameRef.current = pathname;
    dispatchRouteRequest(pathname);
  }, [pathname, isLoaded, dispatchRouteRequest]);

  return null;
}
