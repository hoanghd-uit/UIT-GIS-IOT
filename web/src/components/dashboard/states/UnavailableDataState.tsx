import React from 'react';

export interface UnavailableDataStateProps {
  title?: string;
  description?: string;
  badgeText?: string;
  phaseNote?: string;
  actionText?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
}

export function UnavailableDataState({
  title = 'Dữ liệu chưa được kết nối',
  description = 'Tính năng và nguồn dữ liệu này đang được chuẩn bị và sẽ được tích hợp trong các giai đoạn tiếp theo của Big Phase 02.',
  badgeText = 'Giai đoạn nền tảng (Phase 01)',
  phaseNote,
  actionText,
  onAction,
  compact = false,
  className = '',
}: UnavailableDataStateProps) {
  if (compact) {
    return (
      <div
        role="region"
        aria-label={title}
        className={`flex flex-col items-center justify-center p-4 text-center rounded-lg border border-dashed ${className}`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
          style={{ backgroundColor: 'var(--panel-elevated)', color: 'var(--primary)' }}
          aria-hidden="true"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h4 className="text-xs font-semibold mb-1 text-[#E6EDF1]">
          {title}
        </h4>
        <p className="text-[11px] max-w-xs text-[#7E8B96] leading-relaxed">
          {description}
        </p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[200px] rounded-lg border border-dashed ${className}`}
      style={{
        backgroundColor: 'rgba(11, 34, 56, 0.3)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: 'var(--panel-elevated)', color: 'var(--accent-cyan)' }}
        aria-hidden="true"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {badgeText && (
        <span
          className="inline-block px-2.5 py-0.5 rounded text-[11px] font-medium tracking-wide mb-2"
          style={{
            backgroundColor: 'rgba(34, 199, 232, 0.15)',
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(34, 199, 232, 0.3)',
          }}
        >
          {badgeText}
        </span>
      )}

      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>

      <p className="text-xs max-w-md mb-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>

      {phaseNote && (
        <p className="text-[11px] max-w-sm mb-4 font-mono opacity-80" style={{ color: 'var(--text-muted)' }}>
          {phaseNote}
        </p>
      )}

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-3.5 py-1.5 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 mt-2"
          style={{
            backgroundColor: 'var(--panel-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
