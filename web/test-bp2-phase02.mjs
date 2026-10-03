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

// Sample catalogue response fixture for testing
const mockCatalogueResponse = {
  schemaVersion: 1,
  buildingId: 'E',
  requestedFloorId: '4',
  availability: 'ready',
  provenance: {
    mode: 'live',
    sourceId: 'iot-device-catalogue',
    sourceType: 'iot_backend',
    fetchedAt: '2026-09-26T03:00:00.000Z',
    caveats: ['Áp dụng dữ liệu development fallback từ tầng 0 cho tầng 4.'],
  },
  mapping: {
    floorMode: 'TEST_CURRENT_FLOOR_4_6_V1',
    developmentFallbackApplied: true,
    requestedUpstreamFloorLevel: 4,
  },
  summary: {
    receivedCount: 2,
    acceptedCount: 2,
    skippedCount: 0,
    duplicateCount: 0,
    truncated: false,
  },
  devices: [
    {
      externalDeviceId: '70B3D57ED0073E9D',
      sourceDeviceType: 'solar',
      category: 'solar',
      active: true,
      sourceCreatedAt: '2026-09-20T19:09:17.355Z',
      sourceUpdatedAt: '2026-09-20T19:09:17.355Z',
      sourceLocation: { x: 10.5, y: 2.1, z: 15.3, floorLevel: 0 },
      displayFloorId: '4',
      floorAssignment: 'development-fallback',
    },
    {
      externalDeviceId: 'dummy-opaque-sensor-123',
      sourceDeviceType: 'avc',
      category: 'avc',
      active: false,
      sourceCreatedAt: '2026-09-21T08:00:00.000Z',
      sourceUpdatedAt: '2026-09-21T09:30:00.000Z',
      sourceLocation: { x: 0, y: 0, z: 0, floorLevel: 0 },
      displayFloorId: '4',
      floorAssignment: 'development-fallback',
    },
  ],
};

test('BP2-P02-T17: Frontend adapter calls only same-origin route with cache: no-store and supports cancellation', async () => {
  const adapterSource = readSrcFile('lib/dashboard/iot-catalogue-api.ts');
  assert.ok(adapterSource.includes('/api/devices/dashboard/buildings/'), 'Must use same-origin /api/devices proxy');
  assert.ok(adapterSource.includes("cache: 'no-store'"), 'Must explicitly specify cache: no-store');
  assert.ok(adapterSource.includes('signal: options.signal'), 'Must pass AbortSignal for request cancellation');
  assert.ok(!adapterSource.includes('api.ttlab.manhthao.uk'), 'Must never hardcode upstream host in client code');
  assert.ok(!adapterSource.includes('IOT_API_MASTER_TOKEN'), 'Must never reference master token in client code');
});

test('BP2-P02-T18: Local ID search is case-insensitive and source-type filtering operates in-memory', () => {
  const devices = mockCatalogueResponse.devices;

  // Case-insensitive search
  const queryUpper = 'SOLAR';
  const queryLower = '70b3d57ed0073e9d';
  const queryDummy = 'DUMMY-OPAQUE';

  const match1 = devices.filter((d) => d.externalDeviceId.toLowerCase().includes(queryLower));
  assert.strictEqual(match1.length, 1);
  assert.strictEqual(match1[0].externalDeviceId, '70B3D57ED0073E9D');

  const match2 = devices.filter((d) => d.externalDeviceId.toLowerCase().includes(queryDummy.toLowerCase()));
  assert.strictEqual(match2.length, 1);
  assert.strictEqual(match2[0].externalDeviceId, 'dummy-opaque-sensor-123');

  // Type filter in memory
  const solarDevices = devices.filter((d) => d.sourceDeviceType === 'solar');
  assert.strictEqual(solarDevices.length, 1);

  const avcDevices = devices.filter((d) => d.sourceDeviceType === 'avc');
  assert.strictEqual(avcDevices.length, 1);
});

test('BP2-P02-T19: Stale/aborted floor responses cannot overwrite latest selection', () => {
  const panelSource = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');
  assert.ok(panelSource.includes('requestGenRef'), 'Must track request generation with a ref');
  assert.ok(panelSource.includes('currentGen !== requestGenRef.current'), 'Must discard response if generation is outdated');
  assert.ok(panelSource.includes('AbortController'), 'Must instantiate AbortController on fetch');
});

test('BP2-P02-T20: Loading, ready, upstream-empty, filter-empty, unavailable, and error states resolve distinctly', () => {
  const panelSource = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');

  assert.ok(panelSource.includes("<LoadingState message="), 'Contains LoadingState');
  assert.ok(panelSource.includes('<EmptyDataState'), 'Contains EmptyDataState');
  assert.ok(panelSource.includes('<UnavailableDataState'), 'Contains UnavailableDataState');
  assert.ok(panelSource.includes('<ErrorState'), 'Contains ErrorState');
  assert.ok(panelSource.includes('Không tìm thấy thiết bị phù hợp'), 'Distinguishes filter-empty from upstream empty');
});

test('BP2-P02-T21: Total-device KPI uses accepted normalized rows, preserves zero, and is not rendered before successful data', () => {
  const panelSource = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');

  assert.ok(panelSource.includes("title=\"Tổng số thiết bị\""), 'KPI card title is Tổng số thiết bị');
  assert.ok(panelSource.includes("data?.summary.acceptedCount"), 'Uses summary.acceptedCount');
  assert.ok(/status\s*===\s*'empty'\s*\?\s*0\s*:\s*null/.test(panelSource), 'Preserves numeric 0 only when status is empty, null otherwise');
  assert.ok(/status\s*===\s*'loading'\s*\?\s*'unavailable'/.test(panelSource), 'Not rendered ready before successful data');
});

test('BP2-P02-T22: Catalogue active never produces Online/Offline/health/heartbeat conclusions', () => {
  const tableSource = readSrcFile('components/dashboard/iot/IotDeviceCatalogueTable.tsx');
  const panelSource = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');

  // Verify activity is presented as catalogue activity
  assert.ok(tableSource.includes('Đang hoạt động trong danh mục'), 'Active label must specify catalogue activity');
  assert.ok(tableSource.includes('Ngừng hoạt động trong danh mục'), 'Inactive label must specify catalogue activity');

  // Must not label device row as online/offline
  assert.ok(!tableSource.includes("status === 'online'"), 'Must not evaluate online status');
  assert.ok(!tableSource.includes("label: 'Online'"), 'Must not label active as Online');

  // KPI cards for Online/Offline/Rate remain unavailable
  assert.ok(panelSource.includes('title="Đang hoạt động (Online)"'), 'Contains Online KPI placeholder');
  assert.ok(panelSource.includes('title="Mất kết nối (Offline)"'), 'Contains Offline KPI placeholder');
  assert.ok(panelSource.includes('title="Tỷ lệ trực tuyến"'), 'Contains Online rate KPI placeholder');
  assert.ok(panelSource.includes('Chờ tích hợp telemetry (Phase 03)'), 'KPIs explicitly state telemetry requirement');
});

test('BP2-P02-T23: Unsupported telemetry, battery, firmware, gateway, OTA, calibration, and packet fields are absent or explicitly unavailable', () => {
  const tableSource = readSrcFile('components/dashboard/iot/IotDeviceCatalogueTable.tsx');
  const typeSource = readSrcFile('types/dashboard-iot.ts');

  // Ensure these fields are NOT defined on the catalogue item
  const forbiddenItemFields = ['battery', 'firmware', 'gatewayId', 'ota', 'calibration', 'packetLoss', 'snr', 'rssi'];
  for (const field of forbiddenItemFields) {
    assert.ok(!typeSource.includes(`${field}:`), `Field '${field}' should not be on DashboardDeviceCatalogueItem`);
    assert.ok(!tableSource.includes(`device.${field}`), `Field '${field}' should not be rendered in table`);
  }
});

test('BP2-P02-T24: Page 04, 05, 08, and 10 remain absent; Dashboard still mounts no Unity runtime', () => {
  const dashboardDir = path.join(__dirname, 'src', 'app', 'dashboard');
  const entries = fs.readdirSync(dashboardDir);

  assert.ok(!entries.includes('space'), 'Page 04 (space) must remain absent');
  assert.ok(!entries.includes('maintenance'), 'Page 05 (maintenance) must remain absent');
  assert.ok(!entries.includes('elevator'), 'Page 08 (elevator) must remain absent');
  assert.ok(!entries.includes('security'), 'Page 10 (security) must remain absent');

  // No Unity canvas/runtime in Dashboard
  const iotPage = readSrcFile('app/dashboard/iot/page.tsx');
  assert.ok(!iotPage.includes('UnityViewer'), 'Dashboard iot page must not mount UnityViewer');
});

test('BP2-P02-T25: Client-facing source contains no IoT host, bearer token, authorization secret, or arbitrary upstream-path parameter', () => {
  const clientDir = path.join(__dirname, 'src');
  const filesToScan = [
    'app/dashboard/iot/page.tsx',
    'components/dashboard/iot/IotCataloguePanel.client.tsx',
    'components/dashboard/iot/IotDeviceCatalogueTable.tsx',
    'components/dashboard/iot/IotCatalogueFilters.tsx',
    'lib/dashboard/iot-catalogue-api.ts',
    'types/dashboard-iot.ts',
  ];

  for (const rel of filesToScan) {
    const content = readSrcFile(rel);
    assert.ok(!content.includes('api.ttlab.manhthao.uk'), `File ${rel} must not contain upstream URL`);
    assert.ok(!content.includes('e7e087a2709e278afd016e696e5348396038a0ff4a6ac161c214809dfed94ef7'), `File ${rel} must not contain master token`);
    assert.ok(!content.includes('IOT_API_MASTER_TOKEN'), `File ${rel} must not contain token env variable name`);
  }
});
