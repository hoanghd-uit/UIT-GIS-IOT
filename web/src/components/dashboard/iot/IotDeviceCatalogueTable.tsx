'use client';

import React, { useState } from 'react';
import { DashboardDeviceCatalogueItem } from '@/types/dashboard-iot';

export interface SelectedTelemetrySummary {
  rssi?: number | null;
  snr?: number | null;
  latestTimestamp?: string | null;
}

export interface IotDeviceCatalogueTableProps {
  devices: DashboardDeviceCatalogueItem[];
  selectedDeviceId?: string | null;
  selectedTelemetrySummary?: SelectedTelemetrySummary | null;
  onSelectDevice?: (device: DashboardDeviceCatalogueItem) => void;
}

function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function formatTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '—';
  }
}

export function IotDeviceCatalogueTable({
  devices,
  selectedDeviceId,
  selectedTelemetrySummary,
  onSelectDevice,
}: IotDeviceCatalogueTableProps) {
  // Expansion state for technical metadata disclosure per row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div
      className="w-full overflow-x-auto rounded-xl border"
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr
            className="border-b"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <th scope="col" className="py-3 px-3.5 font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Mã thiết bị
            </th>
            <th scope="col" className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Loại
            </th>
            <th scope="col" className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Vị trí
            </th>
            <th scope="col" className="py-3 px-2.5 font-semibold text-[11px] uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>
              RSSI
            </th>
            <th scope="col" className="py-3 px-2.5 font-semibold text-[11px] uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>
              SNR
            </th>
            <th scope="col" className="py-3 px-2.5 font-semibold text-[11px] uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
              Pin
            </th>
            <th scope="col" className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
              Lần cuối
            </th>
            <th scope="col" className="py-3 px-2.5 font-semibold text-[11px] uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
              Firmware
            </th>
            <th scope="col" className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
              Trạng thái
            </th>
            <th scope="col" className="py-3 px-2.5 font-semibold text-[11px] uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
              Thao tác
            </th>
            <th scope="col" className="py-3 px-2 font-semibold text-[11px] uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
              Chi tiết
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: 'rgba(83, 109, 126, 0.16)' }}>
          {devices.map((device) => {
            const isSelected = selectedDeviceId === device.externalDeviceId;
            const isExpanded = expandedId === device.externalDeviceId;
            const isFallback = device.floorAssignment === 'development-fallback';

            // Show telemetry radio stats only for the actively selected device if available
            const hasLiveTelemetry = isSelected && selectedTelemetrySummary;
            const rssiVal = hasLiveTelemetry && selectedTelemetrySummary.rssi != null ? `${selectedTelemetrySummary.rssi} dBm` : '—';
            const snrVal = hasLiveTelemetry && selectedTelemetrySummary.snr != null ? `${selectedTelemetrySummary.snr}` : '—';
            const lastTimeVal = hasLiveTelemetry && selectedTelemetrySummary.latestTimestamp ? formatTime(selectedTelemetrySummary.latestTimestamp) : '—';

            return (
              <React.Fragment key={device.externalDeviceId}>
                <tr
                  onClick={() => onSelectDevice?.(device)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectDevice?.(device);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Thiết bị ${device.externalDeviceId}, loại ${device.sourceDeviceType}`}
                  className={`transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[rgba(79,185,173,0.1)] ring-1 ring-[rgba(79,185,173,0.35)]'
                      : 'hover:bg-[rgba(255,255,255,0.03)]'
                  }`}
                >
                  {/* Mã thiết bị */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-mono text-xs font-semibold text-[#E6EDF1] hover:underline"
                        title={device.externalDeviceId}
                      >
                        {device.externalDeviceId}
                      </span>
                    </div>
                  </td>

                  {/* Loại */}
                  <td className="py-3 px-3">
                    <span className="font-medium text-[#E6EDF1] uppercase text-xs">
                      {device.sourceDeviceType}
                    </span>
                  </td>

                  {/* Vị trí */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#E6EDF1]">
                        {device.sourceLocation.floorLevel != null ? `Tầng ${device.sourceLocation.floorLevel}` : `Tầng ${device.displayFloorId}`}
                      </span>
                      {isFallback && (
                        <span
                          className="text-[10px] px-1 py-0.2 rounded font-mono text-[#E4BF55] bg-[rgba(228,191,85,0.12)] border border-[rgba(228,191,85,0.25)]"
                          title="Áp dụng dữ liệu development fallback từ tầng 0"
                        >
                          FB
                        </span>
                      )}
                    </div>
                  </td>

                  {/* RSSI */}
                  <td className="py-3 px-2.5 text-right font-mono text-xs">
                    <span
                      style={{
                        color: hasLiveTelemetry && selectedTelemetrySummary.rssi != null
                          ? selectedTelemetrySummary.rssi < -110 ? 'var(--warning)' : 'var(--text-primary)'
                          : 'var(--text-muted)'
                      }}
                      title={hasLiveTelemetry ? `RSSI từ telemetry: ${rssiVal}` : 'Chỉ khả dụng khi chọn thiết bị để nạp telemetry'}
                    >
                      {rssiVal}
                    </span>
                  </td>

                  {/* SNR */}
                  <td className="py-3 px-2.5 text-right font-mono text-xs">
                    <span
                      style={{
                        color: hasLiveTelemetry && selectedTelemetrySummary.snr != null
                          ? 'var(--text-primary)'
                          : 'var(--text-muted)'
                      }}
                      title={hasLiveTelemetry ? `SNR từ telemetry: ${snrVal}` : 'Chỉ khả dụng khi chọn thiết bị để nạp telemetry'}
                    >
                      {snrVal}
                    </span>
                  </td>

                  {/* Pin (Chưa có standardized percentage) */}
                  <td className="py-3 px-2.5 text-center font-mono text-xs text-[#7E8B96]">
                    <span title="Chưa có dữ liệu pin chuẩn hóa cho danh mục">
                      —
                    </span>
                  </td>

                  {/* Lần cuối */}
                  <td className="py-3 px-3 text-center font-mono text-xs text-[#A5B0B9]">
                    <span title={hasLiveTelemetry ? `Mẫu đo mới nhất: ${selectedTelemetrySummary.latestTimestamp}` : 'Chỉ hiển thị khi nạp telemetry'}>
                      {lastTimeVal}
                    </span>
                  </td>

                  {/* Firmware (Chưa có) */}
                  <td className="py-3 px-2.5 text-center font-mono text-xs text-[#7E8B96]">
                    <span title="Chưa có dữ liệu firmware trong hệ thống">
                      —
                    </span>
                  </td>

                  {/* Trạng thái danh mục (Strictly catalogue activity, NOT online/offline) */}
                  <td className="py-3 px-3 text-center">
                    {device.active ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                        style={{
                          backgroundColor: 'rgba(67, 192, 172, 0.12)',
                          color: 'var(--success)',
                          border: '1px solid rgba(67, 192, 172, 0.25)',
                        }}
                        title="Thiết bị được ghi nhận đang hoạt động trong danh mục IoT. Không phản ánh tình trạng kết nối mạng thời gian thực."
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
                        Đang hoạt động trong danh mục
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}
                        title="Thiết bị ngừng hoạt động trong danh mục IoT."
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                        Ngừng hoạt động trong danh mục
                      </span>
                    )}
                  </td>

                  {/* Thao tác: Xem telemetry */}
                  <td className="py-3 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onSelectDevice?.(device)}
                      className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                      style={{
                        backgroundColor: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                      }}
                      aria-label={`Xem telemetry của thiết bị ${device.externalDeviceId}`}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? 'Đang xem' : 'Xem telemetry'}
                    </button>
                  </td>

                  {/* Chi tiết kĩ thuật Toggle */}
                  <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : device.externalDeviceId)}
                      className="p-1 rounded text-xs text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5 transition-colors"
                      title={isExpanded ? 'Ẩn thông số kĩ thuật nguồn' : 'Xem thông số tọa độ và thời gian nguồn'}
                      aria-expanded={isExpanded}
                      aria-label={`Chi tiết kĩ thuật thiết bị ${device.externalDeviceId}`}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Expanded Technical Details Row */}
                {isExpanded && (
                  <tr className="bg-[rgba(23,34,44,0.6)] text-xs">
                    <td colSpan={11} className="py-3 px-4 border-b border-[rgba(83,109,126,0.2)]">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <span className="text-[#7E8B96]">Tọa độ nguồn (X, Y, Z): </span>
                          <span className="font-mono text-[#E6EDF1]">
                            [{device.sourceLocation.x}, {device.sourceLocation.y}, {device.sourceLocation.z}]
                          </span>
                        </div>
                        <div>
                          <span className="text-[#7E8B96]">Ngày tạo nguồn: </span>
                          <span className="font-mono text-[#E6EDF1]">{formatDate(device.sourceCreatedAt)}</span>
                        </div>
                        <div>
                          <span className="text-[#7E8B96]">Cập nhật metadata nguồn: </span>
                          <span className="font-mono text-[#E6EDF1]">{formatDate(device.sourceUpdatedAt)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

