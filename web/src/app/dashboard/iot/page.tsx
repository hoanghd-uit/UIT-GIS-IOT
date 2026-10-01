import React from 'react';
import { requireDashboardSession } from '@/lib/auth/session.server';
import { IotCataloguePanel } from '@/components/dashboard/iot/IotCataloguePanel.client';

export default async function IotPage() {
  await requireDashboardSession('/dashboard/iot');
  return <IotCataloguePanel />;
}
