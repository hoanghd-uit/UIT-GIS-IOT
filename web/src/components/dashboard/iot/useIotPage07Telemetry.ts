'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardDeviceCatalogueItem } from '@/types/dashboard-iot';
import { fetchDashboardDeviceTelemetry } from '@/lib/dashboard/iot-telemetry-api';
import { computeTelemetryRange } from '@/lib/dashboard/iot-telemetry-range';

export interface DeviceRowSummary {
  deviceId: string;
  deviceType: string;
  gatewayId: string | null;
  rssi: number | null;
  snr: number | null;
  observedAt: string | null;
  status: 'loading' | 'ready' | 'empty' | 'error' | 'unsupported';
  errorMessage?: string;
  isStale?: boolean;
  queryWindow?: {
    start: string;
    stop: string;
  };
  fetchedAt?: number;
}

interface CacheEntry {
  summary: DeviceRowSummary;
  cachedAt: number;
  queryWindow: {
    start: string;
    stop: string;
  };
}

interface QueueTask {
  id: string;
  execute: () => Promise<void>;
  abortController: AbortController;
  isDetailPriority?: boolean;
}

const SUPPORTED_DEVICE_TYPES = new Set(['solar', 'avc', 'sb', 'smoke']);
const REFRESH_CADENCE_MS = 300000; // 5 minutes
const MAX_CACHE_ENTRIES = 20; // 2 pages bound
const MAX_CONCURRENT_REQUESTS = 2; // Page 07 app load bound

export function useIotPage07Telemetry(
  visibleDevices: DashboardDeviceCatalogueItem[],
  selectedDevice: DashboardDeviceCatalogueItem | null,
  catalogueStatus: string,
) {
  const [rowSummaries, setRowSummaries] = useState<Record<string, DeviceRowSummary>>({});
  const [isPageRefreshing, setIsPageRefreshing] = useState<boolean>(false);
  const [detailRefreshSignal, setDetailRefreshSignal] = useState<number>(0);

  // In-memory RAM cache (route lifetime only, max 20 entries)
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Concurrency & in-flight tracking
  const activeRequestsRef = useRef<number>(0);
  const queueRef = useRef<QueueTask[]>([]);
  const inFlightRequestsRef = useRef<Map<string, Promise<unknown>>>(new Map());

  // Scheduler deadlines (settle time + 300,000 ms)
  const pageNextDueRef = useRef<number>(0);
  const detailNextDueRef = useRef<number>(Infinity);

  // Active batch generations & abort controllers
  const batchGenRef = useRef<number>(0);
  const pageBatchAbortRef = useRef<AbortController[]>([]);

  // Function to process queue with concurrency bound <= 2
  const processQueue = useCallback(() => {
    while (activeRequestsRef.current < MAX_CONCURRENT_REQUESTS && queueRef.current.length > 0) {
      // Prioritize detail tasks if any, otherwise FIFO
      const detailIndex = queueRef.current.findIndex((t) => t.isDetailPriority);
      const nextTask = detailIndex !== -1
        ? queueRef.current.splice(detailIndex, 1)[0]
        : queueRef.current.shift();

      if (!nextTask) break;

      activeRequestsRef.current++;
      nextTask
        .execute()
        .catch(() => {})
        .finally(() => {
          activeRequestsRef.current--;
          processQueue();
        });
    }
  }, []);

  // Cache helper bounded to 20 entries
  const saveToCache = useCallback((key: string, entry: CacheEntry) => {
    const map = cacheRef.current;
    if (map.has(key)) {
      map.delete(key);
    } else if (map.size >= MAX_CACHE_ENTRIES) {
      // Evict oldest entry (FIFO)
      const oldestKey = map.keys().next().value;
      if (oldestKey) map.delete(oldestKey);
    }
    map.set(key, entry);
  }, []);

  // Fetch telemetry snapshot for a single supported visible device
  const fetchDeviceSnapshot = useCallback(
    async (
      device: DashboardDeviceCatalogueItem,
      window: { start: string; stop: string },
      generation: number,
      abortSignal: AbortSignal,
    ): Promise<DeviceRowSummary> => {
      const cacheKey = `${device.externalDeviceId}:${window.start}:${window.stop}:1`;

      let responsePromise = inFlightRequestsRef.current.get(cacheKey);
      if (!responsePromise) {
        responsePromise = fetchDashboardDeviceTelemetry({
          deviceId: device.externalDeviceId,
          start: window.start,
          stop: window.stop,
          limit: 1,
          signal: abortSignal,
        });
        inFlightRequestsRef.current.set(cacheKey, responsePromise);
        responsePromise.finally(() => {
          inFlightRequestsRef.current.delete(cacheKey);
        });
      }

      const result = (await responsePromise) as Awaited<ReturnType<typeof fetchDashboardDeviceTelemetry>>;

      if (generation !== batchGenRef.current) {
        throw new Error('Stale generation');
      }

      if (!result.success) {
        return {
          deviceId: device.externalDeviceId,
          deviceType: device.sourceDeviceType,
          gatewayId: null,
          rssi: null,
          snr: null,
          observedAt: null,
          status: 'error',
          errorMessage: result.error.message,
          queryWindow: window,
          fetchedAt: Date.now(),
        };
      }

      const latestSample = result.data.latestSample;
      if (latestSample && latestSample.observedAt) {
        return {
          deviceId: device.externalDeviceId,
          deviceType: device.sourceDeviceType,
          gatewayId: latestSample.gatewayId ?? null,
          rssi: latestSample.rssiDbm ?? null,
          snr: latestSample.snrDb ?? null,
          observedAt: latestSample.observedAt,
          status: 'ready',
          queryWindow: window,
          fetchedAt: Date.now(),
        };
      }

      return {
        deviceId: device.externalDeviceId,
        deviceType: device.sourceDeviceType,
        gatewayId: null,
        rssi: null,
        snr: null,
        observedAt: null,
        status: 'empty',
        queryWindow: window,
        fetchedAt: Date.now(),
      };
    },
    [],
  );

  // Load telemetry snapshots for visible devices batch
  const loadVisiblePageSummaries = useCallback(
    async (isManualRefresh = false) => {
      if (catalogueStatus !== 'ready' || visibleDevices.length === 0) {
        return;
      }

      // Abort prior visible-page queue and requests
      for (const ctrl of pageBatchAbortRef.current) {
        ctrl.abort();
      }
      pageBatchAbortRef.current = [];
      queueRef.current = queueRef.current.filter((t) => t.isDetailPriority);

      const currentGen = ++batchGenRef.current;
      if (isManualRefresh) {
        setIsPageRefreshing(true);
      }

      // Frozen reference time for the entire batch
      const batchRefTime = new Date();
      const windowRange = computeTelemetryRange('last-72h', batchRefTime);
      const now = Date.now();

      const initialMap: Record<string, DeviceRowSummary> = {};
      const devicesToFetch: DashboardDeviceCatalogueItem[] = [];

      for (const dev of visibleDevices) {
        const id = dev.externalDeviceId;
        const isSupported = dev.sourceDeviceType && SUPPORTED_DEVICE_TYPES.has(dev.sourceDeviceType.toLowerCase());

        if (!isSupported) {
          initialMap[id] = {
            deviceId: id,
            deviceType: dev.sourceDeviceType,
            gatewayId: null,
            rssi: null,
            snr: null,
            observedAt: null,
            status: 'unsupported',
          };
          continue;
        }

        // Check RAM cache
        const cached = cacheRef.current.get(id);
        if (!isManualRefresh && cached && now - cached.cachedAt < REFRESH_CADENCE_MS) {
          // Valid cache hit (< 5 min)
          initialMap[id] = cached.summary;
        } else if (!isManualRefresh && cached) {
          // Stale cache hit (>= 5 min) — show old with isStale hint while revalidating
          initialMap[id] = { ...cached.summary, isStale: true };
          devicesToFetch.push(dev);
        } else {
          // Cache miss or manual refresh
          initialMap[id] = {
            deviceId: id,
            deviceType: dev.sourceDeviceType,
            gatewayId: null,
            rssi: null,
            snr: null,
            observedAt: null,
            status: 'loading',
          };
          devicesToFetch.push(dev);
        }
      }

      // Update state with immediate initial states
      setRowSummaries((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(initialMap)) {
          next[k] = v;
        }
        return next;
      });

      if (devicesToFetch.length === 0) {
        if (isManualRefresh) setIsPageRefreshing(false);
        pageNextDueRef.current = Date.now() + REFRESH_CADENCE_MS;
        return;
      }

      let remaining = devicesToFetch.length;

      for (const dev of devicesToFetch) {
        const controller = new AbortController();
        pageBatchAbortRef.current.push(controller);

        const task: QueueTask = {
          id: dev.externalDeviceId,
          abortController: controller,
          isDetailPriority: false,
          execute: async () => {
            try {
              const summary = await fetchDeviceSnapshot(dev, windowRange, currentGen, controller.signal);
              if (currentGen !== batchGenRef.current) return;

              saveToCache(dev.externalDeviceId, {
                summary,
                cachedAt: Date.now(),
                queryWindow: windowRange,
              });

              setRowSummaries((prev) => ({
                ...prev,
                [dev.externalDeviceId]: summary,
              }));
            } catch (err: unknown) {
              if ((err as Error)?.name === 'AbortError') return;
              if (currentGen !== batchGenRef.current) return;

              // Retain old value if exists
              const oldEntry = cacheRef.current.get(dev.externalDeviceId);
              const fallbackSummary: DeviceRowSummary = oldEntry
                ? { ...oldEntry.summary, isStale: true, errorMessage: 'Lỗi cập nhật dữ liệu' }
                : {
                    deviceId: dev.externalDeviceId,
                    deviceType: dev.sourceDeviceType,
                    gatewayId: null,
                    rssi: null,
                    snr: null,
                    observedAt: null,
                    status: 'error',
                    errorMessage: 'Không thể tải telemetry',
                  };

              setRowSummaries((prev) => ({
                ...prev,
                [dev.externalDeviceId]: fallbackSummary,
              }));
            } finally {
              remaining--;
              if (remaining <= 0 && currentGen === batchGenRef.current) {
                setIsPageRefreshing(false);
                pageNextDueRef.current = Date.now() + REFRESH_CADENCE_MS;
              }
            }
          },
        };

        queueRef.current.push(task);
      }

      processQueue();
    },
    [catalogueStatus, visibleDevices, fetchDeviceSnapshot, processQueue, saveToCache],
  );

  // Trigger page summary loading when visible devices or catalogue status changes
  useEffect(() => {
    loadVisiblePageSummaries(false);
  }, [loadVisiblePageSummaries]);

  // Handle selected detail settle
  const handleDetailSettled = useCallback(() => {
    if (selectedDevice) {
      detailNextDueRef.current = Date.now() + REFRESH_CADENCE_MS;
    } else {
      detailNextDueRef.current = Infinity;
    }
  }, [selectedDevice]);

  // When selectedDevice changes, update detail deadline
  useEffect(() => {
    if (!selectedDevice) {
      detailNextDueRef.current = Infinity;
    } else {
      // History loads immediately in detail panel; when settled, onDetailSettled will set deadline
      detailNextDueRef.current = Date.now() + REFRESH_CADENCE_MS;
    }
  }, [selectedDevice]);

  // Central 5-Minute Scheduler (Page 07-owned)
  useEffect(() => {
    const checkAndDispatch = () => {
      // Pause if tab is hidden
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      // Pause if browser is offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }

      const now = Date.now();

      // Check visible page consumer deadline
      if (now >= pageNextDueRef.current && !isPageRefreshing) {
        loadVisiblePageSummaries(true);
      }

      // Check selected detail consumer deadline
      if (selectedDevice && now >= detailNextDueRef.current) {
        detailNextDueRef.current = now + REFRESH_CADENCE_MS;
        setDetailRefreshSignal((prev) => prev + 1);
      }
    };

    const intervalId = setInterval(checkAndDispatch, 1000);

    // Event listener for tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndDispatch();
      }
    };

    // Event listener for online status
    const handleOnline = () => {
      checkAndDispatch();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }

      // Cleanup on unmount: abort in-flight page batch requests
      for (const ctrl of pageBatchAbortRef.current) {
        ctrl.abort();
      }
      pageBatchAbortRef.current = [];
      queueRef.current = [];
    };
  }, [isPageRefreshing, loadVisiblePageSummaries, selectedDevice]);

  // Manual page refresh action for footer button
  const refreshPageSummaries = useCallback(async () => {
    if (isPageRefreshing) return;
    await loadVisiblePageSummaries(true);
  }, [isPageRefreshing, loadVisiblePageSummaries]);

  return {
    rowSummaries,
    isPageRefreshing,
    refreshPageSummaries,
    detailRefreshSignal,
    handleDetailSettled,
  };
}
