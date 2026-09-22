"use client";

import React, { useState } from "react";
import { FloorDeviceResponse, FloorDeviceView } from "@/types/iot-devices";
import { DeviceCategoryIcon } from "@/components/icons/DeviceCategoryIcon";
import { useUnityViewer } from "@/components/unity/UnityViewerRuntime.client";
import { isDeviceKindVisible } from "@/lib/unity-bridge";

interface FloorIotDevicePanelProps {
  buildingId: string;
  floorId: string;
  data: FloorDeviceResponse | null;
  loading: boolean;
  error: string | null;
  selectedDeviceId: string | null;
  selectedClusterIds?: string[] | null;
  isListOpen: boolean;
  onToggleList: () => void;
  onSelectDevice: (deviceId: string | null) => void;
  onClearClusterSelection?: () => void;
  onRetry: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  water_meter: "Đồng hồ nước",
  temperature_humidity: "Nhiệt độ & Độ ẩm",
  smart_building: "Tòa nhà thông minh",
  rf_uhf_reader: "Đầu đọc RF/UHF",
  uhf_reader: "Đầu đọc RF/UHF",
  camera: "Camera",
  solar: "Cảm biến Solar",
  avc: "Bộ điều khiển AVC",
  nfc: "Đầu đọc thẻ NFC",
  unknown: "Chưa phân loại",
};

export function FloorIotDevicePanel({
  buildingId,
  floorId,
  data,
  loading,
  error,
  selectedDeviceId,
  selectedClusterIds,
  isListOpen,
  onToggleList,
  onSelectDevice,
  onClearClusterSelection,
  onRetry,
}: FloorIotDevicePanelProps) {
  const [showTestInfo, setShowTestInfo] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { sensorFilters } = useUnityViewer();

  const handleRetry = async () => {
    if (isRetrying || loading) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const allDevices = data?.devices || [];
  const visibleDevices = allDevices.filter((d) =>
    isDeviceKindVisible(d.category, sensorFilters)
  );

  const displayList =
    selectedClusterIds && selectedClusterIds.length > 0
      ? visibleDevices.filter((d) => selectedClusterIds.includes(d.deviceId))
      : visibleDevices;

  const selectedDevice = allDevices.find((d) => d.deviceId === selectedDeviceId);

  return (
    <div className="flex flex-col items-start gap-2 select-none pointer-events-auto">
      {/* 1. Compact Status Strip (Always visible when on floor) */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-lg text-xs"
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Device Count Indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">
            {allDevices.length} thiết bị
          </span>
        </div>

        <span className="text-slate-600">|</span>

        {/* API Coordinates Badge */}
        <button
          type="button"
          onClick={() => setShowTestInfo(!showTestInfo)}
          className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 rounded-md text-[11px] text-cyan-300 font-medium transition-colors"
          title="Bấm để xem chi tiết vị trí tọa độ"
        >
          <span className="font-bold text-[9px] px-1 py-0.2 bg-cyan-500/30 rounded">API</span>
          <span>Tọa độ gốc (0, 0)</span>
          <span className="text-[10px] ml-0.5">ℹ️</span>
        </button>

        <span className="text-slate-600">|</span>

        {/* Refresh button */}
        <button
          type="button"
          onClick={handleRetry}
          disabled={loading || isRetrying}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Tải lại danh sách thiết bị từ API"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading || isRetrying ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* List Drawer Toggle Button */}
        <button
          type="button"
          onClick={onToggleList}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            isListOpen
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700"
          }`}
          title={isListOpen ? "Đóng danh sách" : "Mở danh sách thiết bị"}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Danh sách</span>
        </button>
      </div>

      {/* 2. Position Info Modal / Popover */}
      {showTestInfo && (
        <div
          className="w-80 p-3 bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 rounded-xl shadow-2xl text-xs text-slate-300 leading-relaxed z-30"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1">
              <span>ℹ️</span> Tọa độ thiết bị IoT
            </span>
            <button
              type="button"
              onClick={() => setShowTestInfo(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              ✕
            </button>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
            <li>
              <strong>Nguồn thiết bị:</strong> Dữ liệu được tải trực tiếp từ IoT API qua backend NestJS.
            </li>
            <li>
              <strong>Vị trí hiển thị:</strong> Hiển thị theo đúng tọa độ (x, y) nhận từ API với z = 0, tâm prefab là (0, 0, 0).
            </li>
            <li>
              <strong>Xếp chồng icon:</strong> Do các thiết bị hiện có cùng tọa độ (0, 0), các icon sẽ hiển thị xếp chồng tại tâm mặt bằng. Bấm liên tiếp vào icon trên 3D hoặc chọn trong danh sách để xem từng thiết bị.
            </li>
            <li>
              <strong>Zero-Persistence:</strong> Dữ liệu IoT hoàn toàn trong RAM, không ghi vào cơ sở dữ liệu.
            </li>
          </ul>
        </div>
      )}

      {/* 3. Single Device Popup Card (Appears when an icon is selected on 3D floor) */}
      {selectedDevice && !isListOpen && (
        <div
          className="w-80 p-3.5 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl shadow-2xl text-xs text-slate-200 flex flex-col gap-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150"
          onMouseDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <DeviceCategoryIcon category={selectedDevice.category} size={22} />
              <div>
                <h3 className="font-semibold text-slate-100 text-xs">
                  {CATEGORY_NAMES[selectedDevice.category] || selectedDevice.category}
                </h3>
                <span className="font-mono text-[10px] text-slate-400">
                  {selectedDevice.deviceId}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectDevice(null)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              title="Đóng chi tiết"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-slate-400 block text-[10px]">Loại thiết bị gốc:</span>
              <span className="font-medium text-cyan-300 font-mono">
                {selectedDevice.sourceDeviceType}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tầng hiển thị:</span>
              <span className="font-medium text-slate-200">
                Tòa {buildingId} / Tầng {floorId}
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-between border-t border-slate-800/60 pt-1.5 mt-0.5">
              <span className="text-slate-400 text-[10px]">Tọa độ nguồn API:</span>
              <span className="font-mono text-[10px] text-slate-300">
                ({selectedDevice.sourceLocation.x}, {selectedDevice.sourceLocation.y})
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 rounded-lg">
            <span>📍 Tọa độ API gốc tại tâm prefab</span>
            <button
              type="button"
              onClick={onToggleList}
              className="text-cyan-400 hover:underline ml-2"
            >
              Xem trong danh sách →
            </button>
          </div>
        </div>
      )}

      {/* 4. Full Device Inventory Drawer (Opens only when user clicks 'Danh sách') */}
      {isListOpen && (
        <div
          className="w-84 max-w-[calc(100vw-22rem)] flex flex-col gap-3 p-3.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 text-xs overflow-hidden max-h-[calc(100vh-8rem)] z-20 animate-in fade-in duration-150"
          onMouseDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          role="region"
          aria-label="Panel danh sách thiết bị IoT"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100">
                Danh sách thiết bị ({displayList.length})
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleList}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              title="Đóng danh sách"
            >
              ✕
            </button>
          </div>

          {/* Status & Error handling */}
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Đang tải thiết bị từ API...</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex flex-col gap-2">
              <div className="flex items-start gap-2 text-red-400">
                <span className="text-sm">⚠️</span>
                <span className="text-xs font-medium leading-tight">{error}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="self-end px-3 py-1 bg-red-800/40 hover:bg-red-700/60 border border-red-700/60 text-red-200 rounded-lg text-xs font-medium transition-colors"
              >
                {isRetrying ? "Đang thử lại..." : "Thử lại"}
              </button>
            </div>
          ) : (
            <>
              {selectedClusterIds && selectedClusterIds.length > 0 && (
                <div className="flex items-center justify-between px-2.5 py-1 bg-sky-950/60 border border-sky-600/50 rounded-lg text-[11px] text-sky-300">
                  <span>Đang lọc cụm: {selectedClusterIds.length} thiết bị</span>
                  <button
                    type="button"
                    onClick={onClearClusterSelection}
                    className="text-slate-400 hover:text-white text-xs ml-2 underline"
                  >
                    Hiện tất cả
                  </button>
                </div>
              )}

              {/* Devices List */}
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-72 pr-1">
                {displayList.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    {allDevices.length === 0
                      ? "Chưa có thiết bị từ API cho tầng này."
                      : "Không có thiết bị phù hợp với bộ lọc hiện tại."}
                  </div>
                ) : (
                  displayList.map((device) => {
                    const isSelected = selectedDeviceId === device.deviceId;
                    return (
                      <div
                        key={device.deviceId}
                        onClick={() => onSelectDevice(isSelected ? null : device.deviceId)}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-950/40"
                            : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <DeviceCategoryIcon category={device.category} size={20} />
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-xs text-slate-200 truncate font-semibold">
                              {device.deviceId}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <span className="px-1.5 py-0.2 bg-slate-800 rounded border border-slate-700/80 text-slate-300">
                                {device.sourceDeviceType}
                              </span>
                              <span>
                                {CATEGORY_NAMES[device.category] || device.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-cyan-400 text-xs font-bold shrink-0 ml-2">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
