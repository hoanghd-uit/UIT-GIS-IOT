import React from 'react';
import { requireDashboardSession } from '@/lib/auth/session.server';
import { ParkingDashboard } from '@/components/dashboard/parking/ParkingDashboard.client';

export default async function ParkingPage() {
  await requireDashboardSession('/dashboard/parking');
  return <ParkingDashboard />;
}
