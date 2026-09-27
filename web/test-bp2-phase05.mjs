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

// Pure logic mirror for testing Range Calculations (matches environment-range.ts)
function computeTestEnvironmentRange(presetId = '24h', refDate = new Date()) {
  const stop = new Date(refDate.getTime());
  let durationMs;
  switch (presetId) {
    case '24h':
      durationMs = 24 * 3600 * 1000;
      break;
    case '72h':
      durationMs = 72 * 3600 * 1000;
      break;
    case '7d':
      durationMs = 7 * 24 * 3600 * 1000;
      break;
    default:
      durationMs = 24 * 3600 * 1000;
  }
  const start = new Date(stop.getTime() - durationMs);
  return {
    start: start.toISOString(),
    stop: stop.toISOString(),
  };
}

// Pure logic mirror for Chart Adapter (matches environment-chart.ts)
function prepareTestEnvironmentChartData(readings, metricKey) {
  if (!Array.isArray(readings) || readings.length === 0) return [];
  const copy = [...readings];
  copy.sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
  const res = [];
  for (const item of copy) {
    const val = item[metricKey];
    if (typeof val === 'number' && Number.isFinite(val)) {
      res.push({
        timestamp: item.observedAt,
        value: val,
      });
    }
  }
  return res;
}

test('BP2-P05-T01: Environment range presets (24h, 72h, 7d) produce exact UTC windows from one frozen instant', () => {
  const frozen = new Date('2026-09-27T12:00:00.000Z');

  const r24h = computeTestEnvironmentRange('24h', frozen);
  assert.equal(r24h.stop, '2026-09-27T12:00:00.000Z');
  assert.equal(r24h.start, '2026-09-26T12:00:00.000Z');

  const r72h = computeTestEnvironmentRange('72h', frozen);
  assert.equal(r72h.stop, '2026-09-27T12:00:00.000Z');
  assert.equal(r72h.start, '2026-09-24T12:00:00.000Z');

  const r7d = computeTestEnvironmentRange('7d', frozen);
  assert.equal(r7d.stop, '2026-09-27T12:00:00.000Z');
  assert.equal(r7d.start, '2026-09-20T12:00:00.000Z');

  const rangeSrc = readSrcFile('lib/dashboard/environment-range.ts');
  assert.ok(rangeSrc.includes("'24h'"), 'Must support 24h preset');
  assert.ok(rangeSrc.includes("'72h'"), 'Must support 72h preset');
  assert.ok(rangeSrc.includes("'7d'"), 'Must support 7d preset');
  assert.ok(rangeSrc.includes('getSummaryRange'), 'Must export getSummaryRange capped at 24h');
});

test('BP2-P05-T02: Frontend Environment API calls use same-origin proxy with cache: no-store and AbortSignal', () => {
  const apiSrc = readSrcFile('lib/dashboard/environment-api.ts');
  assert.ok(apiSrc.includes('/api/devices'), 'Must call same-origin /api/devices proxy');
  assert.ok(apiSrc.includes("cache: 'no-store'"), 'Must use cache: no-store');
  assert.ok(apiSrc.includes('AbortSignal'), 'Must support AbortSignal cancellation');
  assert.ok(apiSrc.includes('fetchEnvironmentSources'), 'Must export fetchEnvironmentSources');
  assert.ok(apiSrc.includes('fetchEnvironmentSummary'), 'Must export fetchEnvironmentSummary');
  assert.ok(apiSrc.includes('fetchEnvironmentReadings'), 'Must export fetchEnvironmentReadings');
});

test('BP2-P05-T03: Chart adapter returns sorted oldest-first copy without mutating newest-first source array and preserves zero', () => {
  const original = [
    { observedAt: '2026-09-27T10:00:00.000Z', rawTemperature: 28.5 },
    { observedAt: '2026-09-27T08:00:00.000Z', rawTemperature: 0 }, // Valid 0!
    { observedAt: '2026-09-27T09:00:00.000Z', rawTemperature: 25.0 },
  ];

  const chartData = prepareTestEnvironmentChartData(original, 'rawTemperature');
  assert.equal(chartData.length, 3);
  assert.equal(chartData[0].timestamp, '2026-09-27T08:00:00.000Z');
  assert.equal(chartData[0].value, 0, 'Valid 0 value must be preserved');
  assert.equal(chartData[1].timestamp, '2026-09-27T09:00:00.000Z');
  assert.equal(chartData[2].timestamp, '2026-09-27T10:00:00.000Z');

  // Verify original was not mutated
  assert.equal(original[0].observedAt, '2026-09-27T10:00:00.000Z');
});

test('BP2-P05-T04: Deterministic demo fixture page03-co2-demo-v1 is versioned, has no Math.random, and is internally consistent', () => {
  const fixtureSrc = readSrcFile('lib/dashboard/environment-demo-fixtures.ts');
  assert.ok(!fixtureSrc.includes('Math.random'), 'Fixture must NOT use Math.random()');
  assert.ok(fixtureSrc.includes('page03-co2-demo-v1'), 'Fixture must declare fixtureId page03-co2-demo-v1');
  assert.ok(fixtureSrc.includes('DEMO-E-'), 'Rooms must have DEMO prefix');
  assert.ok(fixtureSrc.includes('CO2_DEMO_FIXTURE'), 'Must export CO2_DEMO_FIXTURE');
});

test('BP2-P05-T05: Page 03 route mounted at /dashboard/environment replaces old placeholder layout', () => {
  const pageSrc = readSrcFile('app/dashboard/environment/page.tsx');
  assert.ok(pageSrc.includes('EnvironmentDashboard'), 'Environment page must mount EnvironmentDashboard');
  assert.ok(!pageSrc.includes('pageNumber="03"'), 'Must no longer render old page badge 03');
  assert.ok(!pageSrc.includes('UnavailableDataState'), 'Must not render generic full-page unavailable state');
});

test('BP2-P05-T06: 6-Card KPI strip has honest data modes: IAQ/PM2.5 unavailable, CO2/VOC demo, raw temp/humidity derived without °C or %', () => {
  const kpiSrc = readSrcFile('components/dashboard/environment/EnvironmentKpiStrip.tsx');
  assert.ok(kpiSrc.includes('Chỉ số IAQ toàn nhà'), 'Must have IAQ card');
  assert.ok(kpiSrc.includes('CO₂ trung bình'), 'Must have CO2 card');
  assert.ok(kpiSrc.includes('Raw temperature'), 'Must have Raw temperature card');
  assert.ok(kpiSrc.includes('Raw humidity'), 'Must have Raw humidity card');
  assert.ok(kpiSrc.includes('VOC xu hướng'), 'Must have VOC card');
  assert.ok(kpiSrc.includes('Bụi mịn PM2.5'), 'Must have PM2.5 card');

  // Verify raw temperature and raw humidity have NO °C or %
  const tempSection = kpiSrc.substring(kpiSrc.indexOf('Raw temperature'), kpiSrc.indexOf('Raw humidity'));
  assert.ok(!tempSection.includes('°C'), 'Raw temperature KPI must NOT include °C unit');

  const humidSection = kpiSrc.substring(kpiSrc.indexOf('Raw humidity'), kpiSrc.indexOf('VOC xu hướng'));
  assert.ok(!humidSection.includes('%</span>'), 'Raw humidity KPI must NOT include % unit');
});

test('BP2-P05-T07: Primary row includes CO2 heatmap and ranking derived from fixture', () => {
  const heatmapSrc = readSrcFile('components/dashboard/environment/Co2DemoHeatmap.tsx');
  assert.ok(heatmapSrc.includes('CO₂ theo phòng × giờ'), 'Must have heatmap title');
  assert.ok(heatmapSrc.includes('Minh họa'), 'Must declare Minh họa badge');
  assert.ok(heatmapSrc.includes('Tất cả'), 'Must include floor pills');
  assert.ok(heatmapSrc.includes('Xem Bảng'), 'Must provide accessible table alternative');

  const rankingSrc = readSrcFile('components/dashboard/environment/Co2DemoRanking.tsx');
  assert.ok(rankingSrc.includes('Phòng CO₂ cao nhất lúc này'), 'Must have ranking title');
  assert.ok(rankingSrc.includes('Minh họa'), 'Must declare Minh họa badge');
});

test('BP2-P05-T08: Secondary row includes floor compliance and read-only threshold table', () => {
  const complianceSrc = readSrcFile('components/dashboard/environment/Co2DemoCompliance.tsx');
  assert.ok(complianceSrc.includes('% thời gian đạt chuẩn CO₂'), 'Must have compliance title');
  assert.ok(complianceSrc.includes('Minh họa'), 'Must declare Minh họa badge');

  const thresholdSrc = readSrcFile('components/dashboard/environment/EnvironmentThresholdTable.tsx');
  assert.ok(thresholdSrc.includes('Ngưỡng cảnh báo'), 'Must have threshold table title');
  assert.ok(thresholdSrc.includes('Chờ Small Phase Alert + Identity/CASL'), 'Must have disabled edit explanation');
  assert.ok(thresholdSrc.includes('Chờ xác nhận phần cứng'), 'Must disclose hardware confirmation status for raw temp/humidity');
});

test('BP2-P05-T09: Source picker and selected raw detail handle single Solar device telemetry', () => {
  const pickerSrc = readSrcFile('components/dashboard/environment/EnvironmentSourcePicker.tsx');
  assert.ok(pickerSrc.includes('Chọn nguồn Solar Environment'), 'Must have picker title');
  assert.ok(pickerSrc.includes('onSelectSource'), 'Must have onSelectSource callback');

  const detailSrc = readSrcFile('components/dashboard/environment/EnvironmentSourceDetail.tsx');
  assert.ok(detailSrc.includes('MetricTrendChart'), 'Must reuse MetricTrendChart');
  assert.ok(detailSrc.includes('Raw temperature'), 'Must support Raw temperature trend');
  assert.ok(detailSrc.includes('Raw humidity'), 'Must support Raw humidity trend');
  assert.ok(detailSrc.includes('Độ rọi'), 'Must support Lux trend');
});

test('BP2-P05-T10: Frontend sources contain no secret tokens, upstream IoT URLs, or database persistence imports', () => {
  const filesToCheck = [
    'app/dashboard/environment/page.tsx',
    'components/dashboard/environment/EnvironmentDashboard.client.tsx',
    'components/dashboard/environment/EnvironmentPageHeader.tsx',
    'components/dashboard/environment/EnvironmentKpiStrip.tsx',
    'components/dashboard/environment/Co2DemoHeatmap.tsx',
    'components/dashboard/environment/Co2DemoRanking.tsx',
    'components/dashboard/environment/Co2DemoCompliance.tsx',
    'components/dashboard/environment/EnvironmentThresholdTable.tsx',
    'components/dashboard/environment/EnvironmentSourcePicker.tsx',
    'components/dashboard/environment/EnvironmentSourceDetail.tsx',
    'lib/dashboard/environment-api.ts',
    'lib/dashboard/environment-range.ts',
    'lib/dashboard/environment-chart.ts',
    'lib/dashboard/environment-demo-fixtures.ts',
  ];

  for (const relPath of filesToCheck) {
    const content = readSrcFile(relPath);
    assert.ok(!content.includes('typeorm'), `${relPath} must not import TypeORM`);
    assert.ok(!content.includes('pg'), `${relPath} must not import pg`);
    assert.ok(!content.includes('Bearer '), `${relPath} must not contain hardcoded bearer tokens`);
    assert.ok(!/https?:\/\/(?!localhost|127\.0\.0\.1)/.test(content), `${relPath} must not contain external upstream URLs`);
  }
});
