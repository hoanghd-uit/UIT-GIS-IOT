'use client';

import React, { useState } from 'react';
import { AlertHistoryBarItem } from '@/types/dashboard-alerts';
import { MetricBarChart } from '@/components/dashboard/charts/MetricBarChart';
import { ALERT_DEMO_FIXTURE_ID } from '@/lib/dashboard/alert-demo-fixtures';

export interface DemoAlertHistoryChartProps {
  historyItems: AlertHistoryBarItem[];
  className?: string;
}

export function DemoAlertHistoryChart({
  historyItems,
  className = '',
}: DemoAlertHistoryChartProps) {
  const [showTable, setShowTable] = useState(false);

  const totalEvents = historyItems.reduce((acc, cur) => acc + cur.count, 0);

  const chartData = historyItems.map((item) => ({
    category: item.label,
    value: item.count,
  }));

  const accessibleSummary = `Biểu đồ số cảnh báo 14 ngày qua ghi nhận tổng cộng ${totalEvents} sự vụ phát hiện mới.`;

  return (
    <div
      className={`flex flex-col justify-between p-5 rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#E6EDF1]">
            Số cảnh báo 14 ngày
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FF2121]/15 text-[#FF2121] border border-[#FF2121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2121]" />
            Demo
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A5B0B9] font-mono">
            Tổng: <span className="font-bold text-[#E6EDF1]">{totalEvents}</span> sự vụ
          </span>
          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className="px-2 py-0.5 rounded text-[11px] text-[#A5B0B9] hover:text-[#E6EDF1] bg-white/5 hover:bg-white/10 border border-[rgba(83,109,126,0.3)] transition-colors"
            title="Chuyển đổi sang bảng tiếp cận"
            aria-label="Chuyển đổi bảng dữ liệu số cảnh báo"
          >
            {showTable ? 'Xem biểu đồ' : 'Xem bảng'}
          </button>
        </div>
      </div>

      {/* Main Visual: Chart or Accessible Table */}
      <div className="my-3 flex-1 min-h-[220px]">
        {showTable ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A5B0B9] border-collapse">
              <thead>
                <tr className="border-b border-[rgba(83,109,126,0.2)] text-[#E6EDF1]">
                  <th scope="col" className="py-2 px-3">Ngày</th>
                  <th scope="col" className="py-2 px-3 text-right">Số lượng sự vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(83,109,126,0.1)]">
                {historyItems.map((item) => (
                  <tr key={item.date} className="hover:bg-white/[0.02]">
                    <td className="py-1.5 px-3 font-mono">{item.label} ({item.date})</td>
                    <td className="py-1.5 px-3 text-right font-mono font-semibold text-[#E6EDF1]">
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <MetricBarChart
            data={chartData}
            metricLabel="Số cảnh báo"
            unit="sự vụ"
            height={220}
            // provenance={{
            //   mode: 'demo',
            //   sourceType: 'deterministic_fixture',
            //   fixtureVersion: ALERT_DEMO_FIXTURE_ID,
            //   fetchedAt: '2026-09-29T10:00:00.000Z',
            //   caveats: ['Demo'],
            // }}
            accessibleSummary={accessibleSummary}
          />
        )}
      </div>

      {/* Footer
      <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[#7E8B96]">
        <span>Chu kỳ: 14 ngày kết thúc tại mốc tham chiếu</span>
        <span>{ALERT_DEMO_FIXTURE_ID}</span>
      </div> */}
    </div>
  );
}
