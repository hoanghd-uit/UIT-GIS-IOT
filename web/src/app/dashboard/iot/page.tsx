import React from 'react';
import { DashboardPageShell } from '@/components/dashboard/layout/DashboardPageShell';
import { IotCataloguePanel } from '@/components/dashboard/iot/IotCataloguePanel.client';

export default function IotPage() {
  return (
    <DashboardPageShell
      pageNumber="07"
      title="Hệ thống IoT"
      description="Trạng thái hoạt động, danh mục và sức khỏe thiết bị IoT tòa nhà E"
    >
      <IotCataloguePanel />
    </DashboardPageShell>
  );
}

