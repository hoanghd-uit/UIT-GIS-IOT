'use client';

import React from 'react';
import { AlertKpiSummary, AlertTimeRangePreset } from '@/types/dashboard-alerts';

export interface AlertCenterKpiStripProps {
  kpis: AlertKpiSummary;
  activePreset: AlertTimeRangePreset;
}

export function AlertCenterKpiStrip({ kpis, activePreset }: AlertCenterKpiStripProps) {
  const rangeLabels: Record<AlertTimeRangePreset, string> = {
    today: 'Hôm nay',
    '7d': '7 ngày gần nhất',
    '30d': '30 ngày qua',
  };

  return (
    <section aria-label="Các chỉ số KPI cảnh báo chính" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full">
        {/* Card 1: Đang mở */}
        <div
          role="article"
          aria-label={`Đang mở: ${kpis.openCount} cảnh báo. Nguy hiểm: ${kpis.dangerCount}, Cảnh báo: ${kpis.warningCount}, Thông tin: ${kpis.infoCount}`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[120px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              Đang mở
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF2121]/10 text-[#FF2121] font-medium border border-[#FF2121]/30 shrink-0">
              Demo
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {kpis.openCount}
            </span>
            <span className="text-xs text-[#A5B0B9]">sự vụ</span>
          </div>
          <div
            className="text-[11px] text-[#A5B0B9] truncate"
            title={`Nguy hiểm: ${kpis.dangerCount} · Cảnh báo: ${kpis.warningCount} · Thông tin: ${kpis.infoCount}`}
          >
            <span className="text-[#FF2121] font-medium">{kpis.dangerCount} Nguy hiểm</span> ·{' '}
            <span className="text-[#E4BF55] font-medium">{kpis.warningCount} Cảnh báo</span> ·{' '}
            <span className="text-[#4FB9AD] font-medium">{kpis.infoCount} Thông tin</span>
          </div>
        </div>

        {/* Card 2: Quá hạn SLA */}
        <div
          role="article"
          aria-label={`Quá hạn SLA: ${kpis.slaOverdueCount} sự vụ`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[120px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              Quá hạn SLA
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF2121]/10 text-[#FF2121] font-medium border border-[#FF2121]/30 shrink-0">
              Demo
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold font-mono tracking-tight ${kpis.slaOverdueCount > 0 ? 'text-[#FF2121]' : 'text-[#E6EDF1]'
                }`}
            >
              {kpis.slaOverdueCount}
            </span>
            <span className="text-xs text-[#A5B0B9]">sự vụ</span>
          </div>
          <div className="text-[11px] text-[#A5B0B9] truncate" title="Chờ phản hồi vượt khung giờ cam kết">
            Chưa nhận xử lý kịp thời
          </div>
        </div>

        {/* Card 3: Mới trong khoảng chọn */}
        <div
          role="article"
          aria-label={`Mới trong khoảng chọn: ${kpis.newInRangeCount} sự kiện mới`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[120px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              Mới trong {rangeLabels[activePreset]}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF2121]/10 text-[#FF2121] font-medium border border-[#FF2121]/30 shrink-0">
              Demo
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {kpis.newInRangeCount}
            </span>
            <span className="text-xs text-[#A5B0B9]">sự kiện</span>
          </div>
          {/* <div className="text-[11px] text-[#A5B0B9] truncate" title={rangeLabels[activePreset]}>
            Khoảng: {rangeLabels[activePreset]}
          </div> */}
        </div>

        {/* Card 4: Thời gian nhận TB */}
        <div
          role="article"
          aria-label={`Thời gian nhận trung bình: ${kpis.avgAcknowledgeMinutes} phút`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[120px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              Thời gian nhận TB
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF2121]/10 text-[#FF2121] font-medium border border-[#FF2121]/30 shrink-0">
              Demo
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {kpis.avgAcknowledgeMinutes}
            </span>
            <span className="text-xs text-[#A5B0B9]">phút</span>
          </div>
          <div className="text-[11px] text-[#A5B0B9] truncate" title="Tính từ thời điểm phát hiện vượt ngưỡng">
            30 ngày
          </div>
        </div>

        {/* Card 5: Kênh thông báo */}
        <div
          role="article"
          aria-label={`Kênh thông báo: ${kpis.channelCount} kênh cấu hình`}
          className="flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[120px]"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A5B0B9] truncate">
              Kênh thông báo
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF2121]/10 text-[#FF2121] font-medium border border-[#FF2121]/30 shrink-0">
              Demo
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-[#E6EDF1]">
              {kpis.channelCount}
            </span>
            <span className="text-xs text-[#A5B0B9]">kênh</span>
          </div>
          <div className="text-[11px] text-[#A5B0B9] truncate" title="Email, Zalo Cloud ZNS, SMS Brandname">
            Email · ZNS · SMS (Mô phỏng)
          </div>
        </div>
      </div>
    </section>
  );
}
