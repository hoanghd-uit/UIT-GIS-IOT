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
  parseDeviceMarkerClickedPayload,
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
import { Coordinate3D, DeviceMarkerDto } from "@/types/devices";

interface UnityViewerContextValue {
  unityProvider: ReturnType<typeof useUnityContext>["unityProvider"];
  isLoaded: boolean;
  loadingProgression: number;
  viewerStatus: ViewerRuntimeStatus;
  statusLabel: string;
  errorMessage: string | null;
  activeFloorMetadata: ActiveFloorMetadata | null;
  activeRequestId: string | null;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
  setViewerStatus: (status: ViewerRuntimeStatus) => void;
  sendMessage: ReturnType<typeof useUnityContext>["sendMessage"];
  dispatchRouteRequest: (pathname: string) => void;
  retryCurrentFloor: () => void;
  applyFloorMarkers: (devices: DeviceMarkerDto[]) => void;
  previewMarkerPosition: (deviceId: string, pos: Coordinate3D) => void;
  selectFloorMarker: (deviceId: string) => void;
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

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

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
      setSelectedDeviceId(null);
      if (route.view === "floor-detail") {
        setViewerStatus("loading-floor");
        setActiveFloorMetadata(null);
      } else {
        sendMessage("_InitManager", "ClearFloorMarkers", "");
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
      setSelectedDeviceId(null);
      setViewerStatus("campus-ready");
      sendMessage("_InitManager", "ClearFloorMarkers", "");
    }
  }, [sendMessage]);

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
        setSelectedDeviceId(null);
        sendMessage("_InitManager", "ClearFloorMarkers", "");
        break;

      case "unavailable":
        setViewerStatus("floor-unavailable");
        setErrorMessage(null);
        setActiveFloorMetadata(null);
        setSelectedDeviceId(null);
        sendMessage("_InitManager", "ClearFloorMarkers", "");
        break;

      case "error":
        setViewerStatus("error");
        setActiveFloorMetadata(null);
        setSelectedDeviceId(null);
        setErrorMessage(payload.errorMessage || "Không thể tải mô hình 3D của tầng này.");
        sendMessage("_InitManager", "ClearFloorMarkers", "");
        break;
    }
  }, [sendMessage]);

  // Handle ViewerError from Unity WebGL
  const handleViewerError = useCallback((raw: unknown) => {
    const payload = parseViewerErrorPayload(raw);
    if (!payload) return;

    console.error("[UnityViewerRuntime] ViewerError from Unity:", payload);
    setViewerStatus("error");
    setErrorMessage(payload.message || "Lỗi giao tiếp với Unity");
  }, []);

  // Handle DeviceMarkerClicked from Unity WebGL
  const handleDeviceMarkerClicked = useCallback((raw: unknown) => {
    const payload = parseDeviceMarkerClickedPayload(raw);
    if (!payload) return;

    setSelectedDeviceId(payload.deviceId);
  }, []);

  // Apply floor markers to Unity WebGL
  const applyFloorMarkers = useCallback(
    (devices: DeviceMarkerDto[]) => {
      if (!isLoaded || !activeFloorMetadata) return;

      const payload = {
        schemaVersion: 1,
        requestId: activeRequestIdRef.current || `req-${Date.now()}`,
        buildingId: activeFloorMetadata.buildingId,
        floorId: activeFloorMetadata.floorId,
        frameId: activeFloorMetadata.coordinateFrameId,
        frameVersion: activeFloorMetadata.coordinateFrameVersion,
        markers: devices
          .filter((d) => d.effectivePosition !== null)
          .map((d) => ({
            id: d.id,
            externalId: d.externalId,
            name: d.name,
            kind: d.kind,
            position: d.effectivePosition!.coordinates,
          })),
      };

      sendMessage("_InitManager", "ApplyFloorMarkers", JSON.stringify(payload));
    },
    [isLoaded, activeFloorMetadata, sendMessage]
  );

  // Preview marker position temporary update
  const previewMarkerPosition = useCallback(
    (deviceId: string, position: Coordinate3D) => {
      if (!isLoaded) return;
      const payload = {
        schemaVersion: 1,
        requestId: activeRequestIdRef.current || `req-${Date.now()}`,
        deviceId,
        position,
      };
      sendMessage("_InitManager", "PreviewMarkerPosition", JSON.stringify(payload));
    },
    [isLoaded, sendMessage]
  );

  // Select marker in Unity WebGL
  const selectFloorMarker = useCallback(
    (deviceId: string) => {
      if (!isLoaded) return;
      setSelectedDeviceId(deviceId);
      sendMessage("_InitManager", "SelectFloorMarker", deviceId);
    },
    [isLoaded, sendMessage]
  );

  // Register Unity event listeners
  useEffect(() => {
    addEventListener("FloorClicked", handleFloorClicked);
    addEventListener("ViewerStateChanged", handleViewerStateChanged);
    addEventListener("FloorContentStateChanged", handleFloorContentStateChanged);
    addEventListener("ViewerError", handleViewerError);
    addEventListener("DeviceMarkerClicked", handleDeviceMarkerClicked);

    return () => {
      removeEventListener("FloorClicked", handleFloorClicked);
      removeEventListener("ViewerStateChanged", handleViewerStateChanged);
      removeEventListener("FloorContentStateChanged", handleFloorContentStateChanged);
      removeEventListener("ViewerError", handleViewerError);
      removeEventListener("DeviceMarkerClicked", handleDeviceMarkerClicked);
    };
  }, [
    addEventListener,
    removeEventListener,
    handleFloorClicked,
    handleViewerStateChanged,
    handleFloorContentStateChanged,
    handleViewerError,
    handleDeviceMarkerClicked,
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
      selectedDeviceId,
      setSelectedDeviceId,
      setViewerStatus,
      sendMessage,
      dispatchRouteRequest,
      retryCurrentFloor,
      applyFloorMarkers,
      previewMarkerPosition,
      selectFloorMarker,
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
      selectedDeviceId,
      sendMessage,
      dispatchRouteRequest,
      retryCurrentFloor,
      applyFloorMarkers,
      previewMarkerPosition,
      selectFloorMarker,
    ]
  );


  return (
    <UnityViewerContext.Provider value={contextValue}>
      {children}
    </UnityViewerContext.Provider>
  );
}
