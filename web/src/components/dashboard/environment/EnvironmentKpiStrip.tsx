'use client';

import React from 'react';
import { DashboardEnvironmentSummaryResponse } from '@/types/dashboard-environment';
import { CO2_DEMO_FIXTURE } from '@/lib/dashboard/environment-demo-fixtures';

export interface EnvironmentKpiStripProps {
  summary: DashboardEnvironmentSummaryResponse | null;
  summaryStatus: 'idle' | 'loading' | 'ready' | 'partial' | 'empty' | 'unavailable' | 'error';
}

export function EnvironmentKpiStrip({
  summary,
  summaryStatus,
}: EnvironmentKpiStripProps) {
  const isSummaryReady = summaryStatus === 'ready' || summaryStatus === 'partial';

  const formatVal = (val: number | null | undefined, maxDigits = 1): string => {
    if (val === null || val === undefined) return '—';
    return val.toLocaleString('vi-VN', { maximumFractionDigits: maxDigits });
  };

  const tempSummary = summary?.metrics?.rawTemperature;
  const humidSummary = summary?.metrics?.rawHumidity;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full">
      {/* Slot 1: Chỉ số IAQ toàn nhà (Unavailable) */}
      <div
        role="article"
        aria-label="Chỉ số IAQ toàn nhà: Chưa có formula hoặc source đầy đủ"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Chỉ số IAQ toàn nhà
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#7E8B96] font-medium border border-white/10 shrink-0">
            Unavailable
          </span>
        </div>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title="Chưa có formula/source đầy đủ">
          Chưa có formula
        </div>
      </div>

      {/* Slot 2: CO2 trung bình (Demo) */}
      <div
        role="article"
        aria-label={`CO2 trung bình: ${CO2_DEMO_FIXTURE.kpis.averageCo2} ppm (Demo)`}
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
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF2121]/10 text-[#FF2121] font-medium border border-[#FF2121]/30 shrink-0">
            Demo
          </span>
        </div>
        <div className="my-1.5 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
            {CO2_DEMO_FIXTURE.kpis.averageCo2}
          </span>
          <span className="text-xs font-medium text-[#A5B0B9]">ppm</span>
        </div>
        <div className="text-[11px] text-[#A5B0B9] truncate" title="Fixture page03-co2-demo-v1">
          Cao nhất: {CO2_DEMO_FIXTURE.kpis.maxCo2} - phòng E6.6
        </div>
      </div>

      {/* Slot 3: Raw temperature · trung bình mẫu (Derived, NO unit) */}
      <div
        role="article"
        aria-label={`Raw temperature trung bình mẫu: ${isSummaryReady && tempSummary?.mean != null ? tempSummary.mean : 'Chưa có dữ liệu'}`}
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Raw temperature
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-medium border border-[var(--primary)]/30 shrink-0">
            Derived
          </span>
        </div>
        <div className="my-1.5 flex items-baseline gap-1.5">
          {isSummaryReady && tempSummary?.mean != null ? (
            <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {formatVal(tempSummary.mean)}
            </span>
          ) : (
            <span className="text-2xl font-light font-mono text-[#7E8B96]">
              —
            </span>
          )}
        </div>
      </div>

      {/* Slot 4: Raw humidity · trung bình mẫu (Derived, NO unit) */}
      <div
        role="article"
        aria-label={`Raw humidity trung bình mẫu: ${isSummaryReady && humidSummary?.mean != null ? humidSummary.mean : 'Chưa có dữ liệu'}`}
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Raw humidity
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-medium border border-[var(--primary)]/30 shrink-0">
            Derived
          </span>
        </div>
        <div className="my-1.5 flex items-baseline gap-1.5">
          {isSummaryReady && humidSummary?.mean != null ? (
            <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {formatVal(humidSummary.mean)}
            </span>
          ) : (
            <span className="text-2xl font-light font-mono text-[#7E8B96]">
              —
            </span>
          )}
        </div>
      </div>

      {/* Slot 5: VOC xu hướng (Demo) */}
      <div
        role="article"
        aria-label={`VOC xu hướng: ${CO2_DEMO_FIXTURE.kpis.vocIndex} mg/m3 (Demo)`}
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            VOC xu hướng
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF2121]/10 text-[#FF2121] font-medium border border-[#FF2121]/30 shrink-0">
            Demo
          </span>
        </div>
        <div className="my-1.5 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
            {CO2_DEMO_FIXTURE.kpis.vocIndex}
          </span>
          <span className="text-xs font-medium text-[#A5B0B9]">mg/m³</span>
        </div>
        <div className="text-[11px] text-[#A5B0B9] truncate" title="Fixture Demo · không sensor thật">
          {CO2_DEMO_FIXTURE.kpis.vocLabel} · Demo
        </div>
      </div>

      {/* Slot 6: PM2.5 (Unavailable) */}
      <div
        role="article"
        aria-label="PM2.5: Chưa có nguồn được phê duyệt"
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Bụi mịn PM2.5
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#7E8B96] font-medium border border-white/10 shrink-0">
            Unavailable
          </span>
        </div>
        <div className="my-1.5 flex items-baseline">
          <span className="text-2xl font-light font-mono text-[#7E8B96]">
            —
          </span>
        </div>
        <div className="text-[11px] text-[#7E8B96] truncate" title="Chưa có source được phê duyệt">
          Chưa có cảm biến
        </div>
      </div>
    </div>
  );
}
