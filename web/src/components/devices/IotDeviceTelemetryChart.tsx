"use client";

import React, { useState, useMemo } from "react";

export interface ChartDataPoint {
  timestamp: string;
  value: number;
}

interface IotDeviceTelemetryChartProps {
  data: ChartDataPoint[];
  unit: string;
  metricLabel: string;
  rangeStart: string;
  rangeStop: string;
  height?: number;
}

export function IotDeviceTelemetryChart({
  data,
  unit,
  metricLabel,
  rangeStart,
  rangeStop,
  height = 140,
}: IotDeviceTelemetryChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    point: ChartDataPoint;
  } | null>(null);

  const width = 340;
  const padding = { top: 16, right: 16, bottom: 26, left: 38 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const startMs = useMemo(() => new Date(rangeStart).getTime(), [rangeStart]);
  const stopMs = useMemo(() => new Date(rangeStop).getTime(), [rangeStop]);
  const totalDuration = Math.max(1, stopMs - startMs);

  // Filter valid data points within range
  const validPoints = useMemo(() => {
    return data
      .filter((d) => typeof d.value === "number" && !isNaN(d.value))
      .map((d) => ({
        ...d,
        ms: new Date(d.timestamp).getTime(),
      }))
      .filter((d) => !isNaN(d.ms) && d.ms >= startMs && d.ms <= stopMs)
      .sort((a, b) => a.ms - b.ms);
  }, [data, startMs, stopMs]);

  // Compute Y-axis bounds
  const { minY, maxY } = useMemo(() => {
    if (validPoints.length === 0) {
      return { minY: 0, maxY: 10 };
    }
    const values = validPoints.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min = Math.max(0, min - 1);
      max = max + 1;
    }
    return { minY: min, maxY: max };
  }, [validPoints]);

  const yRange = Math.max(0.0001, maxY - minY);

  // Compute SVG coordinates
  const coordinates = useMemo(() => {
    return validPoints.map((p) => {
      const xRatio = (p.ms - startMs) / totalDuration;
      const yRatio = (p.value - minY) / yRange;
      const x = padding.left + xRatio * chartW;
      const y = padding.top + chartH - yRatio * chartH;
      return { x, y, point: p };
    });
  }, [validPoints, startMs, totalDuration, minY, yRange, chartW, chartH, padding.left, padding.top]);

  // SVG polyline string
  const polylinePoints = useMemo(() => {
    return coordinates.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  }, [coordinates]);

  // Format date helper
  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const formatTooltipDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  };

  if (validPoints.length === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/80 p-4"
        style={{ height }}
      >
        <span className="text-[11px]">Không có bản ghi hợp lệ cho {metricLabel} trong 72 giờ qua.</span>
      </div>
    );
  }

  return (
    <div className="relative w-full select-none bg-slate-950/40 rounded-xl border border-slate-800/80 p-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        {/* Horizontal grid lines */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left + chartW}
          y2={padding.top}
          stroke="#334155"
          strokeDasharray="2 2"
          strokeWidth={0.8}
        />
        <line
          x1={padding.left}
          y1={padding.top + chartH / 2}
          x2={padding.left + chartW}
          y2={padding.top + chartH / 2}
          stroke="#334155"
          strokeDasharray="2 2"
          strokeWidth={0.8}
        />
        <line
          x1={padding.left}
          y1={padding.top + chartH}
          x2={padding.left + chartW}
          y2={padding.top + chartH}
          stroke="#475569"
          strokeWidth={1}
        />

        {/* Y-axis Labels */}
        <text
          x={padding.left - 4}
          y={padding.top + 3}
          textAnchor="end"
          fill="#94a3b8"
          fontSize="9"
          fontFamily="monospace"
        >
          {maxY > 1000 ? (maxY / 1000).toFixed(1) + "k" : maxY.toFixed(maxY < 1 ? 2 : 0)}
        </text>
        <text
          x={padding.left - 4}
          y={padding.top + chartH + 3}
          textAnchor="end"
          fill="#94a3b8"
          fontSize="9"
          fontFamily="monospace"
        >
          {minY > 1000 ? (minY / 1000).toFixed(1) + "k" : minY.toFixed(minY < 1 ? 2 : 0)}
        </text>

        {/* X-axis Labels (Start - Middle - End) */}
        <text
          x={padding.left}
          y={height - 6}
          textAnchor="start"
          fill="#64748b"
          fontSize="9"
          fontFamily="monospace"
        >
          {formatDateLabel(rangeStart)} -72h
        </text>
        <text
          x={padding.left + chartW / 2}
          y={height - 6}
          textAnchor="middle"
          fill="#64748b"
          fontSize="9"
          fontFamily="monospace"
        >
          -36h
        </text>
        <text
          x={padding.left + chartW}
          y={height - 6}
          textAnchor="end"
          fill="#64748b"
          fontSize="9"
          fontFamily="monospace"
        >
          Nay
        </text>

        {/* Trend Polyline */}
        {coordinates.length > 1 && (
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points & Hover Target Circles */}
        {coordinates.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={coordinates.length > 50 ? 1.5 : 2.5}
              fill="#22d3ee"
              stroke="#0f172a"
              strokeWidth={1}
            />
            {/* Invisible large target for easy hover */}
            <circle
              cx={c.x}
              cy={c.y}
              r={8}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(c)}
            />
          </g>
        ))}

        {/* Active hovered point marker */}
        {hoveredPoint && (
          <g>
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={padding.top + chartH}
              stroke="#22d3ee"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r={4.5}
              fill="#06b6d4"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          </g>
        )}
      </svg>

      {/* Floating HTML Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute pointer-events-none z-30 px-2 py-1 bg-slate-900/95 border border-cyan-500/70 rounded-md shadow-xl text-[10px] text-slate-200"
          style={{
            left: Math.min(Math.max(8, hoveredPoint.x - 45), width - 110),
            top: Math.max(4, hoveredPoint.y - 42),
          }}
        >
          <div className="font-semibold text-cyan-300">
            {hoveredPoint.point.value.toLocaleString()} {unit}
          </div>
          <div className="text-[9px] text-slate-400">
            {formatTooltipDate(hoveredPoint.point.timestamp)}
          </div>
        </div>
      )}
    </div>
  );
}

