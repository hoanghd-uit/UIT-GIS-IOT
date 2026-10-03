'use client';

import React, { useState, useMemo } from 'react';
import {
  DashboardDeviceTelemetryResponse,
} from '@/types/dashboard-iot-telemetry';
import { DashboardDeviceCatalogueItem } from '@/types/dashboard-iot';
import {
  NormalizedSmartBuildingReading,
  NormalizedSmokeReading,
  SmartBuildingTelemetryData,
  SmokeTelemetryData,
} from '@/types/iot-telemetry';
import { MetricTrendChart } from '@/components/dashboard/charts/MetricTrendChart';

export interface IotRawTelemetryDetailsProps {
  data: DashboardDeviceTelemetryResponse;
  device: DashboardDeviceCatalogueItem;
}

type SbMetricKey = 'co2' | 'voc' | 'voltage' | 'visible' | 'ir';

interface SbMetricConfig {
  key: SbMetricKey;
  label: string;
  field: keyof NormalizedSmartBuildingReading;
}

const SB_METRICS: SbMetricConfig[] = [
  { key: 'co2', label: 'CO₂ (raw)', field: 'rawCo2' },
  { key: 'voc', label: 'VOC (raw)', field: 'rawVoc' },
  { key: 'voltage', label: 'voltage (raw)', field: 'rawVoltage' },
  { key: 'visible', label: 'visible (raw)', field: 'rawVisible' },
  { key: 'ir', label: 'ir (raw)', field: 'rawIr' },
];

const PAGE_SIZE = 20;

function formatDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return isoString;
  }
}

export function IotRawTelemetryDetails({ data, device: _device }: IotRawTelemetryDetailsProps) {
  const isSb = data.deviceType === 'sb';
  const isSmoke = data.deviceType === 'smoke';

  const [selectedSbMetric, setSelectedSbMetric] = useState<SbMetricKey>('co2');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isDisclosureOpen, setIsDisclosureOpen] = useState<boolean>(false);

  // Smart Building readings
  const sbTelemetry = isSb ? (data.telemetry as SmartBuildingTelemetryData) : null;
  const sbReadings = useMemo(() => sbTelemetry?.readings || [], [sbTelemetry]);
  const latestSbReading = sbReadings[0] || null;

  // Smoke readings
  const smokeTelemetry = isSmoke ? (data.telemetry as SmokeTelemetryData) : null;
  const smokeReadings = useMemo(() => smokeTelemetry?.readings || [], [smokeTelemetry]);
  const latestSmokeReading = smokeReadings[0] || null;

  // Trend chart points for SB (sorted chronologically oldest-first without mutating original array)
  const activeSbConfig = useMemo(
    () => SB_METRICS.find((m) => m.key === selectedSbMetric) || SB_METRICS[0],
    [selectedSbMetric],
  );

  const chartPoints = useMemo(() => {
    if (!isSb || sbReadings.length === 0) return [];
    const copy = [...sbReadings].reverse(); // readings are newest-first, reverse to oldest-first
    const points = [];
    for (const r of copy) {
      const val = r[activeSbConfig.field];
      if (typeof val === 'number' && Number.isFinite(val)) {
        points.push({
          timestamp: r.timestamp,
          value: val,
        });
      }
    }
    return points;
  }, [isSb, sbReadings, activeSbConfig]);

  // Pagination for history table
  const totalRows = isSb ? sbReadings.length : smokeReadings.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedSbRows = useMemo(() => {
    if (!isSb) return [];
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return sbReadings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [isSb, sbReadings, safePage]);

  const paginatedSmokeRows = useMemo(() => {
    if (!isSmoke) return [];
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return smokeReadings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [isSmoke, smokeReadings, safePage]);

  return (
    <div className="space-y-4">
      {/* Smart Building (sb) Branch */}
      {isSb && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Dữ liệu thô · Smart Building (sb)
            </h4>
          </div>

          {/* SB Caveat Banner */}
          <div
            role="note"
            className="p-3 rounded-lg border text-xs flex items-start gap-2.5"
            style={{
              backgroundColor: 'rgba(234, 179, 8, 0.08)',
              borderColor: 'rgba(234, 179, 8, 0.3)',
              color: 'var(--warning)',
            }}
          >
            <svg
              className="w-4 h-4 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              Đơn vị và thang đo cảm biến sb chưa được xác nhận; các giá trị này chưa dùng để đánh giá IAQ hoặc cảnh báo.
            </div>
          </div>

          {/* 5 Raw Sensor Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {SB_METRICS.map((metric) => {
              const val = latestSbReading ? latestSbReading[metric.field] : null;
              const isSelected = selectedSbMetric === metric.key;
              return (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => setSelectedSbMetric(metric.key)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/20 shadow-sm'
                      : 'hover:border-slate-600'
                  }`}
                  style={{
                    backgroundColor: isSelected ? undefined : 'var(--panel-elevated)',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                  }}
                  aria-pressed={isSelected}
                >
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold truncate">
                    {metric.label}
                  </div>
                  <div className="text-base font-mono font-bold text-foreground mt-1 tabular-nums">
                    {val !== null && val !== undefined ? val : '—'}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {isSelected ? 'Đang chọn xem xu hướng' : 'Bấm để xem xu hướng'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selectable Trend Chart (Default: CO2, no unit labels, no threshold colors) */}
          <div className="w-full">
            {chartPoints.length > 0 ? (
              <MetricTrendChart
                data={chartPoints}
                metricLabel={activeSbConfig.label}
                unit=""
                height={260}
                accessibleSummary={`Biểu đồ xu hướng dữ liệu thô ${activeSbConfig.label} gồm ${chartPoints.length} điểm đo.`}
              />
            ) : (
              <div
                className="p-6 rounded-lg border text-center text-xs text-muted-foreground"
                style={{
                  backgroundColor: 'var(--panel-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                Không có dữ liệu hợp lệ cho thông số {activeSbConfig.label} trong khoảng thời gian đã tải.
              </div>
            )}
          </div>

          {/* Technical Disclosure */}
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setIsDisclosureOpen(!isDisclosureOpen)}
              className="w-full px-4 py-2.5 text-xs font-semibold flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--panel-elevated)' }}
              aria-expanded={isDisclosureOpen}
            >
              <span>Thông tin kỹ thuật &amp; metadata</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${isDisclosureOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDisclosureOpen && (
              <div
                className="p-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
                style={{
                  backgroundColor: 'var(--panel-bg)',
                  borderColor: 'var(--border)',
                }}
              >
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Tên thiết bị trong mạng</div>
                  <div className="font-mono text-foreground mt-0.5 truncate">
                    {latestSbReading?.networkDeviceName || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Application ID</div>
                  <div className="font-mono text-foreground mt-0.5 truncate">
                    {latestSbReading?.applicationId || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">dev_eui</div>
                  <div className="font-mono text-foreground mt-0.5 truncate">
                    {data.deviceId}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">f_cnt</div>
                  <div className="font-mono text-foreground mt-0.5 tabular-nums">
                    {latestSbReading?.fCnt !== null && latestSbReading?.fCnt !== undefined
                      ? latestSbReading.fCnt
                      : '—'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bounded Local History Table */}
          <div
            className="rounded-lg border overflow-hidden flex flex-col"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between flex-wrap gap-2 text-xs"
              style={{ backgroundColor: 'var(--panel-elevated)', borderColor: 'var(--border)' }}
            >
              <h5 className="font-semibold text-foreground">Bản tin đã tải</h5>
              <div className="text-muted-foreground text-[11px]">
                Trang {safePage} / {totalPages} ({paginatedSbRows.length} / {totalRows} bản tin)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr
                    className="border-b text-[10px] uppercase text-muted-foreground font-semibold"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                  >
                    <th className="px-3 py-2 whitespace-nowrap">Thời điểm ghi nhận</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">CO₂ (raw)</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">VOC (raw)</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">voltage (raw)</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">visible (raw)</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">ir (raw)</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">f_cnt</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono tabular-nums text-[11px]" style={{ borderColor: 'var(--border)' }}>
                  {paginatedSbRows.length > 0 ? (
                    paginatedSbRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[rgba(255,255,255,0.03)] transition-colors h-10"
                      >
                        <td className="px-3 py-2 text-foreground whitespace-nowrap">
                          {formatDate(row.timestamp)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.rawCo2 !== null && row.rawCo2 !== undefined ? row.rawCo2 : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.rawVoc !== null && row.rawVoc !== undefined ? row.rawVoc : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.rawVoltage !== null && row.rawVoltage !== undefined ? row.rawVoltage : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.rawVisible !== null && row.rawVisible !== undefined ? row.rawVisible : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.rawIr !== null && row.rawIr !== undefined ? row.rawIr : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {row.fCnt !== null && row.fCnt !== undefined ? row.fCnt : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">
                        Không có bản tin nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div
                className="px-4 py-2 border-t flex items-center justify-between text-xs"
                style={{ backgroundColor: 'var(--panel-elevated)', borderColor: 'var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-2.5 py-1 rounded border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Trang trước
                </button>
                <span className="text-[11px] text-muted-foreground">
                  Trang {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1 rounded border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smoke Branch */}
      {isSmoke && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Dữ liệu thô · Smoke
            </h4>
          </div>

          {/* Smoke Caveat Banner */}
          <div
            role="note"
            className="p-3 rounded-lg border text-xs flex items-start gap-2.5"
            style={{
              backgroundColor: 'rgba(234, 179, 8, 0.08)',
              borderColor: 'rgba(234, 179, 8, 0.3)',
              color: 'var(--warning)',
            }}
          >
            <svg
              className="w-4 h-4 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              Chưa xác nhận ý nghĩa mã status/state; không diễn giải thành bình thường, cháy hoặc sự cố.
            </div>
          </div>

          {/* 2 Neutral Raw Code Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--panel-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                status (mã thô)
              </div>
              <div className="text-lg font-mono font-bold text-foreground mt-1 tabular-nums">
                {latestSmokeReading?.rawStatus !== null && latestSmokeReading?.rawStatus !== undefined
                  ? latestSmokeReading.rawStatus
                  : '—'}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Mã trạng thái số nguyên chưa phân giải
              </div>
            </div>

            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--panel-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                state (mã thô)
              </div>
              <div className="text-lg font-mono font-bold text-foreground mt-1 tabular-nums">
                {latestSmokeReading?.rawState !== null && latestSmokeReading?.rawState !== undefined
                  ? latestSmokeReading.rawState
                  : '—'}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Mã trạng thái vận hành chưa phân giải
              </div>
            </div>
          </div>

          {/* Per §7.4: No trend chart for Smoke codes. Only neutral cards and history table */}

          {/* Technical Disclosure */}
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setIsDisclosureOpen(!isDisclosureOpen)}
              className="w-full px-4 py-2.5 text-xs font-semibold flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--panel-elevated)' }}
              aria-expanded={isDisclosureOpen}
            >
              <span>Thông tin kỹ thuật &amp; metadata</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${isDisclosureOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDisclosureOpen && (
              <div
                className="p-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs"
                style={{
                  backgroundColor: 'var(--panel-bg)',
                  borderColor: 'var(--border)',
                }}
              >
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Tên thiết bị trong mạng</div>
                  <div className="font-mono text-foreground mt-0.5 truncate">
                    {latestSmokeReading?.networkDeviceName || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Application ID</div>
                  <div className="font-mono text-foreground mt-0.5 truncate">
                    {latestSmokeReading?.applicationId || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">dev_eui</div>
                  <div className="font-mono text-foreground mt-0.5 truncate">
                    {data.deviceId}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bounded Local History Table */}
          <div
            className="rounded-lg border overflow-hidden flex flex-col"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between flex-wrap gap-2 text-xs"
              style={{ backgroundColor: 'var(--panel-elevated)', borderColor: 'var(--border)' }}
            >
              <h5 className="font-semibold text-foreground">Bản tin đã tải</h5>
              <div className="text-muted-foreground text-[11px]">
                Trang {safePage} / {totalPages} ({paginatedSmokeRows.length} / {totalRows} bản tin)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr
                    className="border-b text-[10px] uppercase text-muted-foreground font-semibold"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                  >
                    <th className="px-3 py-2 whitespace-nowrap">Thời điểm ghi nhận</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">status (mã thô)</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">state (mã thô)</th>
                    <th className="px-3 py-2 whitespace-nowrap">Gateway</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">RSSI</th>
                    <th className="px-3 py-2 whitespace-nowrap text-right">SNR</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono tabular-nums text-[11px]" style={{ borderColor: 'var(--border)' }}>
                  {paginatedSmokeRows.length > 0 ? (
                    paginatedSmokeRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-[rgba(255,255,255,0.03)] transition-colors h-10"
                      >
                        <td className="px-3 py-2 text-foreground whitespace-nowrap">
                          {formatDate(row.timestamp)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.rawStatus !== null && row.rawStatus !== undefined ? row.rawStatus : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.rawState !== null && row.rawState !== undefined ? row.rawState : '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">
                          {row.gatewayId || '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.rssi !== null && row.rssi !== undefined ? `${row.rssi} dBm` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.snr !== null && row.snr !== undefined ? `${row.snr} dB` : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                        Không có bản tin nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div
                className="px-4 py-2 border-t flex items-center justify-between text-xs"
                style={{ backgroundColor: 'var(--panel-elevated)', borderColor: 'var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-2.5 py-1 rounded border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Trang trước
                </button>
                <span className="text-[11px] text-muted-foreground">
                  Trang {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1 rounded border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
