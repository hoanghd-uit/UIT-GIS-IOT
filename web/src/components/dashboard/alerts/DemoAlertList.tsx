'use client';

import React, { forwardRef } from 'react';
import {
  DemoAlertEvent,
  AlertSeverityFilter,
  AlertSortOrder,
  AlertSeverity,
  AlertLifecycleStatus,
} from '@/types/dashboard-alerts';
import { ALERT_DEMO_FIXTURE_ID } from '@/lib/dashboard/alert-demo-fixtures';

export interface DemoAlertListProps {
  events: DemoAlertEvent[];
  selectedAlertId: string | null;
  onSelectAlert: (alertId: string) => void;
  severityFilter: AlertSeverityFilter;
  onSeverityFilterChange: (severity: AlertSeverityFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortOrder: AlertSortOrder;
  onSortOrderChange: (order: AlertSortOrder) => void;
  countsBySeverity: {
    all: number;
    danger: number;
    warning: number;
    info: number;
  };
  className?: string;
}

export const DemoAlertList = forwardRef<HTMLInputElement, DemoAlertListProps>(
  function DemoAlertList(
    {
      events,
      selectedAlertId,
      onSelectAlert,
      severityFilter,
      onSeverityFilterChange,
      searchQuery,
      onSearchQueryChange,
      sortOrder,
      onSortOrderChange,
      countsBySeverity,
      className = '',
    },
    searchRef,
  ) {
    const filterPills: { id: AlertSeverityFilter; label: string; count: number }[] = [
      { id: 'all', label: 'Tất cả', count: countsBySeverity.all },
      { id: 'danger', label: 'Nguy hiểm', count: countsBySeverity.danger },
      { id: 'warning', label: 'Cảnh báo', count: countsBySeverity.warning },
      { id: 'info', label: 'Thông tin', count: countsBySeverity.info },
    ];

    const getSeverityBadge = (severity: AlertSeverity) => {
      switch (severity) {
        case 'danger':
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FF2121]/15 text-[#FF2121] border border-[#FF2121]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2121]" />
              Nguy hiểm
            </span>
          );
        case 'warning':
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E4BF55]/15 text-[#E4BF55] border border-[#E4BF55]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E4BF55]" />
              Cảnh báo
            </span>
          );
        case 'info':
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#4FB9AD]/15 text-[#4FB9AD] border border-[#4FB9AD]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4FB9AD]" />
              Thông tin
            </span>
          );
      }
    };

    const getLifecycleBadge = (status: AlertLifecycleStatus) => {
      switch (status) {
        case 'new':
          return (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FF2121]/10 text-[#FF2121] border border-[#FF2121]/25">
              Mới
            </span>
          );
        case 'acknowledged':
          return (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E4BF55]/10 text-[#E4BF55] border border-[#E4BF55]/25">
              Đã nhận
            </span>
          );
        case 'resolved':
          return (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/25">
              Đã xử lý
            </span>
          );
        case 'closed':
          return (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-[#7E8B96] border border-white/10">
              Đã đóng
            </span>
          );
      }
    };

    const formatTime = (iso: string) => {
      try {
        const d = new Date(iso);
        const hours = String(d.getUTCHours() + 7).padStart(2, '0'); // ICT
        const mins = String(d.getUTCMinutes()).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        return `${hours}:${mins} · ${day}/${month}`;
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
        {/* Header & Filter Controls */}
        <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#E6EDF1]">
                Danh sách cảnh báo
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FF2121]/15 text-[#FF2121] border border-[#FF2121]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2121]" />
                Demo
              </span>
            </div>
            <span className="text-[11px] text-[#7E8B96] font-mono">
              Hiển thị {events.length} sự vụ ({ALERT_DEMO_FIXTURE_ID})
            </span>
          </div>

          {/* Filter Pills, Search Bar, and Sort Order */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Severity Tabs */}
            <div
              className="inline-flex items-center p-1 rounded-xl border bg-[#111922] border-[rgba(83,109,126,0.25)] flex-wrap"
              role="tablist"
              aria-label="Lọc theo mức độ cảnh báo"
            >
              {filterPills.map((pill) => {
                const isActive = severityFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onSeverityFilterChange(pill.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${isActive
                      ? 'bg-[#1C2B39] text-[#E6EDF1] font-semibold shadow-sm border border-[rgba(83,109,126,0.3)]'
                      : 'text-[#A5B0B9] hover:text-[#E6EDF1] hover:bg-white/5'
                      }`}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive
                        ? 'bg-[var(--primary)] text-[#0C1319] font-bold'
                        : 'bg-white/10 text-[#A5B0B9]'
                        }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input & Sort Selector */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48 md:w-56">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="Tìm tiêu đề, vị trí, mã..."
                  className="w-full px-3 py-1.5 pl-8 text-xs rounded-lg border bg-[#111922] text-[#E6EDF1] border-[rgba(83,109,126,0.25)] placeholder-[#7E8B96] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  aria-label="Tìm kiếm trong danh sách cảnh báo"
                />
                <svg
                  className="w-3.5 h-3.5 text-[#7E8B96] absolute left-2.5 top-2.5 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange('')}
                    className="absolute right-2 top-2 text-[#7E8B96] hover:text-[#E6EDF1] text-xs"
                    aria-label="Xóa nội dung tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Order Selector */}
              <select
                value={sortOrder}
                onChange={(e) => onSortOrderChange(e.target.value as AlertSortOrder)}
                className="px-2.5 py-1.5 text-xs rounded-lg border bg-[#111922] text-[#E6EDF1] border-[rgba(83,109,126,0.25)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                aria-label="Sắp xếp thời gian"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alert List Table / Scroll Container */}
        <div className="my-3 overflow-x-auto flex-1 min-h-[300px] max-h-[420px]">
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center text-[#7E8B96]">
              <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs font-medium">Không tìm thấy cảnh báo phù hợp với bộ lọc.</p>
              <p className="text-[11px] text-[#A5B0B9] mt-1">Thử thay đổi mức độ, khoảng thời gian hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[rgba(83,109,126,0.2)] text-[#7E8B96]">
                  <th scope="col" className="py-2.5 px-3 font-semibold w-24">Mức độ</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">Nội dung cảnh báo</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">Vị trí</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold whitespace-nowrap">Thời gian</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">Người xử lý</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold text-center">Trạng thái</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold text-center">SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(83,109,126,0.1)]">
                {events.map((ev) => {
                  const isSelected = selectedAlertId === ev.alertId;
                  const isSlaOverdue =
                    ev.slaDueAt &&
                    Date.parse(ev.slaDueAt) < Date.parse('2026-09-29T10:00:00.000Z') &&
                    ev.lifecycleStatus !== 'resolved' &&
                    ev.lifecycleStatus !== 'closed';

                  return (
                    <tr
                      key={ev.alertId}
                      tabIndex={0}
                      role="row"
                      aria-selected={isSelected}
                      onClick={() => onSelectAlert(ev.alertId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectAlert(ev.alertId);
                        }
                      }}
                      className={`cursor-pointer transition-colors outline-none focus:ring-1 focus:ring-[var(--primary)] ${isSelected
                        ? 'bg-[rgba(79,185,173,0.12)] border-l-2 border-l-[var(--primary)]'
                        : 'hover:bg-white/[0.02]'
                        }`}
                    >
                      {/* Mức độ */}
                      <td className="py-3 px-3">
                        {getSeverityBadge(ev.severity)}
                      </td>

                      {/* Tiêu đề / Nội dung */}
                      <td className="py-3 px-3 max-w-[240px]">
                        <div
                          className="font-medium text-[#E6EDF1] truncate"
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                        <div className="text-[10px] font-mono text-[#7E8B96]">
                          {ev.alertId} · {ev.demoDeviceId}
                        </div>
                      </td>

                      {/* Vị trí */}
                      <td className="py-3 px-3 text-[#A5B0B9] whitespace-nowrap" title={ev.locationLabel}>
                        {ev.locationLabel}
                      </td>

                      {/* Thời gian */}
                      <td className="py-3 px-3 font-mono text-[11px] text-[#A5B0B9] whitespace-nowrap">
                        {formatTime(ev.detectedAt)}
                      </td>

                      {/* Người xử lý */}
                      <td className="py-3 px-3 text-[#A5B0B9] whitespace-nowrap">
                        {ev.demoAssigneeRole ?? '—'}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getLifecycleBadge(ev.lifecycleStatus)}
                      </td>

                      {/* SLA */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isSlaOverdue ? (
                          <span
                            className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FF2121]/20 text-[#FF2121] border border-[#FF2121]/35"
                            title="Quá thời hạn cam kết SLA"
                          >
                            Quá hạn
                          </span>
                        ) : (
                          <span
                            className="inline-block px-1.5 py-0.2 rounded text-[10px] text-[#7E8B96] bg-white/5 border border-white/10"
                            title="Trong thời hạn SLA"
                          >
                            Trong hạn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Provenance */}
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[#7E8B96]">
          <span>Phím Enter hoặc Click để chọn xem chi tiết cảnh báo</span>
          <span>Dữ liệu: {ALERT_DEMO_FIXTURE_ID}</span>
        </div>
      </div>
    );
  },
);
