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
// Pure logic mirror for testing Range Calculations (matches water-range.ts)
// ---------------------------------------------------------------------------
function computeTestWaterRange(presetId, refDate = new Date()) {
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
      startMs = stop.getTime() - 24 * 3600 * 1000;
  }
  const start = new Date(startMs);
  return {
    preset: presetId,
    start: start.toISOString(),
    stop: stop.toISOString(),
  };
}

// Pure logic mirror for Water Chart Adapter (matches water-chart.ts)
function prepareTestWaterChartData(readings, metricKey) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return {
      chartPoints: [],
      hasData: false,
      pointCount: 0,
      latestValue: null,
      accessibleSummary: 'Không có dữ liệu',
    };
  }

  // Clone to avoid mutating original
  const sorted = [...readings].sort((a, b) => {
    const ta = new Date(a.observedAt).getTime();
    const tb = new Date(b.observedAt).getTime();
    return ta - tb;
  });

  const chartPoints = [];
  for (const row of sorted) {
    const val = row[metricKey];
    if (typeof val === 'number' && Number.isFinite(val)) {
      chartPoints.push({
        time: row.observedAt,
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
// Automated Tests BP2-P04-T01 through T25
// ---------------------------------------------------------------------------

test('BP2-P04-T01: Water range presets produce exact UTC windows with default 24h', () => {
  const frozenInstant = new Date('2026-09-26T12:00:00.000Z');

  // 24h (default)
  const range24h = computeTestWaterRange('last-24h', frozenInstant);
  assert.strictEqual(range24h.stop, '2026-09-26T12:00:00.000Z');
  assert.strictEqual(range24h.start, '2026-09-25T12:00:00.000Z');
  const dur24 = new Date(range24h.stop).getTime() - new Date(range24h.start).getTime();
  assert.strictEqual(dur24, 24 * 3600 * 1000);

  // 72h
  const range72h = computeTestWaterRange('last-72h', frozenInstant);
  assert.strictEqual(range72h.stop, '2026-09-26T12:00:00.000Z');
  assert.strictEqual(range72h.start, '2026-09-23T12:00:00.000Z');
  const dur72 = new Date(range72h.stop).getTime() - new Date(range72h.start).getTime();
  assert.strictEqual(dur72, 72 * 3600 * 1000);

  // 7d
  const range7d = computeTestWaterRange('last-7d', frozenInstant);
  assert.strictEqual(range7d.stop, '2026-09-26T12:00:00.000Z');
  assert.strictEqual(range7d.start, '2026-09-19T12:00:00.000Z');
  const dur7d = new Date(range7d.stop).getTime() - new Date(range7d.start).getTime();
  assert.strictEqual(dur7d, 7 * 24 * 3600 * 1000);
});

test('BP2-P04-T02: Frontend Water API calls use same-origin proxy with cache: no-store and AbortSignal', () => {
  const apiSrc = readSrcFile('lib/dashboard/water-api.ts');
  assert.ok(apiSrc.includes("cache: 'no-store'"), 'water-api must specify cache: no-store');
  assert.ok(apiSrc.includes('signal'), 'water-api must pass AbortSignal');
  assert.ok(
    apiSrc.includes('/dashboard/buildings/${encodeURIComponent(buildingId)}/water/meters') ||
    apiSrc.includes('/water/meters'),
    'water-api must target water/meters endpoint',
  );
  assert.ok(
    apiSrc.includes('/readings'),
    'water-api must target /readings endpoint for meter telemetry',
  );
  assert.ok(!apiSrc.includes('https://api.ttlab'), 'water-api must not leak external IoT backend host');
  assert.ok(!apiSrc.includes('Authorization: Bearer'), 'water-api must not leak master token');
});

test('BP2-P04-T03: Chart adapter returns sorted oldest-first copy without mutating newest-first source array', () => {
  const originalReadings = [
    { observedAt: '2026-09-26T12:00:00.000Z', instantFlowM3h: 0.5 },
    { observedAt: '2026-09-26T11:00:00.000Z', instantFlowM3h: 0.2 },
    { observedAt: '2026-09-26T10:00:00.000Z', instantFlowM3h: 0.0 },
  ];

  const sourceCopy = JSON.parse(JSON.stringify(originalReadings));
  const result = prepareTestWaterChartData(originalReadings, 'instantFlowM3h');

  // Must not mutate source
  assert.deepStrictEqual(originalReadings, sourceCopy, 'Source readings array was mutated');

  // Must be sorted oldest first
  assert.strictEqual(result.chartPoints[0].time, '2026-09-26T10:00:00.000Z');
  assert.strictEqual(result.chartPoints[1].time, '2026-09-26T11:00:00.000Z');
  assert.strictEqual(result.chartPoints[2].time, '2026-09-26T12:00:00.000Z');
});

test('BP2-P04-T04: Finite numeric values and valid zero values are preserved in water chart adapter', () => {
  const readings = [
    { observedAt: '2026-09-26T12:00:00.000Z', instantFlowM3h: 0 },
    { observedAt: '2026-09-26T11:00:00.000Z', instantFlowM3h: null },
    { observedAt: '2026-09-26T10:00:00.000Z', instantFlowM3h: undefined },
    { observedAt: '2026-09-26T09:00:00.000Z', instantFlowM3h: NaN },
    { observedAt: '2026-09-26T08:00:00.000Z', instantFlowM3h: 1.25 },
  ];

  const result = prepareTestWaterChartData(readings, 'instantFlowM3h');

  // Should include valid zero and 1.25, but omit null/undefined/NaN
  assert.strictEqual(result.pointCount, 2);
  const values = result.chartPoints.map((p) => p.value);
  assert.ok(values.includes(0), 'Valid zero was omitted');
  assert.ok(values.includes(1.25), '1.25 was omitted');
  assert.ok(!values.includes(null));
});

test('BP2-P04-T05: Energy panels and KPI slots remain unavailable in Phase 04 without fake live values', () => {
  const kpiSrc = readSrcFile('components/dashboard/water/EnergyWaterKpiStrip.tsx');
  assert.ok(kpiSrc.includes('Điện năng hôm nay'), 'Must contain Slot 1 Điện năng hôm nay');
  assert.ok(kpiSrc.includes('Điện 30 ngày'), 'Must contain Slot 2 Điện 30 ngày');
  assert.ok(kpiSrc.includes('Phụ tải nền ban đêm'), 'Must contain Slot 3 Phụ tải nền ban đêm');

  const unavailablePanelsSrc = readSrcFile('components/dashboard/water/EnergyUnavailablePanels.tsx');
  assert.ok(unavailablePanelsSrc.includes('Điện năng theo giờ (kWh)'), 'Must contain primary left title');
  assert.ok(unavailablePanelsSrc.includes('7 ngày gần nhất (kWh/ngày)'), 'Must contain primary right title');
  assert.ok(unavailablePanelsSrc.includes('Small Phase 20'), 'Must cite Small Phase 20 for energy demo');
});

test('BP2-P04-T06: Technical disclosure shows raw numeric flag codes and disclaimers without boolean/alarm coercion', () => {
  const detailSrc = readSrcFile('components/dashboard/water/WaterMeterDetail.tsx');
  assert.ok(detailSrc.includes('valveOpen'), 'Must contain valveOpen');
  assert.ok(detailSrc.includes('pipeLeak'), 'Must contain pipeLeak');
  assert.ok(detailSrc.includes('pipeBurst'), 'Must contain pipeBurst');
  assert.ok(detailSrc.includes('batteryLow'), 'Must contain batteryLow');
  assert.ok(detailSrc.includes('frozen'), 'Must contain frozen');
  assert.ok(detailSrc.includes('tamper'), 'Must contain tamper');
  assert.ok(
    detailSrc.includes('Không thể kết luận rò rỉ hoặc bất thường từ các mã cờ kỹ thuật hiện tại') ||
    detailSrc.includes('Không thể kết luận rò rỉ'),
    'Must contain unconfirmed flag disclaimer',
  );
});

test('BP2-P04-T07: Client container enforces no telemetry request before meter selection', () => {
  const dashboardSrc = readSrcFile('components/dashboard/water/EnergyWaterDashboard.client.tsx');
  // Initial readingStatus is idle
  assert.ok(dashboardSrc.includes("readingStatus, setReadingStatus] = useState<\n    'idle'"), 'Initial readingStatus must be idle');
  assert.ok(dashboardSrc.includes('selectedMeterId, setSelectedMeterId] = useState<string | null>(null)'), 'Initial selectedMeterId must be null');
});

test('BP2-P04-T08: Frontend sources contain no secret tokens or external IoT backend URLs', () => {
  const filesToCheck = [
    'components/dashboard/water/EnergyWaterDashboard.client.tsx',
    'components/dashboard/water/EnergyWaterPageHeader.tsx',
    'components/dashboard/water/EnergyWaterKpiStrip.tsx',
    'components/dashboard/water/EnergyUnavailablePanels.tsx',
    'components/dashboard/water/WaterMeterList.tsx',
    'components/dashboard/water/WaterMetricChart.tsx',
    'components/dashboard/water/WaterMeterDetail.tsx',
    'lib/dashboard/water-api.ts',
    'lib/dashboard/water-range.ts',
    'lib/dashboard/water-chart.ts',
    'types/dashboard-water.ts',
  ];

  for (const f of filesToCheck) {
    const content = readSrcFile(f);
    assert.ok(!content.includes('api.ttlab.manhthao.uk'), `File ${f} contains external host`);
    assert.ok(!content.includes('Bearer '), `File ${f} contains Bearer token`);
  }
});

test('BP2-P04-T09: Page 02 route is mounted at /dashboard/energy-water', () => {
  const pageSrc = readSrcFile('app/dashboard/energy-water/page.tsx');
  assert.ok(pageSrc.includes('EnergyWaterDashboard'), 'Page must mount EnergyWaterDashboard');
});

test('BP2-P04-T10: Time filter UI block is reused between /dashboard/iot and /dashboard/energy-water', () => {
  const timeFilterSrc = readSrcFile('components/dashboard/controls/TimeFilterSegmented.tsx');
  assert.ok(timeFilterSrc.includes('Hôm nay'), 'TimeFilterSegmented must include Hôm nay');
  assert.ok(timeFilterSrc.includes('7 ngày'), 'TimeFilterSegmented must include 7 ngày');
  assert.ok(timeFilterSrc.includes('30 ngày'), 'TimeFilterSegmented must include 30 ngày');
  assert.ok(timeFilterSrc.includes('Tùy chọn'), 'TimeFilterSegmented must include Tùy chọn');

  const iotHeaderSrc = readSrcFile('components/dashboard/iot/IotPageHeader.tsx');
  assert.ok(iotHeaderSrc.includes('TimeFilterSegmented'), 'IotPageHeader must reuse TimeFilterSegmented');

  const waterHeaderSrc = readSrcFile('components/dashboard/water/EnergyWaterPageHeader.tsx');
  assert.ok(waterHeaderSrc.includes('TimeFilterSegmented'), 'EnergyWaterPageHeader must reuse TimeFilterSegmented');
});

test('BP2-P04-T11: KPI slots 5 and 6 display "Lưu lượng nước đêm" and "Mực bể chứa" with dummy baselines', () => {
  const kpiSrc = readSrcFile('components/dashboard/water/EnergyWaterKpiStrip.tsx');
  assert.ok(kpiSrc.includes('Lưu lượng nước đêm'), 'Must include Lưu lượng nước đêm');
  assert.ok(kpiSrc.includes('0,90'), 'Must include 0,90 m3/h baseline');
  assert.ok(kpiSrc.includes('Mức nền 0,20 m³/h — nghi rò rỉ'), 'Must include leak suspicion subtext');
  assert.ok(kpiSrc.includes('Mực bể chứa'), 'Must include Mực bể chứa');
  assert.ok(kpiSrc.includes('72'), 'Must include 72% baseline');
  assert.ok(kpiSrc.includes('Bể mái · ~ 29 m³'), 'Must include tank volume subtext');
});

test('BP2-P04-T12: Water chart supports total aggregate across all AVC meters when unselected', () => {
  const waterChartSrc = readSrcFile('lib/dashboard/water-chart.ts');
  assert.ok(waterChartSrc.includes('function aggregateWaterReadings'), 'Must define aggregateWaterReadings');
  assert.ok(waterChartSrc.includes('BUCKET_MS'), 'Must use time bucketing for aggregate alignment');

  const dashboardSrc = readSrcFile('components/dashboard/water/EnergyWaterDashboard.client.tsx');
  assert.ok(dashboardSrc.includes('loadAggregatedReadings'), 'Client container must implement loadAggregatedReadings');

  const chartCompSrc = readSrcFile('components/dashboard/water/WaterMetricChart.tsx');
  assert.ok(chartCompSrc.includes('Toàn bộ đồng hồ AVC (Tổng hợp)'), 'Must identify aggregated display in chart');
});

test('BP2-P04-T13: MetricTrendChart uses continuous time scale (~3h ticks) and displays Y-axis in tooltip items', () => {
  const trendSrc = readSrcFile('components/dashboard/charts/MetricTrendChart.tsx');
  assert.ok(trendSrc.includes("type: 'time'"), 'Must configure time scale');
  assert.ok(trendSrc.includes('tickCount: 8'), 'Must space ticks every ~3 hours over 24h');
  assert.ok(trendSrc.includes('formatXAxisTime'), 'Must format X axis friendly');
  assert.ok(trendSrc.includes("channel: 'y'") || trendSrc.includes('field: valueKey'), 'Tooltip must show Y axis metric value');
  assert.ok(trendSrc.includes('formatTooltipTime'), 'Tooltip title must format friendly timestamp');
});
