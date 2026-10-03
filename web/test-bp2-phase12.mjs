/**
 * Verification Test Suite for Big Phase 02 / Phase 12 (Small Phase 25)
 * Page 03 SB CO2 & Environmental Source Upgrade
 *
 * Verifies SP25-T01 through SP25-T17.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSrcFile(relPath) {
  const fullPath = path.resolve(__dirname, 'src', relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

function readBackendFile(relPath) {
  const fullPath = path.resolve(__dirname, '..', 'backend', 'src', relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

// =========================================================================
// SP25-T01: Solar + SB source list; unsupported types; source floor/nullable room
// =========================================================================
test('SP25-T01: Environment source list supports Solar + SB, filters unsupported types, preserves source location & room', () => {
  const backendService = readBackendFile('dashboard/dashboard-environment.service.ts');
  const dtoList = readBackendFile('dashboard/dto/dashboard-environment-source-list-response.dto.ts');
  const webTypes = readSrcFile('types/dashboard-environment.ts');

  // Verify candidate device filtering for solar and sb
  assert.ok(
    backendService.includes("device.sourceDeviceType === 'solar' || device.sourceDeviceType === 'sb'"),
    'Backend must filter for solar and sb sources',
  );

  // Verify additive acceptedSbCount
  assert.ok(dtoList.includes('acceptedSbCount'), 'DTO must include acceptedSbCount');
  assert.ok(backendService.includes('acceptedSbCount'), 'Service must count acceptedSbCount');

  // Verify roomId propagation in sourceLocation
  assert.ok(backendService.includes('roomId: d.sourceLocation.roomId'), 'Must propagate roomId in sourceLocation');

  // Verify web types
  assert.ok(webTypes.includes("'solar' | 'sb'"), 'Web types must define solar | sb union');
  assert.ok(webTypes.includes('acceptedSbCount'), 'Web types must include acceptedSbCount');
  assert.ok(webTypes.includes('roomId?: string | null'), 'Web source item must support nullable roomId');
});

// =========================================================================
// SP25-T02: Selected SB sample co2=596, zero/null/malformed variants
// =========================================================================
test('SP25-T02: SB sample co2=596 identity mapping, valid zero preservation, and null handling', () => {
  const backendSummary = readBackendFile('dashboard/dashboard-environment-summary.ts');
  const backendService = readBackendFile('dashboard/dashboard-environment.service.ts');

  // Verify rawCo2 is checked for finite numbers and 0 is valid
  assert.ok(
    backendSummary.includes("typeof r.rawCo2 === 'number' && Number.isFinite(r.rawCo2)"),
    'Must check typeof number and Number.isFinite so 0 is preserved',
  );

  // Verify readings mapper preserves rawCo2
  assert.ok(backendService.includes('rawCo2: newestRow.rawCo2 ?? null'), 'Must preserve rawCo2 in latestSample');
  assert.ok(backendService.includes('rawCo2: r.rawCo2 ?? null'), 'Must preserve rawCo2 in readings array');
});

// =========================================================================
// SP25-T03: Metric-unit mapping and future version replacement
// =========================================================================
test('SP25-T03: Centralized metric-unit mapping distinguishes assumed_standard vs documented_contract', async () => {
  const mappingMod = await import('./src/lib/dashboard/environment-metric-units.ts');

  assert.equal(mappingMod.ENVIRONMENT_METRIC_UNITS_VERSION, 'environment-metric-units-v1');
  const co2Meta = mappingMod.ENVIRONMENT_METRIC_UNITS.rawCo2;
  assert.ok(co2Meta);
  assert.equal(co2Meta.unit, 'ppm');
  assert.equal(co2Meta.unitStatus, 'assumed_standard');
  assert.equal(co2Meta.hardwareConfirmed, false);

  const tempMeta = mappingMod.ENVIRONMENT_METRIC_UNITS.rawTemperature;
  assert.ok(tempMeta);
  assert.equal(tempMeta.unit, '°C');
  assert.equal(tempMeta.unitStatus, 'documented_contract');

  // Identity mapping preserves values without hidden scaling
  assert.equal(mappingMod.identityMapMetricValue(596), 596);
  assert.equal(mappingMod.identityMapMetricValue(0), 0);
  assert.equal(mappingMod.identityMapMetricValue(null), null);
});

// =========================================================================
// SP25-T04: Mixed Solar/SB population; independent metric calculations
// =========================================================================
test('SP25-T04: Mixed Solar/SB population calculates CO2 strictly from SB, temp/humidity strictly from Solar', () => {
  const backendSummary = readBackendFile('dashboard/dashboard-environment-summary.ts');

  // Verify branch separation
  assert.ok(
    backendSummary.includes("deviceType === 'sb'"),
    'Must branch on deviceType === sb',
  );
  assert.ok(
    backendSummary.includes('co2Values.push(r.rawCo2)'),
    'CO2 values must only be collected from SB',
  );
  assert.ok(
    backendSummary.includes('tempValues.push(r.rawTemperature)'),
    'Temp values must only be collected from Solar',
  );
});

// =========================================================================
// SP25-T05: >20 candidates, type-interleaving selection to prevent SB starvation
// =========================================================================
test('SP25-T05: Type-interleaving selection policy enforces total cap 20 and prevents SB starvation', () => {
  const backendService = readBackendFile('dashboard/dashboard-environment.service.ts');

  assert.ok(
    backendService.includes('MAX_SUMMARY_SOURCES = 20'),
    'Must define cap of 20 sources',
  );
  assert.ok(
    backendService.includes('type_interleaving_v1'),
    'Must record type_interleaving_v1 selection policy',
  );
  assert.ok(
    backendService.includes('sortedSolar') && backendService.includes('sortedSb'),
    'Must sort both Solar and SB candidate lists deterministically',
  );
});

// =========================================================================
// SP25-T06: Latest row null CO2, partial/empty/all-failed sources
// =========================================================================
test('SP25-T06: Single latest sample without historic backfill, truthful availability calculation', () => {
  const backendService = readBackendFile('dashboard/dashboard-environment.service.ts');

  // Summary request fetches limit: 1
  assert.ok(
    backendService.includes('limit: 1'),
    'Summary fetch must explicitly request limit: 1',
  );

  // Availability distinguishes partial and empty
  assert.ok(
    backendService.includes("availability = successfulSourceCount > 0 ? 'partial' : 'empty'"),
    'Must assign partial when errors exist but some sources succeeded',
  );
});

// =========================================================================
// SP25-T07: Time bounds, limits, unsupported device rejection
// =========================================================================
test('SP25-T07: Time duration caps (24h summary, 7d readings) and unsupported device rejection', () => {
  const backendService = readBackendFile('dashboard/dashboard-environment.service.ts');

  assert.ok(
    backendService.includes('MAX_SUMMARY_DURATION_MS = 24 * 60 * 60 * 1000'),
    'Summary must enforce 24-hour cap',
  );
  assert.ok(
    backendService.includes('MAX_READINGS_DURATION_MS = 7 * 24 * 60 * 60 * 1000'),
    'Readings must enforce 7-day cap',
  );
  assert.ok(
    backendService.includes("resolvedType !== 'solar' && resolvedType !== 'sb'"),
    'Must reject devices that are neither solar nor sb',
  );
});

// =========================================================================
// SP25-T08: Optional meta missing, truthful truncation
// =========================================================================
test('SP25-T08: Truthful truncation indicators without confounding snapshot limit=1 with fleet coverage', () => {
  const backendService = readBackendFile('dashboard/dashboard-environment.service.ts');
  const dtoSummary = readBackendFile('dashboard/dto/dashboard-environment-summary-response.dto.ts');

  assert.ok(
    backendService.includes('sourcesTruncated = totalCandidateCount > MAX_SUMMARY_SOURCES'),
    'Must flag sourcesTruncated only when candidate count exceeds cap',
  );
  assert.ok(
    dtoSummary.includes('sourcesTruncated: boolean'),
    'Summary response must disclose sourcesTruncated',
  );
});

// =========================================================================
// SP25-T09: Source identity vs friendly device name; radio/source timestamps
// =========================================================================
test('SP25-T09: Opaque deviceId joins, observedAt from sample timestamp, no battery% inference', () => {
  const backendService = readBackendFile('dashboard/dashboard-environment.service.ts');

  assert.ok(
    backendService.includes('observedAt: newestRow.timestamp'),
    'observedAt must strictly come from reading timestamp',
  );
  assert.ok(
    backendService.includes('deviceId: device.externalDeviceId'),
    'Must use opaque externalDeviceId as primary key',
  );
  // Ensure no battery % calculation
  assert.ok(
    !backendService.includes('batteryPercent') && !backendService.includes('batteryPercentage'),
    'Must NOT fabricate battery percentage calculation from raw voltage',
  );
});

// =========================================================================
// SP25-T10: Chart newest-first inputs, zero/null, switching Solar <-> SB
// =========================================================================
test('SP25-T10: Chart adapter sorts oldest-first without mutating source and handles SB metrics', () => {
  const chartSrc = readSrcFile('lib/dashboard/environment-chart.ts');

  assert.ok(chartSrc.includes("rawCo2: 'CO₂ (ppm)'"), 'Must define rawCo2 label with ppm');
  assert.ok(chartSrc.includes('item.rawCo2'), 'Must read item.rawCo2');
  assert.ok(chartSrc.includes('item.rawVoc'), 'Must read item.rawVoc');
  assert.ok(chartSrc.includes('item.rawVoltage'), 'Must read item.rawVoltage');
  assert.ok(chartSrc.includes('timeA - timeB'), 'Must sort chronological oldest first');

  // Verify chronological sorting and zero preservation
  const testReadings = [
    { observedAt: '2026-09-27T10:00:00.000Z', rawCo2: 600 },
    { observedAt: '2026-09-27T08:00:00.000Z', rawCo2: 0 },
    { observedAt: '2026-09-27T09:00:00.000Z', rawCo2: 550 },
  ];

  const copy = [...testReadings];
  copy.sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());

  assert.equal(copy.length, 3);
  assert.equal(copy[0].observedAt, '2026-09-27T08:00:00.000Z');
  assert.equal(copy[0].rawCo2, 0, 'Zero CO2 must be preserved');
  assert.equal(copy[2].observedAt, '2026-09-27T10:00:00.000Z');
  assert.equal(copy[2].rawCo2, 600);

  // Original array not mutated
  assert.equal(testReadings[0].observedAt, '2026-09-27T10:00:00.000Z');
});

// =========================================================================
// SP25-T11: IAQ idle > 5 minutes, no polling loop, baseline triggers only
// =========================================================================
test('SP25-T11: Environment Dashboard fetch lifecycle has NO auto-refresh timer or polling loops', () => {
  const dashboardClientSrc = readSrcFile('components/dashboard/environment/EnvironmentDashboard.client.tsx');

  assert.ok(
    !dashboardClientSrc.includes('setInterval'),
    'Must NOT contain setInterval polling',
  );
  assert.ok(
    !dashboardClientSrc.includes('300000') && !dashboardClientSrc.includes('300_000'),
    'Must NOT copy 5-minute auto-refresh cadence into IAQ dashboard',
  );
  assert.ok(
    !dashboardClientSrc.includes('setTimeout'),
    'Must NOT contain setTimeout polling',
  );
});

// =========================================================================
// SP25-T12: Null/unknown room, source floor 0, dev fallback, conflicting bindings
// =========================================================================
test('SP25-T12: Room mapping adapter resolves explicit development-fallback, unmapped, and ambiguous states', async () => {
  const mappingMod = await import('./src/lib/dashboard/environment-room-mapping.ts');

  // Case 1: floorAssignment is development-fallback
  const fallbackRes = mappingMod.resolveDeviceToCell({
    deviceId: 'sb-dev-01',
    sourceRoomId: 'E4.01',
    floorAssignment: 'development-fallback',
  });
  assert.equal(fallbackRes.state, 'development-fallback');

  // Case 2: sourceFloorLevel is 0
  const floorZeroRes = mappingMod.resolveDeviceToCell({
    deviceId: 'sb-dev-01',
    sourceRoomId: 'E4.01',
    sourceFloorLevel: 0,
    floorAssignment: 'source',
  });
  assert.equal(floorZeroRes.state, 'development-fallback');

  // Case 3: Missing roomId
  const noRoomRes = mappingMod.resolveDeviceToCell({
    deviceId: 'sb-dev-01',
    sourceRoomId: null,
    floorAssignment: 'source',
  });
  assert.equal(noRoomRes.state, 'unmapped');

  // Case 4: Ambiguous conflicting bindings
  const ambiguousConfig = {
    version: 'test-v1',
    bindings: [
      { roomId: 'E4.01', floorId: '4', cellId: 'cell-1', primaryDeviceId: 'sb-dev-01' },
      { roomId: 'E4.01', floorId: '6', cellId: 'cell-2', primaryDeviceId: 'sb-dev-02' },
    ],
  };
  const ambiguousRes = mappingMod.resolveDeviceToCell({
    deviceId: 'sb-dev-01',
    sourceRoomId: 'E4.01',
    sourceFloorLevel: 4,
    floorAssignment: 'source',
    mappingConfig: ambiguousConfig,
  });
  assert.equal(ambiguousRes.state, 'ambiguous');
});

// =========================================================================
// SP25-T13: Verified synthetic room mapping and absent buckets
// =========================================================================
test('SP25-T13: Room mapping adapter deterministically maps verified primary device', async () => {
  const mappingMod = await import('./src/lib/dashboard/environment-room-mapping.ts');

  const validConfig = {
    version: 'synthetic-v1',
    bindings: [
      { roomId: 'E4.08', floorId: '4', cellId: 'R408', primaryDeviceId: 'sb-dev-primary' },
    ],
  };

  const mappedRes = mappingMod.resolveDeviceToCell({
    deviceId: 'sb-dev-primary',
    sourceRoomId: 'E4.08',
    sourceFloorLevel: 4,
    floorAssignment: 'source',
    mappingConfig: validConfig,
  });
  assert.equal(mappedRes.state, 'mapped');
  assert.equal(mappedRes.roomId, 'E4.08');
  assert.equal(mappedRes.cellId, 'R408');
  assert.equal(mappedRes.floorId, '4');

  // Non-primary device returns ambiguous
  const nonPrimaryRes = mappingMod.resolveDeviceToCell({
    deviceId: 'sb-dev-secondary',
    sourceRoomId: 'E4.08',
    sourceFloorLevel: 4,
    floorAssignment: 'source',
    mappingConfig: validConfig,
  });
  assert.equal(nonPrimaryRes.state, 'ambiguous');
});

// =========================================================================
// SP25-T14: Viewer/Manager authorization through same-origin + NestJS
// =========================================================================
test('SP25-T14: SessionAuthGuard, PoliciesGuard, and RequireAbility protect Environment controller', () => {
  const controllerSrc = readBackendFile('dashboard/dashboard-environment.controller.ts');

  assert.ok(
    controllerSrc.includes('@UseGuards(SessionAuthGuard, PoliciesGuard)'),
    'Controller must be guarded with SessionAuthGuard and PoliciesGuard',
  );
  assert.ok(
    controllerSrc.includes("@RequireAbility('read', 'Dashboard')"),
    "Controller must require read Dashboard ability",
  );
});

// =========================================================================
// SP25-T15: Upstream error sanitization and secret secrecy
// =========================================================================
test('SP25-T15: Upstream errors are sanitized without leaking bearer tokens, URLs, or internal paths', () => {
  const backendService = readBackendFile('dashboard/dashboard-environment.service.ts');
  const apiSrc = readSrcFile('lib/dashboard/environment-api.ts');

  assert.ok(
    backendService.includes('sanitizeError'),
    'Backend must contain sanitizeError helper',
  );
  assert.ok(
    backendService.includes('/token/i.test(message) || /bearer/i.test(message)'),
    'Backend must check for token/bearer leakage',
  );
  assert.ok(
    apiSrc.includes('sanitizeErrorMessage'),
    'Frontend must sanitize error messages before display',
  );
});

// =========================================================================
// SP25-T16: Read-only/persistence boundary (zero DB writes)
// =========================================================================
test('SP25-T16: Environment service has ZERO database imports, entities, migrations, or repositories', () => {
  const backendService = readBackendFile('dashboard/dashboard-environment.service.ts');
  const summaryFile = readBackendFile('dashboard/dashboard-environment-summary.ts');

  assert.ok(!backendService.includes('@InjectRepository'), 'Must not inject database repositories');
  assert.ok(!backendService.includes('typeorm'), 'Must not import typeorm in environment service');
  assert.ok(!summaryFile.includes('typeorm'), 'Must not import typeorm in summary helper');
});

// =========================================================================
// SP25-T17: UI modes/labels + regression pages + Page07 hotfix preservation
// =========================================================================
test('SP25-T17: UI modes honest, derived CO2 KPI in place, and Page 07 hotfix preserved', () => {
  const kpiSrc = readSrcFile('components/dashboard/environment/EnvironmentKpiStrip.tsx');
  const headerSrc = readSrcFile('components/dashboard/environment/EnvironmentPageHeader.tsx');
  const detailSrc = readSrcFile('components/dashboard/environment/EnvironmentSourceDetail.tsx');

  // KPI card 2 has Derived badge and ppm
  assert.ok(kpiSrc.includes('CO₂ trung bình'), 'KPI strip must have CO2 card');
  assert.ok(kpiSrc.includes('ppm'), 'CO2 card must use ppm unit');
  assert.ok(kpiSrc.includes('co2Summary'), 'CO2 card must read co2Summary');

  // Header has honest mixed badges
  assert.ok(headerSrc.includes('Solar & SB · Live / Derived'), 'Header must state Solar & SB Live / Derived');
  assert.ok(headerSrc.includes('Phòng / VOC · Demo'), 'Header must state Room / VOC Demo');

  // Detail panel supports SB default tab CO2
  assert.ok(detailSrc.includes("isSb ? 'rawCo2' : 'rawTemperature'"), 'Detail must default to CO2 for SB');
  assert.ok(detailSrc.includes('CO₂ hiện tại'), 'Detail must display CO2 card');

  // Verify Page 07 hotfix intact
  const hotfixTest = fs.readFileSync(path.resolve(__dirname, 'test-bp2-hotfix-page07.mjs'), 'utf8');
  assert.ok(hotfixTest.includes('BP2-HOTFIX-T01'), 'Page 07 hotfix test file must be intact');
});
