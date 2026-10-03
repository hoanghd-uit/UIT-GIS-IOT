import React from 'react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Sanitizes any raw error object to prevent exposing stack traces,
 * database strings, authorization tokens, or internal URLs to users.
 */
export function sanitizeUserErrorMessage(rawError?: unknown, defaultMessage = 'Không thể tải dữ liệu vào lúc này. Vui lòng thử lại sau.'): string {
  if (!rawError) return defaultMessage;

  let rawString = '';
  if (rawError instanceof Error) {
    rawString = rawError.message;
  } else if (typeof rawError === 'string') {
    rawString = rawError;
  } else {
    return defaultMessage;
  }

  // Check for forbidden leaked patterns: stack traces, internal paths, tokens, SQL
  const isDangerous =
    /at\s+[a-zA-Z0-9._$<>]+\s+\(/i.test(rawString) ||
    /node_modules/i.test(rawString) ||
    /bearer\s+/i.test(rawString) ||
    /token/i.test(rawString) ||
    /password/i.test(rawString) ||
    /select\s+.*from/i.test(rawString) ||
    /http:\/\//i.test(rawString) ||
    /https:\/\//i.test(rawString);

  if (isDangerous) {
    return defaultMessage;
  }

  // If safe short message
  if (rawString.length > 0 && rawString.length < 150) {
    return rawString;
  }

  return defaultMessage;
}

export function ErrorState({
  title = 'Đã xảy ra lỗi nạp dữ liệu',
  message,
  error,
  onRetry,
  retryLabel = 'Thử lại',
  className = '',
}: ErrorStateProps) {
  const displayMessage = message || sanitizeUserErrorMessage(error);

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[180px] rounded-lg border ${className}`}
      style={{
        backgroundColor: 'rgba(255, 100, 111, 0.08)',
        borderColor: 'rgba(255, 100, 111, 0.3)',
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{
          backgroundColor: 'rgba(255, 100, 111, 0.15)',
          color: 'var(--danger)',
        }}
        aria-hidden="true"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--danger)' }}>
        {title}
      </h3>

      <p className="text-xs max-w-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {displayMessage}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3.5 py-1.5 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            backgroundColor: 'var(--panel-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
