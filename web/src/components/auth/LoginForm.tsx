'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiLogin } from '../../lib/auth/auth-api';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  // Sanitize next redirect target
  let safeNext = '/dashboard/overview';
  if (nextParam && nextParam.startsWith('/dashboard') && !nextParam.startsWith('//')) {
    safeNext = nextParam;
  }

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      await apiLogin({ username: trimmedUsername, password });
      router.push(safeNext);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-[420px] rounded-2xl border p-7 sm:p-8 flex flex-col gap-6 shadow-2xl"
      style={{
        backgroundColor: '#0D171E',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-sm tracking-wider shadow-inner"
          style={{
            backgroundColor: '#162833',
            border: '1px solid rgba(79, 185, 173, 0.35)',
            color: '#4FB9AD',
          }}
          aria-hidden="true"
        >
          BEI
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
          Đăng nhập Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-[#8899A6]">
          Digital Twin · Tòa E Living Lab
        </p>
      </div>

      {/* Login Form */}
      <form data-testid="login-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Username Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="username"
            className="text-xs font-medium text-[#C5D0D8]"
          >
            Tên đăng nhập
          </label>
          <input
            id="username"
            data-testid="login-username-input"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            placeholder="beiviewer hoặc beimanager"
            className="w-full h-11 px-3.5 rounded-xl text-sm text-white placeholder-[#546673] border transition-colors focus:outline-none focus:ring-1 focus:ring-[#4FB9AD]"
            style={{
              backgroundColor: '#121F28',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-medium text-[#C5D0D8]"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            data-testid="login-password-input"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="•••••••"
            className="w-full h-11 px-3.5 rounded-xl text-sm text-white placeholder-[#546673] border transition-colors focus:outline-none focus:ring-1 focus:ring-[#4FB9AD]"
            style={{
              backgroundColor: '#121F28',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </div>

        {/* Inline Error Alert */}
        {errorMessage && (
          <div
            id="login-error"
            data-testid="login-error-alert"
            role="alert"
            className="p-3 rounded-xl text-xs font-medium border text-red-300 flex items-center gap-2"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <span aria-hidden="true">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          id="login-submit-btn"
          data-testid="login-submit-button"
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-2 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#4FB9AD] focus:ring-offset-2 focus:ring-offset-[#0D171E] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          style={{
            backgroundColor: '#4FB9AD',
            color: '#071219',
          }}
        >
          {isLoading ? (
            <>
              <span
                className="w-4 h-4 border-2 border-[#071219] border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>Đang đăng nhập…</span>
            </>
          ) : (
            <span>Đăng nhập</span>
          )}
        </button>
      </form>
    </div>
  );
}
