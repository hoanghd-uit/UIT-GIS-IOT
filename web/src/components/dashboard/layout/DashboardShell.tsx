'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DASHBOARD_ROUTES,
  isDashboardRouteActive,
  VIEWER_CAMPUS_PATH,
} from '@/config/dashboard-routes';

export interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active route
  const currentRoute = DASHBOARD_ROUTES.find((r) =>
    isDashboardRouteActive(pathname, r.path)
  );

  return (
    <div
      className="flex h-screen w-screen overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--app-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* ========================================================= */}
      {/* 1. Web-HighLevel-Menu (Shared Left Navigation Rail: w-16) */}
      {/* ========================================================= */}
      <aside
        className="flex w-16 flex-col items-center justify-between border-r py-4 z-30 shrink-0"
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
        aria-label="Điều hướng cấp cao hệ thống"
      >
        <div className="flex flex-col items-center gap-6">
          {/* Logo / Brand Symbol */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm shadow-md"
            style={{
              backgroundColor: 'var(--panel-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--accent-cyan)',
            }}
            title="UIT Digital Twin"
          >
            UIT
          </div>

          {/* Navigation Items: Campus View & Dashboard */}
          <nav className="flex flex-col items-center gap-3">
            {/* Campus View */}
            <Link
              href={VIEWER_CAMPUS_PATH}
              className="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-muted)',
              }}
              title="Campus View"
            >
              <svg
                className="h-5 w-5 group-hover:text-cyan-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </Link>

            {/* Dashboard (Active) */}
            <Link
              href="/dashboard/overview"
              className="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--panel-elevated)',
                border: '1px solid var(--primary)',
                color: 'var(--accent-cyan)',
              }}
              title="Dashboard"
              aria-current="page"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            </Link>
          </nav>
        </div>

        {/* Footer info / Version */}
        <div
          className="text-[10px] tracking-wider uppercase opacity-60 font-mono"
          style={{ color: 'var(--text-muted)' }}
        >
          v1.0
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* 2. Dashboard Menu (Sub-menu Panel: w-64)                   */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-16 z-50 flex w-64 flex-col justify-between border-r transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--panel-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Dashboard Header */}
          <div
            className="flex h-14 items-center justify-between px-4 border-b shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                GIS & IOT DASHBOARD
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Tòa nhà E — Digital Twin
              </span>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              className="md:hidden p-1.5 rounded text-sm focus:outline-none"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Đóng bảng điều hướng"
            >
              ✕
            </button>
          </div>

          {/* Navigation Items List */}
          <nav
            aria-label="Điều hướng chính Dashboard"
            className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5"
          >
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider opacity-60" style={{ color: 'var(--text-muted)' }}>
              Phân hệ chức năng
            </div>

            {DASHBOARD_ROUTES.map((route) => {
              const isActive = isDashboardRouteActive(pathname, route.path);
              return (
                <Link
                  key={route.id}
                  href={route.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive ? 'shadow-sm' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--panel-elevated)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0"
                      style={{
                        backgroundColor: isActive ? 'var(--primary)' : 'rgba(78, 163, 225, 0.1)',
                        color: isActive ? '#ffffff' : 'var(--accent-cyan)',
                      }}
                    >
                      {route.pageNumber}
                    </span>
                    <span className="truncate">{route.title}</span>
                  </div>

                  {/* Invariant: Page 06 has no fabricated notification counter */}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Dashboard Menu Footer */}
        <div
          className="p-3 border-t flex flex-col items-center gap-1 shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[10px] text-center font-mono opacity-60" style={{ color: 'var(--text-muted)' }}>
            Big Phase 02 — Sub-phase 01
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 3. Dashboard Content Area                                 */}
      {/* ========================================================= */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top Header */}
        <header
          className="flex h-14 items-center justify-between border-b px-4 md:px-6 z-20 shrink-0"
          style={{
            backgroundColor: 'var(--panel-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger button for mobile to open Dashboard Menu */}
            <button
              type="button"
              className="md:hidden p-1.5 rounded focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở bảng điều hướng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <span style={{ color: 'var(--text-muted)' }}>Dashboard</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ color: 'var(--accent-cyan)' }}>
                {currentRoute?.title || 'Tổng quan'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Switch to Digital Twin 3D */}
            <Link
              href={VIEWER_CAMPUS_PATH}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: 'rgba(34, 199, 232, 0.1)',
                border: '1px solid rgba(34, 199, 232, 0.3)',
                color: 'var(--accent-cyan)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>Digital Twin 3D</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <div
          id="dashboard-main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8"
          style={{ backgroundColor: 'var(--app-bg)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
