'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { OverviewTimeRangePreset, FloorConfig, FloorCell } from '@/types/dashboard-overview';
import { DashboardDeviceCatalogueResponse } from '@/types/dashboard-iot';
import { fetchDashboardDeviceCatalogue } from '@/lib/dashboard/iot-catalogue-api';
import {
  BUILDING_E_FLOOR_CONFIGS,
  getFloorConfigById,
} from '@/lib/dashboard/overview-grid-fixtures';
import {
  getOverviewEnergySummary,
  getOverviewCo2Kpis,
  getOverviewOpenAlertsKpi,
  getOverviewLatestAlerts,
} from '@/lib/dashboard/overview-selectors';

import { OverviewPageHeader } from './OverviewPageHeader';
import { OverviewKpiStrip } from './OverviewKpiStrip';
import { FloorCatalog } from './FloorCatalog';
import { InteractiveFloorGrid } from './InteractiveFloorGrid';
import { FloorMetadataPanel } from './FloorMetadataPanel';
import { LatestAlertsPreview } from './LatestAlertsPreview';
import { HourlyEnergyDemoChart } from './HourlyEnergyDemoChart';
import { IotHealthSummary } from './IotHealthSummary';

export function OverviewDashboard() {
  // Range filter preset (today | 7d | 30d)
  const [preset, setPreset] = useState<OverviewTimeRangePreset>('today');

  // Selected floor & cell state
  const [selectedFloorId, setSelectedFloorId] = useState<string>('T6');
  const [selectedCellId, setSelectedCellId] = useState<string | null>('CELL-E6-02');

  // Live IoT catalogue state
  const [catalogueData, setCatalogueData] = useState<DashboardDeviceCatalogueResponse | null>(null);
  const [catalogueStatus, setCatalogueStatus] = useState<
    'idle' | 'loading' | 'ready' | 'empty' | 'unavailable' | 'error'
  >('idle');
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load catalogue data from same-origin Next.js API
  const loadCatalogue = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCatalogueStatus('loading');
    setIsRefreshing(true);

    try {
      const res = await fetchDashboardDeviceCatalogue({
        buildingId: 'E',
        signal: controller.signal,
      });

      if (res.success) {
        setCatalogueData(res.data);
        setCatalogueStatus(res.data.availability === 'empty' ? 'empty' : 'ready');
        setLastFetchedAt(res.data.provenance?.fetchedAt || new Date().toISOString());
      } else {
        setCatalogueStatus(res.error.isUnavailable ? 'unavailable' : 'error');
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setCatalogueStatus('error');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogue();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadCatalogue]);

  // Current floor configuration
  const currentFloorConfig: FloorConfig = useMemo(() => {
    return getFloorConfigById(selectedFloorId) || BUILDING_E_FLOOR_CONFIGS[0];
  }, [selectedFloorId]);

  // Handle floor selection: switch floor and validate selected cell
  const handleSelectFloor = (floorId: string) => {
    setSelectedFloorId(floorId);
    const newFloor = getFloorConfigById(floorId);
    if (!newFloor) {
      setSelectedCellId(null);
      return;
    }
    // Select first room with demo data on the new floor, or first cell
    const firstDemoRoom = newFloor.cells.find((c) => c.kind === 'room' && c.roomDemoId);
    if (firstDemoRoom) {
      setSelectedCellId(firstDemoRoom.cellId);
    } else {
      const firstRoom = newFloor.cells.find((c) => c.kind === 'room');
      setSelectedCellId(firstRoom ? firstRoom.cellId : newFloor.cells[0]?.cellId ?? null);
    }
  };

  // Currently selected cell object
  const selectedCell: FloorCell | null = useMemo(() => {
    if (!selectedCellId) return null;
    return currentFloorConfig.cells.find((c) => c.cellId === selectedCellId) ?? null;
  }, [currentFloorConfig, selectedCellId]);

  // Derived KPI and chart models
  const energySummary = useMemo(() => getOverviewEnergySummary(preset), [preset]);
  const co2Kpis = useMemo(() => getOverviewCo2Kpis(), []);
  const openAlertsKpi = useMemo(() => getOverviewOpenAlertsKpi(), []);
  const latestAlerts = useMemo(() => getOverviewLatestAlerts(3), []);

  return (
    <div className="flex flex-col gap-5 w-full p-4 sm:p-6 lg:p-8 max-w-[1720px] mx-auto animate-fade-in">
      {/* 1. Aligned Page Header */}
      <OverviewPageHeader
        activePreset={preset}
        onPresetChange={setPreset}
        onRefresh={loadCatalogue}
        isRefreshing={isRefreshing}
        lastFetch={lastFetchedAt}
      />

      {/* 2. Six Operational KPI Slots */}
      <OverviewKpiStrip
        activePreset={preset}
        energySummary={energySummary}
        co2Kpis={co2Kpis}
        openAlertsKpi={openAlertsKpi}
        catalogueCount={catalogueData?.summary?.acceptedCount ?? null}
        catalogueStatus={catalogueStatus}
      />

      {/* 3. Primary Row: 2D Floor Grid (~8/12) + Detail Panel (~4/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
        <div className="lg:col-span-8 flex flex-col md:flex-row gap-3 items-stretch">
          {/* Narrow Left Column: Floor Catalog */}
          <FloorCatalog
            floors={BUILDING_E_FLOOR_CONFIGS}
            selectedFloorId={selectedFloorId}
            onSelectFloor={handleSelectFloor}
            className="w-full md:w-44 shrink-0"
          />

          {/* Main Area: Interactive 2D Floor Grid */}
          <InteractiveFloorGrid
            floorConfig={currentFloorConfig}
            selectedCellId={selectedCellId}
            onSelectCell={setSelectedCellId}
            className="flex-1 min-w-0"
          />
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-4 flex flex-col">
          <FloorMetadataPanel
            floorConfig={currentFloorConfig}
            selectedCell={selectedCell}
            className="h-full"
          />
        </div>
      </div>

      {/* 4. Bottom Row: Latest Alerts + Hourly Energy + IoT Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full items-stretch">
        <LatestAlertsPreview alerts={latestAlerts} className="h-full" />
        <HourlyEnergyDemoChart
          energySummary={energySummary}
          activePreset={preset}
          className="h-full"
        />
        <IotHealthSummary
          healthData={{
            liveSummary: {
              receivedCount: catalogueData?.summary?.receivedCount ?? null,
              acceptedCount: catalogueData?.summary?.acceptedCount ?? null,
              skippedCount: catalogueData?.summary?.skippedCount ?? null,
              duplicateCount: catalogueData?.summary?.duplicateCount ?? null,
              truncated: catalogueData?.summary?.truncated ?? null,
            },
            provenance: catalogueData?.provenance ?? null,
            status: catalogueStatus,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}
