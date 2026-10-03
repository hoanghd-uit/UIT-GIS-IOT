import React from 'react';
import { DashboardAvailability, DashboardDataMode, DashboardProvenance } from '@/types/dashboard';
import { DATA_MODE_LABELS } from '@/lib/dashboard/provenance';

export interface DataModeBadgeProps {
  mode: DashboardDataMode;
  provenance?: DashboardProvenance;
  availability?: DashboardAvailability;
  className?: string;
  size?: 'sm' | 'md';
}

const MODE_CONFIGS: Record<
  DashboardDataMode,
  {
    bg: string;
    border: string;
    text: string;
    icon: string;
    description: string;
  }
> = {
  live: {
    bg: 'rgba(46, 207, 127, 0.12)',
    border: 'rgba(46, 207, 127, 0.4)',
    text: 'var(--success)',
    icon: '●',
    description: 'Dữ liệu thực từ nguồn thiết bị / hệ thống kết nối',
  },
  derived: {
    bg: 'rgba(34, 199, 232, 0.12)',
    border: 'rgba(34, 199, 232, 0.4)',
    text: 'var(--accent-cyan)',
    icon: '✦',
    description: 'Dữ liệu tổng hợp tính toán từ các chuỗi quan sát',
  },
  manual: {
    bg: 'rgba(255, 171, 0, 0.12)',
    border: 'rgba(255, 171, 0, 0.4)',
    text: '#ffab00',
    icon: '✎',
    description: 'Dữ liệu nhập tay hoặc quản trị thủ công',
  },
  demo: {
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.4)',
    text: '#c084fc',
    icon: '◈',
    description: 'Dữ liệu demo xác định theo phiên bản kịch bản',
  },
};

export function DataModeBadge({
  mode,
  provenance,
  availability,
  className = '',
  size = 'md',
}: DataModeBadgeProps) {
  // Guardrail: Never label unavailable/empty/error data as "live" merely because live was the target
  const isUnavailableState = availability && availability !== 'ready';
  const config = MODE_CONFIGS[mode];
  const modeLabel = DATA_MODE_LABELS[mode] || mode;

  // Build accessible title
  const caveatText = provenance?.caveats?.length
    ? `\nLưu ý: ${provenance.caveats.join('; ')}`
    : '';
  const fixtureText = provenance?.fixtureVersion
    ? `\nPhiên bản fixture: ${provenance.fixtureVersion}`
    : '';
  const sourceText = provenance?.sourceId
    ? `\nNguồn: ${provenance.sourceId}`
    : '';

  const tooltip = isUnavailableState
    ? `Trạng thái: Chưa có dữ liệu hoạt động (${modeLabel})`
    : `${config.description}${fixtureText}${sourceText}${caveatText}`;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      role="note"
      aria-label={`Chế độ dữ liệu: ${modeLabel}`}
      title={tooltip}
      className={`inline-flex items-center font-medium rounded-full border transition-colors select-none ${sizeClasses} ${className}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.text,
      }}
    >
      <span aria-hidden="true" className="text-[11px] font-bold">
        {config.icon}
      </span>
      <span>{modeLabel}</span>
      {provenance?.fixtureVersion && (
        <span
          className="text-[10px] font-mono opacity-80 border-l pl-1 ml-0.5"
          style={{ borderColor: config.border }}
        >
          v{provenance.fixtureVersion}
        </span>
      )}
    </span>
  );
}
