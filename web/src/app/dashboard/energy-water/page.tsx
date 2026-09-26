import React from 'react';
import { DashboardPageShell } from '@/components/dashboard/layout/DashboardPageShell';
import { DashboardSection } from '@/components/dashboard/layout/DashboardSection';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { KpiMetadataCard } from '@/components/dashboard/cards/KpiMetadataCard';
import { DataModeBadge } from '@/components/dashboard/cards/DataModeBadge';

export default function EnergyWaterPage() {
  return (
    <DashboardPageShell
      pageNumber="02"
      title="Năng lượng & Nước"
      description="Theo dõi tiêu thụ điện năng và lưu lượng nước theo thời gian thực tòa nhà E"
      badge={<DataModeBadge mode="live" availability="unavailable" size="sm" />}
    >
      {/* Metric Cards */}
      <DashboardSection
        title="Chỉ số Năng lượng & Nước"
        description="Dữ liệu từ hệ thống đồng hồ điện thông minh và đồng hồ nước AVC"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetadataCard
            title="Công suất tức thời"
            unit="kW"
            availability="unavailable"
            subtitle="Hệ thống điện 3 pha"
          />
          <KpiMetadataCard
            title="Điện năng tiêu thụ"
            unit="kWh"
            availability="unavailable"
            subtitle="Lũy kế ngày hiện tại"
          />
          <KpiMetadataCard
            title="Lưu lượng nước tức thời"
            unit="m³/h"
            availability="unavailable"
            subtitle="Đồng hồ lưu lượng AVC"
          />
          <KpiMetadataCard
            title="Tổng tiêu thụ nước"
            unit="m³"
            availability="unavailable"
            subtitle="Lũy kế chu kỳ"
          />
        </div>
      </DashboardSection>

      {/* Charts placeholder */}
      <DashboardSection
        title="Biểu đồ phụ tải và lưu lượng"
        description="Xu hướng tiêu thụ theo chu kỳ quan sát"
      >
        <UnavailableDataState
          title="Nguồn dữ liệu Năng lượng & Nước chưa kết nối"
          description="Kết nối telemetry và dữ liệu đồng hồ AVC sẽ được kích hoạt trong Sub-phase Water & Energy telemetry của Big Phase 02."
          phaseNote="Big Phase 02 / Sub-phase 01: Chuẩn hóa hợp đồng dữ liệu 'live', chưa thực hiện gọi API sớm."
        />
      </DashboardSection>
    </DashboardPageShell>
  );
}
