import React from 'react';

export interface EmptyDataStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyDataState({
  title = 'Không có dữ liệu',
  description = 'Chưa có bản ghi nào phù hợp với bộ lọc hoặc khoảng thời gian đã chọn.',
  actionText,
  onAction,
  className = '',
}: EmptyDataStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[180px] rounded-lg border border-dashed ${className}`}
      style={{
        backgroundColor: 'rgba(11, 34, 56, 0.4)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: 'var(--panel-elevated)', color: 'var(--text-muted)' }}
        aria-hidden="true"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-xs max-w-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-3 py-1.5 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
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
