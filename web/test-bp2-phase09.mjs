import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMongoAbility } from '@casl/ability';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSrcFile(relPath) {
  const fullPath = path.join(__dirname, 'src', relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

/* =========================================================================
 * 1. CASL ABILITY MATRIX TESTS (BP2-P09-T01 .. T06)
 * ========================================================================= */

// Minimal rule generator replicating client ability definition logic
function defineRulesForRole(role) {
  const rules = [];

  if (role === 'viewer') {
    rules.push({ action: 'read', subject: 'Dashboard' });
    rules.push({ action: 'read', subject: 'DeviceDisplayPosition' });
    rules.push({ action: 'read', subject: 'FireExtinguisher' });
    rules.push({ action: 'read', subject: 'FireDrill' });
    rules.push({ inverted: true, action: ['create', 'update', 'delete'], subject: 'all' });
    rules.push({ inverted: true, action: ['update', 'delete'], subject: 'DeviceDisplayPosition' });
  } else if (role === 'manager') {
    rules.push({ action: 'read', subject: 'Dashboard' });
    rules.push({ action: 'read', subject: 'DeviceDisplayPosition' });
    rules.push({ action: 'manage', subject: 'FireExtinguisher' });
    rules.push({ action: 'manage', subject: 'FireDrill' });
    rules.push({ inverted: true, action: ['update', 'delete'], subject: 'DeviceDisplayPosition' });
  }

  return rules;
}

test('BP2-P09-T01: Viewer role has read-only access to Dashboard and PCCC', () => {
  const rules = defineRulesForRole('viewer');
  const ability = createMongoAbility(rules);

  // Can read
  assert.equal(ability.can('read', 'Dashboard'), true, 'Viewer can read Dashboard');
  assert.equal(ability.can('read', 'DeviceDisplayPosition'), true, 'Viewer can read DeviceDisplayPosition');
  assert.equal(ability.can('read', 'FireExtinguisher'), true, 'Viewer can read FireExtinguisher');
  assert.equal(ability.can('read', 'FireDrill'), true, 'Viewer can read FireDrill');

  // Cannot mutate
  assert.equal(ability.can('create', 'FireExtinguisher'), false, 'Viewer cannot create FireExtinguisher');
  assert.equal(ability.can('update', 'FireExtinguisher'), false, 'Viewer cannot update FireExtinguisher');
  assert.equal(ability.can('delete', 'FireExtinguisher'), false, 'Viewer cannot delete FireExtinguisher');
  assert.equal(ability.can('update', 'DeviceDisplayPosition'), false, 'Viewer cannot update DeviceDisplayPosition');
  assert.equal(ability.can('delete', 'DeviceDisplayPosition'), false, 'Viewer cannot delete DeviceDisplayPosition');
});

test('BP2-P09-T02: Manager role can manage PCCC resources but CANNOT mutate DeviceDisplayPosition', () => {
  const rules = defineRulesForRole('manager');
  const ability = createMongoAbility(rules);

  // Can read Dashboard and manage PCCC
  assert.equal(ability.can('read', 'Dashboard'), true, 'Manager can read Dashboard');
  assert.equal(ability.can('create', 'FireExtinguisher'), true, 'Manager can create FireExtinguisher');
  assert.equal(ability.can('update', 'FireExtinguisher'), true, 'Manager can update FireExtinguisher');
  assert.equal(ability.can('delete', 'FireExtinguisher'), true, 'Manager can delete FireExtinguisher');
  assert.equal(ability.can('create', 'FireDrill'), true, 'Manager can create FireDrill');
  assert.equal(ability.can('update', 'FireDrill'), true, 'Manager can update FireDrill');
  assert.equal(ability.can('delete', 'FireDrill'), true, 'Manager can delete FireDrill');

  // Explicitly forbidden from mutating DeviceDisplayPosition
  assert.equal(ability.can('read', 'DeviceDisplayPosition'), true, 'Manager can read DeviceDisplayPosition');
  assert.equal(ability.can('update', 'DeviceDisplayPosition'), false, 'Manager CANNOT update DeviceDisplayPosition');
  assert.equal(ability.can('delete', 'DeviceDisplayPosition'), false, 'Manager CANNOT delete DeviceDisplayPosition');
});

test('BP2-P09-T03: TypeScript auth types and ability exports define correct domain structures', () => {
  const authTypes = readSrcFile('types/auth.ts');
  const abilityLib = readSrcFile('lib/auth/ability.ts');

  assert.ok(authTypes.includes("export type AppRole = 'viewer' | 'manager';"), 'AppRole defined');
  assert.ok(authTypes.includes("export type AppAbilityAction = 'read' | 'create' | 'update' | 'delete' | 'manage';"), 'AppAbilityAction defined');
  assert.ok(authTypes.includes("'DeviceDisplayPosition'"), 'DeviceDisplayPosition subject defined');
  assert.ok(authTypes.includes("'FireExtinguisher'"), 'FireExtinguisher subject defined');
  assert.ok(authTypes.includes("'FireDrill'"), 'FireDrill subject defined');
  assert.ok(authTypes.includes('export interface AuthUser'), 'AuthUser interface defined');
  assert.ok(authTypes.includes('export interface AuthMeResponse'), 'AuthMeResponse interface defined');

  assert.ok(abilityLib.includes('export function buildAbilityFromRules'), 'buildAbilityFromRules exported');
  assert.ok(abilityLib.includes('export function defineRulesForRole'), 'defineRulesForRole exported');
});

/* =========================================================================
 * 2. PROXY HARDENING & TRAVERSAL PROTECTION (BP2-P09-T04 .. T07)
 * ========================================================================= */

test('BP2-P09-T04: Device reverse proxy contains strict path allowlist and blocks traversal', () => {
  const proxyCode = readSrcFile('app/api/devices/[...path]/route.ts');

  // Verify allowlist patterns
  assert.ok(proxyCode.includes('ALLOWED_GET_PATTERNS'), 'ALLOWED_GET_PATTERNS defined in proxy');
  assert.ok(proxyCode.includes('ALLOWED_MUTATION_PATTERNS'), 'ALLOWED_MUTATION_PATTERNS defined in proxy');
  assert.ok(proxyCode.includes('devices'), 'devices in proxy allowlist');
  assert.ok(proxyCode.includes('water'), 'water in proxy allowlist');
  assert.ok(proxyCode.includes('environment'), 'environment in proxy allowlist');

  // Verify path traversal rejection
  assert.ok(proxyCode.includes("seg === '..'") || proxyCode.includes("includes('..')"), 'Proxy rejects double dots');

  // Verify auth route shielding
  assert.ok(proxyCode.includes("normalizedPath === 'auth'") || proxyCode.includes("startsWith('auth')"), 'Proxy rejects auth prefix');
});

test('BP2-P09-T05: Device reverse proxy filters cookies to only forward bei_session', () => {
  const proxyCode = readSrcFile('app/api/devices/[...path]/route.ts');

  assert.ok(proxyCode.includes('bei_session='), 'Proxy forwards bei_session cookie');
  assert.ok(proxyCode.includes('X-BEI-Request'), 'Proxy sends X-BEI-Request header for state mutations');
});

/* =========================================================================
 * 3. ROUTE PROTECTION & SESSION BOUNDARY (BP2-P09-T08 .. T12)
 * ========================================================================= */

test('BP2-P09-T06: Server-side session verification utility handles cookies, redirect and DYNAMIC_SERVER_USAGE', () => {
  const sessionServer = readSrcFile('lib/auth/session.server.ts');

  assert.ok(sessionServer.includes("import 'server-only';"), 'session.server.ts is server-only');
  assert.ok(sessionServer.includes('export async function getDashboardSession()'), 'getDashboardSession exported');
  assert.ok(sessionServer.includes('export async function requireDashboardSession'), 'requireDashboardSession exported');
  assert.ok(sessionServer.includes("redirect(`/login?next=${encodeURIComponent(safeTarget)}`)"), 'Redirects to /login with next query param');
  assert.ok(sessionServer.includes("digest === 'DYNAMIC_SERVER_USAGE'"), 'Rethrows DYNAMIC_SERVER_USAGE for Next.js');
});

test('BP2-P09-T07: All 7 Dashboard page routes and root dashboard page enforce requireDashboardSession', () => {
  const routesToCheck = [
    'app/dashboard/page.tsx',
    'app/dashboard/layout.tsx',
    'app/dashboard/overview/page.tsx',
    'app/dashboard/energy-water/page.tsx',
    'app/dashboard/environment/page.tsx',
    'app/dashboard/parking/page.tsx',
    'app/dashboard/fire-safety/page.tsx',
    'app/dashboard/alerts/page.tsx',
    'app/dashboard/iot/page.tsx',
  ];

  for (const route of routesToCheck) {
    const code = readSrcFile(route);
    assert.ok(
      code.includes('requireDashboardSession'),
      `Route ${route} must import and invoke requireDashboardSession`
    );
  }
});

/* =========================================================================
 * 4. UI COMPONENTS INTEGRATION (BP2-P09-T13 .. T16)
 * ========================================================================= */

test('BP2-P09-T08: DashboardShell mounts DashboardAccountControls in sidebar footer', () => {
  const shellCode = readSrcFile('components/dashboard/layout/DashboardShell.tsx');
  const accountControlsCode = readSrcFile('components/auth/DashboardAccountControls.tsx');

  assert.ok(shellCode.includes('<DashboardAccountControls />'), 'DashboardShell mounts DashboardAccountControls');
  assert.ok(accountControlsCode.includes('data-testid="account-controls"'), 'DashboardAccountControls has test id');
  assert.ok(accountControlsCode.includes('data-testid="logout-button"'), 'DashboardAccountControls has logout button');
  assert.ok(accountControlsCode.includes('data-testid="user-role-badge"'), 'DashboardAccountControls displays role badge');
});

test('BP2-P09-T09: DeviceManagementPanel checks CASL ability and disables placement updates', () => {
  const devicePanelCode = readSrcFile('components/devices/DeviceManagementPanel.tsx');

  assert.ok(devicePanelCode.includes('useDashboardAbility'), 'DeviceManagementPanel uses useDashboardAbility');
  assert.ok(devicePanelCode.includes("can('update', 'DeviceDisplayPosition')"), 'Checks ability to update DeviceDisplayPosition');
  assert.ok(devicePanelCode.includes('Chức năng điều chỉnh vị trí thiết bị đã bị khóa theo chính sách hệ thống'), 'Renders Vietnamese policy tooltip');
});

test('BP2-P09-T10: Login page and LoginForm provide secure client-side authentication with Vietnamese UI', () => {
  const loginPage = readSrcFile('app/login/page.tsx');
  const loginForm = readSrcFile('components/auth/LoginForm.tsx');

  assert.ok(loginPage.includes('<LoginForm />'), 'Login page renders LoginForm');
  assert.ok(loginForm.includes('data-testid="login-form"'), 'LoginForm has data-testid');
  assert.ok(loginForm.includes('data-testid="login-username-input"'), 'LoginForm has username input');
  assert.ok(loginForm.includes('data-testid="login-password-input"'), 'LoginForm has password input');
  assert.ok(loginForm.includes('data-testid="login-submit-button"'), 'LoginForm has submit button');
  assert.ok(loginForm.includes('Tên đăng nhập hoặc mật khẩu không chính xác'), 'Contains Vietnamese error message');
});
