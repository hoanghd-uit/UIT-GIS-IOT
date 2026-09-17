"use client";

import React, { useEffect } from 'react';
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

  if (!isFloorReady) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-20">
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
  );
}
