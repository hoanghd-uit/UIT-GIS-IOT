/**
 * GIS-UIT Building E Digital Twin - Alert Center Demo Fixture
 * Fixture ID: page06-alert-center-demo-v1
 *
 * CRITICAL INVARIANTS:
 * - Deterministic, versioned, zero pseudorandom math, zero render-time timestamp calls
 * - Frozen reference instant for reproducible tests and screenshots
 * - Demo IDs with DEMO- prefix to prevent collision with live device IDs or real persons
 */

import { DemoAlertEvent, DemoAlertRule } from '@/types/dashboard-alerts';

export const ALERT_DEMO_FIXTURE_ID = 'page06-alert-center-demo-v1';

/**
 * Frozen reference instant for deterministic calculations.
 * Corresponds to 2026-09-29T10:00:00.000Z (17:00 ICT).
 */
export const ALERT_REFERENCE_INSTANT = '2026-09-29T10:00:00.000Z';

export const DEMO_NOTIFICATION_CHANNELS = [
  { id: 'email', name: 'Email (SMTP)', status: 'demo_configured', recipient: 'banquonly@uit.edu.vn' },
  { id: 'zns', name: 'Zalo Cloud (ZNS)', status: 'demo_configured', recipient: 'Nhóm Kỹ thuật E' },
  { id: 'sms', name: 'SMS Brandname', status: 'demo_configured', recipient: 'Trực ca 24/7' },
];

export const DEMO_ALERT_RULES: DemoAlertRule[] = [
  {
    ruleId: 'DEMO-RULE-001',
    ruleName: 'Nồng độ CO₂ vượt ngưỡng văn phòng',
    category: 'environment',
    condition: 'CO₂ > 1.000 ppm liên tục 15 phút',
    severity: 'danger',
    notificationChannels: ['Email', 'Zalo Cloud'],
    status: 'demo_active',
  },
  {
    ruleId: 'DEMO-RULE-002',
    ruleName: 'Nhiệt độ phòng máy chủ tăng cao',
    category: 'environment',
    condition: 'Nhiệt độ > 32 °C trong 5 phút',
    severity: 'danger',
    notificationChannels: ['SMS', 'Email'],
    status: 'demo_active',
  },
  {
    ruleId: 'DEMO-RULE-003',
    ruleName: 'Lưu lượng nước đêm bất thường (nghi rò rỉ)',
    category: 'water',
    condition: 'Lưu lượng đêm > 0.5 m³/h từ 01:00 đến 05:00',
    severity: 'warning',
    notificationChannels: ['Email'],
    status: 'demo_active',
  },
  {
    ruleId: 'DEMO-RULE-004',
    ruleName: 'Mực nước bể ngầm dưới ngưỡng an toàn',
    category: 'water',
    condition: 'Mực bể ngầm < 20% dung tích',
    severity: 'danger',
    notificationChannels: ['SMS', 'Zalo Cloud'],
    status: 'demo_active',
  },
  {
    ruleId: 'DEMO-RULE-005',
    ruleName: 'Phụ tải điện nền ca đêm vượt hạn mức',
    category: 'energy',
    condition: 'Công suất nền > 45 kW trong khung giờ nghỉ',
    severity: 'warning',
    notificationChannels: ['Email'],
    status: 'demo_active',
  },
  {
    ruleId: 'DEMO-RULE-006',
    ruleName: 'Mất tín hiệu cảm biến Solar Gateway',
    category: 'iot',
    condition: 'Không nhận gói tin quá 60 phút',
    severity: 'info',
    notificationChannels: ['Email'],
    status: 'demo_active',
  },
];

export const DEMO_ALERT_EVENTS: DemoAlertEvent[] = [
  {
    alertId: 'DEMO-ALT-001',
    subjectId: 'CO2-E6-06',
    demoDeviceId: 'DEMO-DEV-SOLAR-E606',
    severity: 'danger',
    category: 'environment',
    title: 'Nồng độ CO₂ vượt ngưỡng nguy hiểm (1.140 ppm)',
    locationLabel: 'Tầng 6 · Phòng họp E6.6',
    detectedAt: '2026-09-29T09:15:00.000Z', // 45m before reference (Today)
    lifecycleStatus: 'new',
    demoAssigneeRole: 'Kỹ thuật viên HVAC',
    slaDueAt: '2026-09-29T09:45:00.000Z', // Overdue SLA (reference is 10:00)
    suggestedActionText:
      'Tăng lưu lượng gió tươi quạt AHU tầng 6; mở cửa thông gió phòng E6.6 nếu đang diễn ra hội họp đông người.',
    ruleId: 'DEMO-RULE-001',
    notificationChannels: ['Email', 'Zalo Cloud'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-29T09:15:00.000Z',
        title: 'Phát hiện vượt ngưỡng',
        description: 'Mẫu dữ liệu nồng độ CO₂ đạt 1.140 ppm (ngưỡng nguy hiểm 1.000 ppm).',
        type: 'detected',
      },
      {
        timestamp: '2026-09-29T09:16:30.000Z',
        title: 'Gửi cảnh báo tự động',
        description: 'Đã gửi thông báo minh họa qua kênh Zalo ZNS và Email tới tổ vận hành HVAC.',
        type: 'investigating',
      },
      {
        timestamp: '2026-09-29T09:45:00.000Z',
        title: 'Cảnh báo quá hạn SLA phản hồi',
        description: 'Chưa có kỹ thuật viên nhận xử lý trong thời gian cam kết 30 phút.',
        type: 'investigating',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-002',
    subjectId: 'WTR-AVC-FL4',
    demoDeviceId: 'DEMO-DEV-AVC-0014',
    severity: 'warning',
    category: 'water',
    title: 'Lưu lượng nước đêm duy trì liên tục nghi rò rỉ (0.62 m³/h)',
    locationLabel: 'Tầng 4 · Cụm vệ sinh nam khu E4',
    detectedAt: '2026-09-29T02:30:00.000Z', // 7.5h before reference (Today)
    lifecycleStatus: 'acknowledged',
    demoAssigneeRole: 'Đội bảo trì Cấp thoát nước',
    slaDueAt: '2026-09-29T14:30:00.000Z', // Within SLA
    suggestedActionText:
      'Kiểm tra van phao bồn xả vệ sinh tầng 4; cô lập nhánh van phụ nếu phát hiện chảy tràn.',
    ruleId: 'DEMO-RULE-003',
    notificationChannels: ['Email'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-29T02:30:00.000Z',
        title: 'Phát hiện lưu lượng nền đêm bất thường',
        description: 'Đồng hồ nước AVC ghi nhận lưu lượng 0.62 m³/h vượt ngưỡng 0.5 m³/h.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-29T03:05:00.000Z',
        title: 'Xác nhận tiếp nhận',
        description: 'Kỹ thuật viên ca đêm tiếp nhận sự vụ và lên lịch kiểm tra thực địa sáng sớm.',
        actorRole: 'Trực ban M&E',
        type: 'acknowledged',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-003',
    subjectId: 'ENV-TEMP-SERVER',
    demoDeviceId: 'DEMO-DEV-SOLAR-SRV',
    severity: 'danger',
    category: 'environment',
    title: 'Nhiệt độ phòng máy chủ tăng đột biến (33.5 °C)',
    locationLabel: 'Tầng 2 · Phòng Server E2.1',
    detectedAt: '2026-09-28T14:20:00.000Z', // Yesterday (~20h ago, 7d window)
    lifecycleStatus: 'resolved',
    demoAssigneeRole: 'Kỹ sư Cơ điện & Hạ tầng IT',
    slaDueAt: '2026-09-28T15:20:00.000Z',
    suggestedActionText:
      'Bật máy lạnh dự phòng số 2 phòng Server; vệ sinh lưới lọc bụi dàn lạnh trung tâm.',
    ruleId: 'DEMO-RULE-002',
    notificationChannels: ['SMS', 'Email'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-28T14:20:00.000Z',
        title: 'Cảnh báo nhiệt độ cao',
        description: 'Cảm biến ghi nhận 33.5 °C, vượt ngưỡng an toàn 32 °C.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-28T14:28:00.000Z',
        title: 'Kỹ thuật viên nhận xử lý',
        description: 'Kỹ sư trực điều hòa chuyển đổi sang máy lạnh dự phòng số 2.',
        actorRole: 'Kỹ sư Cơ điện',
        type: 'acknowledged',
      },
      {
        timestamp: '2026-09-28T14:55:00.000Z',
        title: 'Nhiệt độ ổn định về mức 24 °C',
        description: 'Sự cố được khắc phục hoàn toàn trong 35 phút (đáp ứng SLA 60 phút).',
        actorRole: 'Kỹ sư Cơ điện',
        type: 'resolved',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-004',
    subjectId: 'ENG-LOAD-NIGHT',
    demoDeviceId: 'DEMO-DEV-MTR-E-MAIN',
    severity: 'warning',
    category: 'energy',
    title: 'Công suất tiêu thụ ban đêm cao hơn mức nền 20% (52 kW)',
    locationLabel: 'Tầng G · Tủ phân phối MSB',
    detectedAt: '2026-09-27T01:45:00.000Z', // 2 days ago (7d window)
    lifecycleStatus: 'closed',
    demoAssigneeRole: 'Tổ trưởng Quản lý Năng lượng',
    slaDueAt: '2026-09-27T08:00:00.000Z',
    suggestedActionText:
      'Rà soát hệ thống chiếu sáng hành lang và điều hòa chưa tắt sau giờ làm việc tại các tầng.',
    ruleId: 'DEMO-RULE-005',
    notificationChannels: ['Email'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-27T01:45:00.000Z',
        title: 'Cảnh báo công suất nền vượt định mức',
        description: 'Đồng hồ tổng ghi nhận phụ tải 52 kW (ngưỡng 45 kW).',
        type: 'detected',
      },
      {
        timestamp: '2026-09-27T02:10:00.000Z',
        title: 'Tuần tra và tắt phụ tải thừa',
        description: 'Bảo vệ ca đêm ngắt thiết bị chiếu sáng hội trường E5 bỏ quên.',
        type: 'resolved',
      },
      {
        timestamp: '2026-09-27T07:30:00.000Z',
        title: 'Đóng sự vụ',
        description: 'Hoàn tất nghiệm thu rà soát tiêu thụ điện.',
        type: 'closed',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-005',
    subjectId: 'IOT-GW-SOLAR',
    demoDeviceId: 'DEMO-DEV-GW-01',
    severity: 'info',
    category: 'iot',
    title: 'Khởi động lại Gateway cảm biến môi trường tầng 4',
    locationLabel: 'Tầng 4 · Hộp kỹ thuật E4',
    detectedAt: '2026-09-26T11:00:00.000Z', // 3 days ago (7d window)
    lifecycleStatus: 'resolved',
    demoAssigneeRole: 'Kỹ sư Viễn thông & IoT',
    slaDueAt: '2026-09-26T17:00:00.000Z',
    suggestedActionText: 'Theo dõi chất lượng sóng LoRaWAN và gói tin nhận trong 2 giờ tới.',
    ruleId: 'DEMO-RULE-006',
    notificationChannels: ['Email'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-26T11:00:00.000Z',
        title: 'Thiết bị tự khởi động lại định kỳ',
        description: 'Gateway thực hiện watchdog reboot định kỳ hàng tuần.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-26T11:05:00.000Z',
        title: 'Khôi phục kết nối thành công',
        description: 'Toàn bộ 4 cảm biến Solar kết nối lại và truyền dữ liệu bình thường.',
        type: 'resolved',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-006',
    subjectId: 'CO2-E4-02',
    demoDeviceId: 'DEMO-DEV-SOLAR-E402',
    severity: 'warning',
    category: 'environment',
    title: 'Nồng độ CO₂ mức cảnh báo (920 ppm)',
    locationLabel: 'Tầng 4 · Phòng học E4.2',
    detectedAt: '2026-09-25T15:10:00.000Z', // 4 days ago (7d window)
    lifecycleStatus: 'resolved',
    demoAssigneeRole: 'Kỹ thuật viên HVAC',
    slaDueAt: '2026-09-25T16:10:00.000Z',
    suggestedActionText: 'Điều chỉnh tốc độ quạt hút gió tầng 4 lên mức 2.',
    ruleId: 'DEMO-RULE-001',
    notificationChannels: ['Email'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-25T15:10:00.000Z',
        title: 'CO₂ tiệm cận ngưỡng cao',
        description: 'Mẫu đo đạt 920 ppm trong giờ học đông sinh viên.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-25T15:40:00.000Z',
        title: 'Tăng cường lưu thông khí',
        description: 'Đã mở thêm quạt đối lưu, nồng độ giảm về 680 ppm.',
        type: 'resolved',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-007',
    subjectId: 'WTR-TANK-ROOF',
    demoDeviceId: 'DEMO-DEV-TANK-LVL-01',
    severity: 'info',
    category: 'water',
    title: 'Bể nước mái kích hoạt bơm bù tự động (mực nước 55%)',
    locationLabel: 'Tầng Mái · Cụm bồn cấp 29 m³',
    detectedAt: '2026-09-24T08:30:00.000Z', // 5 days ago (7d window)
    lifecycleStatus: 'closed',
    demoAssigneeRole: 'Kỹ thuật viên Vận hành Nước',
    slaDueAt: null,
    suggestedActionText: 'Kiểm tra hoạt động ngắt tự động của phao điện khi bể đạt 90%.',
    ruleId: 'DEMO-RULE-004',
    notificationChannels: ['Email'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-24T08:30:00.000Z',
        title: 'Bơm nước bắt đầu chu kỳ nạp',
        description: 'Phao điện đóng mạch kích hoạt máy bơm nước từ bể ngầm lên bể mái.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-24T09:15:00.000Z',
        title: 'Bể mái đầy, tự ngắt',
        description: 'Mực nước đạt 92%, chu trình nạp kết thúc an toàn.',
        type: 'closed',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-008',
    subjectId: 'CO2-E6-01',
    demoDeviceId: 'DEMO-DEV-SOLAR-E601',
    severity: 'warning',
    category: 'environment',
    title: 'Nồng độ CO₂ tăng cao trong giờ học (890 ppm)',
    locationLabel: 'Tầng 6 · Giảng đường E6.1',
    detectedAt: '2026-09-22T09:40:00.000Z', // 7 days ago
    lifecycleStatus: 'closed',
    demoAssigneeRole: 'Kỹ thuật viên HVAC',
    slaDueAt: '2026-09-22T10:40:00.000Z',
    suggestedActionText: 'Bật hệ thống hút gió cưỡng bức phòng E6.1.',
    ruleId: 'DEMO-RULE-001',
    notificationChannels: ['Email'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-22T09:40:00.000Z',
        title: 'Ghi nhận nồng độ 890 ppm',
        description: 'Vượt ngưỡng cảnh báo nhẹ 800 ppm.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-22T10:15:00.000Z',
        title: 'Xử lý hoàn tất',
        description: 'Hệ thống thông gió hoạt động ổn định đưa CO₂ về 620 ppm.',
        type: 'closed',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-009',
    subjectId: 'WTR-VALVE-E2',
    demoDeviceId: 'DEMO-DEV-AVC-0022',
    severity: 'warning',
    category: 'water',
    title: 'Áp lực nước đường ống cấp tầng 2 giảm dưới 1.2 bar',
    locationLabel: 'Tầng 2 · Trục kỹ thuật nước E2',
    detectedAt: '2026-09-19T16:00:00.000Z', // 10 days ago (30d window)
    lifecycleStatus: 'closed',
    demoAssigneeRole: 'Đội bảo trì Cấp thoát nước',
    slaDueAt: '2026-09-19T18:00:00.000Z',
    suggestedActionText: 'Kiểm tra van giảm áp nhánh tầng 2 và van xả khí đầu ống.',
    ruleId: 'DEMO-RULE-003',
    notificationChannels: ['Email', 'SMS'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-19T16:00:00.000Z',
        title: 'Áp lực nước suy giảm',
        description: 'Đồng hồ AVC tầng 2 ghi nhận áp suất tụt xuống 1.1 bar.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-19T17:10:00.000Z',
        title: 'Xả khí đường ống thành công',
        description: 'Áp lực trở lại mức chuẩn 2.2 bar.',
        type: 'closed',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-010',
    subjectId: 'CO2-E4-05',
    demoDeviceId: 'DEMO-DEV-SOLAR-E405',
    severity: 'danger',
    category: 'environment',
    title: 'Nồng độ CO₂ vượt ngưỡng nghiêm trọng (1.210 ppm)',
    locationLabel: 'Tầng 4 · Phòng thí nghiệm E4.5',
    detectedAt: '2026-09-16T14:30:00.000Z', // 13 days ago (30d window)
    lifecycleStatus: 'closed',
    demoAssigneeRole: 'Kỹ thuật viên HVAC',
    slaDueAt: '2026-09-16T15:00:00.000Z',
    suggestedActionText: 'Sơ tán sinh viên ra hành lang thoáng khí; kích hoạt quạt hút công suất tối đa.',
    ruleId: 'DEMO-RULE-001',
    notificationChannels: ['Email', 'Zalo Cloud', 'SMS'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-16T14:30:00.000Z',
        title: 'Vượt ngưỡng khẩn cấp 1.210 ppm',
        description: 'Báo động phòng thí nghiệm kín đông người.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-16T14:42:00.000Z',
        title: 'Mở cửa và tăng thông gió',
        description: 'Giảng viên mở cửa sổ thông thoáng và bật quạt trần.',
        type: 'resolved',
      },
      {
        timestamp: '2026-09-16T15:15:00.000Z',
        title: 'Nồng độ an toàn trở lại',
        description: 'Chỉ số đo hạ xuống 540 ppm, đóng sự vụ.',
        type: 'closed',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-011',
    subjectId: 'IOT-BATTERY-LOW',
    demoDeviceId: 'DEMO-DEV-SOLAR-E604',
    severity: 'info',
    category: 'iot',
    title: 'Pin dự phòng cảm biến Solar E6.4 báo yếu (< 20%)',
    locationLabel: 'Tầng 6 · Phòng học E6.4',
    detectedAt: '2026-09-10T09:00:00.000Z', // 19 days ago (30d window)
    lifecycleStatus: 'closed',
    demoAssigneeRole: 'Kỹ thuật viên Thiết bị',
    slaDueAt: '2026-09-12T09:00:00.000Z',
    suggestedActionText: 'Thay pin Lithium 3.6V cho cảm biến Solar trong đợt bảo dưỡng định kỳ.',
    ruleId: 'DEMO-RULE-006',
    notificationChannels: ['Email'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-10T09:00:00.000Z',
        title: 'Cảnh báo mức pin thấp',
        description: 'Điện áp pin báo 2.85V, ước tính còn 18% dung lượng.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-11T14:00:00.000Z',
        title: 'Thay pin mới',
        description: 'Kỹ thuật viên đã thay pin 3.6V mới, điện áp 3.65V.',
        type: 'closed',
      },
    ],
  },
  {
    alertId: 'DEMO-ALT-012',
    subjectId: 'ENG-VOLT-SAG',
    demoDeviceId: 'DEMO-DEV-MTR-E-MAIN',
    severity: 'warning',
    category: 'energy',
    title: 'Điện áp pha A sụt giảm ngắn hạn (205V)',
    locationLabel: 'Tầng G · Trạm biến áp Tòa E',
    detectedAt: '2026-09-05T13:25:00.000Z', // 24 days ago (30d window)
    lifecycleStatus: 'closed',
    demoAssigneeRole: 'Kỹ sư Điện',
    slaDueAt: '2026-09-05T14:25:00.000Z',
    suggestedActionText: 'Theo dõi điện áp lưới trung thế EVN cấp vào trạm biến áp.',
    ruleId: 'DEMO-RULE-005',
    notificationChannels: ['Email'],
    provenance: {
      mode: 'demo',
      fixtureId: ALERT_DEMO_FIXTURE_ID,
    },
    timeline: [
      {
        timestamp: '2026-09-05T13:25:00.000Z',
        title: 'Ghi nhận sụt áp thoáng qua',
        description: 'Điện áp pha A giảm từ 220V xuống 205V trong 12 giây.',
        type: 'detected',
      },
      {
        timestamp: '2026-09-05T13:40:00.000Z',
        title: 'Điện áp trở lại bình thường',
        description: 'Lưới điện EVN ổn định lại 222V, không ảnh hưởng thiết bị.',
        type: 'closed',
      },
    ],
  },
];
