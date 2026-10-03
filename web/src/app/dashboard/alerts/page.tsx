import React from 'react';
import { requireDashboardSession } from '@/lib/auth/session.server';
import { AlertCenterDashboard } from '@/components/dashboard/alerts/AlertCenterDashboard.client';

export default async function AlertsPage() {
  await requireDashboardSession('/dashboard/alerts');
  return <AlertCenterDashboard />;
}
