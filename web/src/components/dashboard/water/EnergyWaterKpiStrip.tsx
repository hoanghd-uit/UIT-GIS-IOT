'use client';

import React from 'react';
import { DashboardWaterLatestSample } from '@/types/dashboard-water';

export interface EnergyWaterKpiStripProps {
  selectedMeterId: string | null;
  latestSample: DashboardWaterLatestSample | null;
  readingStatus: 'idle' | 'loading' | 'refreshing' | 'ready' | 'empty' | 'unavailable' | 'error';
}

export function EnergyWaterKpiStrip({
  selectedMeterId,
  latestSample,
  readingStatus,
}: EnergyWaterKpiStripProps) {
  const hasMeter = selectedMeterId !== null;
  const isReadingReady = readingStatus === 'ready' || readingStatus === 'refreshing';

  // Format numbers cleanly
  const formatVal = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '—';
    // Preserve valid zero (0)
    return num.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full">
      {/* Slot 1: Điện năng hôm nay (Unavailable) */}
      <div
        role="article"
        aria-label="Điện năng hôm nay: Chưa có nguồn smart-meter"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          Điện năng hôm nay
        </span>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title="Energy demo được triển khai ở phase riêng">
          Unavailable
        </div>
      </div>

      {/* Slot 2: Điện 30 ngày (Unavailable) */}
      <div
        role="article"
        aria-label="Điện 30 ngày: Chưa có nguồn smart-meter"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          Điện 30 ngày
        </span>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title="Chưa có nguồn smart-meter">
          Unavailable
        </div>
      </div>

      {/* Slot 3: Phụ tải nền ban đêm (Unavailable) */}
      <div
        role="article"
        aria-label="Phụ tải nền ban đêm: Mục tiêu <= 30 kW"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E4BF55]" aria-hidden="true" />
          <span>Phụ tải nền ban đêm</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFB121]/15 text-[#FFB121] border border-[#FFB121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB121]" />
            Demo
          </span>
        </div>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#E4BF55] truncate" title="Mục tiêu ≤ 30 kW">
          Mục tiêu ≤ 30 kW
        </div>
      </div>

      {/* Slot 4: Lưu lượng tức thời (Live selected meter or aggregated total) */}
      <div
        role="article"
        aria-label={`Lưu lượng tức thời: ${isReadingReady && latestSample?.instantFlowM3h != null ? `${latestSample.instantFlowM3h} m3/h` : 'Chưa có dữ liệu'}`}
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9]">
          Lưu lượng nước tức thời
        </span>
        <div className="my-1.5 flex items-baseline gap-1.5">
          {isReadingReady && latestSample?.instantFlowM3h != null ? (
            <>
              <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
                {formatVal(latestSample.instantFlowM3h)}
              </span>
              <span className="text-xs font-medium text-[#A5B0B9]">m³/h</span>
            </>
          ) : (
            <span className="text-2xl font-light font-mono text-[#7E8B96]">
              —
            </span>
          )}
        </div>
        {/* <div
          className="text-[11px] text-[#7E8B96] truncate"
          title={
            hasMeter
              ? 'Đồng hồ AVC · chờ xác nhận phần cứng'
              : 'Tổng từ tất cả đồng hồ AVC'
          }
        >
          {hasMeter
            ? 'Đồng hồ AVC · chờ xác nhận phần cứng'
            : isReadingReady
              ? 'Tổng từ tất cả đồng hồ AVC'
              : 'Đang tải dữ liệu tổng...'}
        </div> */}
      </div>

      {/* Slot 5: Lưu lượng nước đêm*/}
      <div
        role="article"
        aria-label="Lưu lượng nước đêm: 0,90 m3/h, Mức nền 0,20 m³/h — nghi rò rỉ"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A5B0B9]">
          <span className="w-2 h-2 rounded-full bg-[#FFB121] shrink-0" aria-hidden="true" />
          <span>Lưu lượng nước đêm</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFB121]/15 text-[#FFB121] border border-[#FFB121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB121]" />
            Demo
          </span>
        </div>
        <div className="my-1.5 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
            0,90
          </span>
          <span className="text-xs font-medium text-[#A5B0B9]">m³/h</span>
        </div>
        <div
          className="text-[11px] font-medium text-[#E25822] truncate"
          title="Mức nền 0,20 m³/h — nghi rò rỉ"
        >
          Mức nền 0,20 m³/h — nghi rò rỉ
        </div>
      </div>

      {/* Slot 6: Mực bể chứa*/}
      <div
        role="article"
        aria-label="Mực bể chứa: 72 %, Bể mái · ~ 29 m³"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A5B0B9]">
          <span className="w-2 h-2 rounded-full bg-[#3182CE] shrink-0" aria-hidden="true" />
          <span>Mực bể chứa</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFB121]/15 text-[#FFB121] border border-[#FFB121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB121]" />
            Demo
          </span>
        </div>
        <div className="my-1.5 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
            72
          </span>
          <span className="text-xs font-medium text-[#A5B0B9]">%</span>
        </div>
        <div
          className="text-[11px] text-[#A5B0B9] truncate"
          title="Bể mái · ~ 29 m³"
        >
          Bể mái · ~ 29 m³
        </div>
      </div>
    </div>
  );
}
