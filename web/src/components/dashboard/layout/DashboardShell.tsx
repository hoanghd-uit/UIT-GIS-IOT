'use client';

import React, { useState, useEffect } from 'react';
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

function renderRouteIcon(routeId: string, className = 'w-5 h-5') {
  switch (routeId) {
    case 'overview':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'energy-water':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'environment':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10a2 2 0 10-2-2H4a2 2 0 000 4h8a2 2 0 002-2zm4-4a2 2 0 10-2-2H4a2 2 0 000 4h12a2 2 0 002-2zm-2 8a2 2 0 10-2-2H4a2 2 0 000 4h10a2 2 0 002-2z" />
        </svg>
      );
    case 'alerts':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 'iot':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.393 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      );
    case 'parking':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M3 11l1.5-4.5A2 2 0 016.4 5h11.2a2 2 0 011.9 1.5L21 11v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
        </svg>
      );
    case 'fire-safety':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--app-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* ========================================================= */}
      {/* 1. High-Level Sidebar (Global Rail: w-16 / 64px)          */}
      {/* ========================================================= */}
      <aside
        className="flex w-16 flex-col items-center justify-between border-r py-4 z-30 shrink-0"
        style={{
          backgroundColor: 'var(--high-level-sidebar-bg)',
          borderColor: 'var(--border)',
        }}
        aria-label="Điều hướng cấp cao hệ thống"
      >
        <div className="flex flex-col items-center gap-6">
          {/* Logo / Brand Symbol */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-xs shadow-md transition-colors"
            style={{
              backgroundColor: 'var(--panel-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--primary)',
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
              title="Campus View (Viewer)"
            >
              <svg
                className="h-5 w-5 group-hover:text-[#4FB9AD] transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
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
                color: 'var(--primary)',
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
                aria-hidden="true"
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
          className="text-[10px] tracking-wider uppercase font-mono opacity-50"
          style={{ color: 'var(--text-muted)' }}
        >
          v1.0
        </div>
      </aside>

      {/* Mobile Drawer Overlay for Dashboard Workspace */}
      {mobileMenuOpen && (
        <div
          role="presentation"
          className="fixed inset-y-0 left-16 right-0 z-40 bg-black/70 xl:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* 2. Dashboard Sidebar (Secondary Sidebar: 288px / w-72)     */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-16 z-50 flex w-72 flex-col justify-between border-r transition-transform duration-200 xl:static xl:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--dashboard-sidebar-bg)',
          borderColor: 'var(--border)',
          width: 'var(--dashboard-sidebar-width, 18rem)',
        }}
        aria-label="Điều hướng phân hệ Dashboard"
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand Header */}
          <div
            className="flex h-16 items-center justify-between px-4 border-b shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs tracking-wider shadow-inner"
                style={{
                  backgroundColor: '#162833',
                  border: '1px solid rgba(79, 185, 173, 0.35)',
                  color: 'var(--primary)',
                }}
              >
                BEI
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Digital Twin
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Tòa E · Living Lab
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              className="xl:hidden p-1.5 rounded-lg text-sm focus:outline-none hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Đóng bảng điều hướng"
            >
              ✕
            </button>
          </div>

          {/* Navigation Items List */}
          <nav
            aria-label="Danh mục phân hệ giám sát"
            className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1"
          >
            <div
              className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
            >
              GIÁM SÁT
            </div>

            {DASHBOARD_ROUTES.map((route) => {
              const isActive = isDashboardRouteActive(pathname, route.path);
              return (
                <Link
                  key={route.id}
                  href={route.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'shadow-sm text-[#E6EDF1]'
                      : 'hover:bg-white/5 text-[#A5B0B9] hover:text-[#E6EDF1]'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--panel-elevated)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Left Teal Active Indicator */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
                      style={{ backgroundColor: 'var(--primary)' }}
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className="shrink-0 transition-colors"
                    style={{
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    }}
                  >
                    {renderRouteIcon(route.id, 'w-4 h-4')}
                  </span>
                  <span className="truncate text-[13px]">{route.shortTitle || route.title}</span>
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
          <div className="text-[10px] text-center font-mono opacity-50" style={{ color: 'var(--text-muted)' }}>
            Digital Twin · Building E
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 3. Dashboard Content Canvas                               */}
      {/* ========================================================= */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Mobile/Tablet Drawer Toggle Bar (Hidden on desktop reference viewport) */}
        <div className="xl:hidden flex h-12 items-center justify-between border-b px-4 shrink-0 bg-[#0A1116] border-[var(--border)]">
          <button
            type="button"
            className="flex items-center gap-2 p-1.5 rounded-lg text-xs font-medium hover:bg-white/5"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở bảng điều hướng Dashboard"
          >
            <svg className="w-5 h-5 text-[#4FB9AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs font-semibold">Phân hệ giám sát</span>
          </button>
          <Link
            href={VIEWER_CAMPUS_PATH}
            className="text-[11px] px-2.5 py-1 rounded border border-[rgba(79,185,173,0.3)] text-[#4FB9AD] hover:bg-[#4FB9AD]/10 transition-colors"
          >
            3D Campus
          </Link>
        </div>

        {/* Scrollable Content Viewport (No max-w-7xl, clean full workspace) */}
        <div
          id="dashboard-main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6 lg:px-8 lg:py-7"
          style={{ backgroundColor: 'var(--app-bg)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

