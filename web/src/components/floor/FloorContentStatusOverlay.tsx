"use client";

import React from "react";
import { useUnityViewer } from "@/components/unity/UnityViewerRuntime.client";
import { FloorId } from "@/types/viewer";

interface FloorContentStatusOverlayProps {
  floorId: FloorId;
}

export function FloorContentStatusOverlay({ floorId }: FloorContentStatusOverlayProps) {
  const { viewerStatus, errorMessage, retryCurrentFloor } = useUnityViewer();

  if (viewerStatus !== "loading-floor" &&
      viewerStatus !== "floor-unavailable" &&
      viewerStatus !== "error") {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
      {viewerStatus === "loading-floor" && (
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-xl px-5 py-3.5 shadow-2xl flex items-center gap-3 text-cyan-300">
          <svg
            className="animate-spin h-5 w-5 text-cyan-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span className="text-sm font-medium tracking-wide">
            Đang tải mô hình 3D Tầng {floorId}...
          </span>
        </div>
      )}

      {viewerStatus === "floor-unavailable" && (
        <div className="pointer-events-auto max-w-md bg-slate-900/90 backdrop-blur-md border border-amber-500/40 rounded-xl p-5 shadow-2xl text-center">
          <div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 rounded-full bg-amber-500/20 text-amber-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-100 mb-1">
            Tầng {floorId} chưa có mô hình 3D
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Dữ liệu mô hình cho tầng này đang được chuẩn bị. Bạn có thể chọn tầng khác (ví dụ Tầng 4 hoặc Tầng 6) trên danh sách bên phải.
          </p>
        </div>
      )}

      {viewerStatus === "error" && (
        <div className="pointer-events-auto max-w-md bg-slate-900/90 backdrop-blur-md border border-rose-500/40 rounded-xl p-5 shadow-2xl text-center">
          <div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 rounded-full bg-rose-500/20 text-rose-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-100 mb-1">
            Không thể tải mô hình Tầng {floorId}
          </h3>
          <p className="text-xs text-rose-300/80 mb-4">
            {errorMessage || "Lỗi kết nối tải asset bundle"}
          </p>
          <button
            type="button"
            onClick={retryCurrentFloor}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer shadow-md"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}

