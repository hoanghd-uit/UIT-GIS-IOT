'use client';

import React from 'react';

export interface IotKpiStripProps {
  totalDevicesCount: number | null;
  status: 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';
  typeBreakdownText?: string;
}

export function IotKpiStrip({
  totalDevicesCount,
  status,
  typeBreakdownText,
}: IotKpiStripProps) {
  const isReady = status === 'ready';
  const totalVal = status === 'empty' ? 0 : isReady && totalDevicesCount != null ? totalDevicesCount : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full">
      {/* KPI 1: Tổng thiết bị */}
      <div
        role="article"
        aria-label={`Tổng thiết bị: ${totalVal != null ? totalVal : 'Chưa có dữ liệu'}`}
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          Tổng thiết bị
        </span>
        <div className="my-1.5 flex items-baseline">
          {totalVal != null ? (
            <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {totalVal}
            </span>
          ) : (
            <span className="text-2xl font-light font-mono text-[#7E8B96]">
              —
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate">
          {isReady ? (typeBreakdownText || 'Danh mục toàn tòa nhà') : status === 'loading' ? 'Đang nạp dữ liệu...' : 'Danh mục thiết bị'}
        </div>
      </div>

      {/* KPI 2: Trực tuyến */}
      <div
        role="article"
        aria-label="Trực tuyến: Chưa có dữ liệu authoritative"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#43C0AC]" aria-hidden="true" />
          <span>Trực tuyến</span>
        </div>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title="Chờ xác nhận quy tắc online/offline">
          Chờ quy tắc online/offline
        </div>
      </div>

      {/* KPI 3: Nhận gói tin (24h) */}
      <div
        role="article"
        aria-label="Nhận gói tin 24h: Chưa có nguồn packet-rate"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FB9AD]" aria-hidden="true" />
          <span>Nhận gói tin (24h)</span>
        </div>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title="Chưa có nguồn packet-rate">
          Chưa có nguồn packet-rate
        </div>
      </div>

      {/* KPI 4: Gateway */}
      <div
        role="article"
        aria-label="Gateway: Chưa có inventory/health"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#43C0AC]" aria-hidden="true" />
          <span>Gateway</span>
        </div>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title="Chưa có inventory/health">
          Chưa có inventory/health
        </div>
      </div>

      {/* KPI 5: Pin yếu */}
      <div
        role="article"
        aria-label="Pin yếu: Chưa xác nhận dữ liệu pin"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E4BF55]" aria-hidden="true" />
          <span>Pin yếu</span>
        </div>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title="Chưa xác nhận dữ liệu pin">
          Chưa xác nhận dữ liệu pin
        </div>
      </div>

      {/* KPI 6: Tuổi thọ pin dự kiến */}
      <div
        role="article"
        aria-label="Tuổi thọ pin dự kiến: Chưa có mô hình dự báo"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          Tuổi thọ pin dự kiến
        </span>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title="Chưa có mô hình dự báo">
          Chưa có mô hình dự báo
        </div>
      </div>
    </div>
  );
}
