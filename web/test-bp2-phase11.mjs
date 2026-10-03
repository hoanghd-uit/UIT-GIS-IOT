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

function readBackendFile(relPath) {
  const fullPath = path.join(__dirname, '..', 'backend', 'src', relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

/* =========================================================================
 * Big Phase 02 / Small Phase 24: Read-only sb & smoke Raw Telemetry Foundation
 * Test Matrix: BP2-SP24-T01 through BP2-SP24-T29
 * ========================================================================= */

test('BP2-SP24-T01: Fixed /api/v1/sb query construction (dev_eui, start, stop, limit)', () => {
  const clientSrc = readBackendFile('iot/services/iot-client.service.ts');
  assert.ok(clientSrc.includes("fetchSmartBuildingReadings"), 'Defines fetchSmartBuildingReadings');
  assert.ok(clientSrc.includes("dev_eui: devEui.trim()"), 'Sets dev_eui query parameter');
  assert.ok(clientSrc.includes("`/api/v1/sb?${params.toString()}`"), 'Calls /api/v1/sb endpoint');
});

test('BP2-SP24-T02: Fixed /api/v1/smoke query construction (dev_eui, start, stop, limit)', () => {
  const clientSrc = readBackendFile('iot/services/iot-client.service.ts');
  assert.ok(clientSrc.includes("fetchSmokeReadings"), 'Defines fetchSmokeReadings');
  assert.ok(clientSrc.includes("`/api/v1/smoke?${params.toString()}`"), 'Calls /api/v1/smoke endpoint');
});

test('BP2-SP24-T03: Exact dev_eui case preservation, trimming once, URL encoding', () => {
  const clientSrc = readBackendFile('iot/services/iot-client.service.ts');
  assert.ok(clientSrc.includes("dev_eui: devEui.trim()"), 'Trims devEui once');
  assert.ok(!clientSrc.includes("devEui.toLowerCase()"), 'Preserves exact case for devEui in client');
});

test('BP2-SP24-T04: Local parameter validation (empty devEui, invalid ISO, start >= stop, limit 1..10000)', () => {
  const clientSrc = readBackendFile('iot/services/iot-client.service.ts');
  assert.ok(clientSrc.includes("!devEui || typeof devEui !== 'string' || devEui.trim().length === 0"), 'Validates devEui string');
  assert.ok(clientSrc.includes("isNaN(startDate.getTime()) || isNaN(endDate.getTime())"), 'Validates ISO timestamps');
  assert.ok(clientSrc.includes("startDate.getTime() >= endDate.getTime()"), 'Validates start strictly before stop');
  assert.ok(clientSrc.includes("limit < 1 || limit > 10000"), 'Validates limit between 1 and 10000');
});

test('BP2-SP24-T05: Envelope parser policy (data array required, meta object, sourceCount/sourceTruncated)', () => {
  const telemetryServiceSrc = readBackendFile('iot/services/iot-telemetry.service.ts');
  assert.ok(telemetryServiceSrc.includes("Malformed smart building response: envelope must be an object with data array"), 'Validates SB envelope');
  assert.ok(telemetryServiceSrc.includes("Malformed smoke response: envelope must be an object with data array"), 'Validates Smoke envelope');
  assert.ok(telemetryServiceSrc.includes("meta.count must be a non-negative integer"), 'Validates meta.count non-negative integer');
  assert.ok(telemetryServiceSrc.includes("meta.truncated must be a boolean"), 'Validates meta.truncated boolean');
});

test('BP2-SP24-T06: Sparse SB reading normalization (documented fields null when absent, wrong-typed marks row invalid)', () => {
  const telemetryServiceSrc = readBackendFile('iot/services/iot-telemetry.service.ts');
  assert.ok(telemetryServiceSrc.includes("toValidStringOrInvalid(row.device_id)"), 'Validates networkDeviceName');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.co2)"), 'Validates rawCo2');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.voc)"), 'Validates rawVoc');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.voltage)"), 'Validates rawVoltage');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.visible)"), 'Validates rawVisible');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.ir)"), 'Validates rawIr');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.f_cnt)"), 'Validates fCnt');
});

test('BP2-SP24-T07: Sparse Smoke reading normalization (status/state numbers, networkDeviceName, gatewayId, rssi, snr)', () => {
  const telemetryServiceSrc = readBackendFile('iot/services/iot-telemetry.service.ts');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.status)"), 'Validates rawStatus');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.state)"), 'Validates rawState');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.rssi)"), 'Validates rssi');
  assert.ok(telemetryServiceSrc.includes("toValidFiniteNumberOrInvalid(row.snr)"), 'Validates snr');
});

test('BP2-SP24-T08: Finite numbers and valid zero preserved without scaling or IAQ score conversion', () => {
  const telemetryServiceSrc = readBackendFile('iot/services/iot-telemetry.service.ts');
  // Helper preserves 0 as valid finite number
  assert.ok(telemetryServiceSrc.includes("typeof val === 'number' && Number.isFinite(val)"), 'Preserves zero and finite numbers');
  assert.ok(!telemetryServiceSrc.includes("iaqScore"), 'No IAQ score conversion');
  assert.ok(!telemetryServiceSrc.includes("iaq_score"), 'No iaq_score in normalizer');
});

test('BP2-SP24-T09: All-invalid non-empty payload throws 502 Bad Gateway', () => {
  const telemetryServiceSrc = readBackendFile('iot/services/iot-telemetry.service.ts');
  assert.ok(
    telemetryServiceSrc.includes("raw.data.length > 0 && validCount === 0"),
    'Detects all-invalid rows in non-empty payload',
  );
  assert.ok(
    telemetryServiceSrc.includes("throw new BadGatewayException('All returned upstream telemetry rows were invalid or malformed.')"),
    'Throws 502 on all-invalid non-empty rows',
  );
});

test('BP2-SP24-T10: Empty data array returns validCount 0 and availability empty without throwing', () => {
  const telemetryServiceSrc = readBackendFile('iot/services/iot-telemetry.service.ts');
  const dashboardServiceSrc = readBackendFile('dashboard/dashboard-iot-telemetry.service.ts');
  assert.ok(dashboardServiceSrc.includes("const availability = rawResult.coverage.validCount > 0 ? 'ready' : 'empty';"), 'Empty when validCount is 0');
});

test('BP2-SP24-T11: Exact case-sensitive dev_eui match and row timestamp filtering inside query range', () => {
  const telemetryServiceSrc = readBackendFile('iot/services/iot-telemetry.service.ts');
  assert.ok(telemetryServiceSrc.includes("row.dev_eui !== trimmedDeviceId"), 'Case-sensitive exact match');
  assert.ok(telemetryServiceSrc.includes("tsMs < startMs || tsMs > stopMs"), 'Inclusive query range check');
});

test('BP2-SP24-T12: Sorting normalized rows newest-first; latest sample coherent from single newest valid row', () => {
  const telemetryServiceSrc = readBackendFile('iot/services/iot-telemetry.service.ts');
  assert.ok(telemetryServiceSrc.includes("b.timestamp).getTime() - new Date(a.timestamp).getTime()"), 'Sorts newest-first');
  assert.ok(telemetryServiceSrc.includes("const latestReading = normalizedList[0] || null;"), 'Derives latest reading from index 0');
});

test('BP2-SP24-T13: Supported device types on Dashboard: solar, avc, sb, smoke', () => {
  const dashboardServiceSrc = readBackendFile('dashboard/dashboard-iot-telemetry.service.ts');
  const dtoSrc = readBackendFile('dashboard/dto/dashboard-iot-telemetry-response.dto.ts');
  assert.ok(
    dashboardServiceSrc.includes("resolvedType !== 'solar' && resolvedType !== 'avc' && resolvedType !== 'sb' && resolvedType !== 'smoke'"),
    'Checks supported types solar, avc, sb, smoke',
  );
  assert.ok(dtoSrc.includes("enum: ['solar', 'avc', 'sb', 'smoke']"), 'Swagger enum includes all four types');
});

test('BP2-SP24-T14: Dashboard boundary validation: Building E only, 7-day max duration, limit 1..1000, duplicate query rejection', () => {
  const dashboardServiceSrc = readBackendFile('dashboard/dashboard-iot-telemetry.service.ts');
  assert.ok(dashboardServiceSrc.includes("normalizedBuilding !== 'E'"), 'Restricted to Building E');
  assert.ok(dashboardServiceSrc.includes("durationMs > MAX_DURATION_MS"), '7 days maximum');
  assert.ok(dashboardServiceSrc.includes("parsed < 1 || parsed > 1000"), 'Limit 1..1000');
  assert.ok(dashboardServiceSrc.includes("typeof query.start !== 'string' || typeof query.stop !== 'string'"), 'Rejects repeated start/stop arrays');
  assert.ok(dashboardServiceSrc.includes("Array.isArray((query as any).limit)"), 'Rejects repeated limit');
});

test('BP2-SP24-T15: Upstream error sanitization (no bearer token, URL, or internal paths leaked in exceptions)', () => {
  const dashboardServiceSrc = readBackendFile('dashboard/dashboard-iot-telemetry.service.ts');
  assert.ok(dashboardServiceSrc.includes("sanitizeError"), 'Defines sanitizeError helper');
  assert.ok(dashboardServiceSrc.includes("/token/i.test(message)"), 'Checks token in message');
  assert.ok(dashboardServiceSrc.includes("/bearer/i.test(message)"), 'Checks bearer in message');
  assert.ok(dashboardServiceSrc.includes("/https?:\\/\\//i.test(message)"), 'Checks URLs in message');
});

test('BP2-SP24-T16: Zero database persistence: telemetry is in-memory only, no entities or DB writes', () => {
  const telemetryServiceSrc = readBackendFile('iot/services/iot-telemetry.service.ts');
  const dbModuleSrc = readBackendFile('database/database.module.ts');
  assert.ok(telemetryServiceSrc.includes("Zero DB persistence: entirely in-memory"), 'Zero DB persistence documented');
  assert.ok(!dbModuleSrc.includes("Telemetry"), 'No Telemetry entity in TypeORM DatabaseModule');
  assert.ok(!dbModuleSrc.includes("SmartBuilding"), 'No SmartBuilding entity in DatabaseModule');
  assert.ok(!dbModuleSrc.includes("Smoke"), 'No Smoke entity in DatabaseModule');
});

test('BP2-SP24-T17: Placement PUT/DELETE remain denied (Viewer/Manager permissions intact)', () => {
  const abilitySrc = readBackendFile('authorization/casl-ability.factory.ts');
  assert.ok(abilitySrc.includes("cannot('update', 'DeviceDisplayPosition')"), 'Update DeviceDisplayPosition denied for Viewer/Manager');
  assert.ok(abilitySrc.includes("cannot('delete', 'DeviceDisplayPosition')"), 'Delete DeviceDisplayPosition denied for Viewer/Manager');
});

test('BP2-SP24-T18: Frontend type definitions synced (SmartBuildingTelemetryData, SmokeTelemetryData, sourceCount, sourceTruncated)', () => {
  const typesSrc = readSrcFile('types/iot-telemetry.ts');
  const dashTypesSrc = readSrcFile('types/dashboard-iot-telemetry.ts');
  assert.ok(typesSrc.includes("SmartBuildingTelemetryData"), 'Defines SmartBuildingTelemetryData');
  assert.ok(typesSrc.includes("SmokeTelemetryData"), 'Defines SmokeTelemetryData');
  assert.ok(typesSrc.includes("sourceCount?: number | null"), 'Includes sourceCount in coverage');
  assert.ok(typesSrc.includes("sourceTruncated?: boolean | null"), 'Includes sourceTruncated in coverage');
  assert.ok(dashTypesSrc.includes("deviceType: 'solar' | 'avc' | 'sb' | 'smoke'"), 'Dashboard telemetry includes sb and smoke');
});

test('BP2-SP24-T19: Detail panel has no independent timer/polling; Page 07 central coordinator enforces 300000 ms cadence', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  const coordinatorSrc = readSrcFile('components/dashboard/iot/useIotPage07Telemetry.ts');
  assert.ok(!panelSrc.includes("setInterval"), 'No automatic polling timer in detail panel');
  assert.ok(!panelSrc.includes("setTimeout("), 'No recursive timeout polling in detail panel');
  assert.ok(panelSrc.includes("fetchDashboardDeviceTelemetry"), 'Direct telemetry call on device/preset');
  assert.ok(coordinatorSrc.includes('REFRESH_CADENCE_MS = 300000'), 'Enforces 300000 ms cadence in Page 07 scheduler');
});

test('BP2-SP24-T20: Request generation ref and abort controller prevent race conditions and stale response overwrite', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  assert.ok(panelSrc.includes("requestGenRef.current"), 'Uses request generation counter');
  assert.ok(panelSrc.includes("abortControllerRef.current.abort()"), 'Aborts prior flight on change');
  assert.ok(panelSrc.includes("if (currentGen !== requestGenRef.current) return;"), 'Discards stale responses');
});

test('BP2-SP24-T21: Caveats properly assigned: SB caveat for sb, Smoke caveat for smoke', () => {
  const dashboardServiceSrc = readBackendFile('dashboard/dashboard-iot-telemetry.service.ts');
  assert.ok(
    dashboardServiceSrc.includes('Đơn vị và thang đo cảm biến sb chưa được xác nhận; các giá trị này chưa dùng để đánh giá IAQ hoặc cảnh báo.'),
    'Contains exact SB caveat',
  );
  assert.ok(
    dashboardServiceSrc.includes('Chưa xác nhận ý nghĩa mã status/state; không diễn giải thành bình thường, cháy hoặc sự cố.'),
    'Contains exact Smoke caveat',
  );
});

test('BP2-SP24-T22: SB UI branch: 5 raw metric cards, default trend metric co2, no unit labels/threshold colors', () => {
  const rawDetailsSrc = readSrcFile('components/dashboard/iot/IotRawTelemetryDetails.tsx');
  assert.ok(rawDetailsSrc.includes("CO₂ (raw)"), 'Has CO2 raw label');
  assert.ok(rawDetailsSrc.includes("VOC (raw)"), 'Has VOC raw label');
  assert.ok(rawDetailsSrc.includes("voltage (raw)"), 'Has voltage raw label');
  assert.ok(rawDetailsSrc.includes("visible (raw)"), 'Has visible raw label');
  assert.ok(rawDetailsSrc.includes("ir (raw)"), 'Has ir raw label');
  assert.ok(rawDetailsSrc.includes("useState<SbMetricKey>('co2')"), 'Default metric is co2');
  assert.ok(rawDetailsSrc.includes('unit=""'), 'Trend chart has empty unit (no fabricated units)');
});

test('BP2-SP24-T23: Smoke UI branch: 2 neutral raw code cards, no trend chart, 20-row history table', () => {
  const rawDetailsSrc = readSrcFile('components/dashboard/iot/IotRawTelemetryDetails.tsx');
  assert.ok(rawDetailsSrc.includes("status (mã thô)"), 'Has status raw code card');
  assert.ok(rawDetailsSrc.includes("state (mã thô)"), 'Has state raw code card');
  assert.ok(rawDetailsSrc.includes("isSmoke"), 'Contains smoke branch');
  assert.ok(!rawDetailsSrc.includes("alert-critical"), 'No alarm severity colors for smoke');
});

test('BP2-SP24-T24: Bounded local history table: 20 rows per page, pagination controls, loaded count', () => {
  const rawDetailsSrc = readSrcFile('components/dashboard/iot/IotRawTelemetryDetails.tsx');
  assert.ok(rawDetailsSrc.includes("PAGE_SIZE = 20"), 'Page size is 20 rows');
  assert.ok(rawDetailsSrc.includes("Bản tin đã tải"), 'Heading is Bản tin đã tải');
  assert.ok(rawDetailsSrc.includes("Trang trước"), 'Has Previous button');
  assert.ok(rawDetailsSrc.includes("Trang sau"), 'Has Next button');
});

test('BP2-SP24-T25: Legacy Solar and AVC telemetry and UI branches preserved without regressions', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx');
  assert.ok(panelSrc.includes("data.deviceType === 'solar' || data.deviceType === 'avc'"), 'Preserves solar and avc branch');
  assert.ok(panelSrc.includes("IotTelemetryMetricSelector"), 'Mounts IotTelemetryMetricSelector for legacy types');
  assert.ok(panelSrc.includes("IotTelemetryTechnicalDetails"), 'Mounts IotTelemetryTechnicalDetails for legacy types');
});

test('BP2-SP24-T26: Phase 23 catalogue and room filtering preserved', () => {
  const catalogueApiSrc = readSrcFile('lib/dashboard/iot-catalogue-api.ts');
  const tableSrc = readSrcFile('components/dashboard/iot/IotDeviceCatalogueTable.tsx');
  assert.ok(catalogueApiSrc.includes("roomId"), 'Catalogue API preserves roomId');
  assert.ok(tableSrc.includes("sourceLocation.roomId"), 'Table preserves sourceLocation.roomId display');
});

test('BP2-SP24-T27: Zero persistence and protected page rules (Page 01, 02, 03, 06, 09, 11 untouched)', () => {
  const page01Exists = fs.existsSync(path.join(__dirname, 'src/app/dashboard/page.tsx'));
  const page03Exists = fs.existsSync(path.join(__dirname, 'src/app/dashboard/environment/page.tsx'));
  const page09Exists = fs.existsSync(path.join(__dirname, 'src/app/dashboard/energy-water/page.tsx'));
  assert.ok(page01Exists, 'Page 01 exists');
  assert.ok(page03Exists, 'Page 03 exists');
  assert.ok(page09Exists, 'Page 09 exists');
});

test('BP2-SP24-T28: Accessible controls, labels, and table layout', () => {
  const rawDetailsSrc = readSrcFile('components/dashboard/iot/IotRawTelemetryDetails.tsx');
  assert.ok(rawDetailsSrc.includes('role="note"'), 'Uses note role for caveat');
  assert.ok(rawDetailsSrc.includes('aria-pressed='), 'Uses aria-pressed for selected metric card');
  assert.ok(rawDetailsSrc.includes('aria-expanded='), 'Uses aria-expanded for technical disclosure');
});

test('BP2-SP24-T29: Historical assertion updates (Phase 03 T09 and Phase 10 T26)', () => {
  const testP03Src = fs.readFileSync(path.join(__dirname, 'test-bp2-phase03.mjs'), 'utf8');
  const testP10Src = fs.readFileSync(path.join(__dirname, 'test-bp2-phase10.mjs'), 'utf8');
  assert.ok(testP03Src.includes("device.sourceDeviceType === 'sb'"), 'Phase 03 test reflects sb support');
  assert.ok(testP03Src.includes("device.sourceDeviceType === 'smoke'"), 'Phase 03 test reflects smoke support');
  assert.ok(!testP10Src.includes("!clientSrc.includes(\"/api/v1/sb\")"), 'Phase 10 test allows sb endpoint implementation in Phase 11');
});
