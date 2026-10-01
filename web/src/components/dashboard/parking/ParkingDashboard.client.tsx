'use client';

import React, { useState, useMemo } from 'react';
import { ParkingTimeRangePreset } from '@/types/dashboard-parking';
import { PARKING_DEMO_FIXTURE } from '@/lib/dashboard/parking-demo-fixtures';
import {
  getParkingKpiStripData,
  getParkingEntriesSummary,
} from '@/lib/dashboard/parking-demo-selectors';

import { ParkingPageHeader } from './ParkingPageHeader';
import { ParkingDemoNotice } from './ParkingDemoNotice';
import { ParkingKpiStrip } from './ParkingKpiStrip';
import { ParkingOccupancyCard } from './ParkingOccupancyCard';
import { ParkingEntriesChart } from './ParkingEntriesChart';
import { ParkingCameraTable } from './ParkingCameraTable';
import { ParkingTechnicalNotes } from './ParkingTechnicalNotes';

export function ParkingDashboard() {
  // Range filter preset (today | 7d | 30d)
  const [preset, setPreset] = useState<ParkingTimeRangePreset>('today');

  // Selected car slot or motorcycle zone ID
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Derived KPI and chart models from deterministic fixture
  const kpis = useMemo(() => {
    return getParkingKpiStripData(PARKING_DEMO_FIXTURE, preset);
  }, [preset]);

  const entriesSummary = useMemo(() => {
    return getParkingEntriesSummary(PARKING_DEMO_FIXTURE, preset);
  }, [preset]);

  return (
    <div className="flex flex-col gap-5 w-full p-4 sm:p-6 lg:p-8 max-w-[1720px] mx-auto animate-fade-in">
      {/* 1. Aligned Page Header */}
      <ParkingPageHeader
        activePreset={preset}
        onPresetChange={setPreset}
      />

      {/* 2. Demo Scenario Full-Width Notice Banner */}
      {/* <ParkingDemoNotice /> */}

      {/* 3. Five Operational KPI Slots */}
      <ParkingKpiStrip
        kpis={kpis}
        activePreset={preset}
      />

      {/* 4. Main Row: Occupancy Visual (Left ~7/12) + Entries Chart & Cameras (Right ~5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
        {/* Left Column: Car Slots + Motorcycle Zones */}
        <div className="lg:col-span-7 xl:col-span-7 w-full flex flex-col">
          <ParkingOccupancyCard
            carAreas={PARKING_DEMO_FIXTURE.carAreas}
            motorcycleZones={PARKING_DEMO_FIXTURE.motorcycleZones}
            selectedEntityId={selectedEntityId}
            onSelectEntity={setSelectedEntityId}
            className="w-full"
          />
        </div>

        {/* Right Column: Vehicle Entries Chart + Demo Camera Table */}
        <div className="lg:col-span-5 xl:col-span-5 w-full flex flex-col gap-5">
          <ParkingEntriesChart
            entriesSummary={entriesSummary}
            activePreset={preset}
            className="w-full"
          />
          <ParkingCameraTable
            cameras={PARKING_DEMO_FIXTURE.cameraDevices}
            className="w-full"
          />
        </div>
      </div>

      {/* 5. Bottom Row: Technical Notes & Scenario Boundaries */}
      <ParkingTechnicalNotes
        notes={PARKING_DEMO_FIXTURE.technicalNotes}
        className="w-full"
      />
    </div>
  );
}
