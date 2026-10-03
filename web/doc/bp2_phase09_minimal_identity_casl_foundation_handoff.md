# Small Phase 16 / Phase 09: Minimal Identity & CASL Foundation — Implementation Handoff

> **Document ID:** `BP2-P09-IDENTITY-CASL-HANDOFF`  
> **Project:** GIS — UIT Building E Digital Twin  
> **Phase:** Big Phase 02 / Small Phase 16 (Phase 09: Minimal Identity & CASL Foundation)  
> **Date:** 2026-10-01  
> **Status:** `COMPLETED & VERIFIED`  
> **Target Environment:** Development Docker PostgreSQL (`gis-uit-p04-dev-postgres-1` @ `127.0.0.1:5432`), NestJS Backend (`:3001`), Next.js Web (`:3000`)  
> **Authoritative Specification:** `web/doc/bp2_phase09_minimal_identity_casl_foundation.md`  
> **Master Knowledge Base:** `web/doc/Dashboard_Knowledge_Base.md`  

---

## 1. Executive Summary

Small Phase 16 establishes the verified identity and authorization foundation for the GIS-UIT Building E Digital Twin Dashboard. Prior to this phase, all dashboard reads and legacy device placement mutations were open and unauthenticated. 

In this phase:
1. **Persistent Identity & Sessions:** Created PostgreSQL migration for `application_users` and `application_sessions` tables. Seeded two application accounts: `beiviewer` (`viewer`) and `beimanager` (`manager`) using scrypt key derivation with random 16-byte salts.
2. **CASL Authorization Engine:** Configured an explicit two-role authorization matrix in NestJS (`CaslAbilityFactory`, `PoliciesGuard`, `@RequireAbility`) and Next.js (`DashboardAbilityProvider`, `canPerform`).
   - `viewer`: Read-only access to all 7 Dashboard pages; denied all mutations.
   - `manager`: Read access to all 7 Dashboard pages; granted explicit CASL capability to create/update/delete PCCC manual records (`FireExtinguisher`, `FireDrill`) when Small Phase 17 arrives; denied device placement mutations.
   - Both roles: Explicitly denied updating or deleting `DeviceDisplayPosition`.
3. **Session & Security Boundary:**
   - Same-origin `bei_session` cookie (`httpOnly`, `sameSite: 'lax'`, `path: '/'`).
   - Strict CSRF protection enforcing `Origin` verification and custom `X-BEI-Request` header on all state-changing endpoints.
   - In-memory rate limiting on authentication routes (maximum 5 attempts per IP per 60 seconds).
4. **Endpoint & Route Protection:**
   - All backend Dashboard controllers guarded with `SessionAuthGuard` and `PoliciesGuard`.
   - All 7 Dashboard pages and Next.js layout protected with server-side `requireDashboardSession`, redirecting unauthenticated users to `/login?next=...`.
   - Reverse proxy (`/api/devices/[...path]`) hardened with strict path allowlist, traversal rejection (`..`), shielding of `auth/*`, and forwarding of `bei_session` cookie only.
5. **UI & Stakeholder Content Preservation:**
   - Dedicated login page (`/login`) with Vietnamese error messages, styled to match the dark glassmorphic design system.
   - Sidebar footer account block (`DashboardAccountControls`) displaying authenticated username, role badge (`Viewer` / `Manager`), and one-click logout.
   - Stakeholder-edited labels (such as Page 07 catalogue status `"Trực tuyến trong API"`) and existing chart/KPI logic are 100% preserved.

---

## 2. Git Audit & Modified Files

- **Git HEAD:** `ecd5593a712a9a07d45cb17f2287dcbf657c517f`
- **User-Owned Files Preserved:** `GISUIT.code-workspace` was unmodified.

### Files Created:
1. `backend/src/database/entities/application-user.entity.ts`
2. `backend/src/database/entities/application-session.entity.ts`
3. `backend/src/database/migrations/1727780000000-ApplicationIdentityTables.ts`
4. `backend/src/database/scripts/test-db-identity.ts`
5. `backend/src/auth/password-hasher.service.ts`
6. `backend/src/auth/rate-limiter.service.ts`
7. `backend/src/auth/csrf.guard.ts`
8. `backend/src/auth/session-auth.guard.ts`
9. `backend/src/auth/dto/login.dto.ts`
10. `backend/src/auth/auth.service.ts`
11. `backend/src/auth/auth.controller.ts`
12. `backend/src/auth/auth.module.ts`
13. `backend/src/auth/scripts/seed-local-accounts.ts`
14. `backend/src/auth/tests/password-hasher.spec.ts`
15. `backend/src/authorization/casl-ability.factory.ts`
16. `backend/src/authorization/require-ability.decorator.ts`
17. `backend/src/authorization/policies.guard.ts`
18. `backend/src/authorization/authorization.module.ts`
19. `backend/src/authorization/tests/casl-ability.factory.spec.ts`
20. `backend/test/auth-authorization.e2e-spec.ts`
21. `web/src/types/auth.ts`
22. `web/src/lib/auth/ability.ts`
23. `web/src/lib/auth/session.server.ts`
24. `web/src/lib/auth/auth-api.ts`
25. `web/src/app/api/auth/login/route.ts`
26. `web/src/app/api/auth/me/route.ts`
27. `web/src/app/api/auth/logout/route.ts`
28. `web/src/components/auth/DashboardAbilityProvider.tsx`
29. `web/src/components/auth/DashboardAccountControls.tsx`
30. `web/src/components/auth/LoginForm.tsx`
31. `web/src/app/login/page.tsx`
32. `web/test-bp2-phase09.mjs`
33. `web/doc/bp2_phase09_minimal_identity_casl_foundation_handoff.md`

### Files Modified:
1. `backend/src/app.module.ts` — registered `AuthModule` and `AuthorizationModule`.
2. `backend/src/main.ts` — mounted `cookie-parser`, CORS `credentials: true`, allowed header `X-BEI-Request`.
3. `backend/src/database/data-source.migration.ts` — registered `ApplicationUser` and `ApplicationSession` entities + migration.
4. `backend/src/database/database.module.ts` — registered identity entities in TypeORM module.
5. `backend/src/dashboard/dashboard-environment.controller.ts` — guarded with `SessionAuthGuard, PoliciesGuard`.
6. `backend/src/dashboard/dashboard-water.controller.ts` — guarded with `SessionAuthGuard, PoliciesGuard`.
7. `backend/src/dashboard/dashboard-iot.controller.ts` — guarded with `SessionAuthGuard, PoliciesGuard`.
8. `backend/src/dashboard/alerts/dashboard-alert.controller.ts` — guarded with `SessionAuthGuard, PoliciesGuard`.
9. `backend/src/devices/devices.controller.ts` — guarded placement mutations (`PUT /display-position`, `DELETE /display-position`) with `CsrfGuard, SessionAuthGuard, PoliciesGuard`.
10. `backend/test/app.e2e-spec.ts` — configured test module guard overrides so legacy Phase 04 placement logic tests remain isolated.
11. `backend/package.json` — added `auth:seed-local` and `test:db-identity` scripts.
12. `web/package.json` — added `test:bp2:p09` and added to `npm test`.
13. `web/src/app/api/devices/[...path]/route.ts` — hardened path validation, regex allowlist, traversal check, and `bei_session` cookie forwarding.
14. `web/src/app/dashboard/layout.tsx` — enforced `requireDashboardSession`, wrapped tree in `DashboardAbilityProvider`.
15. `web/src/app/dashboard/page.tsx` — enforced `requireDashboardSession`.
16. `web/src/app/dashboard/overview/page.tsx` — enforced `requireDashboardSession`.
17. `web/src/app/dashboard/energy-water/page.tsx` — enforced `requireDashboardSession`.
18. `web/src/app/dashboard/environment/page.tsx` — enforced `requireDashboardSession`.
19. `web/src/app/dashboard/parking/page.tsx` — enforced `requireDashboardSession`.
20. `web/src/app/dashboard/fire-safety/page.tsx` — enforced `requireDashboardSession`.
21. `web/src/app/dashboard/alerts/page.tsx` — enforced `requireDashboardSession`.
22. `web/src/app/dashboard/iot/page.tsx` — enforced `requireDashboardSession`.
23. `web/src/components/dashboard/layout/DashboardShell.tsx` — mounted `DashboardAccountControls` in sidebar footer.
24. `web/src/components/devices/DeviceManagementPanel.tsx` — integrated CASL `can('update', 'DeviceDisplayPosition')` check and disabled state tooltips.
25. `web/doc/Dashboard_Knowledge_Base.md` — updated Identity Foundation status to COMPLETED.
26. `web/doc/dashboard_big_phase_small_phase_plan.md` — updated Small Phase 16 execution status to COMPLETED.

---

## 3. Approved Two-Role Matrix & CASL Capability Model

The CASL authorization engine enforces a strict two-role model:

| Action / Subject | `viewer` | `manager` | Rationale |
| :--- | :---: | :---: | :--- |
| `read : Dashboard` | **Allow** | **Allow** | Both roles have verified read access to all 7 completed Dashboard pages. |
| `read : AlertConfig` | **Allow** | **Allow** | Both roles view alert statuses and rules; config writes remain deferred to SP21. |
| `read : DeviceDisplayPosition` | **Allow** | **Allow** | Both roles view device positions in catalogue and 3D Digital Twin. |
| `update : DeviceDisplayPosition` | **Deny** | **Deny** | Device position adjustments are locked down; neither role may mutate coordinates. |
| `delete : DeviceDisplayPosition` | **Deny** | **Deny** | Resetting position overrides is locked down; neither role may delete coordinates. |
| `create / update / delete : FireExtinguisher` | **Deny** | **Allow** | Manager is granted authorization ready for Small Phase 17 manual PCCC records. |
| `create / update / delete : FireDrill` | **Deny** | **Allow** | Manager is granted authorization ready for Small Phase 17 manual fire drills. |
| `create / update / delete : all` | **Deny** | — | Viewer is inverted for all mutation operations across all subjects. |

---

## 4. PostgreSQL Database Integration Tests

As requested by the stakeholder, PostgreSQL integration tests were executed directly against the local PostgreSQL container (`gis-uit-p04-dev-postgres-1` on port 5432).

**Command Executed:**
```bash
npm run test:db-identity
```

**Results Output:**
```
=== RUNNING POSTGRESQL DATABASE TESTS ===
Connecting to gis_uit_dev on 127.0.0.1:5432 as runtime role 'gis_app_runtime'...
[PASS] Connected successfully as 'gis_app_runtime'.

Test 1: Verifying existence of tables 'application_users' and 'application_sessions'...
[PASS] Test 1: Tables exist: application_sessions, application_users

Test 2: Verifying constraints on 'application_users'...
[PASS] Test 2: application_users columns: id(uuid), username(character varying), password_hash(character varying), role(character varying), is_active(boolean), created_at(timestamp with time zone), updated_at(timestamp with time zone)

Test 3: Testing check constraint CHK_application_users_role rejects invalid role 'admin'...
[PASS] Test 3: Check constraint successfully rejected role 'admin'.

Test 4: Verifying DML permissions (INSERT, SELECT, UPDATE, DELETE) for runtime role...
  Inserted temporary test user id: c0104bd2-578c-4f59-9953-f032a1eef154
  Inserted temporary test session id: 324d672b-0adc-4151-8e39-08a8f9fd801c
  Updated temporary session (revoked_at set).
  Cleaned up temporary user and session.
[PASS] Test 4: Runtime role has verified SELECT, INSERT, UPDATE, DELETE permissions.

Test 5: Verifying Foreign Key ON DELETE CASCADE...
[PASS] Test 5: Foreign key ON DELETE CASCADE verified.

Test 6: Verifying seeded accounts 'beiviewer' and 'beimanager'...
[PASS] Test 6: Seeded accounts 'beiviewer' and 'beimanager' verified in PostgreSQL (distinct IDs, unique salts, valid scrypt password verification).

=== ALL POSTGRESQL DATABASE TESTS PASSED SUCCESSFULLY ===
```

---

## 5. Account Seeding Evidence

Both local application accounts were seeded via `npm run auth:seed-local`:

| Username | Role | Display Name | Salt (Random 16 bytes) | Hash Algorithm | Password Verification |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `beiviewer` | `viewer` | Viewer | Unique per seed | `scrypt$N=16384,r=8,p=1` | Verified with constant-time comparison |
| `beimanager` | `manager` | Manager | Unique per seed | `scrypt$N=16384,r=8,p=1` | Verified with constant-time comparison |

- **Idempotency:** Re-running `npm run auth:seed-local` detects existing users by username and does not duplicate or alter records.
- **Privacy Guarantee:** Plaintext passwords and session tokens are never logged or stored in version control.

---

## 6. Verification Test Suites Summary

### 1. Backend Unit Tests (`npm test`)
- 11 test suites passed, 147 of 147 tests passed.
- `password-hasher.spec.ts`: verified hashing, random salting, positive/negative password verification, and malformed hash rejection.
- `casl-ability.factory.spec.ts`: verified Viewer matrix, Manager matrix, and client rule serialization.

### 2. Backend E2E Tests (`npm run test:e2e`)
- 2 test suites passed, 35 of 35 tests passed.
- `auth-authorization.e2e-spec.ts` (21 tests):
  - CSRF header requirement and origin check.
  - Rate limiting (throttles after threshold).
  - Invalid credentials return 401 with Vietnamese error message.
  - Successful login sets HttpOnly cookie and returns safe DTO.
  - `GET /me` returns user and CASL rules when authenticated; 401 when unauthenticated.
  - Authenticated reads to `/dashboard/overview`, `/water`, `/environment`, `/iot`, `/alerts` succeed.
  - Anonymous reads to dashboard return 401.
  - Placement mutations (`PUT /devices/:id/display-position`, `DELETE ...`) return 401 when anonymous and 403 when authenticated as either Viewer or Manager.
  - Session revocation on `POST /logout` immediately invalidates subsequent calls.

### 3. Web Test Suite (`npm run test:bp2:p09`)
- 10 of 10 tests passed in `web/test-bp2-phase09.mjs`:
  - `BP2-P09-T01`: Viewer role read-only checks.
  - `BP2-P09-T02`: Manager role PCCC capability and placement mutation denial.
  - `BP2-P09-T03`: TypeScript types and domain structure definitions.
  - `BP2-P09-T04`: Reverse proxy allowlist and path traversal rejection.
  - `BP2-P09-T05`: Reverse proxy cookie forwarding (`bei_session` only).
  - `BP2-P09-T06`: Server-side session verification and Next.js dynamic usage handling.
  - `BP2-P09-T07`: All 7 dashboard pages enforce `requireDashboardSession`.
  - `BP2-P09-T08`: `DashboardShell` mounts `DashboardAccountControls`.
  - `BP2-P09-T09`: `DeviceManagementPanel` checks CASL ability and displays disabled tooltip.
  - `BP2-P09-T10`: Login form accessibility, submit handling, and Vietnamese UI.

### 4. Production Web Build (`npm run build`)
- Successfully compiled via `next build --webpack` in 4.0 seconds with TypeScript check passing cleanly.
- Routes correctly marked dynamic (`ƒ`) for authenticated dashboard routes and static (`○`) for public landing/login.

### 5. Browser Automation Test
- Browser recording: `login_flow_demo_1790867722589.webp`.
- Verified flow:
  1. Visiting `/dashboard/overview` automatically redirects to `/login?next=%2Fdashboard%2Foverview`.
  2. Submitting valid credentials logs in, sets cookie, and navigates to `/dashboard/overview`.
  3. Sidebar displays authenticated block (`beiviewer`, `Viewer` badge, and `Đăng xuất` button).
  4. Clicking `Đăng xuất` revokes session, clears cookie, and navigates back to `/login`.

---

## 7. Small Phase 17 Entry Gate Status

Small Phase 16 is fully completed and ready to hand off to Small Phase 17:

- [x] Trustworthy identity and authenticated session boundary established.
- [x] CASL ability engine active across both backend and frontend.
- [x] Manager role possesses pre-configured permissions for PCCC resources (`FireExtinguisher`, `FireDrill`).
- [x] Device placement writes blocked for all roles.
- [x] Small Phase 17 may proceed with manual PCCC database schema (`fire_extinguishers`, `fire_drills`) and CRUD endpoints.
