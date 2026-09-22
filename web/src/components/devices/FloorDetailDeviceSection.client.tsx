"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useUnityViewer } from "@/components/unity/UnityViewerRuntime.client";
import { FloorIotDevicePanel } from "./FloorIotDevicePanel";
import { DeviceManagementPanel } from "./DeviceManagementPanel";
import { fetchFloorIotDevices } from "@/lib/iot-api";
import { FloorDeviceResponse } from "@/types/iot-devices";

interface FloorDetailDeviceSectionProps {
  buildingId: string;
  floorId: string;
}

export function FloorDetailDeviceSection({
  buildingId,
  floorId,
}: FloorDetailDeviceSectionProps) {
  const searchParams = useSearchParams();
  const isDevMode = searchParams.get("dev") === "true";

  const {
    viewerStatus,
    activeFloorMetadata,
    selectedDeviceId,
    selectedClusterIds,
    setSelectedDeviceId,
    setSelectedClusterIds,
    selectFloorMarker,
    applyFloorDeviceMarkers,
    clearFloorDeviceMarkers,
    previewMarkerPosition,
    applyFloorMarkers,
  } = useUnityViewer();

  // Mode tab: 'iot' (Phase 06 default) or 'manual-override' (Phase 04 legacy dev tool)
  const [activeTab, setActiveTab] = useState<"iot" | "manual-override">("iot");
  const [isListOpen, setIsListOpen] = useState(false); // Closed by default per Section 3.1 & 6

  // IoT Data & Lifecycle State
  const [iotData, setIotData] = useState<FloorDeviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGenerationRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastAppliedGenRef = useRef<number | null>(null);

  const isSupportedFloor = buildingId === "E" && ["4", "6"].includes(floorId);

  const isFloorReady =
    viewerStatus === "floor-ready" &&
    activeFloorMetadata?.buildingId === buildingId &&
    activeFloorMetadata?.floorId === floorId;

  // 1. Fetch IoT Devices on Floor Load or Change
  const loadIotDevices = useCallback(async () => {
    // Cancel in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const currentGen = ++loadGenerationRef.current;
    lastAppliedGenRef.current = null;

    // Clear stale markers immediately
    clearFloorDeviceMarkers(currentGen);
    setSelectedDeviceId(null);
    setSelectedClusterIds(null);

    if (!isSupportedFloor) {
      setIotData(null);
      setLoading(false);
      setError("Tích hợp IoT TEST hiện chỉ hỗ trợ tầng 4 và tầng 6 của Tòa E.");
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await fetchFloorIotDevices(buildingId, floorId, controller.signal);

      // Verify generation is still active
      if (loadGenerationRef.current !== currentGen) {
        return;
      }

      setIotData(data);
    } catch (err: any) {
      if (err.name === "AbortError" || loadGenerationRef.current !== currentGen) {
        return;
      }
      console.error("[FloorDetailDeviceSection] Failed to fetch IoT devices:", err);
      setError(err.message || "Không thể kết nối đến máy chủ IoT.");
    } finally {
      if (loadGenerationRef.current === currentGen) {
        setLoading(false);
      }
    }
  }, [buildingId, floorId, isSupportedFloor, clearFloorDeviceMarkers, setSelectedDeviceId, setSelectedClusterIds]);

  // Trigger fetch on mount or buildingId/floorId change
  useEffect(() => {
    loadIotDevices();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadIotDevices]);

  // 2. Gating: Apply markers when BOTH response and floor prefab are ready
  useEffect(() => {
    if (
      activeTab === "iot" &&
      isFloorReady &&
      iotData &&
      loadGenerationRef.current !== lastAppliedGenRef.current
    ) {
      lastAppliedGenRef.current = loadGenerationRef.current;
      applyFloorDeviceMarkers(iotData.devices, loadGenerationRef.current);
    }
  }, [activeTab, isFloorReady, iotData, applyFloorDeviceMarkers]);

  // 3. Selection synchronization
  const handleSelectDevice = (id: string | null) => {
    setSelectedDeviceId(id);
    selectFloorMarker(id || "");
  };

  const handleClearCluster = () => {
    setSelectedClusterIds(null);
    setSelectedDeviceId(null);
    selectFloorMarker("");
  };

  // If floor is not ready or leaving floor detail, hide UI
  if (viewerStatus !== "floor-ready" && viewerStatus !== "loading-floor") {
    return null;
  }

  return (
    <div className="absolute top-4 left-[19.5rem] z-20 pointer-events-auto flex flex-col items-start gap-2">
      {/* Optional Dev mode tab switcher */}
      {isDevMode && (
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("iot")}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
              activeTab === "iot"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📡 IoT API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual-override")}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
              activeTab === "manual-override"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📍 Tọa độ thủ công (Phase 04)
          </button>
        </div>
      )}

      {/* Active Tab Content */}
      {activeTab === "iot" ? (
        <FloorIotDevicePanel
          buildingId={buildingId}
          floorId={floorId}
          data={iotData}
          loading={loading}
          error={error}
          selectedDeviceId={selectedDeviceId}
          selectedClusterIds={selectedClusterIds}
          isListOpen={isListOpen}
          onToggleList={() => setIsListOpen((prev) => !prev)}
          onSelectDevice={handleSelectDevice}
          onClearClusterSelection={handleClearCluster}
          onRetry={loadIotDevices}
        />
      ) : (
        <DeviceManagementPanel
          buildingId={buildingId}
          floorId={floorId}
          coordinateFrameId={activeFloorMetadata?.coordinateFrameId}
          coordinateFrameVersion={activeFloorMetadata?.coordinateFrameVersion}
          isFloorReady={isFloorReady}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={(id) => selectFloorMarker(id || "")}
          onPreviewPosition={previewMarkerPosition}
          onMarkersUpdated={applyFloorMarkers}
        />
      )}
    </div>
  );
}
