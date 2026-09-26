import React from 'react';
import { DashboardPageShell } from '@/components/dashboard/layout/DashboardPageShell';
import { DashboardSection } from '@/components/dashboard/layout/DashboardSection';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { KpiMetadataCard } from '@/components/dashboard/cards/KpiMetadataCard';
import { DataModeBadge } from '@/components/dashboard/cards/DataModeBadge';

export default function EnvironmentPage() {
  return (
    <DashboardPageShell
      pageNumber="03"
      title="Môi trường (IAQ)"
      description="Chất lượng không khí trong nhà và điều kiện tiện nghi nhiệt tại các không gian chức năng"
      badge={<DataModeBadge mode="live" availability="unavailable" size="sm" />}
    >
      <DashboardSection
        title="Thông số môi trường trọng yếu"
        description="Dữ liệu từ trạm quan trắc IAQ đa thông số phân bố các tầng"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetadataCard
            title="Nhiệt độ trung bình"
            unit="°C"
            availability="unavailable"
            subtitle="Tiện nghi nhiệt"
          />
          <KpiMetadataCard
            title="Độ ẩm tương đối"
            unit="%"
            availability="unavailable"
            subtitle="Tiện nghi ẩm"
          />
          <KpiMetadataCard
            title="Nồng độ CO₂"
            unit="ppm"
            availability="unavailable"
            subtitle="Độ tươi không khí"
          />
          <KpiMetadataCard
            title="Bụi mịn PM2.5"
            unit="µg/m³"
            availability="unavailable"
            subtitle="Chất lượng không khí"
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Phân bố và xu hướng IAQ"
        description="Đồ thị biến thiên và bản đồ nhiệt môi trường các phòng"
      >
        <UnavailableDataState
          title="Nguồn dữ liệu Môi trường (IAQ) chưa kết nối"
          description="Cảm biến quan trắc môi trường và thuật toán tính chỉ số IAQ sẽ được tích hợp trong Sub-phase IAQ của Big Phase 02."
          phaseNote="Big Phase 02 / Sub-phase 01: Thiết lập cấu trúc giao diện chuẩn, không sử dụng số liệu giả lập."
        />
      </DashboardSection>
    </DashboardPageShell>
  );
}
