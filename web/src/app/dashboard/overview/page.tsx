import React from 'react';
import { requireDashboardSession } from '@/lib/auth/session.server';
import { OverviewDashboard } from '@/components/dashboard/overview/OverviewDashboard.client';

export default async function OverviewPage() {
  await requireDashboardSession('/dashboard/overview');
  return <OverviewDashboard />;
}
