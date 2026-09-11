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
  parseFloorContentStateChangedPayload,
  parseViewerErrorPayload,
  parseViewerStateChangedPayload,
} from "@/lib/unity-bridge";
import { buildFloorRoute, parseViewerRoute } from "@/lib/viewer-routes";
import {
  ActiveFloorMetadata,
  ViewerRuntimeStatus,
} from "@/types/viewer";

interface UnityViewerContextValue {
  unityProvider: ReturnType<typeof useUnityContext>["unityProvider"];
  isLoaded: boolean;
  loadingProgression: number;
  viewerStatus: ViewerRuntimeStatus;
  statusLabel: string;
  errorMessage: string | null;
  activeFloorMetadata: ActiveFloorMetadata | null;
  activeRequestId: string | null;
  setViewerStatus: (status: ViewerRuntimeStatus) => void;
  sendMessage: ReturnType<typeof useUnityContext>["sendMessage"];
  dispatchRouteRequest: (pathname: string) => void;
  retryCurrentFloor: () => void;
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
    streamingAssetsUrl: campusUnityBuild.streamingAssetsUrl,
  });

  const [viewerStatus, setViewerStatus] = useState<ViewerRuntimeStatus>("initial-loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFloorMetadata, setActiveFloorMetadata] = useState<ActiveFloorMetadata | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);
  const requestCounterRef = useRef(0);
  const activeRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
    routerRef.current = router;
  }, [pathname, router]);

  // Dispatch a route request to Unity with a monotonic requestId token
  const dispatchRouteRequest = useCallback(
    (targetPathname: string) => {
      if (!isLoaded) return;

      const route = parseViewerRoute(targetPathname);
      if (!route) return;

      const newId = `req-${++requestCounterRef.current}`;
      activeRequestIdRef.current = newId;
      setActiveRequestId(newId);

      const payload = {
        ...route,
        requestId: newId,
      };

      setErrorMessage(null);
      if (route.view === "floor-detail") {
        setViewerStatus("loading-floor");
        setActiveFloorMetadata(null);
      }

      sendMessage("_InitManager", "ApplyViewerRoute", JSON.stringify(payload));
    },
    [isLoaded, sendMessage]
  );

  const retryCurrentFloor = useCallback(() => {
    dispatchRouteRequest(pathnameRef.current);
  }, [dispatchRouteRequest]);

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

    // Ignore stale acknowledgements
    if (payload.requestId && activeRequestIdRef.current && payload.requestId !== activeRequestIdRef.current) {
      console.warn("[UnityViewerRuntime] Ignored stale ViewerStateChanged with requestId:", payload.requestId, "active:", activeRequestIdRef.current);
      return;
    }

    const currentRoute = parseViewerRoute(pathnameRef.current);
    if (!currentRoute) return;

    if (payload.view === "campus") {
      if (currentRoute.view !== "campus") return;
      setErrorMessage(null);
      setActiveFloorMetadata(null);
      setViewerStatus("campus-ready");
    }
  }, []);

  // Handle FloorContentStateChanged event from Unity WebGL
  const handleFloorContentStateChanged = useCallback((raw: unknown) => {
    const payload = parseFloorContentStateChangedPayload(raw);
    if (!payload) {
      console.warn("[UnityViewerRuntime] Ignored invalid FloorContentStateChanged payload:", raw);
      return;
    }

    // Require matching requestId if an active request token is tracked
    if (activeRequestIdRef.current) {
      if (!payload.requestId || payload.requestId !== activeRequestIdRef.current) {
        console.warn("[UnityViewerRuntime] Ignored mismatched or missing requestId in FloorContentStateChanged:", payload.requestId, "active:", activeRequestIdRef.current);
        return;
      }
    }

    const currentRoute = parseViewerRoute(pathnameRef.current);
    if (!currentRoute || currentRoute.view !== "floor-detail" ||
        currentRoute.buildingId !== payload.buildingId ||
        currentRoute.floorId !== payload.floorId) {
      return;
    }

    switch (payload.status) {
      case "ready":
        setErrorMessage(null);
        setViewerStatus("floor-ready");
        if (payload.contentVersion && payload.coordinateFrameId) {
          setActiveFloorMetadata({
            buildingId: payload.buildingId,
            floorId: payload.floorId,
            contentVersion: payload.contentVersion,
            coordinateFrameId: payload.coordinateFrameId,
            coordinateFrameVersion: payload.coordinateFrameVersion ?? 1,
            calibrationStatus: payload.calibrationStatus ?? "Unverified",
          });
        }
        break;

      case "loading":
        setViewerStatus("loading-floor");
        setErrorMessage(null);
        setActiveFloorMetadata(null);
        break;

      case "unavailable":
        setViewerStatus("floor-unavailable");
        setErrorMessage(null);
        setActiveFloorMetadata(null);
        break;

      case "error":
        setViewerStatus("error");
        setActiveFloorMetadata(null);
        setErrorMessage(payload.errorMessage || "Không thể tải mô hình 3D của tầng này.");
        break;
    }
  }, []);

  // Handle ViewerError from Unity WebGL
  const handleViewerError = useCallback((raw: unknown) => {
    const payload = parseViewerErrorPayload(raw);
    if (!payload) return;

    console.error("[UnityViewerRuntime] ViewerError from Unity:", payload);
    setViewerStatus("error");
    setErrorMessage(payload.message || "Lỗi giao tiếp với Unity");
  }, []);

  // Register Unity event listeners
  useEffect(() => {
    addEventListener("FloorClicked", handleFloorClicked);
    addEventListener("ViewerStateChanged", handleViewerStateChanged);
    addEventListener("FloorContentStateChanged", handleFloorContentStateChanged);
    addEventListener("ViewerError", handleViewerError);

    return () => {
      removeEventListener("FloorClicked", handleFloorClicked);
      removeEventListener("ViewerStateChanged", handleViewerStateChanged);
      removeEventListener("FloorContentStateChanged", handleFloorContentStateChanged);
      removeEventListener("ViewerError", handleViewerError);
    };
  }, [
    addEventListener,
    removeEventListener,
    handleFloorClicked,
    handleViewerStateChanged,
    handleFloorContentStateChanged,
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
        return "Đang tải mô hình tầng...";
      case "floor-ready":
        return "FloorDetail ready";
      case "floor-unavailable":
        return "Chưa có mô hình 3D";
      case "campus-ready":
        return "Campus ready";
      case "error":
        return errorMessage || "Lỗi tải scene hoặc mô hình";
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
      activeFloorMetadata,
      activeRequestId,
      setViewerStatus,
      sendMessage,
      dispatchRouteRequest,
      retryCurrentFloor,
    }),
    [
      unityProvider,
      isLoaded,
      loadingProgression,
      viewerStatus,
      statusLabel,
      errorMessage,
      activeFloorMetadata,
      activeRequestId,
      sendMessage,
      dispatchRouteRequest,
      retryCurrentFloor,
    ]
  );

  return (
    <UnityViewerContext.Provider value={contextValue}>
      {children}
    </UnityViewerContext.Provider>
  );
}
