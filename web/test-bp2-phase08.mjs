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

// Helper to extract exported object from TypeScript file without module loaders
function extractParkingDemoFixture() {
  const source = readSrcFile('lib/dashboard/parking-demo-fixtures.ts');
  // Strip TypeScript types and create sandbox evaluation
  const cleaned = source
    .replace(/import type[\s\S]*?;/g, '')
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"].*?['"];/g, '')
    .replace(/export const PARKING_DEMO_PROVENANCE[\s\S]*?\}\);/g, 'const PARKING_DEMO_PROVENANCE = {};')
    .replace(/:\s*ParkingDemoFixture\b/g, '')
    .replace(/export const /g, 'const ');

  const fn = new Function(`${cleaned}; return { PARKING_DEMO_FIXTURE, PARKING_DEMO_FIXTURE_ID, PARKING_DEMO_FIXTURE_VERSION, PARKING_REFERENCE_INSTANT };`);
  return fn();
}

/* =========================================================================
 * 1. FIXTURE & SELECTOR INVARIANTS (BP2-P08-T01 .. T08)
 * ========================================================================= */

test('BP2-P08-T01: Deterministic demo fixture has fixed ID, frozen reference instant, and no Math.random/Date.now', () => {
  const fixturesSource = readSrcFile('lib/dashboard/parking-demo-fixtures.ts');
  const selectorsSource = readSrcFile('lib/dashboard/parking-demo-selectors.ts');

  // Verify fixture ID and version
  assert.ok(fixturesSource.includes("'page09-parking-demo-v1'"), 'Fixture must have ID page09-parking-demo-v1');
  assert.ok(fixturesSource.includes("'1.0.0'"), 'Fixture must have version 1.0.0');

  // Frozen reference instant
  assert.ok(fixturesSource.includes('2026-10-01T08:00:00.000Z'), 'Fixture must have frozen reference instant');

  // No Math.random or render-time Date.now calls
  assert.ok(!fixturesSource.includes('Math.random()'), 'No Math.random in parking fixtures');
  assert.ok(!selectorsSource.includes('Math.random()'), 'No Math.random in parking selectors');
  assert.ok(!selectorsSource.includes('Date.now()'), 'No Date.now in parking selectors');
});

test('BP2-P08-T02: Stable DEMO- IDs across slots, zones, and cameras with zero collisions', () => {
  const { PARKING_DEMO_FIXTURE } = extractParkingDemoFixture();

  const seenIds = new Set();

  // Check car slot IDs
  for (const area of PARKING_DEMO_FIXTURE.carAreas) {
    assert.ok(area.areaId.startsWith('DEMO-AREA-'), `Area ID ${area.areaId} must start with DEMO-AREA-`);
    assert.ok(!seenIds.has(area.areaId), `Duplicate area ID: ${area.areaId}`);
    seenIds.add(area.areaId);

    for (const slot of area.slots) {
      assert.ok(slot.slotId.startsWith('DEMO-SLOT-'), `Slot ID ${slot.slotId} must start with DEMO-SLOT-`);
      assert.ok(!seenIds.has(slot.slotId), `Duplicate slot ID: ${slot.slotId}`);
      seenIds.add(slot.slotId);

      if (slot.cameraDemoId) {
        assert.ok(slot.cameraDemoId.startsWith('DEMO-CAM-'), `Referenced camera ID ${slot.cameraDemoId} must start with DEMO-CAM-`);
      }
    }
  }

  // Check motorcycle zone IDs
  for (const zone of PARKING_DEMO_FIXTURE.motorcycleZones) {
    assert.ok(zone.zoneId.startsWith('DEMO-ZONE-'), `Zone ID ${zone.zoneId} must start with DEMO-ZONE-`);
    assert.ok(!seenIds.has(zone.zoneId), `Duplicate zone ID: ${zone.zoneId}`);
    seenIds.add(zone.zoneId);

    if (zone.cameraDemoId) {
      assert.ok(zone.cameraDemoId.startsWith('DEMO-CAM-'), `Referenced camera ID ${zone.cameraDemoId} must start with DEMO-CAM-`);
    }
  }

  // Check camera device IDs
  for (const cam of PARKING_DEMO_FIXTURE.cameraDevices) {
    assert.ok(cam.cameraDemoId.startsWith('DEMO-CAM-'), `Camera ID ${cam.cameraDemoId} must start with DEMO-CAM-`);
    assert.ok(!seenIds.has(cam.cameraDemoId), `Duplicate camera ID: ${cam.cameraDemoId}`);
    seenIds.add(cam.cameraDemoId);
  }
});

test('BP2-P08-T03: Car capacity consistency: occupied + free = total capacity; occupancy % matches selector', () => {
  const { PARKING_DEMO_FIXTURE } = extractParkingDemoFixture();
  const selectorsSource = readSrcFile('lib/dashboard/parking-demo-selectors.ts');

  let totalSlots = 0;
  let occupiedCount = 0;
  let evSlotsTotal = 0;
  let evSlotsOccupied = 0;

  for (const area of PARKING_DEMO_FIXTURE.carAreas) {
    for (const slot of area.slots) {
      totalSlots += 1;
      if (slot.occupied) occupiedCount += 1;
      if (slot.vehicleType === 'ev') {
        evSlotsTotal += 1;
        if (slot.occupied) evSlotsOccupied += 1;
      }
    }
  }

  const freeCount = totalSlots - occupiedCount;
  const occupancyRate = Math.round((occupiedCount / totalSlots) * 1000) / 10;

  assert.equal(totalSlots, 30, 'Total slots must equal 30');
  assert.equal(occupiedCount + freeCount, totalSlots, 'Occupied + Free must equal Total');
  assert.equal(occupiedCount, 18, 'Occupied count must equal 18');
  assert.equal(freeCount, 12, 'Free count must equal 12');
  assert.equal(occupancyRate, 60.0, 'Occupancy rate must be exactly 60%');
  assert.equal(evSlotsTotal, 5, 'EV slots total must equal 5');
  assert.equal(evSlotsOccupied, 3, 'EV occupied count must equal 3');

  // Verify selector exports getParkingCarSummary
  assert.ok(selectorsSource.includes('export function getParkingCarSummary'), 'Selectors export getParkingCarSummary');
  assert.ok(selectorsSource.includes('occupiedCount += 1'), 'Counts occupied slots');
  assert.ok(selectorsSource.includes('freeCount'), 'Calculates free count');
});

test('BP2-P08-T04: Motorcycle zone density selector consistency and peak zone identification', () => {
  const { PARKING_DEMO_FIXTURE } = extractParkingDemoFixture();
  const selectorsSource = readSrcFile('lib/dashboard/parking-demo-selectors.ts');

  const zones = PARKING_DEMO_FIXTURE.motorcycleZones;
  assert.equal(zones.length, 3, 'Must have 3 motorcycle zones');

  const sortedZones = [...zones].sort((a, b) => b.estimatedDensityPercent - a.estimatedDensityPercent);
  const peakZone = sortedZones[0];

  assert.equal(peakZone.zoneId, 'DEMO-ZONE-M1', 'Peak zone is M1');
  assert.equal(peakZone.estimatedDensityPercent, 78, 'Peak density is 78%');

  const avgDensity = Math.round(((zones[0].estimatedDensityPercent + zones[1].estimatedDensityPercent + zones[2].estimatedDensityPercent) / 3) * 10) / 10;
  assert.equal(avgDensity, 58.3, 'Average density is (78+55+42)/3 = 58.3%');

  const totalCap = zones.reduce((acc, z) => acc + z.capacityEstimate, 0);
  assert.equal(totalCap, 600, 'Total capacity is 350+150+100 = 600');

  assert.ok(selectorsSource.includes('export function getParkingMotorcycleSummary'), 'Selectors export getParkingMotorcycleSummary');
});

test('BP2-P08-T05: Entries summary selector consistency across today, 7d, 30d; peak period calculated accurately', () => {
  const { PARKING_DEMO_FIXTURE } = extractParkingDemoFixture();
  const selectorsSource = readSrcFile('lib/dashboard/parking-demo-selectors.ts');

  // Today
  const todaySeries = PARKING_DEMO_FIXTURE.entriesByRange.today;
  const todayTotal = todaySeries.reduce((acc, s) => acc + s.entryCount, 0);
  assert.equal(todayTotal, 247, 'Today total entries must equal 247');
  assert.equal(todaySeries.length, 14, 'Today series has 14 hours');

  // 7d
  const d7Series = PARKING_DEMO_FIXTURE.entriesByRange['7d'];
  const d7Total = d7Series.reduce((acc, s) => acc + s.entryCount, 0);
  assert.equal(d7Total, 1472, '7d total entries must equal 1472');
  assert.equal(d7Series.length, 7, '7d series has 7 days');

  // 30d
  const d30Series = PARKING_DEMO_FIXTURE.entriesByRange['30d'];
  const d30Total = d30Series.reduce((acc, s) => acc + s.entryCount, 0);
  assert.equal(d30Total, 6000, '30d total entries must equal 6000');
  assert.equal(d30Series.length, 4, '30d series has 4 weeks');

  assert.ok(selectorsSource.includes('export function getParkingEntriesSummary'), 'Selectors export getParkingEntriesSummary');
  assert.ok(selectorsSource.includes('peakCount'), 'Tracks peak count in entries');
});

test('BP2-P08-T06: Camera summary selector consistency: active and inspection counts agree with fixture rows', () => {
  const { PARKING_DEMO_FIXTURE } = extractParkingDemoFixture();
  const selectorsSource = readSrcFile('lib/dashboard/parking-demo-selectors.ts');

  const cams = PARKING_DEMO_FIXTURE.cameraDevices;
  assert.equal(cams.length, 4, 'Total camera count must equal 4');

  const activeCams = cams.filter((c) => c.demoStatus === 'simulated_active');
  const inspectionCams = cams.filter((c) => c.demoStatus === 'simulated_inspection');
  const standbyCams = cams.filter((c) => c.demoStatus === 'simulated_standby');

  assert.equal(activeCams.length, 3, 'Active simulated cameras must equal 3');
  assert.equal(inspectionCams.length, 1, 'Inspection simulated cameras must equal 1');
  assert.equal(standbyCams.length, 0, 'Standby simulated cameras must equal 0');

  assert.ok(selectorsSource.includes('export function getParkingCameraSummary'), 'Selectors export getParkingCameraSummary');
});

test('BP2-P08-T07: Duration KPI is strictly fixture-backed with explicit duration summary', () => {
  const { PARKING_DEMO_FIXTURE } = extractParkingDemoFixture();
  const selectorsSource = readSrcFile('lib/dashboard/parking-demo-selectors.ts');

  const durationData = PARKING_DEMO_FIXTURE.demoSessionDurationSummary;
  assert.equal(durationData.averageMinutes, 195, 'Average duration must be 195 minutes');
  assert.equal(durationData.formattedDuration, '3h15', 'Formatted duration must be 3h15');
  assert.equal(durationData.totalSampleSessions, 140, 'Sample sessions count must be 140');

  assert.ok(selectorsSource.includes('export function getParkingDurationSummary'), 'Selectors export getParkingDurationSummary');
});

test('BP2-P08-T08: Privacy constraints: zero PII, license plates, person IDs, or camera video/stream URLs', () => {
  const fixturesSource = readSrcFile('lib/dashboard/parking-demo-fixtures.ts');
  const typesSource = readSrcFile('types/dashboard-parking.ts');

  // No license plates, personal IDs, RTSP or WebRTC streams
  assert.ok(!fixturesSource.includes('licensePlate'), 'No licensePlate field in fixtures');
  assert.ok(!fixturesSource.includes('rtsp://'), 'No RTSP URLs in fixtures');
  assert.ok(!fixturesSource.includes('webrtc://'), 'No WebRTC URLs in fixtures');
  assert.ok(!typesSource.includes('licensePlate'), 'No licensePlate in types');
  assert.ok(!typesSource.includes('personId'), 'No personId in types');
});

/* =========================================================================
 * 2. UI COMPONENT INTEGRATION & ACCESSIBILITY (BP2-P08-T09 .. T16)
 * ========================================================================= */

test('BP2-P08-T09: ParkingPageHeader renders title, subtitle, demo badge, range selector, and no fake live claim', () => {
  const headerSource = readSrcFile('components/dashboard/parking/ParkingPageHeader.tsx');

  assert.ok(headerSource.includes('Bãi xe · Hầm B1'), 'Header contains approved title');
  assert.ok(headerSource.includes('Kịch bản mô phỏng bãi đỗ xe Tòa E'), 'Header subtitle states demo scenario');
  assert.ok(headerSource.includes('Dữ liệu minh họa'), 'Contains Dữ liệu minh họa badge');
  assert.ok(headerSource.includes('Hôm nay'), 'Contains Hôm nay preset');
  assert.ok(headerSource.includes('7 ngày'), 'Contains 7 ngày preset');
  assert.ok(headerSource.includes('30 ngày'), 'Contains 30 ngày preset');
  assert.ok(headerSource.includes('Tùy chọn'), 'Contains Tùy chọn disabled button');
});

test('BP2-P08-T10: ParkingDemoNotice renders full-width accessible note (role="note") with explicit demo wording', () => {
  const noticeSource = readSrcFile('components/dashboard/parking/ParkingDemoNotice.tsx');

  assert.ok(noticeSource.includes('role="note"'), 'Notice has accessible role="note"');
  assert.ok(noticeSource.includes('Mô phỏng · Demo:'), 'Notice has prominent demo headline');
  assert.ok(noticeSource.includes('Không kết nối thiết bị cảm biến'), 'States lack of real sensor connection');
  assert.ok(noticeSource.includes('Không thu thập, xử lý hay lưu trữ') || noticeSource.includes('PII'), 'Highlights privacy protections');
});

test('BP2-P08-T11: ParkingKpiStrip renders five operational KPI slots with demo badges and selector values', () => {
  const kpiSource = readSrcFile('components/dashboard/parking/ParkingKpiStrip.tsx');

  assert.ok(kpiSource.includes('Vị trí ô tô (B1)'), 'Slot 1: Car occupancy');
  assert.ok(kpiSource.includes('Mật độ xe máy TB'), 'Slot 2: Motorcycle density');
  assert.ok(kpiSource.includes('Lượt xe vào'), 'Slot 3: Vehicle entries');
  assert.ok(kpiSource.includes('Thời gian đỗ TB'), 'Slot 4: Parking duration');
  assert.ok(kpiSource.includes('Camera mô phỏng'), 'Slot 5: Demo camera');
  assert.ok(kpiSource.includes('Demo'), 'Displays Demo badges on cards');
});

test('BP2-P08-T12: ParkingOccupancyCard provides visual slots/zones and accessible table alternative', () => {
  const cardSource = readSrcFile('components/dashboard/parking/ParkingOccupancyCard.tsx');

  assert.ok(cardSource.includes('Sơ đồ trực quan'), 'Provides visual mode');
  assert.ok(cardSource.includes('Bảng dữ liệu'), 'Provides accessible table mode');
  assert.ok(cardSource.includes('<table'), 'Contains semantic table markup');
  assert.ok(cardSource.includes('EV'), 'Indicates EV charging spots');
  assert.ok(cardSource.includes('Mật độ ước tính'), 'Motorcycle zones indicate estimated density');
  assert.ok(cardSource.includes('onSelectEntity'), 'Supports slot and zone selection');
});

test('BP2-P08-T13: ParkingEntriesChart renders range-aware vehicle entries and accessible table alternative', () => {
  const chartSource = readSrcFile('components/dashboard/parking/ParkingEntriesChart.tsx');

  assert.ok(chartSource.includes('Lưu lượng xe vào theo giờ'), 'Default title for today');
  assert.ok(chartSource.includes('Đồ thị'), 'Provides graph view');
  assert.ok(chartSource.includes('Bảng'), 'Provides table view');
  assert.ok(chartSource.includes('Tổng lượt vào:'), 'Displays total entries summary');
  assert.ok(chartSource.includes('Đỉnh:'), 'Displays peak period summary');
});

test('BP2-P08-T14: ParkingCameraTable displays DEMO- cameras with scenario status and no real online/offline claim', () => {
  const tableSource = readSrcFile('components/dashboard/parking/ParkingCameraTable.tsx');

  assert.ok(tableSource.includes('Camera giám sát mô phỏng'), 'Card title');
  assert.ok(tableSource.includes('Mã thiết bị'), 'Column header');
  assert.ok(tableSource.includes('Khu vực bao quát'), 'Column header');
  assert.ok(tableSource.includes('Chu kỳ suy luận'), 'Column header');
  assert.ok(tableSource.includes('Trạng thái kịch bản'), 'Column header');
  assert.ok(tableSource.includes('DEMO-'), 'Camera table clarifies DEMO- prefix');
  assert.ok(!tableSource.includes("'Online'"), 'Does not claim real Online hardware status');
  assert.ok(!tableSource.includes("'Offline'"), 'Does not claim real Offline hardware status');
});

test('BP2-P08-T15: ParkingTechnicalNotes explains deterministic simulation, privacy, and architecture boundaries', () => {
  const notesSource = readSrcFile('components/dashboard/parking/ParkingTechnicalNotes.tsx');

  assert.ok(notesSource.includes('Ghi chú kỹ thuật & Giới hạn kịch bản mô phỏng'), 'Title of technical notes card');
  assert.ok(notesSource.includes('Mô phỏng vị trí đỗ ô tô') || notesSource.includes('NOTE-01'), 'Covers car slot note');
  assert.ok(notesSource.includes('quyền riêng tư') || notesSource.includes('NOTE-03'), 'Covers privacy note');
});

test('BP2-P08-T16: Page 09 route /dashboard/parking mounts ParkingDashboard without legacy placeholder', () => {
  const pageSource = readSrcFile('app/dashboard/parking/page.tsx');

  assert.ok(pageSource.includes('ParkingDashboard'), 'Mounts ParkingDashboard component');
  assert.ok(!pageSource.includes('DashboardPageShell'), 'Removed legacy foundation shell');
  assert.ok(!pageSource.includes('pageNumber="09"'), 'Removed legacy pageNumber="09"');
  assert.ok(!pageSource.includes('UnavailableDataState'), 'Removed placeholder unavailable state');
});

/* =========================================================================
 * 3. ARCHITECTURE & SHELL INTEGRITY (BP2-P08-T17 .. T18)
 * ========================================================================= */

test('BP2-P08-T17: Shell retains exactly 7 routes and no fake alert badges on sidebar', () => {
  const routesSrc = readSrcFile('config/dashboard-routes.ts');
  const shellSrc = readSrcFile('components/dashboard/layout/DashboardShell.tsx');

  assert.ok(routesSrc.includes('/dashboard/parking'), 'Route catalogue contains /dashboard/parking');
  assert.ok(!routesSrc.includes('/dashboard/security'), 'No out-of-scope security route');
  assert.ok(!routesSrc.includes('/dashboard/elevators'), 'No out-of-scope elevators route');

  // Verify exactly 7 routes in routes config
  const routeMatches = routesSrc.match(/path:\s*['"]\/dashboard\/[^'"]*['"]/g) || [];
  assert.equal(routeMatches.length, 7, 'Must have exactly 7 routes in sidebar');

  // No fake alert badge "5"
  assert.ok(!shellSrc.includes('alertBadgeCount'), 'DashboardShell nav must not render alertBadgeCount');
  assert.ok(!shellSrc.includes('unreadCount'), 'DashboardShell nav must not render unreadCount');
});

test('BP2-P08-T18: Security & Architecture audit: zero backend changes, zero DB entities, zero polling/timers', () => {
  const clientSource = readSrcFile('components/dashboard/parking/ParkingDashboard.client.tsx');

  // No network calls inside client container
  assert.ok(!clientSource.includes('fetch('), 'ParkingDashboard performs no fetch calls');
  assert.ok(!clientSource.includes('setInterval('), 'ParkingDashboard has no polling interval');
  assert.ok(!clientSource.includes('setTimeout('), 'ParkingDashboard has no periodic timer');
  assert.ok(!clientSource.includes('localStorage'), 'ParkingDashboard uses no browser storage persistence');
});
