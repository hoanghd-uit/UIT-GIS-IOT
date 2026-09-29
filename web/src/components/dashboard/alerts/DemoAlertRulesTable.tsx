'use client';

import React from 'react';
import { DemoAlertRule, AlertSeverity } from '@/types/dashboard-alerts';
import { DEMO_ALERT_RULES } from '@/lib/dashboard/alert-demo-fixtures';

export interface DemoAlertRulesTableProps {
  authoritativeRuleCount: number;
  className?: string;
}

export function DemoAlertRulesTable({
  authoritativeRuleCount = 0,
  className = '',
}: DemoAlertRulesTableProps) {
  const rules: DemoAlertRule[] = DEMO_ALERT_RULES;

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'danger':
        return (
          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FF2121]/15 text-[#FF2121] border border-[#FF2121]/30">
            Nguy hiểm
          </span>
        );
      case 'warning':
        return (
          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#E4BF55]/15 text-[#E4BF55] border border-[#E4BF55]/30">
            Cảnh báo
          </span>
        );
      case 'info':
        return (
          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#4FB9AD]/15 text-[#4FB9AD] border border-[#4FB9AD]/30">
            Thông tin
          </span>
        );
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
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#E6EDF1]">
            Quy tắc cảnh báo
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FF2121]/15 text-[#FF2121] border border-[#FF2121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2121]" />
            Demo
          </span>
        </div>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Chờ Identity/CASL + PostgreSQL phase"
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/5 text-[#7E8B96] border border-white/10 cursor-not-allowed opacity-60 hover:opacity-70 transition-all flex items-center gap-1"
        >
          <span>+</span>
          <span>Thêm quy tắc</span>
        </button>
      </div>

      {/* Rules Table / Scroll area */}
      <div className="my-3 overflow-x-auto flex-1 min-h-[220px] max-h-[260px]">
        <table className="w-full text-left text-xs border-collapse min-w-[440px]">
          <thead>
            <tr className="border-b border-[rgba(83,109,126,0.2)] text-[#7E8B96]">
              <th scope="col" className="py-2 px-2.5 font-semibold">Tên quy tắc & Điều kiện</th>
              <th scope="col" className="py-2 px-2 font-semibold">Mức độ</th>
              <th scope="col" className="py-2 px-2 font-semibold">Kênh</th>
              <th scope="col" className="py-2 px-2 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(83,109,126,0.1)]">
            {rules.map((r) => (
              <tr key={r.ruleId} className="hover:bg-white/[0.02]">
                {/* Name & Condition */}
                <td className="py-2 px-2.5 max-w-[200px]">
                  <div className="font-medium text-[#E6EDF1] truncate" title={r.ruleName}>
                    {r.ruleName}
                  </div>
                  <div className="text-[10px] text-[#A5B0B9] truncate" title={r.condition}>
                    {r.condition}
                  </div>
                </td>

                {/* Severity */}
                <td className="py-2 px-2 whitespace-nowrap">
                  {getSeverityBadge(r.severity)}
                </td>

                {/* Channels */}
                <td className="py-2 px-2 text-[11px] text-[#A5B0B9] whitespace-nowrap">
                  {r.notificationChannels.join(', ')}
                </td>

                {/* Disabled Edit/Toggle */}
                <td className="py-2 px-2 text-center whitespace-nowrap">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="Chờ Identity/CASL + PostgreSQL phase"
                    className="p-1 rounded text-[#7E8B96] hover:text-[#A5B0B9] cursor-not-allowed opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {/* <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[#7E8B96]">
        <span>Chỉ hiển thị mẫu quy tắc demo</span>
        <span>Runtime registry rỗng</span>
      </div> */}
    </div>
  );
}
