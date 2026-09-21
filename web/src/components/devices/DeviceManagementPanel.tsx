"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  DeviceMarkerDto,
  FloorDevicesResponse,
  Coordinate3D,
} from '@/types/devices';
import {
  fetchFloorDevices,
  updateDevicePosition,
  resetDevicePosition,
} from '@/lib/devices-api';
import { useUnityViewer } from '@/components/unity/UnityViewerRuntime.client';
import { isDeviceKindVisible } from '@/lib/unity-bridge';

interface DeviceManagementPanelProps {
  buildingId: string;
  floorId: string;
  coordinateFrameId?: string;
  coordinateFrameVersion?: number;
  isFloorReady: boolean;
  selectedDeviceId?: string | null;
  onSelectDevice?: (deviceId: string | null) => void;
  onPreviewPosition?: (deviceId: string, pos: Coordinate3D) => void;
  onMarkersUpdated?: (devices: DeviceMarkerDto[]) => void;
}

export function DeviceManagementPanel({
  buildingId,
  floorId,
  coordinateFrameId = `E/${floorId}/floor-local`,
  coordinateFrameVersion = 1,
  isFloorReady,
  selectedDeviceId: externalSelectedId,
  onSelectDevice,
  onPreviewPosition,
  onMarkersUpdated,
}: DeviceManagementPanelProps) {
  const [catalogue, setCatalogue] = useState<FloorDevicesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Edit coordinates state
  const [editX, setEditX] = useState<string>('0');
  const [editY, setEditY] = useState<string>('0');
  const [editZ, setEditZ] = useState<string>('0');
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { sensorFilters } = useUnityViewer();
  const visibleDevices = (catalogue?.devices || []).filter((d) =>
    isDeviceKindVisible(d.kind, sensorFilters)
  );

  const selectedDevice = visibleDevices.find((d) => d.id === selectedId) || null;

  // Deselect if active device is filtered out
  useEffect(() => {
    if (selectedId && !visibleDevices.some((d) => d.id === selectedId)) {
      setSelectedId(null);
      onSelectDevice?.(null);
    }
  }, [selectedId, visibleDevices, onSelectDevice]);

  // Sync external selection from Unity click
  useEffect(() => {
    if (externalSelectedId !== undefined && externalSelectedId !== selectedId) {
      setSelectedId(externalSelectedId);
    }
  }, [externalSelectedId]);

  // Load catalogue when floor or ready state changes
  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    setConflictError(null);
    try {
      const data = await fetchFloorDevices(buildingId, floorId);
      setCatalogue(data);
      if (onMarkersUpdated) {
        onMarkersUpdated(data.devices);
      }
    } catch (err: any) {
      console.error('[DeviceManagementPanel] Fetch error:', err);
      setError(err.message || 'Failed to load device catalogue');
    } finally {
      setLoading(false);
    }
  }, [buildingId, floorId, onMarkersUpdated]);

  useEffect(() => {
    if (isFloorReady) {
      loadDevices();
    }
  }, [isFloorReady, loadDevices]);

  // When selected device changes, populate input coordinates
  useEffect(() => {
    if (selectedDevice && selectedDevice.effectivePosition) {
      const { x, y, z } = selectedDevice.effectivePosition.coordinates;
      setEditX(String(x));
      setEditY(String(y));
      setEditZ(String(z));
    }
  }, [selectedDevice]);

  const handleSelect = (device: DeviceMarkerDto) => {
    setSelectedId(device.id);
    onSelectDevice?.(device.id);
    setActionMessage(null);
    setConflictError(null);
  };

  const handleCoordinateChange = (axis: 'x' | 'y' | 'z', value: string) => {
    if (axis === 'x') setEditX(value);
    if (axis === 'y') setEditY(value);
    if (axis === 'z') setEditZ(value);

    const nx = axis === 'x' ? parseFloat(value) : parseFloat(editX);
    const ny = axis === 'y' ? parseFloat(value) : parseFloat(editY);
    const nz = axis === 'z' ? parseFloat(value) : parseFloat(editZ);

    if (!isNaN(nx) && !isNaN(ny) && !isNaN(nz) && selectedDevice) {
      onPreviewPosition?.(selectedDevice.id, { x: nx, y: ny, z: nz });
    }
  };

  const handleSave = async () => {
    if (!selectedDevice) return;
    const x = parseFloat(editX);
    const y = parseFloat(editY);
    const z = parseFloat(editZ);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      setError('Coordinates must be valid finite numbers');
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        setConflictError(null);
        setActionMessage('Saving display override...');

        const updated = await updateDevicePosition(
          selectedDevice.id,
          {
            buildingId,
            floorId,
            frameId: coordinateFrameId,
            frameVersion: coordinateFrameVersion,
            position: { x, y, z },
          },
          selectedDevice.placementRevision,
        );

        setActionMessage('Saved position override successfully!');
        // Update local state
        setCatalogue((prev) => {
          if (!prev) return prev;
          const updatedDevices = prev.devices.map((d) => (d.id === updated.id ? updated : d));
          onMarkersUpdated?.(updatedDevices);
          return { ...prev, devices: updatedDevices };
        });
      } catch (err: any) {
        if (err.isConflict) {
          setConflictError(err.message);
        } else {
          setError(err.message || 'Failed to save position');
        }
      }
    });
  };

  const handleReset = async () => {
    if (!selectedDevice) return;

    startTransition(async () => {
      try {
        setError(null);
        setConflictError(null);
        setActionMessage('Resetting to original position...');

        const updated = await resetDevicePosition(
          selectedDevice.id,
          selectedDevice.placementRevision,
          buildingId,
          floorId,
        );

        setActionMessage('Reset position override back to original!');
        setCatalogue((prev) => {
          if (!prev) return prev;
          const updatedDevices = prev.devices.map((d) => (d.id === updated.id ? updated : d));
          onMarkersUpdated?.(updatedDevices);
          return { ...prev, devices: updatedDevices };
        });
      } catch (err: any) {
        if (err.isConflict) {
          setConflictError(err.message);
        } else {
          setError(err.message || 'Failed to reset position');
        }
      }
    });
  };

  const handleCancel = () => {
    if (selectedDevice && selectedDevice.effectivePosition) {
      const { x, y, z } = selectedDevice.effectivePosition.coordinates;
      setEditX(String(x));
      setEditY(String(y));
      setEditZ(String(z));
      onPreviewPosition?.(selectedDevice.id, { x, y, z });
      setActionMessage('Reverted preview coordinates.');
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 text-white rounded-xl shadow-2xl p-4 w-96 flex flex-col max-h-[85vh] text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
        <div>
          <h2 className="font-semibold text-base text-sky-400">Device Marker Inventory</h2>
          <p className="text-xs text-slate-400">Floor {buildingId}-{floorId}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
            {catalogue?.source.mode === 'fixture' ? 'Fixture Data' : 'IoT Not Configured'}
          </span>
          <span className="text-[10px] text-slate-400">Calibration: Unverified</span>
        </div>
      </div>

      {/* Error & Conflict Banners */}
      {error && (
        <div className="p-2 mb-2 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-lg">
          {error}
        </div>
      )}

      {conflictError && (
        <div className="p-2 mb-2 bg-amber-950/80 border border-amber-500 text-amber-200 text-xs rounded-lg flex items-center justify-between">
          <span>{conflictError}</span>
          <button
            onClick={loadDevices}
            className="ml-2 px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px]"
          >
            Reload
          </button>
        </div>
      )}

      {actionMessage && !error && !conflictError && (
        <div className="p-2 mb-2 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs rounded-lg">
          {actionMessage}
        </div>
      )}

      {/* Device List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 mb-3 max-h-48 border border-slate-800 rounded-lg p-1.5 bg-slate-950/50">
        {loading ? (
          <div className="p-4 text-center text-slate-400 text-xs">Đang tải danh sách thiết bị...</div>
        ) : visibleDevices.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">Không có thiết bị phù hợp với bộ lọc.</div>
        ) : (
          visibleDevices.map((device) => {
            const isSelected = device.id === selectedId;
            const hasOverride = device.overrideStatus === 'active';
            return (
              <button
                key={device.id}
                onClick={() => handleSelect(device)}
                className={`w-full text-left p-2 rounded-md transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-sky-600/30 border border-sky-400 text-white'
                    : 'bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="truncate">
                  <div className="font-medium text-xs truncate">{device.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className="capitalize">{device.kind.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>rev {device.placementRevision}</span>
                  </div>
                </div>
                <div>
                  {hasOverride ? (
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/40">
                      Custom
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                      Original
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selected Device Position Editor */}
      {selectedDevice ? (
        <div className="border-t border-slate-700 pt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 truncate">
              {selectedDevice.name}
            </h3>
            <span className="text-[10px] text-slate-400">Rev: {selectedDevice.placementRevision}</span>
          </div>

          {/* Coordinates Inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">X (m)</label>
              <input
                type="number"
                step="0.1"
                value={editX}
                onChange={(e) => handleCoordinateChange('x', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Y (m)</label>
              <input
                type="number"
                step="0.1"
                value={editY}
                onChange={(e) => handleCoordinateChange('y', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Z (m)</label>
              <input
                type="number"
                step="0.1"
                value={editZ}
                onChange={(e) => handleCoordinateChange('z', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium py-1.5 px-3 rounded text-xs transition"
            >
              {isPending ? 'Saving...' : 'Save Position'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-1.5 px-2.5 rounded text-xs transition"
            >
              Cancel
            </button>
            {selectedDevice.overrideStatus === 'active' && (
              <button
                onClick={handleReset}
                disabled={isPending}
                className="bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/60 py-1.5 px-2.5 rounded text-xs transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-slate-500 text-xs">
          Select a device marker to adjust position
        </div>
      )}
    </div>
  );
}

