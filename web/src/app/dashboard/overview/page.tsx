import React from 'react';
import { DashboardPageShell } from '@/components/dashboard/layout/DashboardPageShell';
import { DashboardSection } from '@/components/dashboard/layout/DashboardSection';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { KpiMetadataCard } from '@/components/dashboard/cards/KpiMetadataCard';
import { DataModeBadge } from '@/components/dashboard/cards/DataModeBadge';

export default function OverviewPage() {
  return (
    <DashboardPageShell
      pageNumber="01"
      title="Tổng quan"
      description="Tổng quan vận hành và các chỉ số trung tâm tòa nhà E — UIT Digital Twin"
      badge={<DataModeBadge mode="derived" availability="unavailable" size="sm" />}
    >
      {/* KPI Cards Summary Section (Unconnected in Phase 01) */}
      <DashboardSection
        title="Chỉ số vận hành trọng yếu"
        description="Các chỉ số tổng hợp toàn tòa nhà (sẽ kết nối trong Sub-phase Overview)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetadataCard
            title="Tổng điện năng hôm nay"
            availability="unavailable"
            subtitle="Toàn bộ tòa nhà E"
          />
          <KpiMetadataCard
            title="Lưu lượng nước hôm nay"
            availability="unavailable"
            subtitle="Đồng hồ tổng AVC"
          />
          <KpiMetadataCard
            title="Chất lượng không khí (IAQ)"
            availability="unavailable"
            subtitle="Điểm trung bình các tầng"
          />
          <KpiMetadataCard
            title="Thiết bị IoT trực tuyến"
            availability="unavailable"
            subtitle="Cảm biến & Gateway"
          />
        </div>
      </DashboardSection>

      {/* Main Content Area */}
      <DashboardSection
        title="Không gian dữ liệu tổng quan"
        description="Biểu đồ tích hợp và bản đồ trạng thái vận hành"
      >
        <UnavailableDataState
          title="Phân hệ Tổng quan đang trong giai đoạn nền tảng"
          description="Dữ liệu tổng hợp từ các phân hệ Năng lượng, Nước, IAQ, IoT và Cảnh báo sẽ được tích hợp hoàn chỉnh trong Sub-phase chuyên biệt của Big Phase 02."
          phaseNote="Big Phase 02 / Sub-phase 01: Thiết lập khung giao diện, provenance và route an toàn."
        />
      </DashboardSection>
    </DashboardPageShell>
  );
}
