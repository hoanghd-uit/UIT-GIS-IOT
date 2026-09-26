import React from 'react';
import { DashboardPageShell } from '@/components/dashboard/layout/DashboardPageShell';
import { DashboardSection } from '@/components/dashboard/layout/DashboardSection';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { KpiMetadataCard } from '@/components/dashboard/cards/KpiMetadataCard';
import { DataModeBadge } from '@/components/dashboard/cards/DataModeBadge';
import { createDemoProvenance } from '@/lib/dashboard/provenance';

const PARKING_FUTURE_PROVENANCE = createDemoProvenance({
  fixtureVersion: '1.0.0-planned',
  sourceId: 'parking-scenario-fixture',
  caveats: ['Kịch bản mô phỏng bãi xe sẽ được kích hoạt trong Sub-phase Parking Demo'],
});

export default function ParkingPage() {
  return (
    <DashboardPageShell
      pageNumber="09"
      title="Bãi xe"
      description="Quản lý sức chứa, lượt phương tiện và trạng thái bãi đỗ xe tòa nhà E"
      badge={<DataModeBadge mode="demo" provenance={PARKING_FUTURE_PROVENANCE} size="sm" />}
    >
      <DashboardSection
        title="Chỉ số hoạt động bãi xe"
        description="Theo dõi lưu lượng xe ra vào và vị trí đỗ (Kịch bản demo xác định theo phiên bản)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetadataCard
            title="Sức chứa hiện tại"
            provenance={PARKING_FUTURE_PROVENANCE}
            availability="unavailable"
            subtitle="Kịch bản xe máy & ô tô"
          />
          <KpiMetadataCard
            title="Lượt xe vào trong ngày"
            provenance={PARKING_FUTURE_PROVENANCE}
            availability="unavailable"
            subtitle="Mô phỏng NFC Barrier"
          />
          <KpiMetadataCard
            title="Lượt xe ra trong ngày"
            provenance={PARKING_FUTURE_PROVENANCE}
            availability="unavailable"
            subtitle="Mô phỏng NFC Barrier"
          />
          <KpiMetadataCard
            title="Tỷ lệ lấp đầy"
            provenance={PARKING_FUTURE_PROVENANCE}
            availability="unavailable"
            subtitle="Ước tính công suất"
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Mô phỏng bãi xe thông minh"
        description="Giao diện kịch bản và dữ liệu đỗ xe mẫu"
      >
        <UnavailableDataState
          title="Phân hệ Bãi xe tuân thủ hợp đồng 'demo'"
          description="Dữ liệu mô phỏng bãi xe sẽ sử dụng bộ fixture xác định (deterministic fixture) có phiên bản rõ ràng trong Sub-phase Parking Demo. Không sử dụng dữ liệu sinh ngẫu nhiên."
          badgeText="Chế độ Demo (Kịch bản xác định)"
          phaseNote="Big Phase 02 / Sub-phase 01: Xác lập provenance 'demo' và cấu trúc lưu trữ fixture có kiểm soát."
        />
      </DashboardSection>
    </DashboardPageShell>
  );
}
