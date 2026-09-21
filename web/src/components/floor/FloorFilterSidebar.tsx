"use client";

import React, { useState } from "react";
import { useUnityViewer } from "@/components/unity/UnityViewerRuntime.client";
import { FloorLocatorIsometric } from "./FloorLocatorIsometric";
import { FloorObjectFilters, FloorSensorFilters } from "@/types/viewer";

import { DeviceCategoryIcon } from "@/components/icons/DeviceCategoryIcon";

interface FloorFilterSidebarProps {
  buildingId: string;
  floorId: string;
}

export function FloorFilterSidebar({ buildingId, floorId }: FloorFilterSidebarProps) {
  const {
    objectFilters,
    sensorFilters,
    filterStatus,
    updateObjectFilters,
    updateSensorFilters,
  } = useUnityViewer();

  // Accordion open/collapse states (default both open per spec)
  const [sensorsOpen, setSensorsOpen] = useState(true);
  const [objectsOpen, setObjectsOpen] = useState(true);

  // Toggle helper for object filters
  const handleObjectToggle = (key: keyof FloorObjectFilters) => {
    updateObjectFilters({ [key]: !objectFilters[key] });
  };

  // Toggle helper for sensor filters
  const handleSensorToggle = (key: keyof FloorSensorFilters) => {
    updateSensorFilters({ [key]: !sensorFilters[key] });
  };

  return (
    <aside
      className="w-80 max-w-[calc(100vw-2rem)] flex flex-col gap-3 p-3.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 text-xs overflow-y-auto max-h-[calc(100vh-6rem)] pointer-events-auto select-none"
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      role="region"
      aria-label="Bộ lọc tầng và sơ đồ vị trí"
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="font-semibold text-sm text-slate-100 tracking-wide">
            Bộ lọc hiển thị
          </h2>
        </div>
        {filterStatus === "applying" && (
          <span className="text-[10px] text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full">
            Đang áp dụng...
          </span>
        )}
      </div>

      {/* 1. Dropdown: Loại cảm biến */}
      <section className="border border-slate-800 rounded-xl bg-slate-950/40 overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-left font-medium text-slate-200"
          onClick={() => setSensorsOpen(!sensorsOpen)}
          aria-expanded={sensorsOpen}
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-sky-400">
            <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Loại cảm biến
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${sensorsOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {sensorsOpen && (
          <div className="p-3 space-y-2.5 border-t border-slate-800/60">
            {/* Water Meter */}
            <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white">
              <input
                type="checkbox"
                checked={sensorFilters.waterMeter}
                onChange={() => handleSensorToggle("waterMeter")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <DeviceCategoryIcon category="water_meter" size={16} />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Đồng hồ nước
              </span>
            </label>

            {/* Temperature & Humidity */}
            <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white">
              <input
                type="checkbox"
                checked={sensorFilters.temperatureHumidity}
                onChange={() => handleSensorToggle("temperatureHumidity")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <DeviceCategoryIcon category="temperature_humidity" size={16} />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Cảm biến nhiệt độ/độ ẩm
              </span>
            </label>

            {/* Smart Building */}
            <label className="flex items-start gap-2.5 cursor-pointer group hover:text-white">
              <input
                type="checkbox"
                checked={sensorFilters.smartBuilding}
                onChange={() => handleSensorToggle("smartBuilding")}
                className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <DeviceCategoryIcon category="smart_building" size={16} className="mt-0.5" />
              <span className="text-slate-300 group-hover:text-white transition-colors leading-tight">
                Smart Building (VOC, nhiệt độ/độ ẩm, áp suất)
              </span>
            </label>

            {/* RF UHF Reader */}
            <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white">
              <input
                type="checkbox"
                checked={sensorFilters.rfUhfReader}
                onChange={() => handleSensorToggle("rfUhfReader")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <DeviceCategoryIcon category="rf_uhf_reader" size={16} />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                RF UHF đọc thẻ
              </span>
            </label>

            {/* Camera */}
            <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white">
              <input
                type="checkbox"
                checked={sensorFilters.camera}
                onChange={() => handleSensorToggle("camera")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <DeviceCategoryIcon category="camera" size={16} />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Camera
              </span>
            </label>

            {/* Unknown / Fallback */}
            <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white border-t border-slate-800/80 pt-2">
              <input
                type="checkbox"
                checked={sensorFilters.unknown}
                onChange={() => handleSensorToggle("unknown")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <DeviceCategoryIcon category="unknown" size={16} />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Chưa phân loại (solar, avc, nfc...)
              </span>
            </label>
          </div>
        )}
      </section>

      {/* 2. Dropdown: Object trong tầng */}
      <section className="border border-slate-800 rounded-xl bg-slate-950/40 overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-left font-medium text-slate-200"
          onClick={() => setObjectsOpen(!objectsOpen)}
          aria-expanded={objectsOpen}
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Object trong tầng
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${objectsOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {objectsOpen && (
          <div className="p-3 space-y-2.5 border-t border-slate-800/60">
            {/* Ceilling (exact spelling mandated by spec) */}
            <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white">
              <input
                type="checkbox"
                checked={objectFilters.ceilling}
                onChange={() => handleObjectToggle("ceilling")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Ceilling
              </span>
            </label>

            {/* Interior */}
            <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white">
              <input
                type="checkbox"
                checked={objectFilters.interior}
                onChange={() => handleObjectToggle("interior")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Interior
              </span>
            </label>

            {/* Wall */}
            <label className="flex items-center gap-2.5 cursor-pointer group hover:text-white">
              <input
                type="checkbox"
                checked={objectFilters.wall}
                onChange={() => handleObjectToggle("wall")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Wall
              </span>
            </label>

            {/* Note that Floor is always kept active */}
            <div className="pt-1 text-[10px] text-slate-500 italic">
              * Sàn luôn được hiển thị khi mô hình hoạt động.
            </div>
          </div>
        )}
      </section>

      {/* //dropdownfilter visual layer */}

      {/* 4. Sơ đồ vị trí tầng trong tòa nhà */}
      <section className="pt-1">
        <FloorLocatorIsometric buildingId={buildingId} currentFloorId={floorId} />
      </section>
    </aside>
  );
}

