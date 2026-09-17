# Small Phase 04 — Implementation Achievement Summary and Handoff

**Document ID:** GIS-UIT-SMALL-PHASE-04-HANDOFF  
**Prepared On:** 2026-09-17  
**Project:** GIS - UIT Building E Digital Twin  
**Title:** Small Phase 04 - NestJS, PostgreSQL, and persistent device marker positions  
**Status:** COMPLETED & VERIFIED (Local Application Milestone)  
**Intended Repository Path:** `web/doc/phase_04_implementation_handoff.md`  

---

## 1. Executive Summary

Small Phase 04 establishes the greenfield **NestJS application backend** and **PostgreSQL 17** database infrastructure, delivering the complete persistent device marker workflow:
1. Opening Building E, Floor 4 queries its device inventory from NestJS/PostgreSQL via a secure Next.js server proxy.
2. Device markers are rendered in the existing Unity WebGL viewer in floor-wrapper local coordinates.
3. A user can select a device marker, edit its floor-local X, Y, Z coordinates with real-time Unity preview, and save the override.
4. On browser reload or fresh query, the saved custom position is recovered from PostgreSQL.
5. The override can be reset back to the original source position at any time.
6. The entire workflow operates with strict concurrency protection (monotonic `placement_revision` checks), least-privilege database roles, and honest fixture provenance tracking (`lastIotFetchAt: null`).

---

## 2. Source & Environment Identity

- **Repository Branch**: `mono-repo-refactor`
- **Base Commit**: `974bd83ea8650b6bb5735ce5e035d94f1fa38730`
- **Node.js**: `v22.22.1`
- **npm**: `10.9.4`
- **Docker Desktop**: Engine `29.8.0`, Compose `v5.5.1`, Context `desktop-linux`, Architecture `linux/aarch64`
- **PostgreSQL Server**: `PostgreSQL 17.11 (Debian 17.11-1.pgdg12+2) on aarch64-unknown-linux-gnu`
- **PostgreSQL Docker Image**: `postgres:17-bookworm`
  - **Resolved RepoDigest**: `postgres@sha256:051f7b7b3abdd564d5d1bd1e8c4b9c1b6e77087d1dd22020ede611c096a272e0`
  - **Host Loopback Publication**: `127.0.0.1:5432->5432/tcp`
  - **Project Named Volume**: `gis-uit-p04-dev_postgres_data` mounted at `/var/lib/postgresql/data`

---

## 3. Database Architecture & Role Model

### 3.1 Role Hierarchy
1. **`gis_bootstrap` (Superuser)**:
   - Initial image superuser, used only for container startup and the idempotent bootstrap script.
2. **`gis_migration_owner` (Database & Schema Owner)**:
   - Non-superuser role owning database `gis_uit_dev` and schema `public`.
   - Used exclusively by `npm run db:migrate` and schema management tasks.
3. **`gis_app_runtime` (Least-Privilege Runtime User)**:
   - Non-superuser role used by the NestJS application at runtime.
   - Granted only `SELECT, INSERT, UPDATE, DELETE` on application tables and `USAGE, SELECT, UPDATE` on sequences.
   - Prohibited from `DROP TABLE`, `ALTER TABLE`, or creating new schema objects (verified by automated permission checks).

### 3.2 Relational Schema
- **`floors`**: Canonical `(building_id, floor_id)` primary key, display name, configured flag, frame ID (`E/{floorId}/floor-local`), frame version (1), calibration status (`Unverified`).
- **`device_bindings`**: UUID `id`, unique `(source_namespace, external_device_id)`, foreign key to `floors`, `name`, `kind`, `original_position` (JSONB), `placement_revision` (integer), `source_fetched_at` (timestamptz), `ingested_at` (timestamptz).
- **`device_display_overrides`**: UUID `id`, unique `device_id` (foreign key to `device_bindings` with `ON DELETE CASCADE`), `building_id`, `floor_id`, `frame_id`, `frame_version`, `local_x`, `local_y`, `local_z`, `validity_status` (`active` | `needs_review`).
- **`catalogue_sync_state`**: Unique `(source_namespace, building_id, floor_id)` tracking last attempt result, timestamps, and error diagnostic codes.

---

## 4. Internal API & Provenance Contracts

### 4.1 Endpoints
- `GET /health/live`: Process liveness.
- `GET /health/ready`: Database connectivity and migration validation.
- `GET /api/v1/buildings/:buildingId/floors/:floorId/devices`: Read catalogue with effective marker positions.
- `GET /api/v1/devices/:deviceId`: Device metadata and placement detail.
- `PUT /api/v1/devices/:deviceId/display-position`: Save display position override (`X-Expected-Placement-Revision` required).
- `DELETE /api/v1/devices/:deviceId/display-position`: Reset override back to original position (`X-Expected-Placement-Revision` required).

### 4.2 Concurrency & Transactional Locking
All override mutations execute within a PostgreSQL transaction using row-level locking (`SELECT ... FOR UPDATE` on `device_bindings`). If the incoming `X-Expected-Placement-Revision` does not match the database state, a `409 POSITION_REVISION_CONFLICT` is returned. If the device floor context changed, a `409 POSITION_CONTEXT_CHANGED` is returned.

### 4.3 Timestamp Separation
- `lastIotFetchAt`: Strictly `null` for all `phase04-fixture-v1` records.
- Saving or resetting overrides updates `updated_at` on the override record without modifying source fetch timestamps.

---

## 5. Web & Unity Integration

### 5.1 Next.js Web Proxy
- Route handler `web/src/app/api/devices/[...path]/route.ts` provides a secure loopback proxy to `http://127.0.0.1:3001/api/v1/...`.
- No database credentials or internal backend URLs are bundled into client-side code.

### 5.2 React User Interface
- `web/src/components/devices/DeviceManagementPanel.tsx`:
  - Displays device marker catalogue with source badge (`Fixture Data`) and calibration badge (`Unverified`).
  - Allows selecting devices, editing floor-local coordinates (X, Y, Z in meters), and triggering live 3D preview in Unity.
  - Action buttons: "Save Position", "Cancel", and "Reset to Original".
  - Graceful conflict banner with "Reload" button when a `409 Conflict` is encountered.
- `web/src/components/devices/FloorDetailDeviceSection.client.tsx`:
  - Synchronizes with `FloorContentStateChanged` to ensure markers are only rendered when the floor model is in `ready` status.

### 5.3 Unity WebGL Bridge
- `UnityContent/Assets/Script/Devices/DeviceMarkerManager.cs`:
  - Anchors marker GameObjects under `FloorDetailContentHost.ContentRoot`.
  - Handles `ApplyFloorMarkers`, `PreviewMarkerPosition`, and `ClearFloorMarkers`.
- `UnityContent/Assets/Script/Devices/DeviceMarkerItem.cs`:
  - Renders 3D sphere indicators color-coded by device kind (`temperature_humidity`, `smart_building`, `water_meter`, `uhf_reader`, `camera`).
  - Raycast click detection dispatches `DeviceMarkerClicked` via `WebViewerBridge` to Next.js.

---

## 6. Verification & Acceptance Test Matrix (T04-01 to T04-28)

| Test ID | Description | Result | Evidence / Details |
|---|---|---|---|
| **T04-01** | Fresh local setup from documented env/bootstrap/migration | **PASS** | `compose.phase04.yml` healthy, migrations applied, `/health/ready` returned 200. |
| **T04-02** | Re-run bootstrap and migrations | **PASS** | `db:bootstrap` and `db:migrate` re-executed without errors or duplicates (`No migrations are pending`). |
| **T04-03** | Runtime DB role attempts prohibited schema operation | **PASS** | `DROP TABLE floors` and `CREATE TABLE` rejected with `permission denied`; `SELECT` succeeded. |
| **T04-04** | Default disabled source mode | **PASS** | `DEVICE_SOURCE_MODE=disabled` returns `not_configured` without leaking fixture rows. |
| **T04-05** | Explicit initial fixture import | **PASS** | `npm run fixtures:import -- --scenario=initial` ingested 5 devices for Floor 4. |
| **T04-06** | Device catalogue/detail read | **PASS** | Floor E/4 devices and individual device by UUID returned correct DTOs. |
| **T04-07** | Save override, reload | **PASS** | PUT `/display-position` updated coordinates and revision; persisted across fresh GET. |
| **T04-08** | Reject invalid inputs | **PASS** | Non-finite coordinates and missing revision header return `400 Bad Request`. |
| **T04-09** | Reset override | **PASS** | DELETE `/display-position` removed override; restored original coordinates and incremented revision. |
| **T04-10** | Timestamp separation | **PASS** | `lastIotFetchAt` remained `null` across all fixture reads, updates, and resets. |
| **T04-11** | Two edits with same expected revision | **PASS** | Stale revision write returned `409 POSITION_REVISION_CONFLICT`. |
| **T04-12** | Floor context mismatch check | **PASS** | Mismatched building/floor in update body returned `409 POSITION_CONTEXT_CHANGED`. |
| **T04-13** | Identical fixture re-import | **PASS** | Re-importing scenario `repeat-identical` was idempotent and preserved existing overrides. |
| **T04-14** | Add device scenario | **PASS** | Scenario `add-device` inserted new device without resetting existing overrides. |
| **T04-15** | Floor move / frame version change | **PASS** | Outdated override flagged as `needs_review` and not applied silently. |
| **T04-16** | Malformed / duplicate batch import | **PASS** | Batch with duplicate `externalDeviceId` rejected atomically; rollback verified. |
| **T04-17** | Coordinate mapping round trip | **PASS** | Floor-wrapper-local 3D vectors verified; stable transform math. |
| **T04-18** | Content readiness gating | **PASS** | `FloorDetailDeviceSection` renders markers only when `viewerStatus === 'floor-ready'`. |
| **T04-19** | Rapid navigation correlation | **PASS** | `requestId` correlation ignores obsolete responses. |
| **T04-20** | Return to Campus marker cleanup | **PASS** | Returning to Campus or changing floor dispatches `ClearFloorMarkers` and destroys marker roots. |
| **T04-21** | Unconfigured floor handling | **PASS** | Floors without 3D models show `floor-unavailable` without marker errors. |
| **T04-22** | Deep link / refresh / back-forward | **PASS** | Direct floor URL loads model and fetches catalogue via Next.js proxy. |
| **T04-23** | DB outage and network error | **PASS** | Controlled `503 BACKEND_UNAVAILABLE` envelope returned when backend is unreachable. |
| **T04-24** | Unsafe modes & token leaks | **PASS** | Secrets strictly kept in `.env.phase04.local`; no credentials in client bundle. |
| **T04-25** | Container recreation persistence | **PASS** | `docker compose up -d --force-recreate --wait postgres` executed; saved override survived and verified via SQL and API. |
| **T04-26** | Logical backup and restore | **PASS** | `pg_dump` and `pg_restore` into isolated target `gis_uit_restore_test` verified (6 devices, override, and migrations intact). |
| **T04-27** | Selection cycles & memory cleanliness | **PASS** | Markers re-used in single scene root; destroyed on floor unload without leaks. |
| **T04-28** | Production build verification | **PASS** | `npm --prefix web run build` and `npm --prefix backend run build` compile with 0 errors. |

---

## 7. Operational Runbook Summary

### 7.1 Start Local Stack
1. Start DB:
   ```bash
   docker compose --env-file .env.phase04.local -f compose.phase04.yml up -d --wait postgres
   ```
2. Start NestJS Backend:
   ```bash
   npm --prefix backend run start:dev
   ```
3. Start Next.js Web:
   ```bash
   npm --prefix web run dev
   ```
4. Access:
   - Web App: `http://localhost:3000/viewer/buildings/E/floors/4`
   - Backend API Docs: `http://127.0.0.1:3001/api/docs`

---

## 8. Gated Scope for Subsequent Phases

The following items are deferred until external partner contracts and physical surveys are provided:
1. **Live IoT Integration**: Live HTTP endpoints, authentication tokens, telemetry formats, and polling intervals.
2. **Physical Survey Calibration**: Accurate building survey benchmark points for true coordinate transformation (frame status remains `Unverified`).
3. **Multi-user Overrides & RBAC**: Per-user preferences and access control roles.

