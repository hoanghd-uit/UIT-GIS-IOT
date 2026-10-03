"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseViewerRoute } from "@/lib/viewer-routes";
import { BUILDING_E_NAME, formatFloorLabel } from "@/config/buildings";

interface ViewerShellProps {
  children?: React.ReactNode;
  unityCanvasSlot?: React.ReactNode;
}

export function ViewerShell({ children, unityCanvasSlot }: ViewerShellProps) {
  const pathname = usePathname();
  const route = parseViewerRoute(pathname);
  const isCampus = !route || route.view === "campus";

  return (
    <div
      className="flex h-screen w-screen overflow-hidden select-none"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Left Navigation Rail */}
      <aside
        className="flex w-16 flex-col items-center justify-between border-r py-4 z-20 shrink-0"
        style={{
          backgroundColor: "var(--panel-bg)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Logo / Brand Symbol */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm shadow-md"
            style={{
              backgroundColor: "var(--panel-elevated)",
              border: "1px solid var(--border)",
              color: "var(--accent-cyan)",
            }}
            title="UIT Digital Twin"
          >
            UIT
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-3">
            <Link
              href="/viewer/campus"
              className="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              style={{
                backgroundColor: isCampus ? "var(--panel-elevated)" : "transparent",
                border: `1px solid ${isCampus ? "var(--primary)" : "transparent"}`,
                color: "var(--text-primary)",
              }}
              title="Campus View"
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </Link>

            <Link
              href="/dashboard/overview"
              className="group flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              style={{
                backgroundColor: "transparent",
                border: "1px solid transparent",
                color: "var(--text-muted)",
              }}
              title="Dashboard"
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
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            </Link>
          </nav>
        </div>

        {/* Footer info / Version */}
        <div
          className="text-[10px] tracking-wider uppercase opacity-60 font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          v1.0
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top Bar */}
        <header
          className="flex h-14 items-center justify-between border-b px-5 z-20 shrink-0"
          style={{
            backgroundColor: "var(--panel-bg)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
              Digital Twin - Tòa nhà E, UIT
            </h1>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            {route?.view === "floor-detail" ? (
              <div className="flex items-center gap-2 text-xs font-medium">
                <span style={{ color: "var(--text-muted)" }}>{BUILDING_E_NAME}</span>
                <span style={{ color: "var(--text-muted)" }}>/</span>
                <span style={{ color: "var(--text-muted)" }}>{formatFloorLabel(route.floorId)}</span>
                <span style={{ color: "var(--text-muted)" }}>/</span>
                <span style={{ color: "var(--accent-cyan)" }}>Chi tiết tầng</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--accent-cyan)" }}>
                <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                Campus
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Environment Badge */}
            <div
              className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--panel-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              <span>View:</span>
              <span style={{ color: "var(--text-primary)" }}>
                {route?.view === "floor-detail" ? "Chi tiết tầng" : "3D Overview"}
              </span>
            </div>
          </div>
        </header>

        {/* Viewport Panel */}
        <main
          className="relative flex-1 min-w-0 min-h-0 overflow-hidden"
          style={{ backgroundColor: "var(--canvas-bg)" }}
        >
          {/* Canvas Slot (e.g. Unity WebGL Canvas or Placeholder) */}
          <div className="absolute inset-0 w-full h-full">
            {unityCanvasSlot || (
              <div className="flex h-full w-full items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
                Unity Campus canvas will load here
              </div>
            )}
          </div>

          {/* Route Overlay Layer */}
          {children && (
            <div className="pointer-events-none absolute inset-0 z-10">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

