import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSrcFile(relPath) {
  const fullPath = path.join(__dirname, 'src', relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

/* =========================================================================
 * 1. FIXTURE & SELECTOR INVARIANTS (BP2-P07-T01 .. T05)
 * ========================================================================= */

test('BP2-P07-T01: Deterministic demo fixtures have fixed IDs, frozen reference instant, and no Math.random/Date.now', () => {
  const overviewFixturesSource = readSrcFile('lib/dashboard/overview-demo-fixtures.ts');
  const gridFixturesSource = readSrcFile('lib/dashboard/overview-grid-fixtures.ts');
  const selectorsSource = readSrcFile('lib/dashboard/overview-selectors.ts');

  // Verify fixture IDs
  assert.ok(overviewFixturesSource.includes("'page01-overview-demo-v1'"), 'Overview fixture must have ID page01-overview-demo-v1');
  assert.ok(gridFixturesSource.includes("'page01-floor-grid-demo-v1'"), 'Grid fixture must have ID page01-floor-grid-demo-v1');

  // Frozen reference instant
  assert.ok(overviewFixturesSource.includes('2026-09-29T10:00:00.000Z'), 'Overview fixture must have frozen reference instant');

  // No Math.random or Date.now calls in selectors or fixtures
  assert.ok(!overviewFixturesSource.includes('Math.random()'), 'No Math.random in overview fixtures');
  assert.ok(!gridFixturesSource.includes('Math.random()'), 'No Math.random in grid fixtures');
  assert.ok(!selectorsSource.includes('Math.random()'), 'No Math.random in selectors');
  assert.ok(!selectorsSource.includes('Date.now()'), 'No render-time Date.now in selectors');
});

test('BP2-P07-T02: Energy KPI equals aggregate of chart series across supported range presets', () => {
  const selectorsSource = readSrcFile('lib/dashboard/overview-selectors.ts');
  const fixturesSource = readSrcFile('lib/dashboard/overview-demo-fixtures.ts');

  // Selectors must export getOverviewEnergySummary
  assert.ok(selectorsSource.includes('export function getOverviewEnergySummary'), 'Exports getOverviewEnergySummary');

  // Verifies that totalKwh is sum of series values
  assert.ok(selectorsSource.includes('totalKwh += pt.value'), 'Sum of energy values');
  assert.ok(selectorsSource.includes('baselineTotalKwh += pt.baseline'), 'Sum of baseline values');
  assert.ok(selectorsSource.includes('differenceKwh'), 'Computes difference with baseline');

  // Contains hourlyToday, daily7d, daily30d
  assert.ok(fixturesSource.includes('hourlyToday'), 'Has 24h hourly series');
  assert.ok(fixturesSource.includes('daily7d'), 'Has 7d daily series');
  assert.ok(fixturesSource.includes('daily30d'), 'Has 30d daily series');
});

test('BP2-P07-T03: CO2 average and rooms over warning threshold derive from Page 03 demo fixture without mutation', () => {
  const selectorsSource = readSrcFile('lib/dashboard/overview-selectors.ts');

  // Uses CO2_DEMO_FIXTURE from Page 03
  assert.ok(selectorsSource.includes("from './environment-demo-fixtures'"), 'Imports Page 03 fixture');
  assert.ok(selectorsSource.includes('CO2_DEMO_FIXTURE.kpis.averageCo2'), 'Derives average from Page 03 fixture');
  assert.ok(selectorsSource.includes('CO2_DEMO_FIXTURE.thresholds.co2ModerateMax'), 'Uses 1000 ppm warning threshold');

  // Pure function with no side effects
  assert.ok(selectorsSource.includes('export function getOverviewCo2Kpis'), 'Exports getOverviewCo2Kpis');
  assert.ok(selectorsSource.includes('export function getCellCo2State'), 'Exports getCellCo2State');
});

test('BP2-P07-T04: Open alerts KPI and latest preview derive from Page 06 demo fixture without mutation', () => {
  const selectorsSource = readSrcFile('lib/dashboard/overview-selectors.ts');

  // Uses DEMO_ALERT_EVENTS from Page 06
  assert.ok(selectorsSource.includes("from './alert-demo-fixtures'"), 'Imports Page 06 fixture');
  assert.ok(selectorsSource.includes('ALERT_DEMO_FIXTURE_ID'), 'References Page 06 fixture ID');
  assert.ok(selectorsSource.includes('export function getOverviewLatestAlerts'), 'Exports getOverviewLatestAlerts');
  assert.ok(selectorsSource.includes('export function getOverviewOpenAlertsKpi'), 'Exports getOverviewOpenAlertsKpi');

  // Does not mutate DEMO_ALERT_EVENTS
  assert.ok(selectorsSource.includes('[...openEvents].sort'), 'Sorts a shallow copy of open events');
});

test('BP2-P07-T05: Logical floor grid fixture has unique stable cell IDs and truthful missing-data state for unmapped spaces', () => {
  const gridFixturesSource = readSrcFile('lib/dashboard/overview-grid-fixtures.ts');
  const selectorsSource = readSrcFile('lib/dashboard/overview-selectors.ts');

  // Floor configs for T6 and T4
  assert.ok(gridFixturesSource.includes("floorId: 'T6'"), 'Configures Floor 6');
  assert.ok(gridFixturesSource.includes("floorId: 'T4'"), 'Configures Floor 4');

  // Check unique stable IDs
  assert.ok(gridFixturesSource.includes("'CELL-E6-01'"), 'Stable cell ID CELL-E6-01');
  assert.ok(gridFixturesSource.includes("'CELL-E6-02'"), 'Stable cell ID CELL-E6-02');
  assert.ok(gridFixturesSource.includes("'CELL-E4-01'"), 'Stable cell ID CELL-E4-01');

  // Unmapped rooms or corridor cells do NOT receive fake CO2
  assert.ok(selectorsSource.includes("cell.kind !== 'room' || !cell.roomDemoId"), 'Unmapped rooms or corridors have no sensor');
  assert.ok(selectorsSource.includes("status: 'unavailable'"), 'Returns unavailable status for unmapped cells');
});

/* =========================================================================
 * 2. 2D GRID CONTRACT & ZERO 3D/BIM VERIFICATION (BP2-P07-T06 .. T09)
 * ========================================================================= */

test('BP2-P07-T06: Vùng trung tâm là ma trận 2D logic; hoàn toàn không có Three.js, WebGL hay Unity canvas', () => {
  const gridSource = readSrcFile('components/dashboard/overview/InteractiveFloorGrid.tsx');
  const clientSource = readSrcFile('components/dashboard/overview/OverviewDashboard.client.tsx');
  const pageSource = readSrcFile('app/dashboard/overview/page.tsx');

  // No Three.js, WebGL, or Unity canvas
  assert.ok(!gridSource.includes('three'), 'No Three.js in grid');
  assert.ok(!gridSource.includes('webgl'), 'No WebGL in grid');
  assert.ok(!gridSource.includes('Unity'), 'No Unity in grid');
  assert.ok(!clientSource.includes('Unity'), 'No Unity in overview client');
  assert.ok(!pageSource.includes('Unity'), 'No Unity in overview page');

  // Truthful caption
  assert.ok(gridSource.includes('Không gian theo tầng · Logical 2D Grid'), 'Title specifies Logical 2D Grid');
  assert.ok(gridSource.includes('Sơ đồ ma trận logic, không phải mặt bằng kiến trúc hay mô hình 3D/BIM'), 'Explicit 2D disclaimer');
});

test('BP2-P07-T07: FloorCatalog và InteractiveFloorGrid hỗ trợ chuyển tầng và chọn ô ổn định', () => {
  const catalogSource = readSrcFile('components/dashboard/overview/FloorCatalog.tsx');
  const gridSource = readSrcFile('components/dashboard/overview/InteractiveFloorGrid.tsx');
  const clientSource = readSrcFile('components/dashboard/overview/OverviewDashboard.client.tsx');

  // FloorCatalog component
  assert.ok(catalogSource.includes('export function FloorCatalog'), 'Exports FloorCatalog');
  assert.ok(catalogSource.includes('onSelectFloor'), 'Emits floorId on floor change');

  // InteractiveFloorGrid component
  assert.ok(gridSource.includes('export function InteractiveFloorGrid'), 'Exports InteractiveFloorGrid');
  assert.ok(gridSource.includes('onSelectCell'), 'Emits cellId on selection');

  // Client container validates selection on floor switch
  assert.ok(clientSource.includes('handleSelectFloor'), 'Has floor selection handler');
  assert.ok(clientSource.includes('setSelectedFloorId'), 'Sets selected floor');
});

test('BP2-P07-T08: FloorMetadataPanel hiển thị chi tiết phòng đã chọn và hướng dẫn rõ ràng khi chưa chọn', () => {
  const panelSource = readSrcFile('components/dashboard/overview/FloorMetadataPanel.tsx');

  assert.ok(panelSource.includes('export function FloorMetadataPanel'), 'Exports FloorMetadataPanel');
  assert.ok(panelSource.includes('Chưa chọn ô không gian'), 'Has empty unselected guide');
  assert.ok(panelSource.includes('Nồng độ CO₂ hiện thời'), 'Displays CO2 value when selected');
  assert.ok(panelSource.includes('Diễn biến CO₂ trong ngày'), 'Displays hourly micro-trend');
  assert.ok(panelSource.includes('Xem phân hệ Môi trường'), 'Links to Environment page');
});

test('BP2-P07-T09: InteractiveFloorGrid cung cấp bảng dữ liệu tiếp cận (Accessible Table) song song ma trận 2D', () => {
  const gridSource = readSrcFile('components/dashboard/overview/InteractiveFloorGrid.tsx');

  assert.ok(gridSource.includes("viewMode === 'grid'"), 'Supports 2D grid view mode');
  assert.ok(gridSource.includes("viewMode === 'table'"), 'Supports accessible table view mode');
  assert.ok(gridSource.includes('role="grid"'), 'Has role=grid for accessibility');
  assert.ok(gridSource.includes('role="gridcell"'), 'Has role=gridcell for cells');
  assert.ok(gridSource.includes('<table'), 'Renders accessible table alternative');
});

/* =========================================================================
 * 3. HEADER & 6-CARD KPI STRIP ACCORDING TO DATA STRATEGY (BP2-P07-T10 .. T12)
 * ========================================================================= */

test('BP2-P07-T10: OverviewPageHeader có tiêu đề đúng đắn, không có thông điệp trực tuyến giả mạo, có bộ lọc thời gian và badge đa nguồn', () => {
  const headerSource = readSrcFile('components/dashboard/overview/OverviewPageHeader.tsx');

  assert.ok(headerSource.includes('Tổng quan · Tòa E'), 'Title matches requirement');
  assert.ok(headerSource.includes('Cập nhật lần cuối'), 'Follows mockup subtitle with lastFetch timestamp');
  assert.ok(!headerSource.includes('cảm biến trực tuyến'), 'No fake online sensor claim in header');
  assert.ok(headerSource.includes('Đa nguồn (Live · Demo)'), 'Discloses mixed live and demo mode');
  assert.ok(headerSource.includes('Hôm nay'), 'Has Hôm nay preset');
  assert.ok(headerSource.includes('7 ngày'), 'Has 7 ngày preset');
  assert.ok(headerSource.includes('30 ngày'), 'Has 30 ngày preset');
  assert.ok(headerSource.includes('Tùy chọn'), 'Has disabled Tùy chọn button');
});

test('BP2-P07-T11: Sáu slot KPI tuân thủ ma trận dữ liệu: Nước Unavailable, Điện/CO2/Cảnh báo Demo, Thiết bị danh mục Live', () => {
  const kpiSource = readSrcFile('components/dashboard/overview/OverviewKpiStrip.tsx');

  // 1. Điện năng: Demo
  assert.ok(kpiSource.includes('Điện hôm nay'), 'Slot 1: Điện hôm nay');
  assert.ok(kpiSource.includes('kWh'), 'Slot 1 unit kWh');

  // 2. Nước: Unavailable với lý do rollover
  assert.ok(kpiSource.includes('Nước hôm nay'), 'Slot 2: Nước hôm nay');
  assert.ok(kpiSource.includes('Unavailable'), 'Slot 2 is marked Unavailable');
  assert.ok(kpiSource.includes('Chờ xác nhận rollover AVC'), 'Slot 2 explains AVC rollover blocker');

  // 3. CO2 trung bình: Demo (NOT IAQ score)
  assert.ok(kpiSource.includes('CO₂ trung bình'), 'Slot 3: CO2 trung bình');
  assert.ok(!kpiSource.includes('82/100'), 'Must not fabricate mockup IAQ 82/100');
  assert.ok(kpiSource.includes('ppm'), 'Slot 3 unit ppm');

  // 4. Phòng vượt ngưỡng CO2: Demo
  assert.ok(kpiSource.includes('Vượt ngưỡng CO₂'), 'Slot 4: Phòng vượt ngưỡng');
  assert.ok(kpiSource.includes('E6.2: 1.100 ppm'), 'Slot 4 cites E6.2 sample');

  // 5. Cảnh báo đang mở: Demo (Không gắn badge sidebar)
  assert.ok(kpiSource.includes('Cảnh báo đang mở'), 'Slot 5: Cảnh báo đang mở');
  assert.ok(kpiSource.includes('Không gắn badge sidebar'), 'Slot 5 confirms no sidebar badge');

  // 6. Thiết bị danh mục: Live (Không gọi là trực tuyến / online)
  assert.ok(kpiSource.includes('Thiết bị danh mục'), 'Slot 6: Thiết bị danh mục');
  assert.ok(kpiSource.includes('Live'), 'Slot 6 mode Live');
  assert.ok(kpiSource.includes('Không đo heartbeat'), 'Slot 6 explicitly does not measure heartbeat');
});

/* =========================================================================
 * 4. BOTTOM ROW: ALERTS, ENERGY, IOT HEALTH (BP2-P07-T12 .. T14)
 * ========================================================================= */

test('BP2-P07-T12: LatestAlertsPreview hiển thị danh sách cảnh báo demo chỉ đọc và liên kết tới /dashboard/alerts', () => {
  const alertsSource = readSrcFile('components/dashboard/overview/LatestAlertsPreview.tsx');

  assert.ok(alertsSource.includes('Cảnh báo mới nhất'), 'Title Cảnh báo mới nhất');
  assert.ok(alertsSource.includes('Demo'), 'Card-level Demo badge');
  assert.ok(alertsSource.includes('href="/dashboard/alerts"'), 'Links to /dashboard/alerts');
  assert.ok(alertsSource.includes('Xem tất cả cảnh báo'), 'Call to action to view all');
});

test('BP2-P07-T13: HourlyEnergyDemoChart hiển thị đồ thị và bảng tiếp cận dữ liệu điện năng', () => {
  const chartSource = readSrcFile('components/dashboard/overview/HourlyEnergyDemoChart.tsx');

  assert.ok(chartSource.includes('Điện năng theo giờ'), 'Title Điện năng theo giờ');
  assert.ok(chartSource.includes('Demo'), 'Card-level Demo badge');
  assert.ok(chartSource.includes('Baseline'), 'Displays baseline comparison');
  assert.ok(chartSource.includes('viewMode === \'chart\''), 'Supports chart view');
  assert.ok(chartSource.includes('viewMode === \'table\''), 'Supports table view');
  assert.ok(chartSource.includes('href="/dashboard/energy-water"'), 'Links to /dashboard/energy-water');
});

test('BP2-P07-T14: IotHealthSummary phân biệt số liệu danh mục Live và chỉ số heartbeat Unavailable', () => {
  const healthSource = readSrcFile('components/dashboard/overview/IotHealthSummary.tsx');

  assert.ok(healthSource.includes('Sức khỏe hệ thống IoT'), 'Title Sức khỏe hệ thống IoT');
  assert.ok(healthSource.includes('Live'), 'Card-level Live badge');
  assert.ok(healthSource.includes('Đã tiếp nhận'), 'Displays acceptedCount');
  assert.ok(healthSource.includes('Trực tuyến (Online)'), 'Explicitly discloses Online status placeholder');
  assert.ok(healthSource.includes('Tỷ lệ gói tin'), 'Explicitly discloses packet rate placeholder');
  assert.ok(healthSource.includes('Mất tín hiệu'), 'Explicitly discloses lost signal placeholder');
  assert.ok(healthSource.includes('href="/dashboard/iot"'), 'Links to /dashboard/iot');
});

/* =========================================================================
 * 5. COMPOSITION, ROUTING & SECURITY AUDIT (BP2-P07-T15 .. T18)
 * ========================================================================= */

test('BP2-P07-T15: Page 01 route /dashboard/overview kết nối OverviewDashboard thay thế placeholder', () => {
  const pageSource = readSrcFile('app/dashboard/overview/page.tsx');

  assert.ok(pageSource.includes('OverviewDashboard'), 'Page renders OverviewDashboard');
  assert.ok(!pageSource.includes('UnavailableDataState'), 'Old placeholder UnavailableDataState is replaced');
});

test('BP2-P07-T16: Frontend adapter gọi same-origin Next.js API, hỗ trợ AbortSignal và cách ly sự cố', () => {
  const clientSource = readSrcFile('components/dashboard/overview/OverviewDashboard.client.tsx');

  assert.ok(clientSource.includes('fetchDashboardDeviceCatalogue'), 'Calls same-origin IoT catalogue API');
  assert.ok(clientSource.includes('AbortController'), 'Uses AbortController for request cancellation');
  assert.ok(clientSource.includes('.abort()'), 'Aborts prior requests on unmount/re-fetch');
});

test('BP2-P07-T17: Shell bảo toàn đúng 7 routes và không sinh badge cảnh báo trên thanh điều hướng', () => {
  const routesSrc = readSrcFile('config/dashboard-routes.ts');
  const shellSrc = readSrcFile('components/dashboard/layout/DashboardShell.tsx');

  // Verify seven routes preserved in config
  assert.ok(routesSrc.includes('/dashboard/overview'), 'Must contain overview');
  assert.ok(routesSrc.includes('/dashboard/energy-water'), 'Must contain energy-water');
  assert.ok(routesSrc.includes('/dashboard/environment'), 'Must contain environment');
  assert.ok(routesSrc.includes('/dashboard/alerts'), 'Must contain alerts');
  assert.ok(routesSrc.includes('/dashboard/iot'), 'Must contain iot');
  assert.ok(routesSrc.includes('/dashboard/parking'), 'Must contain parking');
  assert.ok(routesSrc.includes('/dashboard/fire-safety'), 'Must contain fire-safety');

  // Alert link does not display a fabricated badge count '5' from mockup
  assert.ok(!shellSrc.includes('alertBadgeCount'), 'DashboardShell nav must not render alertBadgeCount');
  assert.ok(!shellSrc.includes('unreadCount'), 'DashboardShell nav must not render unreadCount');
});

test('BP2-P07-T18: Security & Architecture audit — không chứa database entity, migration, raw credentials hay polling timer', () => {
  const overviewFiles = [
    'app/dashboard/overview/page.tsx',
    'components/dashboard/overview/OverviewDashboard.client.tsx',
    'components/dashboard/overview/OverviewPageHeader.tsx',
    'components/dashboard/overview/OverviewKpiStrip.tsx',
    'components/dashboard/overview/FloorCatalog.tsx',
    'components/dashboard/overview/InteractiveFloorGrid.tsx',
    'components/dashboard/overview/FloorMetadataPanel.tsx',
    'components/dashboard/overview/LatestAlertsPreview.tsx',
    'components/dashboard/overview/HourlyEnergyDemoChart.tsx',
    'components/dashboard/overview/IotHealthSummary.tsx',
    'lib/dashboard/overview-demo-fixtures.ts',
    'lib/dashboard/overview-grid-fixtures.ts',
    'lib/dashboard/overview-selectors.ts',
    'types/dashboard-overview.ts',
  ];

  for (const relPath of overviewFiles) {
    const content = readSrcFile(relPath);

    // No DB/ORM
    assert.ok(!content.includes('typeorm'), `${relPath} must not import typeorm`);
    assert.ok(!content.includes('@Entity'), `${relPath} must not declare DB entity`);
    assert.ok(!content.includes('Repository'), `${relPath} must not use DB repository`);

    // No credentials or upstream URLs
    assert.ok(!content.includes('Bearer '), `${relPath} must not contain Bearer tokens`);
    assert.ok(!content.includes('iot.uit.edu.vn'), `${relPath} must not contain external upstream URLs`);

    // No automatic polling timers
    assert.ok(!content.includes('setInterval'), `${relPath} must not set polling timers`);
  }
});
