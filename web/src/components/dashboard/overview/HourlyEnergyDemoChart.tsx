'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OverviewEnergySummary, OverviewTimeRangePreset } from '@/types/dashboard-overview';
import { OVERVIEW_DEMO_FIXTURE_ID } from '@/lib/dashboard/overview-demo-fixtures';

export interface HourlyEnergyDemoChartProps {
  energySummary: OverviewEnergySummary;
  activePreset: OverviewTimeRangePreset;
  className?: string;
}

export function HourlyEnergyDemoChart({
  energySummary,
  activePreset,
  className = '',
}: HourlyEnergyDemoChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const titleMap: Record<OverviewTimeRangePreset, string> = {
    today: 'Điện năng theo giờ',
    '7d': 'Điện năng 7 ngày qua',
    '30d': 'Điện năng 30 ngày qua',
  };

  const maxVal = Math.max(
    ...energySummary.series.map((s) => Math.max(s.value, s.baseline || 0)),
    50,
  );

  return (
    <div
      className={`flex flex-col justify-between p-4 sm:p-5 rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
      aria-label="Biểu đồ điện năng tiêu thụ"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(83,109,126,0.18)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#E6EDF1]">
              {titleMap[activePreset]}
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title={`Chế độ dữ liệu Demo · Fixture ${OVERVIEW_DEMO_FIXTURE_ID}`}
            >
              Demo
            </span>
          </div>
          {/* <p className="text-xs text-[#7E8B96] mt-0.5">
            Mô phỏng phụ tải Tòa E so với đường cơ sở (Baseline)
          </p> */}
        </div>

        {/* View Switcher: Chart vs Table */}
        <div className="inline-flex items-center p-0.5 rounded-lg border bg-[#111922] border-[rgba(83,109,126,0.25)] text-xs">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-2 py-1 rounded transition-colors ${viewMode === 'chart'
              ? 'bg-[#1C2B39] text-[#E6EDF1] font-semibold'
              : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
              }`}
            aria-pressed={viewMode === 'chart'}
          >
            Đồ thị
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2 py-1 rounded transition-colors ${viewMode === 'table'
              ? 'bg-[#1C2B39] text-[#E6EDF1] font-semibold'
              : 'text-[#A5B0B9] hover:text-[#E6EDF1]'
              }`}
            aria-pressed={viewMode === 'table'}
          >
            Bảng
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.15)] my-2 text-xs">
        <div>
          <span className="text-[#7E8B96]">Tổng tiêu thụ:</span>{' '}
          <span className="font-mono font-bold text-[#E6EDF1]">
            {energySummary.totalKwh.toLocaleString('vi-VN')} kWh
          </span>
        </div>
        <div>
          <span className="text-[#7E8B96]">Đỉnh:</span>{' '}
          <span className="font-mono font-bold text-[#4FB9AD]">
            {energySummary.peakKwh.toLocaleString('vi-VN')} kWh
          </span>{' '}
          <span className="text-[#7E8B96] font-mono text-[10px]">
            ({energySummary.peakHourOrDay})
          </span>
        </div>
        <div className="hidden sm:block">
          <span className="text-[#7E8B96]">Baseline:</span>{' '}
          <span className="font-mono text-[#A5B0B9]">
            {energySummary.baselineTotalKwh.toLocaleString('vi-VN')} kWh
          </span>
        </div>
      </div>

      {/* Main View: Chart or Table */}
      <div className="my-2 flex-1 min-h-[140px] flex flex-col justify-center">
        {viewMode === 'chart' ? (
          /* SVG/Bar Visualization */
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-end justify-between gap-1 h-28 px-1 pt-3 pb-1 border-b border-[rgba(83,109,126,0.2)]">
              {energySummary.series.map((item, idx) => {
                const heightPercent = Math.max(8, (item.value / maxVal) * 100);
                const baselinePercent = Math.max(8, ((item.baseline || 0) / maxVal) * 100);
                const isPeak = item.value === energySummary.peakKwh;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Baseline indicator mark */}
                    <div
                      className="absolute w-full border-t-2 border-[#7E8B96]/40 border-dotted pointer-events-none"
                      style={{ bottom: `${baselinePercent}%` }}
                    />
                    {/* Main Bar */}
                    <div
                      className={`w-full rounded-t transition-all ${isPeak ? 'bg-[#4FB9AD]' : 'bg-[#4FB9AD]/70 group-hover:bg-[#4FB9AD]'
                        }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="bg-[#1C2B39] text-[#E6EDF1] text-[10px] font-mono px-2 py-1 rounded shadow-lg border border-[rgba(83,109,126,0.3)] whitespace-nowrap">
                        <div className="font-bold">{item.timestamp}</div>
                        <div>Thực tế: {item.value} kWh</div>
                        <div className="text-[#A5B0B9]">Baseline: {item.baseline} kWh</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Axis labels */}
            <div className="flex justify-between text-[10px] text-[#7E8B96] px-1 font-mono">
              <span>{energySummary.series[0]?.timestamp}</span>
              <span>
                {energySummary.series[Math.floor(energySummary.series.length / 2)]?.timestamp}
              </span>
              <span>
                {energySummary.series[energySummary.series.length - 1]?.timestamp}
              </span>
            </div>
          </div>
        ) : (
          /* Accessible Table Alternative */
          <div className="overflow-y-auto max-h-[140px] border border-[rgba(83,109,126,0.2)] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#111922] text-[#A5B0B9] text-[10px] uppercase border-b border-[rgba(83,109,126,0.2)] sticky top-0">
                <tr>
                  <th className="px-2.5 py-1.5">Mốc thời gian</th>
                  <th className="px-2.5 py-1.5">Tiêu thụ (kWh)</th>
                  <th className="px-2.5 py-1.5">Baseline (kWh)</th>
                  <th className="px-2.5 py-1.5">Chênh lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(83,109,126,0.12)]">
                {energySummary.series.map((item, idx) => {
                  const diff = Math.round((item.value - item.baseline) * 10) / 10;
                  return (
                    <tr key={idx} className="hover:bg-white/5 font-mono text-[11px]">
                      <td className="px-2.5 py-1 text-[#E6EDF1]">{item.timestamp}</td>
                      <td className="px-2.5 py-1 text-[#4FB9AD] font-semibold">{item.value}</td>
                      <td className="px-2.5 py-1 text-[#A5B0B9]">{item.baseline}</td>
                      <td
                        className={`px-2.5 py-1 ${diff > 0 ? 'text-[#FFB121]' : diff < 0 ? 'text-[#4FB9AD]' : 'text-[#7E8B96]'
                          }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="pt-3 border-t border-[rgba(83,109,126,0.18)] flex items-center justify-between text-xs">
        <Link
          href="/dashboard/energy-water"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4FB9AD] hover:underline"
        >
          <span>Xem trang Năng lượng &amp; Nước</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        <span className="text-[11px] text-[#7E8B96]">
          Page 02
        </span>
      </div>
    </div>
  );
}
