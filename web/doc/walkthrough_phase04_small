Walkthrough
Walkthrough: Small Phase 04 - NestJS, PostgreSQL & Device Marker Positions
Small Phase 04 delivers an end-to-end persistent device marker workflow for the GIS - UIT Building E Digital Twin, featuring a greenfield NestJS backend, containerized PostgreSQL 17 database, concurrency-safe display overrides, and Next.js / Unity WebGL integration.

1. Accomplished Checkpoints & Tasks
Checkpoint 04A: Inspection & Baseline Decisions
 Verified repository baseline on branch mono-repo-refactor (commit 974bd83).
 Adopted pilot floor: Building E, Floor 4, Frame E/4/floor-local (Version 1, Unverified calibration).
 Created technical decision record in 
web/doc/phase_04_decisions.md
.
Checkpoint 04B: Infrastructure & Foundations
 Verified local Docker Desktop engine (desktop-linux, linux/aarch64).
 Pulled official PostgreSQL 17 image (postgres:17-bookworm), resolved RepoDigest sha256:051f7b7b3abdd564d5d1bd1e8c4b9c1b6e77087d1dd22020ede611c096a272e0.
 Created 
compose.phase04.yml
 with named volume postgres_data and loopback publication on 127.0.0.1:5432.
 Generated 
.env.phase04.example
 and local ignored secrets 
.env.phase04.local
.
 Started PostgreSQL and verified healthcheck.
 Implemented database role bootstrap (
bootstrap.ts
) creating gis_migration_owner and least-privilege gis_app_runtime.
 Scaffolded NestJS application in 
backend/
 with TypeORM (synchronize: false), configuration validation, and Swagger OpenAPI export (
openapi.json
).
 Implemented /health/live and /health/ready (DB ping & migration state check).
Checkpoint 04C: Schema, APIs & Fixture Workflow
 Implemented TypeORM migration 
1726560000000-InitialDeviceTables.ts
 creating floors, device_bindings, device_display_overrides, and catalogue_sync_state.
 Seeded canonical Building E floors (G, 1 through 12).
 Implemented domain catalogue importer (
catalogue-importer.service.ts
) with honest timestamp separation (lastIotFetchAt: null for fixtures).
 Created deterministic fixture scenarios (
fixture-scenarios.ts
) and CLI import tool (npm run fixtures:import -- --scenario=initial).
 Built internal REST APIs:
GET /api/v1/buildings/:buildingId/floors/:floorId/devices
GET /api/v1/devices/:deviceId
PUT /api/v1/devices/:deviceId/display-position (row-level lock, X-Expected-Placement-Revision check, revision increment)
DELETE /api/v1/devices/:deviceId/display-position (reset to original position)
Checkpoint 04D: Unity WebGL & Next.js Viewer Integration
 Built Unity marker manager components:
DeviceMarkerManager.cs
: Anchors markers under floor wrapper root, handles ApplyFloorMarkers, PreviewMarkerPosition, and ClearFloorMarkers.
DeviceMarkerItem.cs
: Renders color-coded 3D marker spheres with raycast click detection.
DeviceMarkerPayloads.cs
: DTO contracts for bridge communication.
 Extended 
WebViewerBridge.cs
 to dispatch DeviceMarkerClicked and receive marker commands.
 Created Next.js API proxy 
route.ts
 for secure server-to-server routing to NestJS.
 Built React UI 
DeviceManagementPanel.tsx
 with floor-local coordinate editing, live Unity preview, save, cancel, reset, and conflict banners.
 Integrated 
FloorDetailDeviceSection.client.tsx
 into the floor detail page.
Checkpoint 04E: Verification, Acceptance & Runbook
 Automated E2E test suite in 
app.e2e-spec.ts
 executed against real PostgreSQL: 14/14 tests PASSED.
 Verified least-privilege runtime role permissions (prohibited schema operations rejected).
 Verified container persistence test (T04-25): Recreated container with --force-recreate, override survived intact.
 Verified logical backup and restore (T04-26): pg_dump and pg_restore into isolated target gis_uit_restore_test verified.
 Verified Next.js and NestJS production builds (npm run build passes with 0 errors).
 Documented runbook in 
backend/README.md
.
 Prepared comprehensive implementation report in 
web/doc/phase_04_implementation_handoff.md
.
2. Test Matrix Summary (T04-01 to T04-28)
Test ID	Area	Status	Evidence
T04-01	Fresh local setup	PASS	Compose up, DB healthy, /health/ready 200
T04-02	Bootstrap & migration idempotency	PASS	Re-run showed No migrations are pending
T04-03	Role security restrictions	PASS	DROP TABLE denied; SELECT allowed
T04-04	Disabled source mode	PASS	Returns not_configured, no leaked fixture rows
T04-05	Initial fixture import	PASS	Ingested 5 devices for Floor E/4
T04-06	Catalogue & detail read	PASS	Returned 5 devices, honest fixture metadata
T04-07	Save override & reload	PASS	PUT saved override; revision incremented to 2
T04-08	Reject invalid inputs	PASS	Returned 400 on non-finite coords & missing header
T04-09	Reset override	PASS	DELETE removed override; returned to original
T04-10	Timestamp integrity	PASS	lastIotFetchAt: null across all fixture actions
T04-11	Revision conflict check	PASS	Stale revision PUT returned 409 POSITION_REVISION_CONFLICT
T04-12	Floor context mismatch	PASS	Mismatched floor returned 409 POSITION_CONTEXT_CHANGED
T04-13	Idempotent re-import	PASS	Existing overrides survived repeat import
T04-14	Add device scenario	PASS	New device added without affecting existing items
T04-15	Floor move / frame change	PASS	Outdated override marked needs_review
T04-16	Malformed batch rollback	PASS	Duplicate ID batch rejected atomically
T04-17	Coordinate math stability	PASS	Floor-wrapper local 3D vectors verified
T04-18	Content readiness gating	PASS	Markers render only when floor model is ready
T04-19	Rapid navigation token	PASS	Obsolete requestId responses discarded
T04-20	Return to Campus cleanup	PASS	Markers cleared on scene / floor exit
T04-21	Unconfigured floor UI	PASS	Unavailable status displayed cleanly
T04-22	Deep link & navigation	PASS	Route loads model and queries catalogue
T04-23	Backend outage handling	PASS	Controlled 503 response envelope returned
T04-24	Secret safety	PASS	Secrets kept strictly in .env.phase04.local
T04-25	Container persistence	PASS	Recreated DB container; override survived
T04-26	Logical backup/restore	PASS	Tested in isolated DB gis_uit_restore_test
T04-27	Marker memory cleanliness	PASS	Hierarchy cleaned under ContentRoot
T04-28	Production compilation	PASS	Both web and backend build cleanly
3. How to Run and Verify
bash

# 1. Start PostgreSQL (Docker)
docker compose --env-file .env.phase04.local -f compose.phase04.yml up -d --wait postgres
# 2. Run backend e2e tests
npm --prefix backend run test:e2e
# 3. Start NestJS backend (Port 3001)
npm --prefix backend run start:dev
# 4. Start Next.js web application (Port 3000)
npm --prefix web run dev
Open http://localhost:3000/viewer/buildings/E/floors/4 in your browser to interact with the device markers. Open http://127.0.0.1:3001/api/docs to inspect the OpenAPI documentation.