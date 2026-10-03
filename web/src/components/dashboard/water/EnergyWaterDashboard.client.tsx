'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DashboardWaterMeterItem,
  DashboardWaterReadingsResponse,
  WaterTimeRangePreset,
  WaterMetricKey,
} from '@/types/dashboard-water';
import { fetchWaterMeters, fetchWaterMeterReadings } from '@/lib/dashboard/water-api';
import { computeWaterTimeRange, DEFAULT_WATER_PRESET } from '@/lib/dashboard/water-range';
import { aggregateWaterReadings } from '@/lib/dashboard/water-chart';
import { EnergyWaterPageHeader } from './EnergyWaterPageHeader';
import { EnergyWaterKpiStrip } from './EnergyWaterKpiStrip';
import { EnergyUnavailablePanels } from './EnergyUnavailablePanels';
import { WaterMeterList } from './WaterMeterList';
import { WaterMetricChart } from './WaterMetricChart';
import { WaterMeterDetail } from './WaterMeterDetail';

export function EnergyWaterDashboard() {
  // Meter List State
  const [meters, setMeters] = useState<DashboardWaterMeterItem[]>([]);
  const [meterListStatus, setMeterListStatus] = useState<
    'idle' | 'loading' | 'ready' | 'empty' | 'unavailable' | 'error'
  >('loading');
  const [meterListError, setMeterListError] = useState<unknown>(null);

  // Selection & Telemetry State
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const [readingsData, setReadingsData] = useState<DashboardWaterReadingsResponse | null>(null);
  const [readingStatus, setReadingStatus] = useState<
    'idle' | 'loading' | 'refreshing' | 'ready' | 'empty' | 'unavailable' | 'error'
  >('idle');
  const [readingError, setReadingError] = useState<unknown>(null);

  // Range and Metric Selectors
  const [activeRange, setActiveRange] = useState<WaterTimeRangePreset>(DEFAULT_WATER_PRESET);
  const [activeMetric, setActiveMetric] = useState<WaterMetricKey>('instantFlowM3h');

  // Abort controllers to prevent race conditions
  const listAbortControllerRef = useRef<AbortController | null>(null);
  const readingAbortControllerRef = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Selected Meter Telemetry
  const loadReadings = useCallback(
    async (meterId: string, rangePreset: WaterTimeRangePreset, isManualRefresh = false) => {
      if (readingAbortControllerRef.current) {
        readingAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      readingAbortControllerRef.current = abortController;

      if (isManualRefresh) {
        setReadingStatus('refreshing');
      } else {
        setReadingStatus('loading');
      }
      setReadingError(null);

      const { start, stop } = computeWaterTimeRange(rangePreset);

      try {
        const result = await fetchWaterMeterReadings({
          deviceId: meterId,
          start,
          stop,
          signal: abortController.signal,
        });

        if (!result.success) {
          if (result.error.isUnavailable) {
            setReadingStatus('unavailable');
          } else {
            setReadingStatus('error');
            setReadingError(result.error);
          }
          return;
        }

        setReadingsData(result.data);
        const hasValidReadings =
          result.data.readings && result.data.readings.length > 0;
        setReadingStatus(hasValidReadings ? 'ready' : 'empty');
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        setReadingStatus('error');
        setReadingError(err);
      }
    },
    [],
  );

  // 2. Fetch Aggregated Telemetry for All AVC Meters
  const loadAggregatedReadings = useCallback(
    async (
      meterList: DashboardWaterMeterItem[],
      rangePreset: WaterTimeRangePreset,
      isManualRefresh = false,
    ) => {
      if (meterList.length === 0) {
        setReadingsData(null);
        setReadingStatus('empty');
        return;
      }

      if (readingAbortControllerRef.current) {
        readingAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      readingAbortControllerRef.current = abortController;

      if (isManualRefresh) {
        setReadingStatus('refreshing');
      } else {
        setReadingStatus('loading');
      }
      setReadingError(null);

      const { start, stop } = computeWaterTimeRange(rangePreset);

      try {
        const fetchPromises = meterList.map((m) =>
          fetchWaterMeterReadings({
            deviceId: m.deviceId,
            start,
            stop,
            signal: abortController.signal,
          }),
        );

        const results = await Promise.all(fetchPromises);
        const successfulData = results
          .filter((res) => res.success)
          .map((res) => (res as { success: true; data: DashboardWaterReadingsResponse }).data);

        if (successfulData.length === 0) {
          const firstError = results.find((res) => !res.success);
          if (firstError && !firstError.success && firstError.error.isUnavailable) {
            setReadingStatus('unavailable');
          } else {
            setReadingStatus('empty');
          }
          setReadingsData(null);
          return;
        }

        const aggregated = aggregateWaterReadings(successfulData);
        setReadingsData(aggregated);
        const hasValid = aggregated && aggregated.readings && aggregated.readings.length > 0;
        setReadingStatus(hasValid ? 'ready' : 'empty');
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        setReadingStatus('error');
        setReadingError(err);
      }
    },
    [],
  );

  // 3. Fetch Meter Catalogue
  const loadMeters = useCallback(async () => {
    if (listAbortControllerRef.current) {
      listAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    listAbortControllerRef.current = abortController;

    setMeterListStatus('loading');
    setMeterListError(null);

    try {
      const result = await fetchWaterMeters({
        buildingId: 'E',
        signal: abortController.signal,
      });

      if (!result.success) {
        if (result.error.isUnavailable) {
          setMeterListStatus('unavailable');
        } else {
          setMeterListStatus('error');
          setMeterListError(result.error);
        }
        return;
      }

      setMeters(result.data.meters);
      setMeterListStatus(result.data.meters.length > 0 ? 'ready' : 'empty');

      // Auto-load aggregated readings if no meter is selected
      if (result.data.meters.length > 0 && selectedMeterId === null) {
        loadAggregatedReadings(result.data.meters, activeRange, false);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setMeterListStatus('error');
      setMeterListError(err);
    }
  }, [activeRange, selectedMeterId, loadAggregatedReadings]);

  useEffect(() => {
    loadMeters();
    return () => {
      listAbortControllerRef.current?.abort();
      readingAbortControllerRef.current?.abort();
    };
  }, [loadMeters]);

  // Trigger telemetry fetch upon meter selection (or toggle back to aggregated total)
  const handleSelectMeter = (meterId: string | null) => {
    const target = meterId && meterId.trim() ? meterId.trim() : null;
    if (target === selectedMeterId) {
      // Clicked currently selected meter: toggle off to show aggregated total
      setSelectedMeterId(null);
      loadAggregatedReadings(meters, activeRange, false);
      return;
    }

    setSelectedMeterId(target);
    if (target) {
      loadReadings(target, activeRange, false);
    } else {
      loadAggregatedReadings(meters, activeRange, false);
    }
  };

  // Trigger telemetry fetch upon range change
  const handleRangeChange = (preset: WaterTimeRangePreset) => {
    setActiveRange(preset);
    if (selectedMeterId) {
      loadReadings(selectedMeterId, preset, false);
    } else {
      loadAggregatedReadings(meters, preset, false);
    }
  };

  // Manual refresh trigger
  const handleManualRefresh = () => {
    if (selectedMeterId) {
      loadReadings(selectedMeterId, activeRange, true);
    } else {
      loadAggregatedReadings(meters, activeRange, true);
    }
  };

  // Search button focus
  const handleSearchFocus = () => {
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1720px] mx-auto pb-12">
      {/* 1. Page Header */}
      <EnergyWaterPageHeader
        meterCount={meterListStatus === 'ready' ? meters.length : null}
        activePreset={activeRange}
        onPresetChange={handleRangeChange}
        onSearchClick={handleSearchFocus}
      />

      {/* 2. KPI Strip (6 slots) */}
      <EnergyWaterKpiStrip
        selectedMeterId={selectedMeterId}
        latestSample={readingsData?.latestSample ?? null}
        readingStatus={readingStatus}
      />

      {/* 3. Primary Row: Energy Unavailable Panels (~5:3 macro-proportions) */}
      <EnergyUnavailablePanels />

      {/* 4. Secondary Row: Water Functional Area (~3:5:3 macro-proportions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        {/* Left Card: Meter List / Dummy Floor Distribution (~3/12 width) */}
        <div className="lg:col-span-3">
          <WaterMeterList
            ref={searchInputRef}
            meters={meters}
            selectedMeterId={selectedMeterId}
            onSelectMeter={handleSelectMeter}
            status={meterListStatus}
            error={meterListError}
            onRetry={loadMeters}
          />
        </div>

        {/* Center Card: Live Metric Chart (~6/12 width) */}
        <div className="lg:col-span-6">
          <WaterMetricChart
            selectedMeterId={selectedMeterId}
            readings={readingsData?.readings ?? []}
            activeMetric={activeMetric}
            onMetricChange={setActiveMetric}
            status={readingStatus}
            error={readingError}
            onRefresh={handleManualRefresh}
            onRetry={() =>
              selectedMeterId
                ? loadReadings(selectedMeterId, activeRange, false)
                : loadAggregatedReadings(meters, activeRange, false)
            }
          />
        </div>

        {/* Right Card: Technical Details / Dummy AI Anomaly (~3/12 width) */}
        <div className="lg:col-span-3">
          <WaterMeterDetail
            selectedMeterId={selectedMeterId}
            readingsData={readingsData}
            status={readingStatus}
          />
        </div>
      </div>
    </div>
  );
}
