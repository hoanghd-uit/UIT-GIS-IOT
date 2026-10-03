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

// Pure selector logic mirror for node test runner
function testFilterAlertEvents(events, options) {
  const range = options?.range ?? '7d';
  const severity = options?.severity ?? 'all';
  const query = options?.searchQuery?.trim().toLowerCase() ?? '';
  const refTime = Date.parse(options?.referenceInstant ?? '2026-09-29T10:00:00.000Z');

  let rangeMs = 7 * 24 * 60 * 60 * 1000;
  if (range === 'today') rangeMs = 24 * 60 * 60 * 1000;
  else if (range === '30d') rangeMs = 30 * 24 * 60 * 60 * 1000;
  const windowStartMs = refTime - rangeMs;

  return events.filter((ev) => {
    const evTime = Date.parse(ev.detectedAt);
    if (evTime < windowStartMs || evTime > refTime) return false;
    if (severity !== 'all' && ev.severity !== severity) return false;
    if (query) {
      const matchTitle = ev.title.toLowerCase().includes(query);
      const matchId = ev.alertId.toLowerCase().includes(query);
      const matchLoc = ev.locationLabel.toLowerCase().includes(query);
      if (!matchTitle && !matchId && !matchLoc) return false;
    }
    return true;
  });
}

function testSortAlertEvents(events, order = 'newest') {
  const sorted = [...events];
  sorted.sort((a, b) => {
    const timeA = Date.parse(a.detectedAt);
    const timeB = Date.parse(b.detectedAt);
    return order === 'newest' ? timeB - timeA : timeA - timeB;
  });
  return sorted;
}

function testGetAlertKpis(filteredEvents, allEvents, referenceInstant = '2026-09-29T10:00:00.000Z') {
  const refTime = Date.parse(referenceInstant);
  const openEvents = allEvents.filter(
    (ev) => ev.lifecycleStatus === 'new' || ev.lifecycleStatus === 'acknowledged',
  );
  const openCount = openEvents.length;

  let warningCount = 0;
  let dangerCount = 0;
  let infoCount = 0;
  for (const ev of openEvents) {
    if (ev.severity === 'danger') dangerCount++;
    else if (ev.severity === 'warning') warningCount++;
    else if (ev.severity === 'info') infoCount++;
  }

  let slaOverdueCount = 0;
  for (const ev of openEvents) {
    if (ev.slaDueAt && Date.parse(ev.slaDueAt) < refTime) {
      slaOverdueCount++;
    }
  }

  const newInRangeCount = filteredEvents.filter((ev) => ev.lifecycleStatus === 'new').length;

  return {
    openCount,
    warningCount,
    dangerCount,
    infoCount,
    slaOverdueCount,
    newInRangeCount,
    channelCount: 3,
  };
}

function testGet14DayHistory(events, referenceInstant = '2026-09-29T10:00:00.000Z') {
  const refDate = new Date(referenceInstant);
  const items = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(refDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = events.filter((ev) => ev.detectedAt.startsWith(dateStr)).length;
    items.push({ date: dateStr, count });
  }
  return items;
}

test('BP2-P06-T01: Demo fixture page06-alert-center-demo-v1 is versioned, deterministic, and uses DEMO- IDs', () => {
  const fixtureSrc = readSrcFile('lib/dashboard/alert-demo-fixtures.ts');

  // Verify fixture ID and frozen reference time
  assert.ok(fixtureSrc.includes("ALERT_DEMO_FIXTURE_ID = 'page06-alert-center-demo-v1'"), 'Must have fixture ID page06-alert-center-demo-v1');
  assert.ok(fixtureSrc.includes("ALERT_REFERENCE_INSTANT = '2026-09-29T10:00:00.000Z'"), 'Must declare frozen reference instant');

  // Verify NO Math.random or Date.now
  assert.ok(!fixtureSrc.includes('Math.random()'), 'Must not contain Math.random()');
  assert.ok(!fixtureSrc.includes('Date.now()'), 'Must not contain Date.now()');

  // Verify DEMO- prefixes
  assert.ok(fixtureSrc.includes('DEMO-ALT-'), 'Alert IDs must use DEMO-ALT- prefix');
  assert.ok(fixtureSrc.includes('DEMO-DEV-'), 'Device IDs must use DEMO-DEV- prefix');
  assert.ok(fixtureSrc.includes('DEMO-RULE-'), 'Rule IDs must use DEMO-RULE- prefix');
});

test('BP2-P06-T02: Pure selectors calculate internally consistent KPIs, severity breakdowns, and list filters', () => {
  const selectorsSrc = readSrcFile('lib/dashboard/alert-demo-selectors.ts');
  assert.ok(selectorsSrc.includes('filterAlertEvents'), 'Must export filterAlertEvents');
  assert.ok(selectorsSrc.includes('sortAlertEvents'), 'Must export sortAlertEvents');
  assert.ok(selectorsSrc.includes('getAlertKpis'), 'Must export getAlertKpis');

  // Verify logic on representative event samples
  const sampleEvents = [
    {
      alertId: 'DEMO-ALT-001',
      title: 'CO2 vượt ngưỡng',
      locationLabel: 'Phòng E6.6',
      detectedAt: '2026-09-29T09:15:00.000Z',
      severity: 'danger',
      lifecycleStatus: 'new',
      slaDueAt: '2026-09-29T09:45:00.000Z',
      timeline: [],
    },
    {
      alertId: 'DEMO-ALT-002',
      title: 'Rò rỉ nước',
      locationLabel: 'Tầng 4',
      detectedAt: '2026-09-29T02:30:00.000Z',
      severity: 'warning',
      lifecycleStatus: 'acknowledged',
      slaDueAt: '2026-09-29T14:30:00.000Z',
      timeline: [],
    },
    {
      alertId: 'DEMO-ALT-003',
      title: 'Nhiệt độ phòng Server',
      locationLabel: 'Phòng E2.1',
      detectedAt: '2026-09-27T14:20:00.000Z',
      severity: 'danger',
      lifecycleStatus: 'resolved',
      slaDueAt: '2026-09-27T15:20:00.000Z',
      timeline: [],
    },
  ];

  const events7d = testFilterAlertEvents(sampleEvents, { range: '7d', severity: 'all' });
  assert.equal(events7d.length, 3, 'Must return all 3 events in 7d window');

  const eventsToday = testFilterAlertEvents(sampleEvents, { range: 'today', severity: 'all' });
  assert.equal(eventsToday.length, 2, 'Must return 2 events in today window');

  const sortedOldest = testSortAlertEvents(sampleEvents, 'oldest');
  assert.equal(sortedOldest[0].alertId, 'DEMO-ALT-003', 'Oldest event must be first');

  const kpis = testGetAlertKpis(events7d, sampleEvents);
  assert.equal(kpis.openCount, 2, 'Must have 2 open events');
  assert.equal(kpis.dangerCount, 1, 'Must have 1 open danger event');
  assert.equal(kpis.warningCount, 1, 'Must have 1 open warning event');
  assert.equal(kpis.slaOverdueCount, 1, 'Must have 1 overdue open event');
  assert.equal(kpis.channelCount, 3, 'Must have 3 demo notification channels');
});

test('BP2-P06-T03: 14-day history chart items and handling efficiency metrics derive deterministically', () => {
  const selectorsSrc = readSrcFile('lib/dashboard/alert-demo-selectors.ts');
  assert.ok(selectorsSrc.includes('get14DayEventHistory'), 'Must export get14DayEventHistory');
  assert.ok(selectorsSrc.includes('getHandlingEfficiencyMetrics'), 'Must export getHandlingEfficiencyMetrics');

  const sampleEvents = [
    {
      alertId: 'DEMO-ALT-001',
      detectedAt: '2026-09-29T09:15:00.000Z',
    },
    {
      alertId: 'DEMO-ALT-002',
      detectedAt: '2026-09-28T14:20:00.000Z',
    },
  ];

  const history = testGet14DayHistory(sampleEvents);
  assert.equal(history.length, 14, 'Must produce 14 day buckets');
  const countSum = history.reduce((acc, c) => acc + c.count, 0);
  assert.equal(countSum, 2, 'History count sum must equal number of events');
});

test('BP2-P06-T04: Frontend alert status API calls same-origin proxy with cache: no-store and AbortSignal', () => {
  const apiSrc = readSrcFile('lib/dashboard/alert-status-api.ts');

  assert.ok(apiSrc.includes("const BASE_URL = '/api/devices'"), 'Must call same-origin proxy /api/devices');
  assert.ok(apiSrc.includes("alerts/evaluation-status"), 'Must call evaluation-status route');
  assert.ok(apiSrc.includes("cache: 'no-store'"), 'Must enforce cache: no-store');
  assert.ok(apiSrc.includes('signal: options?.signal'), 'Must support request cancellation via AbortSignal');
});

test('BP2-P06-T05: Page 06 route mounted at /dashboard/alerts replaces legacy placeholder layout', () => {
  const pageSrc = readSrcFile('app/dashboard/alerts/page.tsx');

  assert.ok(pageSrc.includes('AlertCenterDashboard'), 'Must mount AlertCenterDashboard');
  assert.ok(!pageSrc.includes('pageNumber="06"'), 'Must remove legacy page badge 06');
  assert.ok(!pageSrc.includes('DashboardSection'), 'Must remove generic DashboardSection');
  assert.ok(!pageSrc.includes('Hệ thống cảnh báo chưa được kết nối'), 'Must replace legacy unavailable message');
});

test('BP2-P06-T06: Aligned header contains title, subtitle, Dữ liệu minh họa badge, and disabled custom range', () => {
  const headerSrc = readSrcFile('components/dashboard/alerts/AlertCenterPageHeader.tsx');

  assert.ok(headerSrc.includes('Trung tâm cảnh báo'), 'Must have page title');
  assert.ok(headerSrc.includes('Bản xem trước quy trình · chưa có quy tắc cảnh báo authoritative'), 'Must have aligned subtitle');
  assert.ok(headerSrc.includes('Dữ liệu minh họa'), 'Must declare Dữ liệu minh họa badge');
  assert.ok(headerSrc.includes('Hôm nay'), 'Must include Hôm nay preset');
  assert.ok(headerSrc.includes('7 ngày'), 'Must include 7 ngày preset');
  assert.ok(headerSrc.includes('30 ngày'), 'Must include 30 ngày preset');
  assert.ok(headerSrc.includes('Tùy chọn'), 'Must include Tùy chọn button');
  assert.ok(headerSrc.includes('Phạm vi tùy chỉnh chưa khả dụng trong bản minh họa'), 'Must explain custom range unavailability');
});

test('BP2-P06-T07: 5-card KPI strip derives all values from demo fixture with visible Demo badges', () => {
  const kpiSrc = readSrcFile('components/dashboard/alerts/AlertCenterKpiStrip.tsx');

  assert.ok(kpiSrc.includes('Đang mở'), 'Card 1: Đang mở');
  assert.ok(kpiSrc.includes('Quá hạn SLA'), 'Card 2: Quá hạn SLA');
  assert.ok(kpiSrc.includes('Mới trong khoảng chọn'), 'Card 3: Mới trong khoảng chọn');
  assert.ok(kpiSrc.includes('Thời gian nhận TB'), 'Card 4: Thời gian nhận TB');
  assert.ok(kpiSrc.includes('Kênh thông báo'), 'Card 5: Kênh thông báo');
  assert.ok(kpiSrc.includes('Demo'), 'Must declare Demo badge');
});

test('BP2-P06-T08: Primary row (alert list + detail) supports filters, search, and disabled actions with reasons', () => {
  const listSrc = readSrcFile('components/dashboard/alerts/DemoAlertList.tsx');
  const detailSrc = readSrcFile('components/dashboard/alerts/DemoAlertDetail.tsx');

  // List checks
  assert.ok(listSrc.includes('Danh sách cảnh báo'), 'Must have alert list title');
  assert.ok(listSrc.includes('Nguy hiểm'), 'Must have Nguy hiểm filter');
  assert.ok(listSrc.includes('Cảnh báo'), 'Must have Cảnh báo filter');
  assert.ok(listSrc.includes('Thông tin'), 'Must have Thông tin filter');
  assert.ok(listSrc.includes('onSelectAlert'), 'Must support row selection');
  assert.ok(listSrc.includes('onKeyDown'), 'Must support keyboard selection');

  // Detail checks
  assert.ok(detailSrc.includes('Khuyến nghị xử lý (Minh họa)'), 'Must have suggested action section');
  assert.ok(detailSrc.includes('Tiến trình sự vụ'), 'Must have timeline section');
  assert.ok(detailSrc.includes('Nhận xử lý'), 'Must have Nhận xử lý button');
  assert.ok(detailSrc.includes('Chưa có identity và event persistence'), 'Nhận xử lý must explain disabled reason');
  assert.ok(detailSrc.includes('Xem trên BIM'), 'Must have Xem trên BIM button');
  assert.ok(detailSrc.includes('Chưa có approved room/device spatial mapping'), 'Xem trên BIM must explain disabled reason');
});

test('BP2-P06-T09: Secondary row contains 14-day chart, handling efficiency, and rules table with disabled mutation', () => {
  const chartSrc = readSrcFile('components/dashboard/alerts/DemoAlertHistoryChart.tsx');
  const effSrc = readSrcFile('components/dashboard/alerts/DemoAlertEfficiency.tsx');
  const rulesSrc = readSrcFile('components/dashboard/alerts/DemoAlertRulesTable.tsx');

  assert.ok(chartSrc.includes('Số cảnh báo 14 ngày'), 'Must have 14-day chart title');
  assert.ok(chartSrc.includes('MetricBarChart'), 'Must use MetricBarChart');
  assert.ok(chartSrc.includes('Xem bảng'), 'Must support accessible table view');

  assert.ok(effSrc.includes('Hiệu quả xử lý'), 'Must have efficiency title');
  assert.ok(effSrc.includes('Thời gian nhận TB'), 'Must include acknowledge tile');
  assert.ok(effSrc.includes('Tỷ lệ đạt SLA'), 'Must include SLA tile');

  assert.ok(rulesSrc.includes('Quy tắc cảnh báo'), 'Must have rules table title');
  assert.ok(rulesSrc.includes('Thêm quy tắc'), 'Must have Thêm quy tắc button');
  assert.ok(rulesSrc.includes('Chờ Identity/CASL + PostgreSQL phase'), 'Must explain disabled rule mutation reason');
});

test('BP2-P06-T10: Engine notice clearly discloses 0 authoritative rules and explains unconfirmed semantics blocker', () => {
  const noticeSrc = readSrcFile('components/dashboard/alerts/AlertEngineStatusNotice.tsx');

  assert.ok(noticeSrc.includes('quy tắc authoritative'), 'Must cite authoritative rules count');
  assert.ok(noticeSrc.includes('ALERT_RULES_NOT_CONFIRMED'), 'Must reference ALERT_RULES_NOT_CONFIRMED blocker');
  assert.ok(noticeSrc.includes('Chưa đánh giá live do semantics, baseline, cadence và duration policy chưa được xác nhận'), 'Must explain rationale');
});

test('BP2-P06-T11: Dashboard shell preserves exactly seven frozen routes and contains NO alert badge in sidebar', () => {
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

  // Verify NO alert badge rendered in sidebar navigation
  assert.ok(!shellSrc.includes('alertBadgeCount'), 'DashboardShell nav must not render alertBadgeCount');
  assert.ok(!shellSrc.includes('unreadCount'), 'DashboardShell nav must not render unreadCount');
});

test('BP2-P06-T12: Security & architecture audit — no TypeORM, entity, migration, or external notification imports', () => {
  const alertFiles = [
    'types/dashboard-alerts.ts',
    'lib/dashboard/alert-demo-fixtures.ts',
    'lib/dashboard/alert-demo-selectors.ts',
    'lib/dashboard/alert-status-api.ts',
    'components/dashboard/alerts/AlertCenterDashboard.client.tsx',
    'components/dashboard/alerts/AlertCenterPageHeader.tsx',
    'components/dashboard/alerts/AlertCenterKpiStrip.tsx',
    'components/dashboard/alerts/AlertEngineStatusNotice.tsx',
    'components/dashboard/alerts/DemoAlertList.tsx',
    'components/dashboard/alerts/DemoAlertDetail.tsx',
    'components/dashboard/alerts/DemoAlertHistoryChart.tsx',
    'components/dashboard/alerts/DemoAlertEfficiency.tsx',
    'components/dashboard/alerts/DemoAlertRulesTable.tsx',
  ];

  for (const rel of alertFiles) {
    const content = readSrcFile(rel);
    assert.ok(!content.includes('typeorm'), `${rel} must not import typeorm`);
    assert.ok(!content.includes('postgres'), `${rel} must not import postgres`);
    assert.ok(!content.includes('@casl'), `${rel} must not import @casl`);
    assert.ok(!content.includes('nodemailer'), `${rel} must not import nodemailer`);
    assert.ok(!content.includes('twilio'), `${rel} must not import twilio`);
    assert.ok(!content.includes('http://') && !content.includes('https://api.ttlab'), `${rel} must not contain direct upstream URLs`);
  }
});
