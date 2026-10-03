'use client';

import React, { useState } from 'react';
import { useDashboardAbility } from './DashboardAbilityProvider';

export function DashboardAccountControls() {
  const { user, logout, isLoggingOut } = useDashboardAbility();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      setErrorMessage(null);
      await logout();
    } catch (err: any) {
      setErrorMessage('Đăng xuất thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div
      data-testid="account-controls"
      className="w-full flex flex-col gap-2 p-2.5 rounded-xl border"
      style={{
        backgroundColor: 'var(--panel-elevated)',
        borderColor: 'var(--border)',
      }}
      aria-label="Thông tin tài khoản và đăng xuất"
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex flex-col min-w-0">
          <span
            data-testid="user-username"
            className="text-[13px] font-semibold truncate tracking-tight"
            style={{ color: 'var(--text-primary)' }}
            title={user.username}
          >
            {user.username}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: user.role === 'manager' ? '#4FB9AD' : '#8899A6',
              }}
              aria-hidden="true"
            />
            <span
              data-testid="user-role-badge"
              className="text-[11px] font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {user.displayRole}
            </span>
          </div>
        </div>

        <button
          data-testid="logout-button"
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
          }}
          aria-label="Đăng xuất khỏi hệ thống"
        >
          {isLoggingOut ? 'Đang thoát…' : 'Đăng xuất'}
        </button>
      </div>

      {errorMessage && (
        <div className="text-[11px] text-red-400 mt-0.5" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
