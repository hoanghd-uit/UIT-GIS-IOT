/**
 * Parking Demo Fixtures (Phase 08 — Page 09)
 *
 * Deterministic demo data for Building E basement parking dashboard.
 * All IDs are prefixed with DEMO- and all data is frozen at referenceInstant.
 * Deterministic scenario without random generators, clock polling, or PII.
 */

import type { ParkingDemoFixture } from '@/types/dashboard-parking';
import { createDemoProvenance } from './provenance';

export const PARKING_DEMO_FIXTURE_ID = 'page09-parking-demo-v1';
export const PARKING_DEMO_FIXTURE_VERSION = '1.0.0';
export const PARKING_REFERENCE_INSTANT = '2026-10-01T08:00:00.000Z';
export const PARKING_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const PARKING_DEMO_PROVENANCE = createDemoProvenance({
  fixtureVersion: PARKING_DEMO_FIXTURE_VERSION,
  sourceId: PARKING_DEMO_FIXTURE_ID,
  caveats: [
    'Toàn bộ dữ liệu hiển thị trên trang Bãi xe là kịch bản mô phỏng tĩnh (Demo).',
    'Không có kết nối camera, cảm biến siêu âm, gateway LoRaWAN, rào chắn barrier hoặc hệ thống nhận diện biển số thực tế.',
    'Không thu thập, xử lý hay lưu trữ biển số xe, nhận diện khuôn mặt hoặc thông tin cá nhân (PII).',
  ],
});

export const PARKING_DEMO_FIXTURE: ParkingDemoFixture = {
  fixtureId: PARKING_DEMO_FIXTURE_ID,
  version: PARKING_DEMO_FIXTURE_VERSION,
  referenceInstant: PARKING_REFERENCE_INSTANT,
  timezone: PARKING_TIMEZONE,
  scenarioLabel: 'Kịch bản mô phỏng bãi đỗ xe tầng hầm B1 Tòa E',
  caveats: [
    'Dữ liệu mô phỏng theo hợp đồng Knowledge Base Page 09 Parking.',
    'Tất cả thực thể sử dụng tiền tố DEMO-, không tương ứng thiết bị vật lý thực tế.',
    'Mật độ xe máy là ước tính cấp khu vực, không phải bộ đếm phương tiện chi tiết.',
  ],
  supportedRanges: ['today', '7d', '30d'],

  // Car Parking Areas (Total 30 slots: 18 occupied, 12 free = 60.0% occupancy)
  carAreas: [
    {
      areaId: 'DEMO-AREA-A',
      label: 'Khu A · Ô tô tiêu chuẩn',
      description: 'Vị trí đỗ ô tô đang demo.',
      slots: [
        { slotId: 'DEMO-SLOT-A01', label: 'A-01', areaId: 'DEMO-AREA-A', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: '07:15' },
        { slotId: 'DEMO-SLOT-A02', label: 'A-02', areaId: 'DEMO-AREA-A', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: '07:22' },
        { slotId: 'DEMO-SLOT-A03', label: 'A-03', areaId: 'DEMO-AREA-A', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: 'Trống' },
        { slotId: 'DEMO-SLOT-A04', label: 'A-04', areaId: 'DEMO-AREA-A', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: '07:45' },
        { slotId: 'DEMO-SLOT-A05', label: 'A-05', areaId: 'DEMO-AREA-A', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: 'Trống' },
        { slotId: 'DEMO-SLOT-A06', label: 'A-06', areaId: 'DEMO-AREA-A', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: '06:50' },
        { slotId: 'DEMO-SLOT-A07', label: 'A-07', areaId: 'DEMO-AREA-A', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: '07:30' },
        { slotId: 'DEMO-SLOT-A08', label: 'A-08', areaId: 'DEMO-AREA-A', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: 'Trống' },
        { slotId: 'DEMO-SLOT-A09', label: 'A-09', areaId: 'DEMO-AREA-A', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: '07:55' },
        { slotId: 'DEMO-SLOT-A10', label: 'A-10', areaId: 'DEMO-AREA-A', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: '06:30' },
        { slotId: 'DEMO-SLOT-A11', label: 'A-11', areaId: 'DEMO-AREA-A', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: 'Trống' },
        { slotId: 'DEMO-SLOT-A12', label: 'A-12', areaId: 'DEMO-AREA-A', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: '07:10' },
        { slotId: 'DEMO-SLOT-A13', label: 'A-13', areaId: 'DEMO-AREA-A', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: '07:40' },
        { slotId: 'DEMO-SLOT-A14', label: 'A-14', areaId: 'DEMO-AREA-A', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: 'Trống' },
        { slotId: 'DEMO-SLOT-A15', label: 'A-15', areaId: 'DEMO-AREA-A', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-01', lastStatusChangeLabel: 'Trống' },
      ],
    },
    {
      areaId: 'DEMO-AREA-B',
      label: 'Khu B · Ô tô & Sạc điện EV',
      description: 'Vị trí đỗ ô tô đang demo.',
      slots: [
        { slotId: 'DEMO-SLOT-B01', label: 'B-01', areaId: 'DEMO-AREA-B', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: '06:40' },
        { slotId: 'DEMO-SLOT-B02', label: 'B-02', areaId: 'DEMO-AREA-B', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: 'Trống' },
        { slotId: 'DEMO-SLOT-B03', label: 'B-03', areaId: 'DEMO-AREA-B', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: '07:05' },
        { slotId: 'DEMO-SLOT-B04', label: 'B-04', areaId: 'DEMO-AREA-B', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: 'Trống' },
        { slotId: 'DEMO-SLOT-B05', label: 'B-05', areaId: 'DEMO-AREA-B', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: '07:35' },
        { slotId: 'DEMO-SLOT-B06', label: 'B-06', areaId: 'DEMO-AREA-B', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: 'Trống' },
        { slotId: 'DEMO-SLOT-B07', label: 'B-07', areaId: 'DEMO-AREA-B', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: '07:50' },
        { slotId: 'DEMO-SLOT-B08', label: 'B-08', areaId: 'DEMO-AREA-B', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: '07:15' },
        { slotId: 'DEMO-SLOT-B09', label: 'B-09', areaId: 'DEMO-AREA-B', occupied: false, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: 'Trống' },
        { slotId: 'DEMO-SLOT-B10', label: 'B-10', areaId: 'DEMO-AREA-B', occupied: true, vehicleType: 'car', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: '07:25' },
        // EV charging slots (B-11 to B-15)
        { slotId: 'DEMO-SLOT-B11', label: 'B-11 (EV)', areaId: 'DEMO-AREA-B', occupied: true, vehicleType: 'ev', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: '06:15 · Đang sạc' },
        { slotId: 'DEMO-SLOT-B12', label: 'B-12 (EV)', areaId: 'DEMO-AREA-B', occupied: false, vehicleType: 'ev', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: 'Trống sạc' },
        { slotId: 'DEMO-SLOT-B13', label: 'B-13 (EV)', areaId: 'DEMO-AREA-B', occupied: true, vehicleType: 'ev', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: '06:55 · Đang sạc' },
        { slotId: 'DEMO-SLOT-B14', label: 'B-14 (EV)', areaId: 'DEMO-AREA-B', occupied: false, vehicleType: 'ev', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: 'Trống sạc' },
        { slotId: 'DEMO-SLOT-B15', label: 'B-15 (EV)', areaId: 'DEMO-AREA-B', occupied: true, vehicleType: 'ev', cameraDemoId: 'DEMO-CAM-B1-03', lastStatusChangeLabel: '07:40 · Đang sạc' },
      ],
    },
  ],

  // Motorcycle Zones (Estimated density scenarios)
  motorcycleZones: [
    {
      zoneId: 'DEMO-ZONE-M1',
      label: ' Xe máy sinh viên',
      estimatedDensityPercent: 78,
      capacityEstimate: 350,
      status: 'high',
      statusLabel: 'Mật độ cao (78%)',
      cameraDemoId: 'DEMO-CAM-B1-02',
    },
    {
      zoneId: 'DEMO-ZONE-M2',
      label: 'Cán bộ & Giảng viên',
      estimatedDensityPercent: 55,
      capacityEstimate: 150,
      status: 'moderate',
      statusLabel: 'Trung bình (55%)',
      cameraDemoId: 'DEMO-CAM-B1-03',
    },
    {
      zoneId: 'DEMO-ZONE-M3',
      label: 'Khách vãng lai',
      estimatedDensityPercent: 42,
      capacityEstimate: 100,
      status: 'normal',
      statusLabel: 'Bình thường (42%)',
      cameraDemoId: 'DEMO-CAM-B1-04',
    },
  ],

  // Vehicle entries by range
  entriesByRange: {
    today: [
      { timestamp: '2026-10-01T06:00:00.000Z', timeLabel: '06:00', entryCount: 12 },
      { timestamp: '2026-10-01T07:00:00.000Z', timeLabel: '07:00', entryCount: 38 },
      { timestamp: '2026-10-01T08:00:00.000Z', timeLabel: '08:00', entryCount: 46 },
      { timestamp: '2026-10-01T09:00:00.000Z', timeLabel: '09:00', entryCount: 22 },
      { timestamp: '2026-10-01T10:00:00.000Z', timeLabel: '10:00', entryCount: 16 },
      { timestamp: '2026-10-01T11:00:00.000Z', timeLabel: '11:00', entryCount: 19 },
      { timestamp: '2026-10-01T12:00:00.000Z', timeLabel: '12:00', entryCount: 14 },
      { timestamp: '2026-10-01T13:00:00.000Z', timeLabel: '13:00', entryCount: 28 },
      { timestamp: '2026-10-01T14:00:00.000Z', timeLabel: '14:00', entryCount: 15 },
      { timestamp: '2026-10-01T15:00:00.000Z', timeLabel: '15:00', entryCount: 11 },
      { timestamp: '2026-10-01T16:00:00.000Z', timeLabel: '16:00', entryCount: 8 },
      { timestamp: '2026-10-01T17:00:00.000Z', timeLabel: '17:00', entryCount: 6 },
      { timestamp: '2026-10-01T18:00:00.000Z', timeLabel: '18:00', entryCount: 7 },
      { timestamp: '2026-10-01T19:00:00.000Z', timeLabel: '19:00', entryCount: 5 },
    ],
    '7d': [
      { timestamp: '2026-09-25T00:00:00.000Z', timeLabel: 'Thứ 6', entryCount: 235 },
      { timestamp: '2026-09-26T00:00:00.000Z', timeLabel: 'Thứ 7', entryCount: 120 },
      { timestamp: '2026-09-27T00:00:00.000Z', timeLabel: 'Chủ nhật', entryCount: 45 },
      { timestamp: '2026-09-28T00:00:00.000Z', timeLabel: 'Thứ 2', entryCount: 290 },
      { timestamp: '2026-09-29T00:00:00.000Z', timeLabel: 'Thứ 3', entryCount: 275 },
      { timestamp: '2026-09-30T00:00:00.000Z', timeLabel: 'Thứ 4', entryCount: 260 },
      { timestamp: '2026-10-01T00:00:00.000Z', timeLabel: 'Thứ 5', entryCount: 247 },
    ],
    '30d': [
      { timestamp: '2026-09-03T00:00:00.000Z', timeLabel: 'Tuần 1', entryCount: 1420 },
      { timestamp: '2026-09-10T00:00:00.000Z', timeLabel: 'Tuần 2', entryCount: 1580 },
      { timestamp: '2026-09-17T00:00:00.000Z', timeLabel: 'Tuần 3', entryCount: 1490 },
      { timestamp: '2026-09-24T00:00:00.000Z', timeLabel: 'Tuần 4', entryCount: 1510 },
    ],
  },

  // Demo Camera Devices (4 units, strictly DEMO- prefixed)
  cameraDevices: [
    {
      cameraDemoId: 'DEMO-CAM-B1-01',
      label: 'Camera Hầm B1 - Cổng vào & Khu ô tô A',
      demoCoverageLabel: 'Lối vào & Khu ô tô A',
      demoInferenceIntervalSeconds: 15,
      demoStatus: 'simulated_active',
      demoStatusLabel: 'Demo · Hoạt động giả lập',
    },
    // {
    //   cameraDemoId: 'DEMO-CAM-B1-02',
    //   label: 'Camera Hầm B1 - Khu xe máy M1',
    //   demoCoverageLabel: 'Khu xe máy sinh viên M1',
    //   demoInferenceIntervalSeconds: 30,
    //   demoStatus: 'simulated_active',
    //   demoStatusLabel: 'Demo · Hoạt động giả lập',
    // },
    {
      cameraDemoId: 'DEMO-CAM-B1-03',
      label: 'Camera Hầm B1 - Khu xe máy M2 & Ô tô B',
      demoCoverageLabel: 'Khu Xe máy & Ô tô B',
      demoInferenceIntervalSeconds: 30,
      demoStatus: 'simulated_active',
      demoStatusLabel: 'Demo · Hoạt động giả lập',
    },
    {
      cameraDemoId: 'DEMO-CAM-B1-04',
      label: 'Camera Hầm B1 - Cổng ra & Khu M3',
      demoCoverageLabel: 'Lối ra & Khu M3',
      demoInferenceIntervalSeconds: 60,
      demoStatus: 'simulated_inspection',
      demoStatusLabel: 'Demo · Cần kiểm tra',
    },
  ],

  // Sample session duration statistics (explicitly fixture-backed for duration KPI)
  demoSessionDurationSummary: {
    averageMinutes: 195,
    formattedDuration: '3h15',
    totalSampleSessions: 140,
  },

  // Technical Notes explaining scenario limitations and privacy
  technicalNotes: [
    {
      id: 'NOTE-01',
      title: 'Mô phỏng vị trí đỗ ô tô',
      description:
        'Vị trí Ô tô đang demo.',
    },
    {
      id: 'NOTE-02',
      title: 'Ước tính mật độ xe máy theo khu',
      description:
        'Mật độ xe máy được tính theo tỉ lệ diện tích/khu vực demo.',
    },
    // {
    //   id: 'NOTE-03',
    //   title: 'Bảo vệ quyền riêng tư & Không thu thập PII',
    //   description:
    //     'Hệ thống hoàn toàn không lưu trữ hình ảnh khuôn mặt, biển số xe, nhận diện người hoặc dữ liệu định danh cá nhân trong bất kỳ giai đoạn nào.',
    // },
    // {
    //   id: 'NOTE-04',
    //   title: 'Kiến trúc hệ thống giả lập',
    //   description:
    //     'Không kết nối camera IP, luồng RTSP, thiết bị gateway LoRaWAN hoặc bộ suy luận TinyML biên trong giai đoạn hiện tại. Tất cả giá trị phục vụ mục đích kiểm thử trực quan.',
    // },
  ],
};
