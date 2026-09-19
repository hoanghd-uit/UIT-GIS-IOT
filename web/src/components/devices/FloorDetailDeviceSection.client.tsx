"use client";

import React, { useEffect, useState } from 'react';
import { useUnityViewer } from '@/components/unity/UnityViewerRuntime.client';
import { DeviceManagementPanel } from './DeviceManagementPanel';

interface FloorDetailDeviceSectionProps {
  buildingId: string;
  floorId: string;
}

export function FloorDetailDeviceSection({
  buildingId,
  floorId,
}: FloorDetailDeviceSectionProps) {
  const {
    viewerStatus,
    activeFloorMetadata,
    selectedDeviceId,
    selectFloorMarker,
    previewMarkerPosition,
    applyFloorMarkers,
  } = useUnityViewer();

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const isFloorReady =
    viewerStatus === 'floor-ready' &&
    activeFloorMetadata?.buildingId === buildingId &&
    activeFloorMetadata?.floorId === floorId;

  // Clear markers if we leave ready state
  useEffect(() => {
    if (!isFloorReady) {
      selectFloorMarker('');
    }
  }, [isFloorReady, selectFloorMarker]);

  // If a device marker is selected in Unity, automatically open the management panel
  useEffect(() => {
    if (selectedDeviceId) {
      setIsPanelOpen(true);
    }
  }, [selectedDeviceId]);

  if (!isFloorReady) {
    return null;
  }

  return (
    <div className="absolute top-4 left-[21.5rem] z-20 pointer-events-auto flex flex-col items-start gap-2">
      {!isPanelOpen ? (
        <button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800/95 text-sky-400 border border-slate-700/80 rounded-xl shadow-lg text-xs font-medium transition-all"
        >
          <span>📍</span>
          <span>Quản lý vị trí thiết bị</span>
        </button>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPanelOpen(false)}
            className="absolute top-3.5 right-3.5 z-10 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-xs"
            title="Thu nhỏ panel quản lý thiết bị"
          >
            ✕
          </button>
          <DeviceManagementPanel
            buildingId={buildingId}
            floorId={floorId}
            coordinateFrameId={activeFloorMetadata?.coordinateFrameId}
            coordinateFrameVersion={activeFloorMetadata?.coordinateFrameVersion}
            isFloorReady={isFloorReady}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={(id) => selectFloorMarker(id || '')}
            onPreviewPosition={previewMarkerPosition}
            onMarkersUpdated={applyFloorMarkers}
          />
        </div>
      )}
    </div>
  );
}
