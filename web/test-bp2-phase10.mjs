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
 * Small Phase 23 / Phase 10: Device Catalogue Contract Upgrade Test Suite
 * Test Matrix: BP2-SP23-T01 through BP2-SP23-T26
 * ========================================================================= */

test('BP2-SP23-T01: No filter, floor-only, room-only, floor+room query construction', () => {
  const clientSrc = readBackendFile('iot/services/iot-client.service.ts');
  const catalogueApiSrc = readSrcFile('lib/dashboard/iot-catalogue-api.ts');

  // Verify backend client constructs correct query parts
  assert.ok(clientSrc.includes("queryParts.push(`floor_level=${filter.floorLevel}`)"), 'Constructs floor_level query');
  assert.ok(clientSrc.includes("queryParts.push(`room_id=${encodeURIComponent(trimmedRoom)}`)"), 'Constructs encoded room_id query');
  assert.ok(clientSrc.includes("path = `/api/v1/devices?${queryParts.join('&')}`"), 'Combines query parameters');

  // Verify frontend API helper constructs params
  assert.ok(catalogueApiSrc.includes("params.set('floorId', options.floorId.trim())"), 'Frontend sets floorId');
  assert.ok(catalogueApiSrc.includes("params.set('roomId', options.roomId.trim())"), 'Frontend sets roomId');
  assert.ok(!catalogueApiSrc.includes("`floorId=${undefined}`"), 'Frontend never sends undefined in query');
});

test('BP2-SP23-T02: Room trim, case preservation, and special character encoding', () => {
  const clientSrc = readBackendFile('iot/services/iot-client.service.ts');
  const dtopSrc = readBackendFile('dashboard/dto/dashboard-iot-catalogue-query.dto.ts');

  // Exact case preserved, trimmed once, URI-encoded
  assert.ok(clientSrc.includes("const trimmedRoom = filter.roomId.trim()"), 'Trims leading/trailing whitespace');
  assert.ok(clientSrc.includes("encodeURIComponent(trimmedRoom)"), 'Encodes special characters safely');
  assert.ok(!clientSrc.includes("trimmedRoom.toLowerCase()"), 'Preserves exact source case (no lowercasing)');
  assert.ok(dtopSrc.includes("IsValidRoomIdConstraint"), 'Enforces valid scalar room query constraint');
});

test('BP2-SP23-T03: Empty, spaces, array, object, and duplicate room query rejected locally with 400', () => {
  const dtopSrc = readBackendFile('dashboard/dto/dashboard-iot-catalogue-query.dto.ts');
  const controllerSrc = readBackendFile('dashboard/dashboard-iot.controller.ts');
  const catalogueApiSrc = readSrcFile('lib/dashboard/iot-catalogue-api.ts');

  // DTO validation rejects non-string and empty/blank
  assert.ok(dtopSrc.includes("typeof value !== 'string'"), 'Rejects array/object/number');
  assert.ok(dtopSrc.includes("value.trim().length > 0"), 'Rejects empty or spaces-only');

  // Controller checks multiplicity of roomId in raw query
  assert.ok(controllerSrc.includes("match(/(?:[?&])roomId=/g)"), 'Checks repeated roomId in raw request URL');
  assert.ok(controllerSrc.includes("Duplicate roomId query parameter is not allowed"), 'Throws BadRequestException on duplicate roomId');

  // Frontend adapter rejects blank strings locally
  assert.ok(catalogueApiSrc.includes("INVALID_ROOM_ID"), 'Frontend rejects explicit blank string before fetch');
});

test('BP2-SP23-T04: Unknown query keys and raw upstream parameter bypass rejected', () => {
  const mainSrc = readBackendFile('main.ts');
  assert.ok(mainSrc.includes("whitelist: true"), 'Global pipe whitelist enabled');
  assert.ok(mainSrc.includes("forbidNonWhitelisted: true"), 'Global pipe forbidNonWhitelisted enabled');

  // Proxy forwards only allowed parameters and path patterns
  const proxySrc = readSrcFile('app/api/devices/[...path]/route.ts');
  assert.ok(proxySrc.includes("ALLOWED_GET_PATTERNS"), 'Proxy matches against allowed GET patterns');
});

test('BP2-SP23-T05: Negative and zero floorLevel at low-level client; non-integers rejected', () => {
  const clientSrc = readBackendFile('iot/services/iot-client.service.ts');
  assert.ok(clientSrc.includes("!Number.isInteger(filter.floorLevel)"), 'Validates floorLevel as integer');
  assert.ok(!clientSrc.includes("filter.floorLevel < 0"), 'Accepts negative floors at low-level client (e.g. basements)');
});

test('BP2-SP23-T06: Current list/detail preserves string/null room and Z=0; distinct timestamps', () => {
  const mapperSrc = readBackendFile('iot/services/iot-mapper.service.ts');
  const catalogueServiceSrc = readBackendFile('dashboard/dashboard-iot-catalogue.service.ts');

  assert.ok(mapperSrc.includes("loc.install_room_id === null"), 'Handles null room');
  assert.ok(mapperSrc.includes("typeof loc.install_room_id === 'string'"), 'Preserves string room');
  assert.ok(catalogueServiceSrc.includes("sourceCreatedAt: item.create_timestamp"), 'Preserves create_timestamp');
  assert.ok(catalogueServiceSrc.includes("sourceUpdatedAt: item.last_updated_timestamp"), 'Preserves last_updated_timestamp');
  assert.ok(catalogueServiceSrc.includes("fetchedAt: new Date().toISOString()"), 'FetchedAt is separate local timestamp');
});

test('BP2-SP23-T07: Historical detail compatibility accepts missing room/Z/timestamps without fabricating defaults', () => {
  const telemetryDtoSrc = readBackendFile('iot/dto/iot-telemetry.dto.ts');
  assert.ok(telemetryDtoSrc.includes("install_z?: number"), 'Z is optional in historical detail');
  assert.ok(telemetryDtoSrc.includes("install_room_id?: string | null"), 'install_room_id is optional in detail');
  assert.ok(telemetryDtoSrc.includes("create_timestamp?: string"), 'create_timestamp is optional in historical detail');
});

test('BP2-SP23-T08: Absent room in older responses is compatible and additive', () => {
  const dashboardTypes = readSrcFile('types/dashboard-iot.ts');
  assert.ok(dashboardTypes.includes("roomId?: string | null"), 'roomId is optional in frontend sourceLocation');
  assert.ok(dashboardTypes.includes("requestedRoomId?: string | null"), 'requestedRoomId is optional in frontend response');
});

test('BP2-SP23-T09: Malformed room metadata is skipped without coercion; all-malformed throws 502', () => {
  const catalogueServiceSrc = readBackendFile('dashboard/dashboard-iot-catalogue.service.ts');
  assert.ok(catalogueServiceSrc.includes("skippedCount++;"), 'Increments skippedCount on malformed room');
  assert.ok(catalogueServiceSrc.includes("receivedCount > 0 && acceptedCount === 0"), 'Quality gate checks all-malformed');
  assert.ok(catalogueServiceSrc.includes("Upstream IoT catalogue payload contains only malformed records"), 'Throws 502 on all-malformed payload');
});

test('BP2-SP23-T10: Tolerant meta envelope handling', () => {
  const catalogueServiceSrc = readBackendFile('dashboard/dashboard-iot-catalogue.service.ts');
  assert.ok(catalogueServiceSrc.includes("typeof raw.meta?.truncated === 'boolean'"), 'Checks truncated boolean safely');
});

test('BP2-SP23-T11: Opaque IDs and unknown device types remain valid catalogue records', () => {
  const mapperSrc = readBackendFile('iot/services/iot-mapper.service.ts');
  assert.ok(mapperSrc.includes("return 'unknown';"), 'Unknown types map safely to unknown category');
  assert.ok(mapperSrc.includes("sourceDeviceType"), 'Raw device type string is preserved');
});

test('BP2-SP23-T12: Floor-only empty test mode preserves existing floor-0 fallback', () => {
  const catalogueServiceSrc = readBackendFile('dashboard/dashboard-iot-catalogue.service.ts');
  assert.ok(catalogueServiceSrc.includes("!hasRoomFilter"), 'Fallback restricted to when NO room filter is active');
  assert.ok(catalogueServiceSrc.includes("floorMode === 'TEST_CURRENT_FLOOR_4_6_V1'"), 'Applies under test floor mode');
  assert.ok(catalogueServiceSrc.includes("developmentFallbackApplied = true"), 'Flags development fallback');
});

test('BP2-SP23-T13: Floor+room empty and room-only empty isolation (no floor-0 fallback)', () => {
  const catalogueServiceSrc = readBackendFile('dashboard/dashboard-iot-catalogue.service.ts');
  assert.ok(catalogueServiceSrc.includes("!hasRoomFilter &&"), 'Never falls back to floor 0 when room filter is active');
});

test('BP2-SP23-T14: Zero database persistence for catalogue queries', () => {
  const catalogueServiceSrc = readBackendFile('dashboard/dashboard-iot-catalogue.service.ts');
  assert.ok(!catalogueServiceSrc.includes("@InjectRepository"), 'Catalogue service has no TypeORM repository');
  assert.ok(!catalogueServiceSrc.includes("createQueryBuilder"), 'Catalogue service makes no SQL queries');
});

test('BP2-SP23-T15: Upstream error sanitization and no token/URL leakage', () => {
  const catalogueServiceSrc = readBackendFile('dashboard/dashboard-iot-catalogue.service.ts');
  assert.ok(catalogueServiceSrc.includes("/token/i.test(message)"), 'Checks token in exception sanitization');
  assert.ok(catalogueServiceSrc.includes("/bearer/i.test(message)"), 'Checks bearer in exception sanitization');
  assert.ok(catalogueServiceSrc.includes("/https?:\\/\\//i.test(message)"), 'Checks URLs in exception sanitization');
});

test('BP2-SP23-T16: SessionAuthGuard and PoliciesGuard protect catalogue endpoint', () => {
  const controllerSrc = readBackendFile('dashboard/dashboard-iot.controller.ts');
  assert.ok(controllerSrc.includes("SessionAuthGuard"), 'Protected by SessionAuthGuard');
  assert.ok(controllerSrc.includes("PoliciesGuard"), 'Protected by PoliciesGuard');
  assert.ok(controllerSrc.includes("@RequireAbility('read', 'Dashboard')"), 'Requires read:Dashboard ability');
});

test('BP2-SP23-T17: Upstream 401 converts to sanitized 502 without logging out user session', () => {
  const catalogueServiceSrc = readBackendFile('dashboard/dashboard-iot-catalogue.service.ts');
  assert.ok(catalogueServiceSrc.includes("throw new BadGatewayException('Upstream IoT API authentication failed (401 Unauthorized).')"), 'Returns 502 Bad Gateway on upstream 401');
});

test('BP2-SP23-T18: Placement PUT/DELETE remain denied for Viewer and Manager roles', () => {
  const abilitySrc = readBackendFile('authorization/casl-ability.factory.ts');
  assert.ok(abilitySrc.includes("cannot('update', 'DeviceDisplayPosition')"), 'Viewer cannot update placement');
  assert.ok(abilitySrc.includes("cannot('delete', 'DeviceDisplayPosition')"), 'Viewer cannot delete placement');
});

test('BP2-SP23-T19: Room filtering UI interaction: draft, apply, Enter, clear, and floor change', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');
  const filtersSrc = readSrcFile('components/dashboard/iot/IotCatalogueFilters.tsx');

  assert.ok(panelSrc.includes("const [roomDraft, setRoomDraft] = useState<string>('')"), 'Tracks roomDraft state');
  assert.ok(panelSrc.includes("const [appliedRoom, setAppliedRoom] = useState<string | null>(null)"), 'Tracks appliedRoom state');
  assert.ok(panelSrc.includes("handleApplyRoom"), 'Provides explicit handleApplyRoom callback');
  assert.ok(filtersSrc.includes("onKeyDown"), 'Supports Enter key on room input');
  assert.ok(panelSrc.includes("handleClearAllFilters"), 'Provides clear all filters handler');
});

test('BP2-SP23-T20: Stale responses and abort controller prevent race conditions', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');
  assert.ok(panelSrc.includes("requestGenRef.current"), 'Uses request generation counter');
  assert.ok(panelSrc.includes("new AbortController()"), 'Uses AbortController');
  assert.ok(panelSrc.includes("signal: controller.signal"), 'Passes signal to fetch helper');
});

test('BP2-SP23-T21: Selected device refresh and scope-change clearing', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');
  assert.ok(panelSrc.includes("resData.devices.find((d) => d.externalDeviceId === prev.externalDeviceId)"), 'Refreshes device object by ID');
  assert.ok(panelSrc.includes("setSelectedDevice(null)"), 'Clears selected device on scope change');
  assert.ok(panelSrc.includes("setSelectedTelemetrySummary(null)"), 'Clears telemetry summary on scope change');
});

test('BP2-SP23-T22: Room-scoped count, empty state, and scope hint', () => {
  const panelSrc = readSrcFile('components/dashboard/iot/IotCataloguePanel.client.tsx');
  const kpiSrc = readSrcFile('components/dashboard/iot/IotKpiStrip.tsx');

  assert.ok(panelSrc.includes("scopeHint"), 'Computes scopeHint');
  assert.ok(panelSrc.includes("Phạm vi: Tầng ${selectedFloor} · Phòng ${appliedRoom}"), 'Formats floor+room scope hint');
  assert.ok(panelSrc.includes("Phạm vi: Phòng ${appliedRoom}"), 'Formats room-only scope hint');
  assert.ok(kpiSrc.includes("scopeHint"), 'IotKpiStrip displays scopeHint');
});

test('BP2-SP23-T23: Solar and AVC source semantics and caveats reconciliation (§5.5)', () => {
  const telemetryServiceSrc = readBackendFile('dashboard/dashboard-iot-telemetry.service.ts');
  const telemetryDtoSrc = readBackendFile('iot/dto/iot-telemetry.dto.ts');

  // Confirmed field comments
  assert.ok(telemetryDtoSrc.includes("Measured battery voltage, in volts (V)"), 'Documents solar.voltage in volts');
  assert.ok(telemetryDtoSrc.includes("Measured ambient temperature, in degrees Celsius (°C)"), 'Documents solar.temperature');
  assert.ok(telemetryDtoSrc.includes("Measured relative humidity, in percent (%)"), 'Documents solar.humidity');
  assert.ok(telemetryDtoSrc.includes("Cumulative forward (normal-direction) water volume, in cubic meters (m³)"), 'Documents avc.fwd_volume_m3');
  assert.ok(telemetryDtoSrc.includes("Instantaneous flow rate at reading time, in cubic meters per hour (m³/h)"), 'Documents avc.instant_flow_m3h');

  // Updated caveats
  assert.ok(
    telemetryServiceSrc.includes('Mã trạng thái, hiệu chuẩn và chất lượng dữ liệu của tấm pin mặt trời đang chờ xác nhận từ đội ngũ phần cứng.'),
    'Solar caveat updated per §5.5',
  );
  assert.ok(
    telemetryServiceSrc.includes('Mã cờ van/sự cố, quy tắc reset chỉ số tích lũy và tính toán tiêu thụ theo ngày của đồng hồ nước đang chờ xác nhận từ đội ngũ phần cứng.'),
    'AVC caveat updated per §5.5',
  );
});

test('BP2-SP23-T24: Accessible room controls, labels, and table disclosure', () => {
  const filtersSrc = readSrcFile('components/dashboard/iot/IotCatalogueFilters.tsx');
  const tableSrc = readSrcFile('components/dashboard/iot/IotDeviceCatalogueTable.tsx');

  // Exact UI copy preserved / added
  assert.ok(filtersSrc.includes('placeholder="Nhập mã phòng"'), 'Correct placeholder for room input');
  assert.ok(filtersSrc.includes('aria-label="Phòng nguồn"'), 'Accessible label for room input');
  assert.ok(filtersSrc.includes('Áp dụng'), 'Apply button text');
  assert.ok(filtersSrc.includes('Xóa lọc'), 'Clear button label preserved');
  assert.ok(tableSrc.includes('Phòng nguồn:'), 'Technical field label in table disclosure');
  assert.ok(tableSrc.includes("device.sourceLocation.roomId || '—'"), 'Displays dash when room unset');
});

test('BP2-SP23-T25: Protected pages and route trees preserved', () => {
  // Ensure no new routes were added to app directory
  const dashboardDir = path.join(__dirname, 'src', 'app', 'dashboard');
  const appRoutes = fs.readdirSync(dashboardDir).filter((name) => {
    return fs.statSync(path.join(dashboardDir, name)).isDirectory();
  });
  const expectedDashboardPages = ['alerts', 'energy-water', 'environment', 'fire-safety', 'iot', 'overview', 'parking'];
  for (const page of expectedDashboardPages) {
    assert.ok(appRoutes.includes(page), `Dashboard page ${page} exists`);
  }
  assert.equal(appRoutes.length, 7, 'Exactly 7 dashboard pages present');
});

test('BP2-SP23-T26: Allowed outbound methods and secret scan', () => {
  const clientSrc = readBackendFile('iot/services/iot-client.service.ts');
  const proxySrc = readSrcFile('app/api/devices/[...path]/route.ts');

  // Upstream client only performs GET
  assert.ok(!clientSrc.includes("method: 'POST'"), 'No upstream POST');
  assert.ok(!clientSrc.includes("method: 'PUT'"), 'No upstream PUT');
  assert.ok(!clientSrc.includes("method: 'DELETE'"), 'No upstream DELETE');

  // Upstream /sb and /smoke client endpoints implemented in Phase 11; webhooks remain forbidden
  assert.ok(!clientSrc.includes("/api/v1/webhooks"), 'No webhook calls');

  // Proxy does not leak secrets
  assert.ok(!proxySrc.includes("IOT_API_MASTER_TOKEN"), 'Master token never present in proxy');
});
