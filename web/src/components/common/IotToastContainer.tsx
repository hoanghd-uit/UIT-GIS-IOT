"use client";

import React from "react";
import { useIotToast } from "@/context/IotToastContext";

export function IotToastContainer() {
  const { toasts, dismissToast } = useIotToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-md w-[calc(100vw-2rem)] sm:w-96 pointer-events-none select-none"
    >
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";

        const borderStyle = isError
          ? "border-rose-500/60 bg-slate-950/95 shadow-rose-950/40"
          : isWarning
          ? "border-amber-500/60 bg-slate-950/95 shadow-amber-950/30"
          : "border-sky-500/50 bg-slate-950/95 shadow-sky-950/30";

        const iconBadge = isError ? "⚠️" : isWarning ? "⚠️" : "ℹ️";
        const iconBg = isError
          ? "bg-rose-500/20 text-rose-300"
          : isWarning
          ? "bg-amber-500/20 text-amber-300"
          : "bg-sky-500/20 text-sky-300";

        return (
          <div
            key={toast.id}
            role={isError ? "alert" : "status"}
            className={`pointer-events-auto flex flex-col gap-2 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl text-xs text-slate-200 animate-in fade-in slide-in-from-top-2 duration-200 ${borderStyle}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 ${iconBg}`}>
                  {iconBadge}
                </span>
                <div className="flex flex-col min-w-0">
                  {toast.deviceId && (
                    <span className="font-mono text-[10px] text-cyan-400 font-semibold truncate">
                      {toast.deviceId}
                    </span>
                  )}
                  <p className="text-xs text-slate-100 leading-snug font-medium">
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-1"
                aria-label="Đóng thông báo"
              >
                ✕
              </button>
            </div>

            {toast.onRetry && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    dismissToast(toast.id);
                    toast.onRetry?.();
                  }}
                  className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

