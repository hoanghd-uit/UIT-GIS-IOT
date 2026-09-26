import React from 'react';
import { DashboardPageShell } from '@/components/dashboard/layout/DashboardPageShell';
import { DashboardSection } from '@/components/dashboard/layout/DashboardSection';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { KpiMetadataCard } from '@/components/dashboard/cards/KpiMetadataCard';
import { DataModeBadge } from '@/components/dashboard/cards/DataModeBadge';

export default function IotPage() {
  return (
    <DashboardPageShell
      pageNumber="07"
      title="Hệ thống IoT"
      description="Trạng thái hoạt động, danh mục và sức khỏe thiết bị IoT tòa nhà E"
      badge={<DataModeBadge mode="live" availability="unavailable" size="sm" />}
    >
      <DashboardSection
        title="Tổng quan thiết bị IoT"
        description="Số lượng và tình trạng kết nối thiết bị cảm biến và Gateway"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetadataCard
            title="Tổng số thiết bị"
            availability="unavailable"
            subtitle="Danh mục toàn tòa nhà"
          />
          <KpiMetadataCard
            title="Đang hoạt động (Online)"
            availability="unavailable"
            subtitle="Nhận tín hiệu gần nhất"
          />
          <KpiMetadataCard
            title="Mất kết nối (Offline)"
            availability="unavailable"
            subtitle="Quá thời hạn heartbeat"
          />
          <KpiMetadataCard
            title="Tỷ lệ trực tuyến"
            availability="unavailable"
            subtitle="Độ khả dụng mạng"
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Danh mục thiết bị và giám sát sức khỏe"
        description="Bảng thông số chi tiết trạng thái hoạt động từng thiết bị"
      >
        <UnavailableDataState
          title="Kết nối danh mục và sức khỏe IoT chưa kích hoạt"
          description="Danh mục thiết bị IoT và cơ chế giám sát sức khỏe thiết bị Dashboard sẽ được tích hợp trong Sub-phase IoT của Big Phase 02."
          phaseNote="Big Phase 02 / Sub-phase 01: Không thực hiện gọi API IoT trực tiếp từ giao diện trong sub-phase này."
        />
      </DashboardSection>
    </DashboardPageShell>
  );
}
