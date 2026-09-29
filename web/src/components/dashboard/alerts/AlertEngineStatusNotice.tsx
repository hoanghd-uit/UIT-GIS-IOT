'use client';

import React from 'react';
import { DashboardAlertEvaluationStatusResponse } from '@/types/dashboard-alerts';

export interface AlertEngineStatusNoticeProps {
  statusData: DashboardAlertEvaluationStatusResponse | null;
  statusState: 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';
}

export function AlertEngineStatusNotice({
  statusData,
  statusState,
}: AlertEngineStatusNoticeProps) {
  if (statusState === 'loading') {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[rgba(83,109,126,0.2)] bg-[#111922]/80 text-xs text-[#A5B0B9] animate-pulse">
        <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
        <span>Đang kiểm tra trạng thái Alert Evaluator Engine...</span>
      </div>
    );
  }

  const ruleCount = statusData?.capabilities?.authoritativeRuleCount ?? 0;
  const isEngineReady = statusData?.capabilities?.evaluatorAvailable ?? false;

  return (
    <aside
      aria-label="Thông báo trạng thái công cụ đánh giá cảnh báo"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[rgba(79,185,173,0.25)] bg-[rgba(17,25,34,0.7)] backdrop-blur-sm transition-all"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-1.5 rounded-lg bg-[rgba(79,185,173,0.12)] text-[var(--primary)] border border-[rgba(79,185,173,0.3)] shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-0.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#E6EDF1]">
              {isEngineReady ? 'Engine sẵn sàng' : 'Engine chưa sẵn sàng'} ·{' '}
              <span className="font-mono text-[var(--primary)]">{ruleCount}</span> quy tắc authoritative
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-[#7E8B96] border border-white/10">
              Derived · Unavailable
            </span>
          </div>
          <p className="text-[#A5B0B9]">
            Chưa đánh giá live do semantics, baseline, cadence và duration policy chưa được xác nhận.
          </p>
        </div>
      </div>

      {/* <div className="text-[11px] text-[#7E8B96] shrink-0 self-end sm:self-auto font-mono">
        Mã chặn: {statusData?.blockers?.[0]?.code ?? 'ALERT_RULES_NOT_CONFIRMED'}
      </div> */}
    </aside>
  );
}
