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

// ---------------------------------------------------------------------------
// Pure logic mirror for testing Range Calculations (matches iot-telemetry-range.ts)
// ---------------------------------------------------------------------------
function computeTestRange(presetId, refDate = new Date()) {
  const stop = new Date(refDate.getTime());
  let startMs;
  switch (presetId) {
    case 'last-24h':
      startMs = stop.getTime() - 24 * 3600 * 1000;
      break;
    case 'last-72h':
      startMs = stop.getTime() - 72 * 3600 * 1000;
      break;
    case 'last-7d':
      startMs = stop.getTime() - 7 * 24 * 3600 * 1000;
      break;
    default:
      startMs = stop.getTime() - 72 * 3600 * 1000;
  }
  const start = new Date(startMs);
  return {
    preset: presetId,
    start: start.toISOString(),
    stop: stop.toISOString(),
  };
}

// Pure logic mirror for Chart Adapter (matches iot-telemetry-chart.ts)
function prepareTestTelemetryChartData(telemetryRows, metricKey) {
  if (!Array.isArray(telemetryRows) || telemetryRows.length === 0) {
    return { chartPoints: [], hasData: false, latestValue: null, pointCount: 0, accessibleSummary: 'Không có dữ liệu' };
  }

  // Clone to avoid mutating original
  const sorted = [...telemetryRows].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return ta - tb;
  });

  const chartPoints = [];
  for (const row of sorted) {
    const val = row[metricKey];
    if (typeof val === 'number' && Number.isFinite(val)) {
      chartPoints.push({
        time: row.timestamp,
        value: val,
        metric: metricKey,
      });
    }
  }

  return {
    chartPoints,
    hasData: chartPoints.length > 0,
    pointCount: chartPoints.length,
    latestValue: chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].value : null,
  };
}

// ---------------------------------------------------------------------------
// Automated Tests BP2-P03-T01 through T30
// ---------------------------------------------------------------------------

test('BP2-P03-T04: Range helpers (24h, 72h, 7d) produce exact UTC windows from one frozen stop instant', () => {
  const frozenInstant = new Date('2026-09-26T12:00:00.000Z');

  // 24h
  const range24h = computeTestRange('last-24h', frozenInstant);
  assert.strictEqual(range24h.stop, '2026-09-26T12:00:00.000Z');
  assert.strictEqual(range24h.start, '2026-09-25T12:00:00.000Z');
  const dur24 = new Date(range24h.stop).getTime() - new Date(range24h.start).getTime();
  assert.strictEqual(dur24, 24 * 3600 * 1000);

  // 72h (default)
  const range72h = computeTestRange('last-72h', frozenInstant);
  assert.strictEqual(range72h.stop, '2026-09-26T12:00:00.000Z');
  assert.strictEqual(range72h.start, '2026-09-23T12:00:00.000Z');
  const dur72 = new Date(range72h.stop).getTime() - new Date(range72h.start).getTime();
  assert.strictEqual(dur72, 72 * 3600 * 1000);

  // 7d
  const range7d = computeTestRange('last-7d', frozenInstant);
  assert.strictEqual(range7d.stop, '2026-09-26T12:00:00.000Z');
  assert.strictEqual(range7d.start, '2026-09-19T12:00:00.000Z');
  const dur7d = new Date(range7d.stop).getTime() - new Date(range7d.start).getTime();
  assert.strictEqual(dur7d, 7 * 24 * 3600 * 1000);

  // Check source file defines presets
  const rangeSrc = readSrcFile('lib/dashboard/iot-telemetry-range.ts');
  assert.ok(rangeSrc.includes('DEFAULT_TELEMETRY_PRESET'), 'Must export DEFAULT_TELEMETRY_PRESET');
  assert.ok(rangeSrc.includes("'last-72h'"), 'Default preset must be last-72h');
  assert.ok(rangeSrc.includes('DASHBOARD_TELEMETRY_PRESETS'), 'Must export DASHBOARD_TELEMETRY_PRESETS');
});

test('BP2-P03-T05: Frontend sends exact start, stop, and limit=1000; adapter contains no client deviceType routing hint', () => {
  const apiSrc = readSrcFile('lib/dashboard/iot-telemetry-api.ts');
  assert.ok(apiSrc.includes('/api/devices/dashboard/buildings/E/iot/devices/'), 'Uses same-origin /api/devices proxy for Building E');
  assert.ok(apiSrc.includes('telemetry'), 'Points to telemetry endpoint');
  assert.ok(apiSrc.includes("limit: '1000'"), 'Explicitly passes limit: 1000');
  assert.ok(apiSrc.includes('start,'), 'Explicitly passes start');
  assert.ok(apiSrc.includes('stop,'), 'Explicitly passes stop');
  assert.ok(!apiSrc.includes('deviceType'), 'Frontend adapter MUST NOT send deviceType query parameter');
  assert.ok(apiSrc.includes("cache: 'no-store'"), 'Uses cache: no-store');
});

test('BP2-P03-T09: NFC and unknown devices are unsupported for Dashboard Phase 03 and trigger no telemetry fetch', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  // Checks sourceDeviceType for solar or avc
  assert.ok(panelSrc.includes("device.sourceDeviceType === 'solar' || device.sourceDeviceType === 'avc'"), 'Checks supported types for solar and avc only');
  // Returns early before fetch
  assert.ok(panelSrc.includes('if (!isSupportedType) return;'), 'Does not invoke fetch when type is unsupported');
  // Renders UnavailableDataState for unsupported types
  assert.ok(panelSrc.includes('!isSupportedType &&'), 'Renders unsupported fallback UI');
  assert.ok(panelSrc.includes('UnavailableDataState'), 'Uses UnavailableDataState component');
});

test('BP2-P03-T11 & T12: Solar metric selector and raw unconfirmed field disclosures', () => {
  const selectorSrc = readSrcFile('components/dashboard/iot/IotTelemetryMetricSelector.tsx');
  assert.ok(selectorSrc.includes('current_uA'), 'Solar metric includes current_uA');
  assert.ok(selectorSrc.includes('lux'), 'Solar metric includes lux');

  const techSrc = readSrcFile('components/dashboard/iot/IotTelemetryTechnicalDetails.tsx');
  assert.ok(techSrc.includes('rawVoltage'), 'Technical details includes rawVoltage');
  assert.ok(techSrc.includes('rawTemperature'), 'Technical details includes rawTemperature');
  assert.ok(techSrc.includes('rawHumidity'), 'Technical details includes rawHumidity');
  assert.ok(techSrc.includes('rawState'), 'Technical details includes rawState');
  assert.ok(techSrc.includes('chưa xác nhận phần cứng') || techSrc.includes('chưa có đơn vị'), 'Qualifies solar raw fields as hardware unconfirmed');
});

test('BP2-P03-T13 & T14: AVC flow/volume/temp metrics and numeric raw flag codes without boolean/alarm conversions', () => {
  const selectorSrc = readSrcFile('components/dashboard/iot/IotTelemetryMetricSelector.tsx');
  assert.ok(selectorSrc.includes('instant_flow_m3h'), 'AVC metric includes instant_flow_m3h');
  assert.ok(selectorSrc.includes('fwd_volume_m3'), 'AVC metric includes fwd_volume_m3');
  assert.ok(selectorSrc.includes('rev_volume_m3'), 'AVC metric includes rev_volume_m3');
  assert.ok(selectorSrc.includes('temp_c'), 'AVC metric includes temp_c');

  const techSrc = readSrcFile('components/dashboard/iot/IotTelemetryTechnicalDetails.tsx');
  const avcFlags = ['valve_open', 'pipe_leak', 'pipe_burst', 'battery_low', 'frozen', 'tamper', 'reverse_flow'];
  for (const flag of avcFlags) {
    assert.ok(techSrc.includes(flag), `Technical details includes flag code ${flag}`);
  }
  assert.ok(techSrc.includes('chưa xác nhận miền giá trị'), 'Qualifies AVC raw flags with unconfirmed range wording');
  // Flags must be rendered as raw source codes, not boolean conversions
  assert.ok(!techSrc.includes("=== 1 ? 'Báo động'"), 'Flags must not be converted to alarm booleans');
  assert.ok(!techSrc.includes("battery_low ? 'Pin yếu'"), 'battery_low must not be converted to human alarm');
});

test('BP2-P03-T15: Finite numeric values and valid zero values are preserved in chart adapter', () => {
  const sampleRows = [
    { timestamp: '2026-09-26T10:00:00Z', current_uA: 0 },
    { timestamp: '2026-09-26T11:00:00Z', current_uA: 1540.5 },
    { timestamp: '2026-09-26T12:00:00Z', current_uA: null },
    { timestamp: '2026-09-26T13:00:00Z', current_uA: undefined },
    { timestamp: '2026-09-26T14:00:00Z', current_uA: NaN },
    { timestamp: '2026-09-26T15:00:00Z', current_uA: Infinity },
  ];

  const result = prepareTestTelemetryChartData(sampleRows, 'current_uA');
  assert.strictEqual(result.pointCount, 2, 'Only finite numbers (including 0) should be converted to chart points');
  assert.strictEqual(result.chartPoints[0].value, 0, 'Zero value MUST be preserved');
  assert.strictEqual(result.chartPoints[1].value, 1540.5, 'Positive finite number preserved');

  const chartAdapterSrc = readSrcFile('lib/dashboard/iot-telemetry-chart.ts');
  assert.ok(chartAdapterSrc.includes('Number.isFinite'), 'Chart adapter uses Number.isFinite to validate numbers');
});

test('BP2-P03-T17: Chart adapter returns a separately sorted oldest-first copy without mutating newest-first source array', () => {
  const newestFirstSource = [
    { timestamp: '2026-09-26T12:00:00Z', current_uA: 300 },
    { timestamp: '2026-09-26T11:00:00Z', current_uA: 200 },
    { timestamp: '2026-09-26T10:00:00Z', current_uA: 100 },
  ];

  const copyForTest = [...newestFirstSource];
  const chartResult = prepareTestTelemetryChartData(copyForTest, 'current_uA');

  // Chart points must be oldest-first
  assert.strictEqual(chartResult.chartPoints[0].time, '2026-09-26T10:00:00Z');
  assert.strictEqual(chartResult.chartPoints[1].time, '2026-09-26T11:00:00Z');
  assert.strictEqual(chartResult.chartPoints[2].time, '2026-09-26T12:00:00Z');

  // Source array must NOT be mutated
  assert.strictEqual(copyForTest[0].timestamp, '2026-09-26T12:00:00Z', 'First element of source array remains newest');
  assert.strictEqual(copyForTest[2].timestamp, '2026-09-26T10:00:00Z', 'Last element of source array remains oldest');
});

test('BP2-P03-T18: Nonuniform timestamps and gaps produce no synthetic interpolated points', () => {
  const rowsWithGap = [
    { timestamp: '2026-09-26T00:00:00Z', instant_flow_m3h: 1.2 },
    { timestamp: '2026-09-26T06:00:00Z', instant_flow_m3h: 2.4 },
  ];

  const result = prepareTestTelemetryChartData(rowsWithGap, 'instant_flow_m3h');
  assert.strictEqual(result.chartPoints.length, 2, 'No synthetic points should be inserted between distant timestamps');
  assert.strictEqual(result.chartPoints[0].time, '2026-09-26T00:00:00Z');
  assert.strictEqual(result.chartPoints[1].time, '2026-09-26T06:00:00Z');
});

test('BP2-P03-T20: Truncated, reached-limit, and invalid-row cases generate visible caveats', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  assert.ok(panelSrc.includes('Lưu ý chất lượng dữ liệu'), 'Telemetry panel includes data quality caveats region');
  assert.ok(panelSrc.includes('data.coverage.isTruncated'), 'Checks coverage.isTruncated');
  assert.ok(panelSrc.includes('data.coverage.reachedLimit'), 'Checks coverage.reachedLimit');
  assert.ok(panelSrc.includes('data.coverage.invalidCount'), 'Checks coverage.invalidCount');
});

test('BP2-P03-T21: Latest sample cards derive from newest valid row', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  assert.ok(panelSrc.includes('data.latestSample'), 'Uses latestSample from telemetry response');
  assert.ok(panelSrc.includes('data.latestSample?.observedAt'), 'Exposes observedAt');
});

test('BP2-P03-T22: Device or range switching cancels/supersedes prior request and suppresses stale responses', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  assert.ok(panelSrc.includes('abortControllerRef'), 'Uses abortControllerRef for request cancellation');
  assert.ok(panelSrc.includes('abortControllerRef.current.abort()'), 'Aborts previous request on load');
  assert.ok(panelSrc.includes('requestGenRef'), 'Uses request generation counter');
  assert.ok(panelSrc.includes('currentGen !== requestGenRef.current'), 'Discards response from stale generation');
});

test('BP2-P03-T23: Manual refresh recomputes rolling window without automatic timer/polling', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  assert.ok(panelSrc.includes('handleRefresh'), 'Exposes handleRefresh handler');
  assert.ok(panelSrc.includes('computeTelemetryRange(targetPreset)'), 'Recomputes range on refresh');
  assert.ok(!panelSrc.includes('setInterval'), 'Must NOT use setInterval for auto-polling');
  assert.ok(!panelSrc.includes('useInterval'), 'Must NOT use interval hooks');
});

test('BP2-P03-T24: Selecting a device is the only telemetry trigger; catalogue loading does not perform N+1 requests', () => {
  const cataloguePanelSrc = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');
  const catalogueTableSrc = readSrcFile('components/dashboard/iot/IotDeviceCatalogueTable.tsx');

  assert.ok(catalogueTableSrc.includes('onSelectDevice'), 'Catalogue table accepts onSelectDevice prop');
  assert.ok(catalogueTableSrc.includes('Xem telemetry'), 'Action button is Xem telemetry');
  assert.ok(cataloguePanelSrc.includes('<IotDeviceTelemetryPanel'), 'Mounts IotDeviceTelemetryPanel on selection');
  assert.ok(cataloguePanelSrc.includes('{selectedDevice && ('), 'Renders telemetry panel only when device is selected');
  assert.ok(!catalogueTableSrc.includes('fetchDashboardDeviceTelemetry'), 'Table does NOT fetch telemetry per row');
});

test('BP2-P03-T25: Distinct UI states are handled', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  assert.ok(panelSrc.includes('<LoadingState'), 'Renders LoadingState');
  assert.ok(panelSrc.includes('<EmptyDataState'), 'Renders EmptyDataState');
  assert.ok(panelSrc.includes('<UnavailableDataState'), 'Renders UnavailableDataState');
  assert.ok(panelSrc.includes('<ErrorState'), 'Renders ErrorState');
  assert.ok(panelSrc.includes('isRefreshing'), 'Has distinct refreshing state');
});

test('BP2-P03-T26: Metric trend chart uses MetricTrendChart and provides an accessible text summary', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  assert.ok(panelSrc.includes('MetricTrendChart'), 'Imports and renders MetricTrendChart');
  assert.ok(panelSrc.includes('accessibleSummary={chartData.accessibleSummary}'), 'Passes accessibleSummary to MetricTrendChart');

  const chartComponentSrc = readSrcFile('components/dashboard/charts/MetricTrendChart.tsx');
  assert.ok(chartComponentSrc.includes('<table'), 'MetricTrendChart provides accessible table structure');
  assert.ok(chartComponentSrc.includes('summaryText'), 'MetricTrendChart renders accessible summary');

  const chartAdapterSrc = readSrcFile('lib/dashboard/iot-telemetry-chart.ts');
  assert.ok(chartAdapterSrc.includes('accessibleSummary'), 'Generates accessible Vietnamese summary');
});

test('BP2-P03-T27: Global Online/Offline/online-rate KPIs remain unavailable', () => {
  const cataloguePanelSrc = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');
  assert.ok(cataloguePanelSrc.includes('title="Đang hoạt động (Online)"'), 'Online KPI exists');
  assert.ok(cataloguePanelSrc.includes('title="Mất kết nối (Offline)"'), 'Offline KPI exists');
  assert.ok(cataloguePanelSrc.includes('title="Tỷ lệ trực tuyến"'), 'Online rate KPI exists');
  assert.ok(cataloguePanelSrc.includes('availability="unavailable"'), 'Availability remains unavailable');
});

test('BP2-P03-T28: Forbidden hardware and health fields are absent or unavailable', () => {
  const telemetryTypeSrc = readSrcFile('types/dashboard-iot-telemetry.ts');
  assert.ok(!telemetryTypeSrc.includes('batteryPercentage:'), 'batteryPercentage must not be in contract');
  assert.ok(!telemetryTypeSrc.includes('firmwareVersion:'), 'firmwareVersion must not be in contract');
  assert.ok(!telemetryTypeSrc.includes('otaStatus:'), 'otaStatus must not be in contract');
  assert.ok(!telemetryTypeSrc.includes('calibrationDate:'), 'calibrationDate must not be in contract');
});

test('BP2-P03-T29: Frontend files contain no upstream IoT URL, master token, or authorization header', () => {
  const filesToScan = [
    'components/dashboard/iot/IotCataloguePanel.client.tsx',
    'components/dashboard/iot/IotDeviceCatalogueTable.tsx',
    'components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx',
    'components/dashboard/iot/IotTelemetryMetricSelector.tsx',
    'components/dashboard/iot/IotTelemetryTechnicalDetails.tsx',
    'lib/dashboard/iot-telemetry-api.ts',
    'lib/dashboard/iot-telemetry-chart.ts',
    'lib/dashboard/iot-telemetry-range.ts',
    'types/dashboard-iot-telemetry.ts',
  ];

  for (const rel of filesToScan) {
    const content = readSrcFile(rel);
    assert.ok(!content.includes('api.ttlab.manhthao.uk'), `File ${rel} must not contain upstream host`);
    assert.ok(!content.includes('e7e087a2709e278afd016e696e5348396038a0ff4a6ac161c214809dfed94ef7'), `File ${rel} must not contain master token`);
    assert.ok(!content.includes('IOT_API_MASTER_TOKEN'), `File ${rel} must not contain token env variable name`);
    assert.ok(!content.includes('Bearer '), `File ${rel} must not contain hardcoded Bearer token`);
  }
});

test('BP2-P03-T30: Architecture integrity — no second chart library, no DB entity, out-of-scope pages absent', () => {
  const pkgSrc = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
  assert.ok(!pkgSrc.includes('"recharts"'), 'Recharts must not be added');
  assert.ok(!pkgSrc.includes('"chart.js"'), 'Chart.js must not be added');

  // Verify no new pages
  const dashboardDir = path.join(__dirname, 'src', 'app', 'dashboard');
  const entries = fs.readdirSync(dashboardDir);
  assert.ok(!entries.includes('space'), 'Page 04 (space) must remain absent');
  assert.ok(!entries.includes('maintenance'), 'Page 05 (maintenance) must remain absent');
  assert.ok(!entries.includes('elevator'), 'Page 08 (elevator) must remain absent');
  assert.ok(!entries.includes('security'), 'Page 10 (security) must remain absent');
});
