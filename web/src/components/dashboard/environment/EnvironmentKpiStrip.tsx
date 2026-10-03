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
  const co2Summary = summary?.metrics?.co2;
  const hasCo2Data = isSummaryReady && co2Summary && typeof co2Summary.mean === 'number';

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

      {/* Slot 2: CO2 trung bình (Derived từ SB latest samples, ppm) */}
      <div
        role="article"
        aria-label={`CO2 trung bình: ${hasCo2Data && co2Summary?.mean != null ? `${formatVal(co2Summary.mean)} ppm (Derived)` : 'Chưa có dữ liệu nguồn SB'}`}
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
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium border shrink-0 ${
              hasCo2Data
                ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'
                : 'bg-white/5 text-[#7E8B96] border-white/10'
            }`}
          >
            {hasCo2Data ? 'Derived' : 'Unavailable'}
          </span>
        </div>
        <div className="my-1.5 flex items-baseline gap-1.5">
          {hasCo2Data && co2Summary?.mean != null ? (
            <>
              <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
                {formatVal(co2Summary.mean)}
              </span>
              <span className="text-xs font-medium text-[#A5B0B9]">ppm</span>
            </>
          ) : (
            <span className="text-2xl font-light font-mono text-[#7E8B96]">—</span>
          )}
        </div>
        <div
          className="text-[11px] text-[#A5B0B9] truncate"
          title={
            hasCo2Data && co2Summary
              ? `${co2Summary.contributingSourceCount} nguồn SB · Giả định ppm tiêu chuẩn`
              : 'Chưa có mẫu nguồn SB'
          }
        >
          {hasCo2Data && co2Summary
            ? `${co2Summary.contributingSourceCount} nguồn SB · Cao nhất: ${formatVal(co2Summary.max)} ppm`
            : 'Chưa có mẫu nguồn SB'}
        </div>
      </div>

      {/* Slot 3: Nhiệt độ trung bình (Derived Solar, °C) */}
      <div
        role="article"
        aria-label={`Nhiệt độ trung bình: ${isSummaryReady && tempSummary?.mean != null ? `${formatVal(tempSummary.mean)} °C` : 'Chưa có dữ liệu'}`}
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Nhiệt độ trung bình
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-medium border border-[var(--primary)]/30 shrink-0">
            Derived
          </span>
        </div>
        <div className="my-1.5 flex items-baseline gap-1.5">
          {isSummaryReady && tempSummary?.mean != null ? (
            <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {formatVal(tempSummary.mean)} °C
            </span>
          ) : (
            <span className="text-2xl font-light font-mono text-[#7E8B96]">
              —
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#A5B0B9] truncate" title="Nguồn Solar · Hợp đồng kỹ thuật §3.6">
          {isSummaryReady && tempSummary?.contributingSourceCount
            ? `${tempSummary.contributingSourceCount} nguồn Solar · Mẫu mới nhất`
            : 'Chưa có dữ liệu'}
        </div>
      </div>

      {/* Slot 4: Độ ẩm trung bình (Derived Solar, %) */}
      <div
        role="article"
        aria-label={`Độ ẩm trung bình: ${isSummaryReady && humidSummary?.mean != null ? `${formatVal(humidSummary.mean)} %` : 'Chưa có dữ liệu'}`}
        className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[136px]"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
            Độ ẩm trung bình
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-medium border border-[var(--primary)]/30 shrink-0">
            Derived
          </span>
        </div>
        <div className="my-1.5 flex items-baseline gap-1.5">
          {isSummaryReady && humidSummary?.mean != null ? (
            <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {formatVal(humidSummary.mean)} %
            </span>
          ) : (
            <span className="text-2xl font-light font-mono text-[#7E8B96]">
              —
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#A5B0B9] truncate" title="Nguồn Solar · Hợp đồng kỹ thuật §3.6">
          {isSummaryReady && humidSummary?.contributingSourceCount
            ? `${humidSummary.contributingSourceCount} nguồn Solar · Mẫu mới nhất`
            : 'Chưa có dữ liệu'}
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
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/10 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0">
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
