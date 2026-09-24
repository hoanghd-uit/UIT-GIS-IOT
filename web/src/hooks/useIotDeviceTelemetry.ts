"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchDeviceTelemetry } from "@/lib/iot-api";
import { DeviceTelemetryResponseDto } from "@/types/iot-telemetry";
import { useIotToast } from "@/context/IotToastContext";

const WINDOW_HOURS = 72;
const DEFAULT_LIMIT = 1000;
const CLIENT_TIMEOUT_MS = 25000; // 25s client watchdog per Phase 07 plan Section 6.7

export interface UseIotDeviceTelemetryOptions {
  deviceId: string | null;
  deviceTypeHint?: string;
  enabled?: boolean;
}

export interface UseIotDeviceTelemetryResult {
  data: DeviceTelemetryResponseDto | null;
  loading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Maps error message/status to user-facing copy per Section 6.5 of Phase 07 plan.
 */
export function mapTelemetryErrorMessage(rawMsg: string, deviceId: string): string {
  const lower = (rawMsg || "").toLowerCase();

  if (lower.includes("400") || lower.includes("chưa hợp lệ") || lower.includes("invalid")) {
    return `Không thể tải dữ liệu thiết bị ${deviceId}. Yêu cầu truy vấn chưa hợp lệ.`;
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return `Chưa thể truy cập dữ liệu thiết bị ${deviceId}. Vui lòng thử lại sau.`;
  }
  if (lower.includes("404") || lower.includes("not found")) {
    return `Không tìm thấy thiết bị ${deviceId} trên hệ thống dữ liệu.`;
  }
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Đang có quá nhiều yêu cầu. Vui lòng thử lại sau.";
  }
  if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("failed to fetch") || lower.includes("econnrefused")) {
    return `Không kết nối được dịch vụ dữ liệu cho thiết bị ${deviceId}.`;
  }
  if (lower.includes("timeout") || lower.includes("quá thời gian")) {
    return `Quá thời gian tải dữ liệu thiết bị ${deviceId}. Vui lòng thử lại.`;
  }
  if (lower.includes("chưa hỗ trợ") || lower.includes("unsupported")) {
    return "Chưa hỗ trợ dữ liệu cho loại thiết bị này.";
  }
  if (lower.includes("500") || lower.includes("502") || lower.includes("503") || lower.includes("504")) {
    return `Dịch vụ IoT đang gặp lỗi. Chưa tải được dữ liệu thiết bị ${deviceId}.`;
  }
  return rawMsg || `Dịch vụ IoT đang gặp lỗi. Chưa tải được dữ liệu thiết bị ${deviceId}.`;
}

/**
 * Hook managing IoT device telemetry fetching, rolling 72h window, request generation,
 * race condition elimination, floating toast notifications, and strictly in-memory state.
 */
export function useIotDeviceTelemetry({
  deviceId,
  deviceTypeHint,
  enabled = true,
}: UseIotDeviceTelemetryOptions): UseIotDeviceTelemetryResult {
  const [data, setData] = useState<DeviceTelemetryResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeDeviceIdRef = useRef<string | null>(null);
  const generationRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isTimeoutRef = useRef<boolean>(false);

  const { showToast, dismissDeviceToasts } = useIotToast();

  const executeFetch = useCallback(
    async (targetDeviceId: string, isRefreshAction = false) => {
      // 1. Invalidate and cancel previous request and timers
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const currentGen = ++generationRef.current;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      isTimeoutRef.current = false;

      // Setup 25-second watchdog timer
      timeoutIdRef.current = setTimeout(() => {
        if (generationRef.current === currentGen) {
          isTimeoutRef.current = true;
          controller.abort();
        }
      }, CLIENT_TIMEOUT_MS);

      // 2. Clear state on fresh device switch; dismiss previous device's toasts
      if (!isRefreshAction) {
        dismissDeviceToasts();
        setData(null);
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // 3. Compute exact rolling 72-hour window
      const stopDate = new Date();
      const startDate = new Date(stopDate.getTime() - WINDOW_HOURS * 60 * 60 * 1000);

      try {
        const result = await fetchDeviceTelemetry(
          targetDeviceId,
          {
            start: startDate.toISOString(),
            stop: stopDate.toISOString(),
            limit: DEFAULT_LIMIT,
            deviceType: deviceTypeHint,
          },
          controller.signal,
        );

        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        // Guard against race conditions and stale responses
        if (generationRef.current !== currentGen || activeDeviceIdRef.current !== targetDeviceId) {
          return;
        }

        setData(result);
        setError(null);

        // 4. Check for Empty Data (HTTP 200 with 0 valid records) -> Floating notification per R11
        const returnedCount = result?.coverage?.returnedCount ?? 0;
        const validCount = result?.coverage?.validCount ?? 0;
        if (returnedCount === 0 || validCount === 0) {
          showToast({
            type: "warning",
            deviceId: targetDeviceId,
            message: `Không có dữ liệu của thiết bị ${targetDeviceId} trong 72 giờ gần nhất.`,
            generation: currentGen,
            durationMs: 8000,
          });
        }
      } catch (err: any) {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        // Distinguish between intentional abort (device switch) and timeout abort
        if (err.name === "AbortError" && !isTimeoutRef.current) {
          return; // Superceded by fresh user action; do not notify stale abort
        }

        if (generationRef.current !== currentGen || activeDeviceIdRef.current !== targetDeviceId) {
          return;
        }

        let userMsg: string;
        if (isTimeoutRef.current) {
          userMsg = `Quá thời gian tải dữ liệu thiết bị ${targetDeviceId}. Vui lòng thử lại.`;
        } else {
          console.error(`[useIotDeviceTelemetry] Error fetching telemetry for ${targetDeviceId}:`, err);
          userMsg = mapTelemetryErrorMessage(err.message || "", targetDeviceId);
        }

        setError(userMsg);

        // Emit floating notification for fetch error per R11
        showToast({
          type: "error",
          deviceId: targetDeviceId,
          message: userMsg,
          generation: currentGen,
          onRetry: () => {
            executeFetch(targetDeviceId, true);
          },
        });
      } finally {
        if (generationRef.current === currentGen && activeDeviceIdRef.current === targetDeviceId) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [deviceTypeHint, showToast, dismissDeviceToasts],
  );

  // Trigger on deviceId change or selection
  useEffect(() => {
    activeDeviceIdRef.current = deviceId;

    if (!deviceId || !enabled) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      dismissDeviceToasts();
      setData(null);
      setLoading(false);
      setIsRefreshing(false);
      setError(null);
      return;
    }

    executeFetch(deviceId, false);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [deviceId, enabled, executeFetch, dismissDeviceToasts]);

  // Manual refresh method
  const refresh = useCallback(async () => {
    if (!activeDeviceIdRef.current) return;
    await executeFetch(activeDeviceIdRef.current, true);
  }, [executeFetch]);

  return {
    data,
    loading,
    isRefreshing,
    error,
    refresh,
  };
}
