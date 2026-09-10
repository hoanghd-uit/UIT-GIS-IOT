"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUnityContext } from "react-unity-webgl";
import { campusUnityBuild } from "@/config/unity-build";
import {
  parseFloorClickedPayload,
  parseViewerErrorPayload,
  parseViewerStateChangedPayload,
} from "@/lib/unity-bridge";
import { buildFloorRoute, parseViewerRoute } from "@/lib/viewer-routes";
import { ViewerRuntimeStatus } from "@/types/viewer";

interface UnityViewerContextValue {
  unityProvider: ReturnType<typeof useUnityContext>["unityProvider"];
  isLoaded: boolean;
  loadingProgression: number;
  viewerStatus: ViewerRuntimeStatus;
  statusLabel: string;
  errorMessage: string | null;
  setViewerStatus: (status: ViewerRuntimeStatus) => void;
  sendMessage: ReturnType<typeof useUnityContext>["sendMessage"];
}

const UnityViewerContext = createContext<UnityViewerContextValue | null>(null);

export function useUnityViewer() {
  const ctx = useContext(UnityViewerContext);
  if (!ctx) {
    throw new Error("useUnityViewer must be used within a UnityViewerRuntime");
  }
  return ctx;
}

interface UnityViewerRuntimeProps {
  children: React.ReactNode;
}

export function UnityViewerRuntime({ children }: UnityViewerRuntimeProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    unityProvider,
    isLoaded,
    loadingProgression,
    sendMessage,
    addEventListener,
    removeEventListener,
  } = useUnityContext({
    loaderUrl: campusUnityBuild.loaderUrl,
    dataUrl: campusUnityBuild.dataUrl,
    frameworkUrl: campusUnityBuild.frameworkUrl,
    codeUrl: campusUnityBuild.codeUrl,
  });

  const [viewerStatus, setViewerStatus] = useState<ViewerRuntimeStatus>("initial-loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);

  useEffect(() => {
    pathnameRef.current = pathname;
    routerRef.current = router;
    setErrorMessage(null);
  }, [pathname, router]);

  // Handle FloorClicked event from Unity WebGL
  const handleFloorClicked = useCallback((raw: unknown) => {
    const payload = parseFloorClickedPayload(raw);
    if (!payload) {
      console.warn("[UnityViewerRuntime] Ignored invalid FloorClicked payload:", raw);
      return;
    }

    const targetRoute = buildFloorRoute(payload.buildingId, payload.floorId);
    if (pathnameRef.current !== targetRoute) {
      routerRef.current.push(targetRoute, { scroll: false });
    }
  }, []);

  // Handle ViewerStateChanged acknowledgement from Unity WebGL
  const handleViewerStateChanged = useCallback((raw: unknown) => {
    const payload = parseViewerStateChangedPayload(raw);
    if (!payload) {
      console.warn("[UnityViewerRuntime] Ignored invalid ViewerStateChanged payload:", raw);
      return;
    }

    const currentRoute = parseViewerRoute(pathnameRef.current);
    if (!currentRoute) {
      return;
    }

    // Compare acknowledgement against active route to ignore stale responses from earlier requests
    if (payload.view === "campus") {
      if (currentRoute.view !== "campus") {
        console.warn("[UnityViewerRuntime] Ignored stale campus acknowledgement while route is:", pathnameRef.current);
        return;
      }
      setErrorMessage(null);
      setViewerStatus("campus-ready");
    } else if (payload.view === "floor-detail") {
      if (
        currentRoute.view !== "floor-detail" ||
        currentRoute.buildingId !== payload.buildingId ||
        currentRoute.floorId !== payload.floorId
      ) {
        console.warn("[UnityViewerRuntime] Ignored stale floor-detail acknowledgement for route:", pathnameRef.current, "payload:", payload);
        return;
      }
      setErrorMessage(null);
      setViewerStatus("floor-ready");
    }
  }, []);

  // Handle ViewerError from Unity WebGL
  const handleViewerError = useCallback((raw: unknown) => {
    const payload = parseViewerErrorPayload(raw);
    if (!payload) return;

    console.error("[UnityViewerRuntime] ViewerError from Unity:", payload);
    setViewerStatus("error");
    setErrorMessage(payload.message || "Failed to load scene");
  }, []);

  // Register Unity event listeners
  useEffect(() => {
    addEventListener("FloorClicked", handleFloorClicked);
    addEventListener("ViewerStateChanged", handleViewerStateChanged);
    addEventListener("ViewerError", handleViewerError);

    return () => {
      removeEventListener("FloorClicked", handleFloorClicked);
      removeEventListener("ViewerStateChanged", handleViewerStateChanged);
      removeEventListener("ViewerError", handleViewerError);
    };
  }, [
    addEventListener,
    removeEventListener,
    handleFloorClicked,
    handleViewerStateChanged,
    handleViewerError,
  ]);

  // Derive human-readable status label
  const statusLabel = useMemo(() => {
    if (!isLoaded) {
      const percentage = Math.round(loadingProgression * 100);
      return `Loading Unity (${percentage}%)`;
    }

    switch (viewerStatus) {
      case "loading-floor":
        return "Loading FloorDetail...";
      case "floor-ready":
        return "FloorDetail ready";
      case "campus-ready":
        return "Campus ready";
      case "error":
        return errorMessage || "Unable to load scene";
      case "initial-loading":
      default:
        return "Unity ready";
    }
  }, [isLoaded, loadingProgression, viewerStatus, errorMessage]);

  const contextValue = useMemo<UnityViewerContextValue>(
    () => ({
      unityProvider,
      isLoaded,
      loadingProgression,
      viewerStatus,
      statusLabel,
      errorMessage,
      setViewerStatus,
      sendMessage,
    }),
    [
      unityProvider,
      isLoaded,
      loadingProgression,
      viewerStatus,
      statusLabel,
      errorMessage,
      sendMessage,
    ]
  );

  return (
    <UnityViewerContext.Provider value={contextValue}>
      {children}
    </UnityViewerContext.Provider>
  );
}
