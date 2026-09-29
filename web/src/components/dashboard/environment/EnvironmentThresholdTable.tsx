'use client';

import React from 'react';

export interface EnvironmentThresholdTableProps {
  className?: string;
}

interface ThresholdRow {
  parameter: string;
  warningThreshold: string;
  dangerThreshold: string;
  sourceType: 'demo' | 'pending' | 'unavailable';
  statusLabel: string;
}

const THRESHOLD_ROWS: ThresholdRow[] = [
  {
    parameter: 'Nồng độ CO₂',
    warningThreshold: '> 1.000 ppm',
    dangerThreshold: '> 1.500 ppm',
    sourceType: 'demo',
    statusLabel: 'Demo (page03-co2-demo-v1)',
  },
  {
    parameter: 'Nhiệt độ',
    warningThreshold: 'Chưa xác nhận',
    dangerThreshold: 'Chưa xác nhận',
    sourceType: 'pending',
    statusLabel: 'Chờ xác nhận phần cứng',
  },
  {
    parameter: 'Độ ẩm',
    warningThreshold: 'Chưa xác nhận',
    dangerThreshold: 'Chưa xác nhận',
    sourceType: 'pending',
    statusLabel: 'Chờ xác nhận phần cứng',
  },
  {
    parameter: 'VOC (Xu hướng)',
    warningThreshold: '> 0.1 mg/m³',
    dangerThreshold: '> 0.3 mg/m³',
    sourceType: 'demo',
    statusLabel: 'Demo tham khảo',
  },
  {
    parameter: 'PM2.5',
    warningThreshold: 'Chưa có ngưỡng',
    dangerThreshold: 'Chưa có ngưỡng',
    sourceType: 'unavailable',
    statusLabel: 'Chưa có nguồn được phê duyệt',
  },
];

export function EnvironmentThresholdTable({ className = '' }: EnvironmentThresholdTableProps) {
  const getBadgeStyle = (type: 'demo' | 'pending' | 'unavailable') => {
    switch (type) {
      case 'demo':
        return 'bg-[#FF2121]/15 text-[#FF2121] border-[#FF2121]/30';
      case 'pending':
        return 'bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30';
      case 'unavailable':
        return 'bg-white/5 text-[#7E8B96] border-white/10';
    }
  };

  return (
    <div
      className={`flex flex-col justify-between p-5 rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#E6EDF1]">
            Ngưỡng cảnh báo
          </h2>
          <span className="text-xs text-[#7E8B96]">(Read-only)</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFB121]/15 text-[#FFB121] border border-[#FFB121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB121]" />
            Demo
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Disabled edit affordance */}
          <button
            type="button"
            disabled
            className="px-2.5 py-1 rounded text-xs font-medium text-[#7E8B96] bg-white/5 border border-white/10 cursor-not-allowed opacity-60 flex items-center gap-1.5"
            title="Chờ Small Phase Alert + Identity/CASL"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Sửa ngưỡng</span>
          </button>
        </div>
      </div>

      {/* Thresholds Table */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] text-[#7E8B96]">
              <th className="py-2.5 px-3 font-semibold">Thông số</th>
              <th className="py-2.5 px-3 font-semibold">Cảnh báo</th>
              <th className="py-2.5 px-3 font-semibold">Nguy hiểm</th>
              <th className="py-2.5 px-3 font-semibold text-right">Trạng thái cấu hình</th>
            </tr>
          </thead>
          <tbody>
            {THRESHOLD_ROWS.map((row) => (
              <tr
                key={row.parameter}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-2.5 px-3 font-medium text-[#E6EDF1]">
                  {row.parameter}
                </td>
                <td className="py-2.5 px-3 font-mono text-[#E4BF55]">
                  {row.warningThreshold}
                </td>
                <td className="py-2.5 px-3 font-mono text-[#FF2121]">
                  {row.dangerThreshold}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getBadgeStyle(
                      row.sourceType,
                    )}`}
                  >
                    {row.statusLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {/* <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[#7E8B96]">
        <span>Chức năng sửa ngưỡng sẽ được kích hoạt ở Phase Alert &amp; CASL</span>
        <span>Chỉ xem</span>
      </div> */}
    </div>
  );
}
