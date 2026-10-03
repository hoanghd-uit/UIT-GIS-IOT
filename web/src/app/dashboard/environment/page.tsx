import React from 'react';
import { requireDashboardSession } from '@/lib/auth/session.server';
import { EnvironmentDashboard } from '@/components/dashboard/environment/EnvironmentDashboard.client';

export default async function EnvironmentPage() {
  await requireDashboardSession('/dashboard/environment');
  return <EnvironmentDashboard />;
}
