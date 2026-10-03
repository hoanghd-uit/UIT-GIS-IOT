import React from 'react';

export type StatusBadgeTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
  size?: 'sm' | 'md';
  className?: string;
}

const TONE_CONFIGS: Record<
  StatusBadgeTone,
  {
    bg: string;
    border: string;
    text: string;
    dotBg: string;
  }
> = {
  info: {
    bg: 'rgba(34, 199, 232, 0.12)',
    border: 'rgba(34, 199, 232, 0.35)',
    text: 'var(--accent-cyan)',
    dotBg: 'var(--accent-cyan)',
  },
  success: {
    bg: 'rgba(46, 207, 127, 0.12)',
    border: 'rgba(46, 207, 127, 0.35)',
    text: 'var(--success)',
    dotBg: 'var(--success)',
  },
  warning: {
    bg: 'rgba(255, 171, 0, 0.12)',
    border: 'rgba(255, 171, 0, 0.35)',
    text: '#ffab00',
    dotBg: '#ffab00',
  },
  danger: {
    bg: 'rgba(255, 100, 111, 0.12)',
    border: 'rgba(255, 100, 111, 0.35)',
    text: 'var(--danger)',
    dotBg: 'var(--danger)',
  },
  neutral: {
    bg: 'rgba(143, 168, 189, 0.12)',
    border: 'rgba(143, 168, 189, 0.35)',
    text: 'var(--text-muted)',
    dotBg: 'var(--text-muted)',
  },
};

export function StatusBadge({
  label,
  tone = 'neutral',
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const config = TONE_CONFIGS[tone];
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      role="status"
      className={`inline-flex items-center font-medium rounded-full border transition-colors select-none ${sizeClasses} ${className}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.text,
      }}
    >
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.dotBg }}
      />
      <span>{label}</span>
    </span>
  );
}
