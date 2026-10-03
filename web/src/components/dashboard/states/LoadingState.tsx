import React from 'react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Đang tải dữ liệu...',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[160px] ${className}`}
    >
      <div
        className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3"
        style={{ borderColor: 'var(--accent-cyan)', borderTopColor: 'transparent' }}
        aria-hidden="true"
      />
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  );
}
