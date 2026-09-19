"use client";

import React from "react";
import { BUILDING_E_FLOOR_IDS, FloorId } from "@/types/viewer";
import { formatFloorLabel } from "@/config/buildings";

interface FloorLocatorIsometricProps {
  buildingId: string;
  currentFloorId: string;
}

export function FloorLocatorIsometric({
  buildingId,
  currentFloorId,
}: FloorLocatorIsometricProps) {
  // Ordered from bottom to top: G, 1, 2, 3, ..., 12
  const floorsBottomToTop: FloorId[] = [...BUILDING_E_FLOOR_IDS].reverse() as FloorId[];
  const totalLayers = floorsBottomToTop.length; // 13 layers

  const activeIndex = floorsBottomToTop.findIndex((f) => f === currentFloorId);

  // Isometric projection parameters
  // Isometric center: (cx, baseCy)
  const cx = 95;
  const baseCy = 175;
  const rx = 52; // horizontal radius / width
  const ry = 22; // vertical radius / angle
  const layerHeight = 9.5; // height per floor slab

  const isInvalidFloor = activeIndex === -1;

  return (
    <div className="w-full flex flex-col items-center bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 shadow-inner select-none">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
          Vị trí trong tòa nhà
        </span>
        <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
          {isInvalidFloor ? "Không xác định" : formatFloorLabel(currentFloorId as FloorId)}
        </span>
      </div>

      <div className="relative w-full aspect-[4/3] max-h-52 flex items-center justify-center">
        <svg
          viewBox="0 0 220 205"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`Sơ đồ vị trí tầng: ${isInvalidFloor ? "Không xác định" : formatFloorLabel(currentFloorId as FloorId)}`}
        >
          <defs>
            <linearGradient id="activeGradientLeft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="activeGradientRight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0e7490" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="activeGradientTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render layers from bottom (index 0) to top (index totalLayers - 1) */}
          {floorsBottomToTop.map((floor, i) => {
            const isCurrent = i === activeIndex;
            const yBottom = baseCy - i * layerHeight;
            const yTop = yBottom - layerHeight;

            // Diamond vertices at yTop
            const pTopNorth = `${cx},${yTop - ry}`;
            const pTopEast = `${cx + rx},${yTop}`;
            const pTopSouth = `${cx},${yTop + ry}`;
            const pTopWest = `${cx - rx},${yTop}`;

            // Vertices at yBottom
            const pBotSouth = `${cx},${yBottom + ry}`;
            const pBotWest = `${cx - rx},${yBottom}`;
            const pBotEast = `${cx + rx},${yBottom}`;

            // Left Face: Top-West -> Top-South -> Bot-South -> Bot-West
            const leftFace = `${pTopWest} ${pTopSouth} ${pBotSouth} ${pBotWest}`;
            // Right Face: Top-South -> Top-East -> Bot-East -> Bot-South
            const rightFace = `${pTopSouth} ${pTopEast} ${pBotEast} ${pBotSouth}`;
            // Top Face: Top-North -> Top-East -> Top-South -> Top-West
            const topFace = `${pTopNorth} ${pTopEast} ${pTopSouth} ${pTopWest}`;

            return (
              <g key={floor} className="transition-all duration-300">
                {/* Left Face */}
                <polygon
                  points={leftFace}
                  fill={isCurrent ? "url(#activeGradientLeft)" : i % 2 === 0 ? "#1e293b" : "#172234"}
                  stroke={isCurrent ? "#22d3ee" : "#334155"}
                  strokeWidth={isCurrent ? "1.5" : "0.7"}
                  filter={isCurrent ? "url(#glow)" : undefined}
                />

                {/* Right Face */}
                <polygon
                  points={rightFace}
                  fill={isCurrent ? "url(#activeGradientRight)" : i % 2 === 0 ? "#0f172a" : "#0d1527"}
                  stroke={isCurrent ? "#22d3ee" : "#334155"}
                  strokeWidth={isCurrent ? "1.5" : "0.7"}
                  filter={isCurrent ? "url(#glow)" : undefined}
                />

                {/* Top Face: render if top layer or active layer to avoid occlusion */}
                {(i === totalLayers - 1 || isCurrent) && (
                  <polygon
                    points={topFace}
                    fill={isCurrent ? "url(#activeGradientTop)" : "#334155"}
                    stroke={isCurrent ? "#a5f3fc" : "#475569"}
                    strokeWidth={isCurrent ? "1.5" : "0.7"}
                    filter={isCurrent ? "url(#glow)" : undefined}
                  />
                )}
              </g>
            );
          })}

          {/* Callout Indicator line and label for the active floor */}
          {activeIndex !== -1 && (
            <g className="transition-all duration-300">
              {(() => {
                const targetY = baseCy - activeIndex * layerHeight;
                const lineStartX = cx + rx;
                const lineEndX = cx + rx + 22;
                return (
                  <>
                    <line
                      x1={lineStartX}
                      y1={targetY}
                      x2={lineEndX}
                      y2={targetY}
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                    />
                    <circle cx={lineStartX} cy={targetY} r="2.5" fill="#22d3ee" />
                    <rect
                      x={lineEndX + 2}
                      y={targetY - 9}
                      width={44}
                      height={18}
                      rx={3}
                      fill="#083344"
                      stroke="#06b6d4"
                      strokeWidth="1"
                    />
                    <text
                      x={lineEndX + 24}
                      y={targetY + 4}
                      textAnchor="middle"
                      fill="#67e8f9"
                      fontSize="9.5"
                      fontWeight="bold"
                    >
                      {currentFloorId === "G" ? "TẦNG G" : `TẦNG ${currentFloorId}`}
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* Building ground label */}
          <text
            x={cx}
            y={baseCy + ry + 16}
            textAnchor="middle"
            fill="#64748b"
            fontSize="9"
            fontWeight="500"
          >
            Tòa E (13 Tầng)
          </text>
        </svg>
      </div>
    </div>
  );
}

