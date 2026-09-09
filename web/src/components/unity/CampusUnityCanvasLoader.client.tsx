"use client";

import React from "react";
import dynamic from "next/dynamic";

const CampusUnityCanvas = dynamic(
  () =>
    import("./CampusUnityCanvas.client").then((mod) => mod.CampusUnityCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#061525] text-sm text-[#8fa8bd]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#168bff] border-t-transparent" />
          <span>Preparing 3D viewer...</span>
        </div>
      </div>
    ),
  }
);

export function CampusUnityCanvasLoader() {
  return <CampusUnityCanvas />;
}

