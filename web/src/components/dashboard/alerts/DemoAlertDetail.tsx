'use client';

import React from 'react';
import { DemoAlertEvent, AlertSeverity, AlertLifecycleStatus } from '@/types/dashboard-alerts';

export interface DemoAlertDetailProps {
  alert: DemoAlertEvent | null;
  className?: string;
}

export function DemoAlertDetail({ alert, className = '' }: DemoAlertDetailProps) {
  if (!alert) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 rounded-xl border text-center ${className}`}
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="p-3 rounded-full bg-white/5 border border-white/10 text-[#7E8B96] mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[#E6EDF1] mb-1">
          Chưa chọn cảnh báo
        </h3>
        <p className="text-xs text-[#A5B0B9] max-w-xs">
          Chọn một sự vụ từ danh sách bên trái để xem thông tin chi tiết, nhật ký diễn biến và khuyến nghị xử lý.
        </p>
      </div>
    );
  }

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FF2121]/15 text-[#FF2121] border border-[#FF2121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2121]" />
            Nguy hiểm
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#E4BF55]/15 text-[#E4BF55] border border-[#E4BF55]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E4BF55]" />
            Cảnh báo
          </span>
        );
      case 'info':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#4FB9AD]/15 text-[#4FB9AD] border border-[#4FB9AD]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4FB9AD]" />
            Thông tin
          </span>
        );
    }
  };

  const getLifecycleLabel = (status: AlertLifecycleStatus) => {
    switch (status) {
      case 'new':
        return 'Mới phát hiện';
      case 'acknowledged':
        return 'Đang xử lý';
      case 'resolved':
        return 'Đã khắc phục';
      case 'closed':
        return 'Đã đóng';
    }
  };

  const formatFullTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const hours = String(d.getUTCHours() + 7).padStart(2, '0');
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${hours}:${mins} ngày ${day}/${month}/${year}`;
    } catch {
      return iso;
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
      <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-2">
          {/* `          <span className="text-xs font-mono text-[#7E8B96]">
            Demo: <span className="text-[#E6EDF1] font-semibold">{alert.alertId}</span>
          </span>` */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FF2121]/15 text-[#FF2121] border border-[#FF2121]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2121]" />
            Demo
          </span>
          {getSeverityBadge(alert.severity)}
        </div>

        <h2 className="text-base font-bold text-[#E6EDF1] leading-snug">
          {alert.title}
        </h2>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
          <div>
            <span className="text-[#7E8B96] block text-[11px]">Vị trí thiết bị:</span>
            <span className="font-medium text-[#E6EDF1]">{alert.locationLabel}</span>
          </div>
          <div>
            <span className="text-[#7E8B96] block text-[11px]">Mã thiết bị:</span>
            <span className="font-mono text-[#A5B0B9]">{alert.demoDeviceId}</span>
          </div>
          <div>
            <span className="text-[#7E8B96] block text-[11px]">Thời gian phát hiện:</span>
            <span className="font-mono text-[#A5B0B9]">{formatFullTime(alert.detectedAt)}</span>
          </div>
          <div>
            <span className="text-[#7E8B96] block text-[11px]">Trạng thái / Phụ trách:</span>
            <span className="font-medium text-[#E6EDF1]">
              {getLifecycleLabel(alert.lifecycleStatus)} · {alert.demoAssigneeRole ?? 'Chưa gán'}
            </span>
          </div>
        </div>
      </div>

      {/* Suggested Action Box (Minh họa) */}
      <div className="my-3 p-3.5 rounded-lg bg-[#141F28] border border-[rgba(83,109,126,0.3)] flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-[var(--primary)] font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Khuyến nghị xử lý (Demo)</span>
        </div>
        <p className="text-[#E6EDF1] leading-relaxed">
          {alert.suggestedActionText}
        </p>
      </div>

      {/* Timeline Section */}
      <div className="my-2 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[220px]">
        <h4 className="text-xs font-semibold text-[#A5B0B9] uppercase tracking-wider">
          Tiến trình sự vụ
        </h4>
        <div className="relative pl-4 border-l border-[rgba(83,109,126,0.25)] flex flex-col gap-3 py-1">
          {alert.timeline.map((step, idx) => (
            <div key={idx} className="relative flex flex-col gap-0.5 text-xs">
              <span
                className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-[#141F28]"
                style={{
                  borderColor:
                    step.type === 'detected'
                      ? '#FF2121'
                      : step.type === 'acknowledged'
                        ? '#E4BF55'
                        : 'var(--primary)',
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#E6EDF1]">{step.title}</span>
                <span className="font-mono text-[10px] text-[#7E8B96]">
                  {formatFullTime(step.timestamp)}
                </span>
              </div>
              <p className="text-[#A5B0B9] text-[11px] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons: Disabled with accessible reasons */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center gap-2.5">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Chưa có identity và event persistence"
          className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-white/5 text-[#7E8B96] border border-white/10 cursor-not-allowed transition-all opacity-60 hover:opacity-70 flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Nhận xử lý</span>
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Chưa có approved room/device spatial mapping"
          className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-white/5 text-[#7E8B96] border border-white/10 cursor-not-allowed transition-all opacity-60 hover:opacity-70 flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Xem trên BIM</span>
        </button>
      </div>
    </div>
  );
}
