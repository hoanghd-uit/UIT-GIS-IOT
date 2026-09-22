"use client";

import React from "react";
import { Unity } from "react-unity-webgl";
import { useUnityViewer } from "./UnityViewerRuntime.client";

export function UnityViewerCanvas() {
  const { unityProvider, isLoaded, loadingProgression, viewerStatus, statusLabel } =
    useUnityViewer();

  const loadingPercentage = Math.round(loadingProgression * 100);

  const getStatusDotClass = () => {
    if (!isLoaded) {
      return "bg-[#22c7e8] animate-pulse";
    }
    switch (viewerStatus) {
      case "error":
        return "bg-[#ef4444]";
      case "loading-floor":
        return "bg-[#22c7e8] animate-pulse";
      case "floor-ready":
      case "campus-ready":
      case "initial-loading":
      default:
        return "bg-[#2ecf7f]";
    }
  };

  const dpr =
    typeof window === "undefined"
      ? 1
      : Math.min(window.devicePixelRatio || 1, 2);

  return (
    <div className="relative h-full w-full min-h-0 min-w-0 overflow-hidden bg-[#020a12]">
      {/* Unity Canvas */}
      <Unity
        unityProvider={unityProvider}
        devicePixelRatio={dpr}
        className="h-full w-full outline-none"
        tabIndex={1}
      />

      {/* Initial WebGL Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#061525]">
          <div className="flex w-64 flex-col items-center gap-3">
            <div className="text-sm font-medium tracking-wide text-[#f4f8fc]">
              Loading Campus
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#102b47]">
              <div
                className="h-full bg-[#168bff] transition-all duration-200 ease-out"
                style={{ width: `${loadingPercentage}%` }}
              />
            </div>
            <div className="text-xs font-mono text-[#8fa8bd]">
              {loadingPercentage}%
            </div>
          </div>
        </div>
      )}

      {/* Status Chip */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded border border-[rgba(78,163,225,0.25)] bg-[#0b2238]/90 px-3 py-1.5 text-xs select-none">
        <span className={`h-2 w-2 rounded-full ${getStatusDotClass()}`} />
        <span className="font-medium text-[#f4f8fc]">{statusLabel}</span>
      </div>
    </div>
  );
}

