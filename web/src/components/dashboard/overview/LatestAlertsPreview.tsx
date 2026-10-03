'use client';

import React from 'react';
import Link from 'next/link';
import { DemoAlertEvent } from '@/types/dashboard-alerts';
import { ALERT_DEMO_FIXTURE_ID } from '@/lib/dashboard/alert-demo-fixtures';

export interface LatestAlertsPreviewProps {
  alerts: DemoAlertEvent[];
  className?: string;
}

export function LatestAlertsPreview({ alerts, className = '' }: LatestAlertsPreviewProps) {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className={`flex flex-col justify-between p-4 sm:p-5 rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderColor: 'var(--border)',
      }}
      aria-label="Cảnh báo mới nhất"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(83,109,126,0.18)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#E6EDF1]">
              Cảnh báo mới nhất
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB121]/15 text-[#FFB121] font-medium border border-[#FFB121]/30 shrink-0"
              title={`Chế độ dữ liệu Demo · Fixture ${ALERT_DEMO_FIXTURE_ID}`}
            >
              Demo
            </span>
          </div>
          <p className="text-xs text-[#7E8B96] mt-0.5">
            Sự vụ mở gần nhất
          </p>
        </div>
      </div>

      {/* Alert List */}
      <div className="my-3 flex-1 flex flex-col gap-2.5">
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#7E8B96]">
            Không có sự vụ cảnh báo đang mở
          </div>
        ) : (
          alerts.map((alt) => {
            const isDanger = alt.severity === 'danger';
            const isWarning = alt.severity === 'warning';
            const sevColor = isDanger ? '#FF2121' : isWarning ? '#E4BF55' : '#4FB9AD';
            const sevLabel = isDanger ? 'Nguy hiểm' : isWarning ? 'Cảnh báo' : 'Thông tin';

            return (
              <div
                key={alt.alertId}
                className="flex items-start justify-between gap-2.5 p-3 rounded-lg bg-[#111922] border border-[rgba(83,109,126,0.18)] hover:border-[rgba(83,109,126,0.3)] transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: sevColor }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#E6EDF1] truncate">
                      {alt.title}
                    </p>
                    <p className="text-[11px] text-[#7E8B96] truncate mt-0.5">
                      {alt.locationLabel} · {alt.alertId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{
                      backgroundColor: `${sevColor}20`,
                      color: sevColor,
                      border: `1px solid ${sevColor}40`,
                    }}
                  >
                    {sevLabel}
                  </span>
                  <span className="text-[10px] text-[#536D7E] font-mono">
                    {formatTime(alt.detectedAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action */}
      <div className="pt-3 border-t border-[rgba(83,109,126,0.18)] flex items-center justify-between text-xs">
        <Link
          href="/dashboard/alerts"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4FB9AD] hover:underline"
        >
          <span>Xem tất cả cảnh báo</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        <span className="text-[11px] text-[#7E8B96]">
          Page 06
        </span>
      </div>
    </div>
  );
}
