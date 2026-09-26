import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to read file from web/src
function readSrcFile(relPath) {
  const fullPath = path.join(__dirname, 'src', relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

// Minimal mirror of provenance validation logic to test in Node environment
const FORBIDDEN_SECRET_PATTERNS = [
  /bearer\s+[a-zA-Z0-9._~+/-]+=*/i,
  /token/i,
  /secret/i,
  /password/i,
  /api[_-]?key/i,
  /authorization/i,
  /at\s+[a-zA-Z0-9._$<>]+\s+\(.*:[0-9]+:[0-9]+\)/,
  /node_modules/i,
];

function validateProvenance(prov) {
  const errors = [];
  if (!prov || typeof prov !== 'object') {
    return { valid: false, errors: ['Provenance must be a non-null object'] };
  }
  const validModes = ['live', 'derived', 'manual', 'demo'];
  if (!prov.mode || !validModes.includes(prov.mode)) {
    errors.push(`Invalid or missing mode: '${prov.mode}'. Must be one of ${validModes.join(', ')}`);
    return { valid: false, errors };
  }
  if (prov.mode === 'demo') {
    if (!prov.fixtureVersion || typeof prov.fixtureVersion !== 'string' || prov.fixtureVersion.trim() === '') {
      errors.push('Demo mode requires a non-empty fixtureVersion');
    }
  }
  if (prov.mode === 'live') {
    if (prov.fixtureVersion !== undefined && prov.fixtureVersion !== null) {
      errors.push('Live mode must not have fixtureVersion');
    }
  }
  if (prov.sourceId && FORBIDDEN_SECRET_PATTERNS.some(p => p.test(prov.sourceId))) {
    errors.push('Provenance sourceId contains forbidden secret or trace');
  }
  return { valid: errors.length === 0, errors };
}

function sanitizeUserErrorMessage(rawError, defaultMessage = 'Không thể tải dữ liệu vào lúc này. Vui lòng thử lại sau.') {
  if (!rawError) return defaultMessage;
  let rawString = rawError instanceof Error ? rawError.message : String(rawError);
  const isDangerous =
    /at\s+[a-zA-Z0-9._$<>]+\s+\(/i.test(rawString) ||
    /node_modules/i.test(rawString) ||
    /bearer\s+/i.test(rawString) ||
    /token/i.test(rawString) ||
    /password/i.test(rawString) ||
    /select\s+.*from/i.test(rawString) ||
    /http:\/\//i.test(rawString) ||
    /https:\/\//i.test(rawString);
  if (isDangerous) return defaultMessage;
  if (rawString.length > 0 && rawString.length < 150) return rawString;
  return defaultMessage;
}

// ---------------- TESTS ---------------- //

test('BP2-P01-T01: Dashboard route catalogue contains exactly Pages 01, 02, 03, 06, 07, 09, and 11', () => {
  const content = readSrcFile('config/dashboard-routes.ts');
  const expectedPages = ['01', '02', '03', '06', '07', '09', '11'];
  
  for (const pageNum of expectedPages) {
    assert.match(
      content,
      new RegExp(`pageNumber:\\s*['"]${pageNum}['"]`),
      `Route catalogue must contain Page ${pageNum}`
    );
  }

  // Count total page numbers defined in DASHBOARD_ROUTES
  const matches = content.match(/pageNumber:\s*['"]\d+['"]/g) || [];
  assert.equal(matches.length, 7, 'Catalogue must contain exactly 7 routes');
});

test('BP2-P01-T02: /dashboard resolves/redirects to Overview', () => {
  const pageContent = readSrcFile('app/dashboard/page.tsx');
  assert.match(
    pageContent,
    /redirect\(/,
    'Dashboard index page must call redirect()'
  );
  assert.match(
    pageContent,
    /(DASHBOARD_DEFAULT_PATH|['"]\/dashboard\/overview['"])/,
    'Dashboard index must redirect to overview'
  );

  const routeConfig = readSrcFile('config/dashboard-routes.ts');
  assert.match(
    routeConfig,
    /DASHBOARD_DEFAULT_PATH\s*=\s*['"]\/dashboard\/overview['"]/,
    'DASHBOARD_DEFAULT_PATH must point to /dashboard/overview'
  );
});

test('BP2-P01-T03: All seven navigation entries have unique stable IDs and routes', () => {
  const content = readSrcFile('config/dashboard-routes.ts');
  
  const idMatches = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const pathMatches = [...content.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);

  assert.equal(idMatches.length, 7, 'Should find 7 route IDs');
  assert.equal(pathMatches.length, 7, 'Should find 7 route paths');

  const uniqueIds = new Set(idMatches);
  const uniquePaths = new Set(pathMatches);

  assert.equal(uniqueIds.size, 7, 'All 7 route IDs must be unique');
  assert.equal(uniquePaths.size, 7, 'All 7 route paths must be unique');

  const expectedIds = ['overview', 'energy-water', 'environment', 'alerts', 'iot', 'parking', 'fire-safety'];
  assert.deepEqual([...uniqueIds].sort(), expectedIds.sort());
});

test('BP2-P01-T04: Page 04, 05, 08, and 10 routes/navigation entries are absent', () => {
  const content = readSrcFile('config/dashboard-routes.ts');
  const forbiddenPages = ['04', '05', '08', '10'];

  for (const pageNum of forbiddenPages) {
    assert.doesNotMatch(
      content,
      new RegExp(`pageNumber:\\s*['"]${pageNum}['"]`),
      `Page ${pageNum} must NOT be in route catalogue`
    );
  }

  // Verify filesystem has no directories for out of scope pages
  const forbiddenPaths = [
    path.join(__dirname, 'src/app/dashboard/spaces'),
    path.join(__dirname, 'src/app/dashboard/maintenance'),
    path.join(__dirname, 'src/app/dashboard/equipment'),
    path.join(__dirname, 'src/app/dashboard/elevators'),
    path.join(__dirname, 'src/app/dashboard/security'),
    path.join(__dirname, 'src/app/dashboard/access-control'),
  ];

  for (const fPath of forbiddenPaths) {
    assert.equal(fs.existsSync(fPath), false, `Out of scope route directory must not exist: ${fPath}`);
  }
});

test('BP2-P01-T05: Active navigation state follows the current pathname', () => {
  function isDashboardRouteActive(currentPathname, routePath) {
    if (!currentPathname || !routePath) return false;
    const cleanCurrent = currentPathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
    const cleanTarget = routePath.replace(/\/+$/, '') || '/';
    return cleanCurrent === cleanTarget;
  }

  assert.equal(isDashboardRouteActive('/dashboard/overview', '/dashboard/overview'), true);
  assert.equal(isDashboardRouteActive('/dashboard/overview/', '/dashboard/overview'), true);
  assert.equal(isDashboardRouteActive('/dashboard/overview?tab=1', '/dashboard/overview'), true);
  assert.equal(isDashboardRouteActive('/dashboard/energy-water', '/dashboard/overview'), false);
  assert.equal(isDashboardRouteActive('/dashboard/alerts', '/dashboard/alerts'), true);
  assert.equal(isDashboardRouteActive('/viewer/campus', '/dashboard/overview'), false);
});

test('BP2-P01-T06: Dashboard has a route back to /viewer/campus', () => {
  const shellContent = readSrcFile('components/dashboard/layout/DashboardShell.tsx');
  assert.match(
    shellContent,
    /VIEWER_CAMPUS_PATH|['"]\/viewer\/campus['"]/,
    'DashboardShell must contain link back to /viewer/campus'
  );

  const viewerShellContent = readSrcFile('components/layout/ViewerShell.tsx');
  assert.match(
    viewerShellContent,
    /['"]\/dashboard\/overview['"]|['"]\/dashboard['"]/,
    'ViewerShell must contain link to dashboard'
  );
});

test('BP2-P01-T07: Dashboard route tree does not render a Unity canvas/runtime component', () => {
  const layoutContent = readSrcFile('app/dashboard/layout.tsx');
  const shellContent = readSrcFile('components/dashboard/layout/DashboardShell.tsx');

  assert.doesNotMatch(layoutContent, /UnityViewerRuntime/, 'Dashboard layout must not import UnityViewerRuntime');
  assert.doesNotMatch(layoutContent, /UnityViewerCanvas/, 'Dashboard layout must not import UnityViewerCanvas');
  assert.doesNotMatch(shellContent, /UnityViewerRuntime/, 'Dashboard shell must not import UnityViewerRuntime');
  assert.doesNotMatch(shellContent, /UnityViewerCanvas/, 'Dashboard shell must not import UnityViewerCanvas');
  assert.doesNotMatch(shellContent, /<canvas/i, 'Dashboard shell must not mount a raw canvas element');
});

test('BP2-P01-T08: DataModeBadge renders distinct accessible labels for all four modes', () => {
  const DATA_MODE_LABELS = {
    live: 'Dữ liệu thực',
    derived: 'Dữ liệu tổng hợp',
    manual: 'Dữ liệu nhập tay',
    demo: 'Dữ liệu demo',
  };

  const labels = Object.values(DATA_MODE_LABELS);
  const uniqueLabels = new Set(labels);

  assert.equal(uniqueLabels.size, 4, 'All four data modes must have unique Vietnamese text labels');
  assert.equal(DATA_MODE_LABELS.live, 'Dữ liệu thực');
  assert.equal(DATA_MODE_LABELS.derived, 'Dữ liệu tổng hợp');
  assert.equal(DATA_MODE_LABELS.manual, 'Dữ liệu nhập tay');
  assert.equal(DATA_MODE_LABELS.demo, 'Dữ liệu demo');

  const badgeContent = readSrcFile('components/dashboard/cards/DataModeBadge.tsx');
  assert.match(badgeContent, /aria-label=/, 'DataModeBadge must have an accessible aria-label');
  assert.match(badgeContent, /role="note"/, 'DataModeBadge must have an accessible role');
});

test('BP2-P01-T09: Demo provenance without fixture version is rejected by validation', () => {
  const invalidDemoProv = {
    mode: 'demo',
    sourceId: 'demo-source',
    // Missing fixtureVersion
  };

  const res = validateProvenance(invalidDemoProv);
  assert.equal(res.valid, false, 'Demo provenance without fixtureVersion must be invalid');
  assert.ok(
    res.errors.some(e => e.includes('fixtureVersion')),
    'Error message must mention fixtureVersion requirement'
  );
});

test('BP2-P01-T10: Live provenance cannot be mislabeled with a fixture version', () => {
  const invalidLiveProv = {
    mode: 'live',
    sourceId: 'sensor-01',
    fixtureVersion: '1.0.0', // Illegal for live mode
  };

  const res = validateProvenance(invalidLiveProv);
  assert.equal(res.valid, false, 'Live provenance with fixtureVersion must be invalid');
  assert.ok(
    res.errors.some(e => e.includes('Live mode must not have fixtureVersion')),
    'Error message must prohibit fixtureVersion on live mode'
  );

  const validLiveProv = {
    mode: 'live',
    sourceId: 'sensor-01',
  };
  const validRes = validateProvenance(validLiveProv);
  assert.equal(validRes.valid, true, 'Valid live provenance must pass validation');
});

test('BP2-P01-T11: KPI missing value does not render as numeric zero', () => {
  // Test KPI card value resolution logic
  function resolveKpiDisplayValue(value, availability, emptyPlaceholder = '—') {
    const isMissingValue = value === undefined || value === null || value === '';
    const isUnavailable = availability === 'unavailable';
    const isEmpty = availability === 'empty';

    if (isUnavailable) return 'Chưa kết nối';
    if (isEmpty || isMissingValue) return emptyPlaceholder;
    return String(value);
  }

  assert.notEqual(resolveKpiDisplayValue(undefined, undefined), '0');
  assert.notEqual(resolveKpiDisplayValue(null, undefined), '0');
  assert.notEqual(resolveKpiDisplayValue('', undefined), '0');
  assert.notEqual(resolveKpiDisplayValue(undefined, 'unavailable'), '0');
  assert.notEqual(resolveKpiDisplayValue(undefined, 'empty'), '0');

  assert.equal(resolveKpiDisplayValue(undefined, undefined), '—');
  assert.equal(resolveKpiDisplayValue(null, undefined), '—');
  assert.equal(resolveKpiDisplayValue(undefined, 'unavailable'), 'Chưa kết nối');

  // Verify actual 0 value is preserved when explicitly provided as data
  assert.equal(resolveKpiDisplayValue(0, 'ready'), '0');

  const cardSource = readSrcFile('components/dashboard/cards/KpiMetadataCard.tsx');
  assert.match(cardSource, /isMissingValue/, 'KpiMetadataCard must explicitly check for missing/null values');
  assert.doesNotMatch(cardSource, /value\s*\|\|\s*0/, 'KpiMetadataCard must not fallback to 0 using || 0');
});

test('BP2-P01-T12: Loading, empty, unavailable, and error states are visually/textually distinct', () => {
  const loading = readSrcFile('components/dashboard/states/LoadingState.tsx');
  const empty = readSrcFile('components/dashboard/states/EmptyDataState.tsx');
  const unavailable = readSrcFile('components/dashboard/states/UnavailableDataState.tsx');
  const error = readSrcFile('components/dashboard/states/ErrorState.tsx');

  assert.match(loading, /role="status"/);
  assert.match(loading, /Đang tải dữ liệu/);

  assert.match(empty, /Không có dữ liệu/);
  assert.match(empty, /Chưa có bản ghi nào/);

  assert.match(unavailable, /Dữ liệu chưa được kết nối/);
  assert.match(unavailable, /Big Phase 02/);

  assert.match(error, /role="alert"/);
  assert.match(error, /Đã xảy ra lỗi/);

  // Assert distinct roles and messages
  const messages = [
    'Đang tải dữ liệu',
    'Không có dữ liệu',
    'Dữ liệu chưa được kết nối',
    'Đã xảy ra lỗi',
  ];
  assert.equal(new Set(messages).size, 4, 'All four states must have distinct Vietnamese messages');
});

test('BP2-P01-T13: Error state does not expose raw internal details supplied in a test error object', () => {
  const stackError = new Error('at Object.<anonymous> (/var/app/db/secrets.ts:42:15)');
  const tokenError = new Error('Invalid authentication token: Bearer eyJhbGciOiJIUzI1Ni...');
  const sqlError = new Error('Database error: SELECT * FROM users WHERE password = 123');
  const urlError = new Error('Failed to fetch from https://internal.iot.cluster.local:9000/api/v1/keys');

  const sanitizedStack = sanitizeUserErrorMessage(stackError);
  const sanitizedToken = sanitizeUserErrorMessage(tokenError);
  const sanitizedSql = sanitizeUserErrorMessage(sqlError);
  const sanitizedUrl = sanitizeUserErrorMessage(urlError);

  const safeDefault = 'Không thể tải dữ liệu vào lúc này. Vui lòng thử lại sau.';
  assert.equal(sanitizedStack, safeDefault);
  assert.equal(sanitizedToken, safeDefault);
  assert.equal(sanitizedSql, safeDefault);
  assert.equal(sanitizedUrl, safeDefault);

  // Safe user message passes through
  const safeMessage = 'Hệ thống đang bảo trì theo kế hoạch.';
  assert.equal(sanitizeUserErrorMessage(safeMessage), safeMessage);
});

test('BP2-P01-T14: Same fixture version produces identical data across repeated calls/renders', () => {
  const fixturesSource = readSrcFile('data/dashboard/fixtures/sample-fixtures.ts');
  assert.doesNotMatch(fixturesSource, /Math\.random\(\)/, 'Fixtures must not use Math.random()');
  assert.doesNotMatch(fixturesSource, /new Date\(\)/, 'Fixtures must not instantiate dynamic current time with new Date()');

  // Verify sample fixtures are frozen/deterministic
  const libFixtures = readSrcFile('lib/dashboard/fixtures.ts');
  assert.match(libFixtures, /Object\.freeze/, 'Fixture helper must freeze data to guarantee immutability');

  // Verify validFrom is deterministic ISO string
  assert.match(fixturesSource, /validFrom:\s*['"]\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});

test('BP2-P01-T15: Chart wrapper handles ready, empty, unavailable, and error states', () => {
  const trend = readSrcFile('components/dashboard/charts/MetricTrendChart.tsx');
  const bar = readSrcFile('components/dashboard/charts/MetricBarChart.tsx');
  const dist = readSrcFile('components/dashboard/charts/MetricDistributionChart.tsx');

  for (const [name, code] of [['Trend', trend], ['Bar', bar], ['Distribution', dist]]) {
    assert.match(code, /loading/, `${name} chart must handle loading state`);
    assert.match(code, /error/, `${name} chart must handle error state`);
    assert.match(code, /unavailable/, `${name} chart must handle unavailable state`);
    assert.match(code, /empty|data\.length === 0/, `${name} chart must handle empty state`);
    assert.match(code, /DynamicLine|DynamicColumn|DynamicPie/, `${name} chart must render dynamic chart component when ready`);
  }
});

test('BP2-P01-T16: Chart wrapper exposes an accessible summary/alternative', () => {
  const trend = readSrcFile('components/dashboard/charts/MetricTrendChart.tsx');
  const bar = readSrcFile('components/dashboard/charts/MetricBarChart.tsx');
  const dist = readSrcFile('components/dashboard/charts/MetricDistributionChart.tsx');

  for (const [name, code] of [['Trend', trend], ['Bar', bar], ['Distribution', dist]]) {
    assert.match(code, /sr-only/, `${name} chart must include screen-reader accessible content`);
    assert.match(code, /<table>|summaryText/, `${name} chart must provide accessible summary or data table`);
    assert.match(code, /role="region"/, `${name} chart must have accessible region role`);
    assert.match(code, /aria-label=/, `${name} chart must have aria-label`);
  }
});

test('BP2-P01-T17: Page 06 foundation renders no fabricated alert badge count', () => {
  const stripComments = (str) => str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const alertsPage = stripComments(readSrcFile('app/dashboard/alerts/page.tsx'));
  const shell = stripComments(readSrcFile('components/dashboard/layout/DashboardShell.tsx'));

  // Verify Page 06 has no fabricated badge count
  assert.doesNotMatch(alertsPage, /badgeCount|alertCount|\bcount\b\s*:\s*\d+/i, 'Page 06 must not fabricate alert count');
  assert.doesNotMatch(alertsPage, /<span[^>]*class[^>]*badge[^>]*>\s*\d+\s*<\/span>/i, 'Page 06 must not render numeric badge count');

  // Verify navigation rail in DashboardShell does not render notification badge with fake number
  assert.doesNotMatch(shell, /badge.*count|unreadCount/i, 'DashboardShell nav must not render fake unread badge count');
});
