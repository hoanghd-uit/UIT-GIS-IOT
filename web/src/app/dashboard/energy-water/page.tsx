import React from 'react';
import { requireDashboardSession } from '@/lib/auth/session.server';
import { EnergyWaterDashboard } from '@/components/dashboard/water/EnergyWaterDashboard.client';

export default async function EnergyWaterPage() {
  await requireDashboardSession('/dashboard/energy-water');
  return <EnergyWaterDashboard />;
}
