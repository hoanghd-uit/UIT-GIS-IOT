'use client';

import React from 'react';
import { OverviewTimeRangePreset, OverviewEnergySummary } from '@/types/dashboard-overview';

export interface OverviewKpiStripProps {
  activePreset: OverviewTimeRangePreset;
  energySummary: OverviewEnergySummary;
  co2Kpis: {
    averageCo2: number;
    roomsOverWarningThreshold: number;
    warningThreshold: number;
    fixtureId: string;
  };
  openAlertsKpi: {
    openCount: number;
    dangerCount: number;
    warningCount: number;
    fixtureId: string;
  };
  catalogueCount: number | null;
  catalogueStatus: 'idle' | 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';
}

export function OverviewKpiStrip({
  activePreset,
  energySummary,
  co2Kpis,
  openAlertsKpi,
  catalogueCount,
  catalogueStatus,
}: OverviewKpiStripProps) {
  const energyLabelMap: Record<OverviewTimeRangePreset, string> = {
    today: 'Điện hôm nay',
    '7d': 'Điện 7 ngày',
    '30d': 'Điện 30 ngày',
  };

  return (
    <section aria-label="Sáu chỉ số KPI tổng quan vận hành" className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full">
        {/* Slot 1: Điện năng (Demo) */}
        <div
          role="article"
          aria-label={`${energyLabelMap[activePreset]}: ${energySummary.totalKwh.toLocaleString('vi-VN')} kWh (Demo)`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              {energyLabelMap[activePreset]}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title="Chế độ dữ liệu Demo · Fixture page01-overview-demo-v1"
            >
              Demo
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {energySummary.totalKwh.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-medium text-[#A5B0B9]">kWh</span>
          </div>
          <div
            className="text-[11px] text-[#A5B0B9] truncate"
            title={`Baseline: ${energySummary.baselineTotalKwh.toLocaleString('vi-VN')} kWh · Lệch: ${
              energySummary.differenceKwh >= 0 ? '+' : ''
            }${energySummary.differenceKwh.toLocaleString('vi-VN')} kWh`}
          >
            Mô phỏng phụ tải Tòa E
          </div>
        </div>

        {/* Slot 2: Nước hôm nay (Unavailable) */}
        <div
          role="article"
          aria-label="Nước hôm nay: Chưa khả dụng do chờ chuẩn hóa semantics reset/rollover AVC"
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              Nước hôm nay
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#7E8B96] font-medium border border-white/10 shrink-0"
              title="Chưa khả dụng: Semantics reset/rollover công tơ AVC chưa được chuẩn hóa"
            >
              Unavailable
            </span>
          </div>
          <div className="my-1.5 flex items-baseline">
            <span className="text-2xl sm:text-3xl font-light font-mono text-[#7E8B96]">
              —
            </span>
          </div>
          <div
            className="text-[11px] text-[#7E8B96] truncate"
            title="Chờ xác nhận semantics reset/rollover công tơ AVC từ hệ thống cấp nước"
          >
            Chờ xác nhận rollover AVC
          </div>
        </div>

        {/* Slot 3: CO2 trung bình (Demo) */}
        <div
          role="article"
          aria-label={`CO2 trung bình: ${co2Kpis.averageCo2.toLocaleString('vi-VN')} ppm (Demo)`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              CO₂ trung bình
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title={`Chế độ dữ liệu Demo · Fixture ${co2Kpis.fixtureId}`}
            >
              Demo
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {co2Kpis.averageCo2.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-medium text-[#A5B0B9]">ppm</span>
          </div>
          <div
            className="text-[11px] text-[#A5B0B9] truncate"
            title="Trung bình mẫu 10 phòng · Ngưỡng an toàn ≤ 800 ppm"
          >
            Mức an toàn: ≤ 800 ppm
          </div>
        </div>

        {/* Slot 4: Phòng vượt ngưỡng CO2 (Demo) */}
        <div
          role="article"
          aria-label={`Phòng vượt ngưỡng CO2: ${co2Kpis.roomsOverWarningThreshold} phòng (Demo)`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              Vượt ngưỡng CO₂
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title={`Chế độ dữ liệu Demo · Fixture ${co2Kpis.fixtureId}`}
            >
              Demo
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E4BF55]">
              {co2Kpis.roomsOverWarningThreshold}
            </span>
            <span className="text-xs font-medium text-[#A5B0B9]">phòng</span>
          </div>
          <div
            className="text-[11px] text-[#A5B0B9] truncate"
            title="Phòng E6.2 đạt 1.100 ppm (> 1.000 ppm ngưỡng cảnh báo)"
          >
            E6.2: 1.100 ppm (&gt; 1.000)
          </div>
        </div>

        {/* Slot 5: Cảnh báo đang mở (Demo) */}
        <div
          role="article"
          aria-label={`Cảnh báo đang mở: ${openAlertsKpi.openCount} sự vụ (Demo)`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              Cảnh báo đang mở
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title={`Chế độ dữ liệu Demo · Fixture ${openAlertsKpi.fixtureId}`}
            >
              Demo
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {openAlertsKpi.openCount}
            </span>
            <span className="text-xs font-medium text-[#A5B0B9]">sự vụ</span>
          </div>
          <div
            className="text-[11px] text-[#A5B0B9] truncate"
            title={`${openAlertsKpi.dangerCount} Nguy hiểm, ${openAlertsKpi.warningCount} Cảnh báo · Không gắn badge sidebar`}
          >
            <span className="text-[#FF2121]">{openAlertsKpi.dangerCount} khẩn cấp</span> ·{' '}
            <span className="text-[#E4BF55]">{openAlertsKpi.warningCount} cảnh báo</span>
          </div>
        </div>

        {/* Slot 6: Thiết bị trong danh mục (Live Catalogue) */}
        <div
          role="article"
          aria-label={`Thiết bị trong danh mục IoT: ${
            catalogueCount !== null ? catalogueCount : 'Chưa tải'
          } thiết bị (Live)`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              Thiết bị danh mục
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#4FB9AD]/15 text-[#4FB9AD] font-medium border border-[#4FB9AD]/30 shrink-0"
              title="Dữ liệu Live từ cùng origin API IoT backend"
            >
              Live
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            {catalogueStatus === 'loading' ? (
              <span className="text-2xl sm:text-3xl font-light font-mono text-[#7E8B96] animate-pulse">
                ...
              </span>
            ) : catalogueCount !== null ? (
              <>
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
                  {catalogueCount}
                </span>
                <span className="text-xs font-medium text-[#A5B0B9]">thiết bị</span>
              </>
            ) : (
              <span className="text-2xl sm:text-3xl font-light font-mono text-[#7E8B96]">
                —
              </span>
            )}
          </div>
          <div
            className="text-[11px] text-[#A5B0B9] truncate"
            title="Danh mục ghi nhận trong API IoT backend. Không phản ánh trực tuyến/ngoại tuyến thời gian thực."
          >
            Danh mục API · Không đo heartbeat
          </div>
        </div>
      </div>
    </section>
  );
}
