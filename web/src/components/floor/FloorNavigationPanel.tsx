"use client";

import React from "react";
import Link from "next/link";
import { BUILDING_E_FLOORS, BUILDING_E_NAME } from "@/config/buildings";
import { buildFloorRoute } from "@/lib/viewer-routes";
import { BuildingId, FloorId } from "@/types/viewer";

interface FloorNavigationPanelProps {
  buildingId: BuildingId;
  currentFloorId: FloorId;
}

export function FloorNavigationPanel({
  buildingId,
  currentFloorId,
}: FloorNavigationPanelProps) {
  return (
    <div
      className="pointer-events-auto flex w-56 max-h-[calc(100vh-5rem)] flex-col rounded-lg border shadow-xl backdrop-blur select-none"
      style={{
        backgroundColor: "rgba(7, 25, 43, 0.95)",
        borderColor: "rgba(78, 163, 225, 0.25)",
      }}
      role="region"
      aria-label="Điều hướng tầng"
    >
      {/* Panel Header */}
      <div
        className="flex flex-col border-b px-3.5 py-3 shrink-0"
        style={{ borderColor: "rgba(78, 163, 225, 0.2)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider uppercase text-[#f4f8fc]">
            ĐIỀU HƯỚNG TẦNG
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
            style={{
              backgroundColor: "rgba(22, 139, 255, 0.15)",
              color: "#22c7e8",
              border: "1px solid rgba(34, 199, 232, 0.3)",
            }}
          >
            {buildingId}
          </span>
        </div>
        <span className="mt-0.5 text-[11px] text-[#8fa8bd]">
          {BUILDING_E_NAME}
        </span>
      </div>

      {/* Floor List */}
      <nav
        className="flex flex-col gap-1 overflow-y-auto p-2 min-h-0"
        aria-label="Danh sách tầng"
      >
        {BUILDING_E_FLOORS.map((floor) => {
          const isActive = floor.floorId === currentFloorId;

          if (isActive) {
            return (
              <div
                key={floor.floorId}
                aria-current="page"
                className="flex items-center justify-between rounded px-3 py-2 text-xs font-semibold text-white shadow-sm"
                style={{
                  backgroundColor: "#168bff",
                  border: "1px solid #3ba0ff",
                }}
              >
                <span>{floor.label}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              </div>
            );
          }

          return (
            <Link
              key={floor.floorId}
              href={buildFloorRoute(buildingId, floor.floorId)}
              prefetch={false}
              className="group flex items-center justify-between rounded px-3 py-2 text-xs font-medium text-[#c4d8e8] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168bff]"
              style={{
                backgroundColor: "rgba(11, 34, 56, 0.6)",
                border: "1px solid rgba(30, 58, 90, 0.6)",
              }}
            >
              <span>{floor.label}</span>
              <span className="text-[10px] opacity-0 group-hover:opacity-100 text-[#22c7e8] transition-opacity">
                →
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

