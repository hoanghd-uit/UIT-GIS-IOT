'use client';

import React from 'react';
import { CO2_DEMO_FIXTURE } from '@/lib/dashboard/environment-demo-fixtures';

export interface Co2DemoRankingProps {
  className?: string;
}

export function Co2DemoRanking({ className = '' }: Co2DemoRankingProps) {
  const rankings = CO2_DEMO_FIXTURE.rankings.slice(0, 6);
  const maxPossible = 1400; // Reference max for bar visual scaling

  const getStatusColor = (status: 'good' | 'moderate' | 'warning') => {
    switch (status) {
      case 'good':
        return { text: '#4FB9AD', bg: 'var(--primary)', label: 'Tốt' };
      case 'moderate':
        return { text: '#E4BF55', bg: '#E4BF55', label: 'Theo dõi' };
      case 'warning':
        return { text: '#ED8936', bg: '#ED8936', label: 'Cảnh báo' };
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
        <h2 className="text-base font-semibold text-[#E6EDF1]">
          Phòng CO₂ cao nhất lúc này
        </h2>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#ED8936]/15 text-[#ED8936] border border-[#ED8936]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ED8936]" />
          Demo
        </span>
      </div>

      {/* Ranking List with Horizontal Bars */}
      <div className="my-4 flex flex-col gap-3.5">
        {rankings.map((item, index) => {
          const colorInfo = getStatusColor(item.status);
          const percent = Math.min(100, Math.round((item.latestValue / maxPossible) * 100));

          return (
            <div key={item.roomId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[#7E8B96] text-[11px] w-4">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-[#E6EDF1] truncate">
                    {item.roomName}
                  </span>
                  <span className="text-[11px] text-[#7E8B96] shrink-0">
                    ({item.floor})
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-semibold text-[#E6EDF1]">
                    {item.latestValue}
                  </span>
                  <span className="text-[11px] text-[#7E8B96]">ppm</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium border"
                    style={{
                      color: colorInfo.text,
                      borderColor: `${colorInfo.text}40`,
                      backgroundColor: `${colorInfo.text}15`,
                    }}
                  >
                    {colorInfo.label}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-1.5 w-full bg-[#111922] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: colorInfo.bg,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[#7E8B96]">
        <span>Sắp xếp theo nồng độ CO₂ thời điểm mới nhất</span>
        <span className="font-mono text-[11px]">Nguồn: {CO2_DEMO_FIXTURE.fixtureId}</span>
      </div>
    </div>
  );
}
