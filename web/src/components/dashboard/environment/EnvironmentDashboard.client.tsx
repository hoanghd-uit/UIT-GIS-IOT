'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DashboardEnvironmentSourceItem,
  DashboardEnvironmentSummaryResponse,
  DashboardEnvironmentReadingsResponse,
  EnvironmentTimeRangePreset,
} from '@/types/dashboard-environment';
import {
  fetchEnvironmentSources,
  fetchEnvironmentSummary,
  fetchEnvironmentReadings,
} from '@/lib/dashboard/environment-api';
import {
  calculateEnvironmentRange,
  getSummaryRange,
} from '@/lib/dashboard/environment-range';
import { EnvironmentPageHeader } from './EnvironmentPageHeader';
import { EnvironmentKpiStrip } from './EnvironmentKpiStrip';
import { Co2DemoHeatmap } from './Co2DemoHeatmap';
import { Co2DemoRanking } from './Co2DemoRanking';
import { Co2DemoCompliance } from './Co2DemoCompliance';
import { EnvironmentThresholdTable } from './EnvironmentThresholdTable';
import { EnvironmentSourcePicker } from './EnvironmentSourcePicker';
import { EnvironmentSourceDetail } from './EnvironmentSourceDetail';

export function EnvironmentDashboard() {
  const [sources, setSources] = useState<DashboardEnvironmentSourceItem[]>([]);
  const [sourceListStatus, setSourceListStatus] = useState<
    'idle' | 'loading' | 'ready' | 'empty' | 'unavailable' | 'error'
  >('idle');

  const [summary, setSummary] = useState<DashboardEnvironmentSummaryResponse | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<
    'idle' | 'loading' | 'ready' | 'partial' | 'empty' | 'unavailable' | 'error'
  >('idle');

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedReadings, setSelectedReadings] =
    useState<DashboardEnvironmentReadingsResponse | null>(null);
  const [readingsStatus, setReadingsStatus] = useState<
    'idle' | 'loading' | 'refreshing' | 'ready' | 'empty' | 'unavailable' | 'error'
  >('idle');

  const [preset, setPreset] = useState<EnvironmentTimeRangePreset>('24h');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

  const activeAbortRef = useRef<AbortController | null>(null);
  const readingsAbortRef = useRef<AbortController | null>(null);

  // Load sources catalogue and initial bounded summary
  const loadInitialData = useCallback(async () => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortRef.current = controller;

    setSourceListStatus('loading');
    setSummaryStatus('loading');

    // 1. Fetch sources
    try {
      const srcResult = await fetchEnvironmentSources({ signal: controller.signal });
      if (srcResult.success) {
        setSources(srcResult.data.sources || []);
        setSourceListStatus(srcResult.data.sources.length > 0 ? 'ready' : 'empty');
      } else {
        setSourceListStatus(srcResult.error.isUnavailable ? 'unavailable' : 'error');
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setSourceListStatus('error');
      }
    }

    // 2. Fetch bounded summary (always 24h lookback window)
    try {
      const summaryRange = getSummaryRange();
      const sumResult = await fetchEnvironmentSummary({
        start: summaryRange.start,
        stop: summaryRange.stop,
        signal: controller.signal,
      });

      if (sumResult.success) {
        setSummary(sumResult.data);
        setSummaryStatus(sumResult.data.availability);
      } else {
        setSummaryStatus(sumResult.error.isUnavailable ? 'unavailable' : 'error');
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setSummaryStatus('error');
      }
    }
  }, []);

  // Fetch readings for a selected Solar source
  const loadReadingsForSource = useCallback(
    async (deviceId: string, isRefresh = false) => {
      if (readingsAbortRef.current) {
        readingsAbortRef.current.abort();
      }
      const controller = new AbortController();
      readingsAbortRef.current = controller;

      setReadingsStatus(isRefresh ? 'refreshing' : 'loading');

      const range = calculateEnvironmentRange(preset);
      try {
        const result = await fetchEnvironmentReadings({
          deviceId,
          start: range.start,
          stop: range.stop,
          limit: 1000,
          signal: controller.signal,
        });

        if (result.success) {
          setSelectedReadings(result.data);
          setReadingsStatus(result.data.availability);
        } else {
          setReadingsStatus(result.error.isUnavailable ? 'unavailable' : 'error');
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          setReadingsStatus('error');
        }
      }
    },
    [preset],
  );

  useEffect(() => {
    loadInitialData();
    return () => {
      if (activeAbortRef.current) activeAbortRef.current.abort();
      if (readingsAbortRef.current) readingsAbortRef.current.abort();
    };
  }, [loadInitialData]);

  // When selectedSourceId or preset changes, fetch selected readings
  useEffect(() => {
    if (selectedSourceId) {
      loadReadingsForSource(selectedSourceId);
    } else {
      setSelectedReadings(null);
      setReadingsStatus('idle');
    }
  }, [selectedSourceId, preset, loadReadingsForSource]);

  return (
    <div className="flex flex-col gap-6 w-full p-4 sm:p-6 lg:p-8 max-w-[1720px] mx-auto animate-fade-in">
      {/* Aligned Page Header */}
      <EnvironmentPageHeader
        sourceCount={sourceListStatus === 'ready' ? sources.length : null}
        activePreset={preset}
        onPresetChange={(newPreset) => setPreset(newPreset)}
        onSearchClick={() => setIsPickerOpen(true)}
      />

      {/* 6-Card KPI Strip */}
      <EnvironmentKpiStrip summary={summary} summaryStatus={summaryStatus} />

      {/* Selected Solar Source Details Panel (Expandable view when a source is selected) */}
      {selectedSourceId && (
        <EnvironmentSourceDetail
          data={selectedReadings}
          status={readingsStatus}
          onClose={() => setSelectedSourceId(null)}
          onRefresh={() => loadReadingsForSource(selectedSourceId, true)}
        />
      )}

      {/* Primary Row: Heatmap (Left ~1.9) + Ranking (Right ~1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <Co2DemoHeatmap className="h-full" />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <Co2DemoRanking className="h-full" />
        </div>
      </div>

      {/* Secondary Row: Floor Compliance (Left 50%) + Threshold Table (Right 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full items-stretch">
        <Co2DemoCompliance className="h-full" />
        <EnvironmentThresholdTable className="h-full" />
      </div>

      {/* Source Picker Modal */}
      <EnvironmentSourcePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        sources={sources}
        selectedSourceId={selectedSourceId}
        onSelectSource={(deviceId) => setSelectedSourceId(deviceId)}
      />
    </div>
  );
}
