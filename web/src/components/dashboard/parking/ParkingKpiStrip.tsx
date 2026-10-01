'use client';

import React from 'react';
import { ParkingKpiStripData, ParkingTimeRangePreset } from '@/types/dashboard-parking';
import { PARKING_DEMO_FIXTURE_ID } from '@/lib/dashboard/parking-demo-fixtures';

export interface ParkingKpiStripProps {
  kpis: ParkingKpiStripData;
  activePreset: ParkingTimeRangePreset;
}

export function ParkingKpiStrip({ kpis, activePreset }: ParkingKpiStripProps) {
  const { carSummary, motorcycleSummary, entriesSummary, durationSummary, cameraSummary } = kpis;

  const rangeTitleMap: Record<ParkingTimeRangePreset, string> = {
    today: 'Hôm nay',
    '7d': '7 ngày qua',
    '30d': '30 ngày qua',
  };

  return (
    <section
      aria-label="Chỉ số hoạt động bãi xe mô phỏng"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full"
    >
      {/* 1. Car Slot Occupancy */}
      <div
        className="p-4 rounded-xl border flex flex-col justify-between"
        style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Vị trí ô tô (B1)
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
            title={`Chế độ Demo · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
          >
            Demo
          </span>
        </div>
        <div className="my-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
            {carSummary.occupiedCount}/{carSummary.totalSlots}
          </span>
          <span className="text-xs font-mono text-[#A5B0B9]">
            ({carSummary.occupancyRatePercent}%)
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate">
          Còn {carSummary.freeCount} chỗ ({carSummary.evSlotsTotal} trạm sạc EV)
        </div>
      </div>

      {/* 2. Motorcycle Zone Density */}
      <div
        className="p-4 rounded-xl border flex flex-col justify-between"
        style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Mật độ xe máy TB
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
            title={`Chế độ Demo · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
          >
            Demo
          </span>
        </div>
        <div className="my-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
            {motorcycleSummary.averageDensityPercent}%
          </span>
          <span className="text-xs font-medium text-[#FFB121]">
            Ước tính
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title={motorcycleSummary.highestDensityZone.label}>
          Đỉnh: {motorcycleSummary.highestDensityZone.label.split('·')[0].trim()} ({motorcycleSummary.highestDensityPercent}%)
        </div>
      </div>

      {/* 3. Vehicle Entries */}
      <div
        className="p-4 rounded-xl border flex flex-col justify-between"
        style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Lượt xe vào ({rangeTitleMap[activePreset]})
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
            title={`Chế độ Demo · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
          >
            Demo
          </span>
        </div>
        <div className="my-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
            {entriesSummary.totalEntries.toLocaleString('vi-VN')}
          </span>
          <span className="text-xs text-[#A5B0B9]">lượt</span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate">
          Cao điểm: {entriesSummary.peakHourOrLabel} ({entriesSummary.peakCount} xe)
        </div>
      </div>

      {/* 4. Average Parking Duration (Fixture backed) */}
      <div
        className="p-4 rounded-xl border flex flex-col justify-between"
        style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Thời gian đỗ TB
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
            title={`Chế độ Demo · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
          >
            Demo
          </span>
        </div>
        <div className="my-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
            {durationSummary.formatted}
          </span>
          <span className="text-xs text-[#A5B0B9]">mô phỏng</span>
        </div>
        {/* <div className="text-[11px] text-[#7E8B96] truncate">
          Mẫu {durationSummary.sampleSessionsCount} phiên đỗ giả lập
        </div> */}
      </div>

      {/* 5. Demo Cameras */}
      <div
        className="p-4 rounded-xl border flex flex-col justify-between"
        style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Camera mô phỏng
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
            title={`Chế độ Demo · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
          >
            Demo
          </span>
        </div>
        <div className="my-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
            {cameraSummary.totalCount} / {cameraSummary.totalCount}
          </span>
          <span className="text-xs text-[#4FB9AD]">vị trí</span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate">
          {cameraSummary.activeCount} hoạt động, {cameraSummary.inspectionCount} cần kiểm tra
        </div>
      </div>
    </section>
  );
}
