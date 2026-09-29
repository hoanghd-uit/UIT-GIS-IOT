'use client';

import React from 'react';
import { CO2_DEMO_FIXTURE } from '@/lib/dashboard/environment-demo-fixtures';

export interface Co2DemoComplianceProps {
  className?: string;
}

export function Co2DemoCompliance({ className = '' }: Co2DemoComplianceProps) {
  const complianceItems = CO2_DEMO_FIXTURE.compliance;

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
        <h2 className="text-base font-semibold text-[#E6EDF1]">
          % thời gian đạt chuẩn CO₂ (7 ngày)
        </h2>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FFB121]/15 text-[#FFB121] border border-[#FFB121]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFB121]" />
          Demo
        </span>
      </div>

      {/* Compliance Bars */}
      <div className="my-4 flex flex-col gap-4">
        {complianceItems.map((item) => {
          const isTotal = item.floor === 'Tất cả';
          const isHigh = item.compliancePercent >= 90;
          const barColor = isHigh ? 'var(--primary)' : '#E4BF55';

          return (
            <div key={item.floor} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isTotal ? 'text-[#E6EDF1] font-semibold' : 'text-[#A5B0B9]'}`}>
                  {isTotal ? 'Toàn nhà (Tổng hợp)' : item.floor}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono font-bold text-sm text-[#E6EDF1]">
                    {item.compliancePercent}%
                  </span>
                  <span className="text-[11px] text-[#7E8B96]">thời gian</span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-2 w-full bg-[#111922] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.compliancePercent}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#7E8B96]">
        <span>Chuẩn: CO₂ ≤ 1000 ppm, 24-27 °C, độ ẩm 40-70%</span>
        {/* <span className="font-mono text-[11px]">Fixture: {CO2_DEMO_FIXTURE.fixtureId}</span> */}
      </div>
    </div>
  );
}
