import React from 'react';
import { DashboardPageShell } from '@/components/dashboard/layout/DashboardPageShell';
import { DashboardSection } from '@/components/dashboard/layout/DashboardSection';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { DataModeBadge } from '@/components/dashboard/cards/DataModeBadge';

export default function AlertsPage() {
  return (
    <DashboardPageShell
      pageNumber="06"
      title="Trung tâm cảnh báo"
      description="Cảnh báo hệ thống, ngưỡng vượt và trạng thái phản hồi tòa nhà E"
      badge={<DataModeBadge mode="derived" availability="unavailable" size="sm" />}
    >
      <DashboardSection
        title="Danh sách và luồng cảnh báo"
        description="Theo dõi sự kiện và các cảnh báo vận hành hệ thống"
      >
        {/*
          CRITICAL INVARIANT (BP2-P01-T17):
          Page 06 renders NO fabricated alert badge count and NO dummy alerts.
        */}
        <UnavailableDataState
          title="Hệ thống cảnh báo chưa được kết nối"
          description="Công cụ đánh giá cảnh báo, luật ngưỡng và luồng xác nhận cảnh báo sẽ được kích hoạt trong Sub-phase Trung tâm cảnh báo của Big Phase 02."
          phaseNote="Big Phase 02 / Sub-phase 01: Không hiển thị số lượng cảnh báo ảo hoặc huy hiệu giả tạo."
        />
      </DashboardSection>
    </DashboardPageShell>
  );
}
