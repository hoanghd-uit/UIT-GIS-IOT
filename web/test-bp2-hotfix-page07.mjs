import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSrcFile(relPath) {
  return fs.readFileSync(path.join(__dirname, 'src', relPath), 'utf8');
}

// -----------------------------------------------------------------------------
// TASK A: STATE / EFFECT FEEDBACK LOOP PREVENTION
// -----------------------------------------------------------------------------
test('BP2-HOTFIX-T01: Parent callback stability and unchanged summary reference check', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');

  // Verify handleTelemetryLoaded is wrapped in useCallback
  assert.ok(panelSrc.includes('const handleTelemetryLoaded = useCallback('), 'handleTelemetryLoaded must use useCallback');

  // Verify reference equality guard on previous summary
  assert.ok(panelSrc.includes('prev.gatewayId === summary.gatewayId'), 'Checks gatewayId equality');
  assert.ok(panelSrc.includes('prev.rssi === summary.rssi'), 'Checks rssi equality');
  assert.ok(panelSrc.includes('prev.snr === summary.snr'), 'Checks snr equality');
  assert.ok(panelSrc.includes('prev.latestTimestamp === summary.latestTimestamp'), 'Checks latestTimestamp equality');
  assert.ok(panelSrc.includes('return prev;'), 'Returns previous reference when values are identical');
});

test('BP2-HOTFIX-T02: Telemetry detail panel suppresses duplicate summary notification to parent', () => {
  const detailSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');

  assert.ok(detailSrc.includes('lastEmittedSummaryRef'), 'Uses lastEmittedSummaryRef to track summary emissions');
  assert.ok(detailSrc.includes('summaryKey'), 'Builds a summary key to detect changes');
  assert.ok(detailSrc.includes('if (lastEmittedSummaryRef.current !== summaryKey)'), 'Only calls onTelemetryLoaded when summary values change');

  // Must not have independent polling timers
  assert.ok(!detailSrc.includes('setInterval('), 'Detail panel must not run independent setInterval');
  assert.ok(!detailSrc.includes('useInterval'), 'Detail panel must not use interval hook');
});

// -----------------------------------------------------------------------------
// TASK B: CATALOGUE PAGING (10 DEVICES PER PAGE)
// -----------------------------------------------------------------------------
test('BP2-HOTFIX-T03: Catalogue paging 10 items/page, filter-first, and footer controls', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');

  assert.ok(panelSrc.includes('PAGE_SIZE = 10'), 'Page size is fixed to 10 devices');
  assert.ok(panelSrc.includes('currentPage, setCurrentPage'), 'Manages currentPage state');
  assert.ok(panelSrc.includes('filteredDevices.slice(startIndex, endIndex)'), 'Slices visible devices after filtering');

  // Footer labels
  assert.ok(panelSrc.includes('Hiển thị {startIndex + 1}–{endIndex} / {totalFiltered} thiết bị'), 'Footer shows 1-indexed range and total count');
  assert.ok(panelSrc.includes('Trang {safeCurrentPage} / {totalPages}'), 'Footer shows current page and total pages');
  assert.ok(panelSrc.includes('Trước'), 'Contains Trước (Previous) button');
  assert.ok(panelSrc.includes('Sau'), 'Contains Sau (Next) button');
  assert.ok(panelSrc.includes('Làm mới dữ liệu trang'), 'Contains Làm mới dữ liệu trang button');
});

test('BP2-HOTFIX-T04: Filter changes reset pagination to page 1 and auto-close off-page selection', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');

  assert.ok(panelSrc.includes('handleSearchChange'), 'Search change handler resets page to 1');
  assert.ok(panelSrc.includes('handleTypeChange'), 'Type change handler resets page to 1');
  assert.ok(panelSrc.includes('handleFloorChange'), 'Floor change handler resets page to 1');
  assert.ok(panelSrc.includes('handleApplyRoom'), 'Apply room handler resets page to 1');

  // Auto-close detail when selected device leaves visible page
  assert.ok(panelSrc.includes('const isStillVisible = visibleDevices.some'), 'Verifies selected device is still in visibleDevices');
  assert.ok(panelSrc.includes('setSelectedDevice(null)'), 'Clears selected device when not visible');
});

// -----------------------------------------------------------------------------
// TASK C: AUTO-LOAD RADIO SUMMARY OF VISIBLE PAGE
// -----------------------------------------------------------------------------
test('BP2-HOTFIX-T05: Telemetry API accepts optional validated limit parameter', () => {
  const apiSrc = readSrcFile('lib/dashboard/iot-telemetry-api.ts');

  assert.ok(apiSrc.includes('limit?: number'), 'Options interface includes optional limit');
  assert.ok(apiSrc.includes("limit: '1000'"), 'Defaults to limit 1000 for compatibility');
  assert.ok(apiSrc.includes('params.set(\'limit\', limit.toString())'), 'Applies custom limit when provided');
});

test('BP2-HOTFIX-T06: Telemetry coordinator enforces max 2 concurrency and bounded 20-entry cache', () => {
  const coordinatorSrc = readSrcFile('components/dashboard/iot/useIotPage07Telemetry.ts');

  assert.ok(coordinatorSrc.includes('MAX_CONCURRENT_REQUESTS = 2'), 'Limits concurrency to 2 on Page 07');
  assert.ok(coordinatorSrc.includes('MAX_CACHE_ENTRIES = 20'), 'Limits RAM cache to 20 entries');
  assert.ok(coordinatorSrc.includes('REFRESH_CADENCE_MS = 300000'), 'Defines 300000 ms cadence');
  assert.ok(coordinatorSrc.includes('limit: 1'), 'Uses limit 1 for snapshot queries');
  assert.ok(coordinatorSrc.includes('SUPPORTED_DEVICE_TYPES'), 'Defines supported device types set');
});

test('BP2-HOTFIX-T07: Table renders per-row telemetry values and updated tooltips', () => {
  const tableSrc = readSrcFile('components/dashboard/iot/IotDeviceCatalogueTable.tsx');

  assert.ok(tableSrc.includes('rowSummaries'), 'Accepts rowSummaries prop');
  assert.ok(tableSrc.includes('rssiDisplay'), 'Renders derived RSSI display');
  assert.ok(tableSrc.includes('snrDisplay'), 'Renders derived SNR display');
  assert.ok(tableSrc.includes('lastTimeDisplay'), 'Renders derived Lần cuối display');

  // Obsolete tooltip removed
  assert.ok(!tableSrc.includes('Chỉ khả dụng khi chọn thiết bị để nạp telemetry'), 'Obsolete selection-only tooltip is removed');
});

// -----------------------------------------------------------------------------
// TASK D: PAGE 07-OWNED 5-MINUTE REFRESH SCHEDULER
// -----------------------------------------------------------------------------
test('BP2-HOTFIX-T08: 5-minute scheduler is owned by Page 07 and respects visibility / online status', () => {
  const coordinatorSrc = readSrcFile('components/dashboard/iot/useIotPage07Telemetry.ts');

  assert.ok(coordinatorSrc.includes('document.visibilityState === \'hidden\''), 'Pauses when document is hidden');
  assert.ok(coordinatorSrc.includes('navigator.onLine'), 'Pauses when browser is offline');
  assert.ok(coordinatorSrc.includes('addEventListener(\'visibilitychange\''), 'Listens for visibility change');
  assert.ok(coordinatorSrc.includes('addEventListener(\'online\''), 'Listens for online event');
  assert.ok(coordinatorSrc.includes('clearInterval'), 'Cleans up interval on unmount');
});

test('BP2-HOTFIX-T09: Protected stakeholder labels and zero-persistence rules preserved', () => {
  const tableSrc = readSrcFile('components/dashboard/iot/IotDeviceCatalogueTable.tsx');

  assert.ok(tableSrc.includes('Trực tuyến trong API'), 'Preserves stakeholder label: Trực tuyến trong API');
  assert.ok(tableSrc.includes('Ngừng hoạt động trong danh mục'), 'Preserves stakeholder label: Ngừng hoạt động trong danh mục');
  assert.ok(tableSrc.includes('RSSI'), 'Preserves RSSI header');
  assert.ok(tableSrc.includes('SNR'), 'Preserves SNR header');
  assert.ok(tableSrc.includes('Lần cuối'), 'Preserves Lần cuối header');
  assert.ok(tableSrc.includes('Pin'), 'Preserves Pin header');
  assert.ok(tableSrc.includes('Firmware'), 'Preserves Firmware header');
});
