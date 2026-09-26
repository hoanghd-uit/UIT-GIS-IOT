import React from 'react';
import { DashboardPageShell } from '@/components/dashboard/layout/DashboardPageShell';
import { DashboardSection } from '@/components/dashboard/layout/DashboardSection';
import { UnavailableDataState } from '@/components/dashboard/states/UnavailableDataState';
import { KpiMetadataCard } from '@/components/dashboard/cards/KpiMetadataCard';
import { DataModeBadge } from '@/components/dashboard/cards/DataModeBadge';
import { createManualProvenance } from '@/lib/dashboard/provenance';

const FIRE_SAFETY_PROVENANCE = createManualProvenance({
  sourceId: 'pccc-inspection-registry',
  caveats: ['Dữ liệu kiểm tra kỹ thuật định kỳ do ban quản lý nhập tay'],
});

export default function FireSafetyPage() {
  return (
    <DashboardPageShell
      pageNumber="11"
      title="PCCC"
      description="Hạ tầng phòng cháy chữa cháy và trạng thái thiết bị cứu hỏa tòa nhà E"
      badge={<DataModeBadge mode="manual" provenance={FIRE_SAFETY_PROVENANCE} availability="unavailable" size="sm" />}
    >
      <DashboardSection
        title="Trạng thái hạ tầng PCCC"
        description="Thông số kiểm định và tình trạng thiết bị cứu hỏa (Nhập liệu thủ công có kiểm toán)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetadataCard
            title="Bình chữa cháy đạt chuẩn"
            provenance={FIRE_SAFETY_PROVENANCE}
            availability="unavailable"
            subtitle="Toàn bộ 12 tầng"
          />
          <KpiMetadataCard
            title="Họng nước vách tường"
            provenance={FIRE_SAFETY_PROVENANCE}
            availability="unavailable"
            subtitle="Áp lực nước thử nghiệm"
          />
          <KpiMetadataCard
            title="Cửa thoát hiểm"
            provenance={FIRE_SAFETY_PROVENANCE}
            availability="unavailable"
            subtitle="Tình trạng hoạt động"
          />
          <KpiMetadataCard
            title="Đợt kiểm định gần nhất"
            provenance={FIRE_SAFETY_PROVENANCE}
            availability="unavailable"
            subtitle="Ban QLDA & Đội PCCC"
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Quản trị thiết bị PCCC"
        description="Sơ đồ bố trí và danh mục kiểm tra an toàn phòng cháy"
      >
        <UnavailableDataState
          title="Phân hệ PCCC chưa kết nối quản trị nhập tay"
          description="Biểu mẫu kiểm tra, nhập liệu thủ công và theo dõi hạn sử dụng thiết bị PCCC sẽ được tích hợp trong Sub-phase PCCC chuyên trách của Big Phase 02."
          phaseNote="Big Phase 02 / Sub-phase 01: Chuẩn bị hợp đồng provenance 'manual' cho dữ liệu nhập tay."
        />
      </DashboardSection>
    </DashboardPageShell>
  );
}
