'use client';

import React, { useState } from 'react';
import { ParkingEntriesSummary, ParkingTimeRangePreset } from '@/types/dashboard-parking';
import { PARKING_DEMO_FIXTURE_ID } from '@/lib/dashboard/parking-demo-fixtures';

export interface ParkingEntriesChartProps {
  entriesSummary: ParkingEntriesSummary;
  activePreset: ParkingTimeRangePreset;
  className?: string;
}

export function ParkingEntriesChart({
  entriesSummary,
  activePreset,
  className = '',
}: ParkingEntriesChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const titleMap: Record<ParkingTimeRangePreset, string> = {
    today: 'Lưu lượng xe vào theo giờ',
    '7d': 'Lưu lượng xe vào 7 ngày qua',
    '30d': 'Lưu lượng xe vào 30 ngày qua',
  };

  const { totalEntries, peakHourOrLabel, peakCount, series } = entriesSummary;
  const maxVal = Math.max(...series.map((s) => s.entryCount), 10);

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between gap-3 ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
      aria-label="Biểu đồ lưu lượng phương tiện vào bãi xe"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(83,109,126,0.18)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#E6EDF1]">
              {titleMap[activePreset]}
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title={`Kịch bản mô phỏng tĩnh · Fixture ${PARKING_DEMO_FIXTURE_ID}`}
            >
              Demo
            </span>
          </div>
          {/* <p className="text-xs text-[#7E8B96] mt-0.5">
            Mô phỏng lượt phương tiện vào cổng theo khung thời gian đã chọn
          </p> */}
        </div>

        {/* View Switcher: Đồ thị vs Bảng */}
        <div className="inline-flex items-center p-0.5 rounded-lg border bg-[#111922] border-[rgba(83,109,126,0.25)] text-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'chart'
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
            className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'table'
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
      <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.15)] text-xs">
        <div>
          <span className="text-[#7E8B96]">Tổng lượt vào:</span>{' '}
          <span className="font-mono font-bold text-[#E6EDF1]">
            {totalEntries.toLocaleString('vi-VN')}
          </span>{' '}
          <span className="text-[#A5B0B9]">lượt</span>
        </div>
        <div>
          <span className="text-[#7E8B96]">Đỉnh:</span>{' '}
          <span className="font-mono font-bold text-[#4FB9AD]">
            {peakCount} lượt
          </span>{' '}
          <span className="text-[#7E8B96] font-mono text-[11px]">
            ({peakHourOrLabel})
          </span>
        </div>
      </div>

      {/* Main Content: Chart or Table */}
      <div className="my-1 flex-1 min-h-[140px] flex flex-col justify-center">
        {viewMode === 'chart' ? (
          <div className="flex flex-col gap-1 w-full">
            {/* Bar Visualization */}
            <div className="flex items-end justify-between gap-1 h-32 px-1 pt-3 pb-1 border-b border-[rgba(83,109,126,0.2)]">
              {series.map((item, idx) => {
                const heightPercent = Math.max(10, (item.entryCount / maxVal) * 100);
                const isPeak = item.entryCount === peakCount;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t transition-all ${isPeak
                          ? 'bg-[#4FB9AD]'
                          : 'bg-[#4FB9AD]/65 group-hover:bg-[#4FB9AD]'
                        }`}
                      style={{ height: `${heightPercent}%` }}
                    />

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="bg-[#1C2B39] text-[#E6EDF1] text-[10px] font-mono px-2 py-1 rounded shadow-lg border border-[rgba(83,109,126,0.3)] whitespace-nowrap">
                        <div className="font-bold">{item.timeLabel}</div>
                        <div className="text-[#4FB9AD]">{item.entryCount} lượt xe</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis labels */}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#7E8B96] pt-1 px-1">
              <span>{series[0]?.timeLabel || ''}</span>
              {series.length > 2 && (
                <span>{series[Math.floor(series.length / 2)]?.timeLabel || ''}</span>
              )}
              <span>{series[series.length - 1]?.timeLabel || ''}</span>
            </div>
          </div>
        ) : (
          /* Accessible Table */
          <div className="overflow-y-auto max-h-36 pr-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(83,109,126,0.2)] text-[#7E8B96]">
                  <th scope="col" className="py-1 px-2 font-semibold">Mốc thời gian</th>
                  <th scope="col" className="py-1 px-2 font-semibold text-right">Lượt xe vào</th>
                  <th scope="col" className="py-1 px-2 font-semibold text-right">Tỷ lệ so với đỉnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(83,109,126,0.1)] text-[#E6EDF1]">
                {series.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-1 px-2 font-mono">{item.timeLabel}</td>
                    <td className="py-1 px-2 font-mono font-bold text-right text-[#4FB9AD]">
                      {item.entryCount}
                    </td>
                    <td className="py-1 px-2 font-mono text-xs text-right text-[#A5B0B9]">
                      {Math.round((item.entryCount / peakCount) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
