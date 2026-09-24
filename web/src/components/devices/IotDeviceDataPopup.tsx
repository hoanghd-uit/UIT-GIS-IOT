"use client";

import React, { useState, useEffect } from "react";
import { DeviceCategoryIcon } from "@/components/icons/DeviceCategoryIcon";
import { FloorDeviceView } from "@/types/iot-devices";
import { useIotDeviceTelemetry } from "@/hooks/useIotDeviceTelemetry";
import { IotDeviceTelemetryChart } from "./IotDeviceTelemetryChart";
import {
  SolarTelemetryData,
  AvcTelemetryData,
  NfcTelemetryData,
} from "@/types/iot-telemetry";

interface IotDeviceDataPopupProps {
  device: FloorDeviceView;
  buildingId: string;
  floorId: string;
  onClose: () => void;
  onViewInList?: () => void;
}

export function IotDeviceDataPopup({
  device,
  buildingId,
  floorId,
  onClose,
  onViewInList,
}: IotDeviceDataPopupProps) {
  const { data, loading, isRefreshing, error, refresh } = useIotDeviceTelemetry({
    deviceId: device.deviceId,
    deviceTypeHint: device.sourceDeviceType,
    enabled: true,
  });

  // Metric selectors
  const [solarMetric, setSolarMetric] = useState<"current_uA" | "lux">("current_uA");
  const [avcMetric, setAvcMetric] = useState<"flow" | "temp" | "fwd" | "rev">("flow");
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const telemetry = data?.telemetry;
  const coverage = data?.coverage;

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  };

  return (
    <div
      className="w-96 max-w-[calc(100vw-22rem)] p-4 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl shadow-2xl text-xs text-slate-200 flex flex-col gap-3 z-30 animate-in fade-in slide-in-from-top-2 duration-150 select-none"
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <DeviceCategoryIcon category={device.category} size={24} />
          <div className="flex flex-col min-w-0">
            <h3 className="font-semibold text-slate-100 text-xs truncate">
              {device.category === "solar"
                ? `Thiết bị Solar`
                : device.category === "water_meter" || device.category === "avc"
                ? `Đồng hồ nước`
                : device.category === "nfc"
                ? `Đầu đọc thẻ NFC`
                : `Thiết bị IoT`}
              {" — "}
              <span className="font-mono text-cyan-300">{device.deviceId}</span>
            </h3>
            <span className="text-[10px] text-slate-400">
              Tòa {buildingId} / Tầng {floorId} • {device.sourceDeviceType}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 ml-2"
          title="Đóng popup (Esc)"
        >
          ✕
        </button>
      </div>

      {/* 2. Loading Skeleton */}
      {loading && !data && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Đang tải dữ liệu 72 giờ từ API...</span>
        </div>
      )}

      {/* 3. Error Banner */}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex flex-col gap-2">
          <div className="flex items-start gap-2 text-red-400">
            <span className="text-sm">⚠️</span>
            <span className="text-xs font-medium leading-tight">{error}</span>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="self-end px-3 py-1 bg-red-800/40 hover:bg-red-700/60 border border-red-700/60 text-red-200 rounded-lg text-xs font-medium transition-colors"
          >
            {isRefreshing ? "Đang thử lại..." : "Thử lại"}
          </button>
        </div>
      )}

      {/* 4. Loaded Telemetry View */}
      {data && telemetry && (
        <>
          {/* A. Status Indicator Bar */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-400">Trạng thái:</span>
              <span className="font-medium text-slate-200">
                {telemetry.status.label}
              </span>
            </div>

            {/* AVC flags or details toggle */}
            {telemetry.type === "avc" && (
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                {showTechnicalDetails ? "Ẩn cờ" : "Xem cờ kỹ thuật"}
              </button>
            )}
          </div>

          {/* Technical Details / Flags Drawer for AVC */}
          {telemetry.type === "avc" && showTechnicalDetails && (
            <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[10px] grid grid-cols-2 gap-1.5 text-slate-300">
              <div>Mã van: <span className="font-mono text-cyan-300">{telemetry.status.rawFlags.valveOpen ?? "—"}</span></div>
              <div>Mã rò rỉ: <span className="font-mono text-cyan-300">{telemetry.status.rawFlags.pipeLeak ?? "—"}</span></div>
              <div>Mã vỡ ống: <span className="font-mono text-cyan-300">{telemetry.status.rawFlags.pipeBurst ?? "—"}</span></div>
              <div>Mã pin yếu: <span className="font-mono text-cyan-300">{telemetry.status.rawFlags.batteryLow ?? "—"}</span></div>
              <div>Mã can thiệp: <span className="font-mono text-cyan-300">{telemetry.status.rawFlags.tamper ?? "—"}</span></div>
              <div>Dòng ngược: <span className="font-mono text-cyan-300">{telemetry.status.rawFlags.reverseFlow ?? "—"}</span></div>
              <div className="col-span-2 text-[9px] text-slate-500 italic border-t border-slate-800/60 pt-1 mt-0.5">
                * Các cờ trạng thái giữ nguyên mã số gốc từ phần cứng, chưa có quy ước mã hóa xác nhận.
              </div>
            </div>
          )}

          {/* B. Specific Device Type Sections */}

          {/* --- SOLAR VIEW --- */}
          {telemetry.type === "solar" && (
            <div className="flex flex-col gap-2.5">
              {/* Metric Selector Tabs */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSolarMetric("current_uA")}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors ${
                    solarMetric === "current_uA"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ⚡ Dòng điện (µA)
                </button>
                <button
                  type="button"
                  onClick={() => setSolarMetric("lux")}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors ${
                    solarMetric === "lux"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ☀️ Độ sáng (lx)
                </button>
              </div>

              {/* Hero Card */}
              <div className="p-3 bg-gradient-to-br from-slate-950/80 to-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400">
                    {solarMetric === "current_uA"
                      ? "Dòng điện mới nhất (72h)"
                      : "Độ sáng mới nhất (72h)"}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-cyan-300">
                      {solarMetric === "current_uA"
                        ? telemetry.hero.value !== null
                          ? telemetry.hero.value.toLocaleString()
                          : "—"
                        : telemetry.secondarySelector.value !== null
                        ? telemetry.secondarySelector.value.toLocaleString()
                        : "—"}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {solarMetric === "current_uA" ? "µA" : "lx"}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400">
                  <span>Bản ghi lúc:</span>
                  <div className="font-mono text-slate-300">
                    {formatDate(
                      solarMetric === "current_uA"
                        ? telemetry.hero.sampleTimestamp
                        : telemetry.secondarySelector.sampleTimestamp,
                    )}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-300">
                  Xu hướng 72 giờ qua ({solarMetric === "current_uA" ? "Dòng điện" : "Độ sáng"})
                </span>
                <IotDeviceTelemetryChart
                  data={telemetry.readings.map((r) => ({
                    timestamp: r.timestamp,
                    value: solarMetric === "current_uA" ? r.currentUa ?? NaN : r.lux ?? NaN,
                  }))}
                  unit={solarMetric === "current_uA" ? "µA" : "lx"}
                  metricLabel={solarMetric === "current_uA" ? "Dòng điện" : "Độ sáng"}
                  rangeStart={data.queryRange.start}
                  rangeStop={data.queryRange.stop}
                />
              </div>
            </div>
          )}

          {/* --- AVC WATER METER VIEW --- */}
          {telemetry.type === "avc" && (
            <div className="flex flex-col gap-2.5">
              {/* Metric Selector Tabs */}
              <div className="grid grid-cols-2 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-[10px]">
                <button
                  type="button"
                  onClick={() => setAvcMetric("flow")}
                  className={`py-1 px-2 rounded-lg font-medium transition-colors text-center ${
                    avcMetric === "flow"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  💧 Lưu lượng (m³/h)*
                </button>
                <button
                  type="button"
                  onClick={() => setAvcMetric("temp")}
                  className={`py-1 px-2 rounded-lg font-medium transition-colors text-center ${
                    avcMetric === "temp"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🌡️ Nhiệt độ (°C)
                </button>
                <button
                  type="button"
                  onClick={() => setAvcMetric("fwd")}
                  className={`py-1 px-2 rounded-lg font-medium transition-colors text-center ${
                    avcMetric === "fwd"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ➡️ Thể tích thuận (m³)*
                </button>
                <button
                  type="button"
                  onClick={() => setAvcMetric("rev")}
                  className={`py-1 px-2 rounded-lg font-medium transition-colors text-center ${
                    avcMetric === "rev"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ⬅️ Thể tích ngược (m³)*
                </button>
              </div>

              {/* Pending Badge Notice */}
              {["flow", "fwd", "rev"].includes(avcMetric) && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-300">
                  <span>⚠️</span>
                  <span>Chờ xác nhận phần cứng — đơn vị/chỉ số theo tài liệu tạm.</span>
                </div>
              )}

              {/* Hero Card */}
              <div className="p-3 bg-gradient-to-br from-slate-950/80 to-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400">
                    {avcMetric === "flow"
                      ? "Lưu lượng tức thời mới nhất"
                      : avcMetric === "temp"
                      ? "Nhiệt độ đo được mới nhất"
                      : avcMetric === "fwd"
                      ? "Thể tích chiều thuận"
                      : "Thể tích chiều ngược"}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-cyan-300">
                      {avcMetric === "flow"
                        ? telemetry.hero.value !== null
                          ? telemetry.hero.value.toLocaleString()
                          : "—"
                        : avcMetric === "temp"
                        ? telemetry.secondarySelectors.tempC.value !== null
                          ? telemetry.secondarySelectors.tempC.value.toLocaleString()
                          : "—"
                        : avcMetric === "fwd"
                        ? telemetry.secondarySelectors.fwdVolume.value !== null
                          ? telemetry.secondarySelectors.fwdVolume.value.toLocaleString()
                          : "—"
                        : telemetry.secondarySelectors.revVolume.value !== null
                        ? telemetry.secondarySelectors.revVolume.value.toLocaleString()
                        : "—"}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {avcMetric === "flow"
                        ? "m³/h"
                        : avcMetric === "temp"
                        ? "°C"
                        : "m³"}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400">
                  <span>Bản ghi lúc:</span>
                  <div className="font-mono text-slate-300">
                    {formatDate(
                      avcMetric === "flow"
                        ? telemetry.hero.sampleTimestamp
                        : avcMetric === "temp"
                        ? telemetry.secondarySelectors.tempC.sampleTimestamp
                        : avcMetric === "fwd"
                        ? telemetry.secondarySelectors.fwdVolume.sampleTimestamp
                        : telemetry.secondarySelectors.revVolume.sampleTimestamp,
                    )}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-300">
                  Xu hướng 72 giờ qua
                </span>
                <IotDeviceTelemetryChart
                  data={telemetry.readings.map((r) => ({
                    timestamp: r.timestamp,
                    value:
                      avcMetric === "flow"
                        ? r.instantFlowM3h ?? NaN
                        : avcMetric === "temp"
                        ? r.tempC ?? NaN
                        : avcMetric === "fwd"
                        ? r.fwdVolumeM3 ?? NaN
                        : r.revVolumeM3 ?? NaN,
                  }))}
                  unit={
                    avcMetric === "flow"
                      ? "m³/h"
                      : avcMetric === "temp"
                      ? "°C"
                      : "m³"
                  }
                  metricLabel={
                    avcMetric === "flow"
                      ? "Lưu lượng"
                      : avcMetric === "temp"
                      ? "Nhiệt độ"
                      : "Thể tích"
                  }
                  rangeStart={data.queryRange.start}
                  rangeStop={data.queryRange.stop}
                />
              </div>
            </div>
          )}

          {/* --- NFC DOOR READER VIEW --- */}
          {telemetry.type === "nfc" && (
            <div className="flex flex-col gap-2.5">
              {/* Hero Card: Latest Event */}
              <div className="p-3 bg-gradient-to-br from-slate-950/80 to-slate-900/80 border border-slate-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Lượt quét gần nhất (72h)
                  </span>
                  {telemetry.hero.latestEvent && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        telemetry.hero.latestEvent.movingDirection === "in"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {telemetry.hero.latestEvent.movingDirection === "in" ? "Vào cửa" : "Ra cửa"}
                    </span>
                  )}
                </div>

                {telemetry.hero.latestEvent ? (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-bold text-cyan-300 truncate">
                        Mã thẻ: {telemetry.hero.latestEvent.detectedCardId}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Thời gian: {formatDate(telemetry.hero.latestEvent.timestamp)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-500 text-[11px] py-1">
                    Không có lượt quét thẻ nào trong 72 giờ qua.
                  </span>
                )}

                {/* Counter Strip */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <span>Đã tải {telemetry.hero.loadedEventCount} lượt:</span>
                  <span className="font-mono text-slate-300">
                    {telemetry.hero.totalInCount} vào • {telemetry.hero.totalOutCount} ra
                  </span>
                </div>
              </div>

              {/* Event History List */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-300">
                  Lịch sử lượt quét (Mới nhất trước)
                </span>
                <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {telemetry.events.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 text-[11px]">
                      Chưa có sự kiện quét thẻ nào.
                    </div>
                  ) : (
                    telemetry.events.map((evt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/80 text-[11px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                              evt.movingDirection === "in"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {evt.movingDirection === "in" ? "Vào" : "Ra"}
                          </span>
                          <span className="font-mono text-slate-200 truncate">
                            {evt.detectedCardId}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                          {formatDate(evt.timestamp)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- UNKNOWN / UNSUPPORTED VIEW --- */}
          {telemetry.type === "unknown" && (
            <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-xs text-center py-6">
              <span>{telemetry.message}</span>
            </div>
          )}

          {/* C. Coverage / Truncation Banner */}
          {coverage && (coverage.isTruncated || coverage.reachedLimit) && (
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-300 flex items-start gap-1.5">
              <span>⚠️</span>
              <span>
                {coverage.reachedLimit
                  ? "Đã đạt giới hạn 1.000 bản ghi; lịch sử có thể chưa đầy đủ."
                  : "API báo giới hạn kết quả; lịch sử có thể chưa đầy đủ."}
              </span>
            </div>
          )}

          {/* D. Footer: Timestamps & Refresh Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
            <div className="flex flex-col leading-tight">
              <span>Đã lấy lúc: {formatDate(data.fetchedAt)}</span>
              <span className="text-[9px] text-slate-500">
                {coverage?.validCount ?? 0} bản ghi hợp lệ • RAM tạm
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onViewInList && (
                <button
                  type="button"
                  onClick={onViewInList}
                  className="text-cyan-400 hover:underline"
                >
                  Danh sách →
                </button>
              )}

              <button
                type="button"
                onClick={refresh}
                disabled={isRefreshing || loading}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title="Làm mới dữ liệu (tính lại 72 giờ gần nhất)"
              >
                <svg
                  className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
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
                <span>{isRefreshing ? "Đang tải..." : "Làm mới"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

