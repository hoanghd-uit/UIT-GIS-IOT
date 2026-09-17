---
document_id: GIS-UIT-SMALL-PHASE-04-PLAN
version: "1.0.0"
prepared_on: "2026-09-17"
project: "GIS - UIT Building E Digital Twin"
title: "Small Phase 04 - NestJS, PostgreSQL, and persistent device marker positions"
language: en
status: "IMPLEMENTATION PLAN - NOT AN IMPLEMENTATION REPORT"
intended_repository_path: "web/doc/phase_04_backend_postgresql_device_positions_plan.md"
checkpoints: [04A, 04B, 04C, 04D, 04E]
repository_inspected_when_writing: false
user_docker_desktop_accessed_when_writing: false
live_iot_contract_available: false
live_iot_integration_in_scope: false
---

# Small Phase 04 implementation handoff

## 0. Mission and first instructions for the implementing agent

Implement one complete application workflow, not an entire backend platform:

> Open a configured floor -> read its device catalogue from NestJS/PostgreSQL -> display device markers in the existing Unity viewer -> select a device -> edit and save its display position -> reload and recover the saved position.

Use **real NestJS APIs and a real PostgreSQL database**, with **explicitly labelled internal fixtures** while the IoT team's contract and sample payloads are unavailable. A fixture-backed success proves the application workflow, not live IoT compatibility or physical-coordinate accuracy.

Read this plan together with the actual repository instructions. Start at **04A**, verify work already present, and continue from the first incomplete requirement. Do not regenerate or overwrite working components merely to match the example paths in this plan. Do not stop after producing only a NestJS skeleton or empty database.

The owner reports that **Docker Desktop has just been installed**. The owner permits Docker CLI use to obtain project-required images. Before pulling or starting anything, verify that the selected Docker endpoint is the owner's intended **local development engine**, print the image list and commands, and report the actual results afterward. This is not permission to modify a remote Docker host, delete volumes, expose services publicly, or deploy production.

### Completion boundary

Small Phase 04 ends with an evidenced, repeatable **local application-data milestone**. Live IoT integration, production authentication, and calibration against the physical building remain separate acceptance gates.

No application repository was available to the author of this plan. Docker CLI was also absent in the document-authoring runtime. **No project images were pulled, no database was started, and no source code, Unity scene, prefab, or application build was verified while writing this file.**

### Reading order

1. Sections 1-3: sources, scope, and proposed implementation defaults.
2. Section 4: repository preflight and decision gate, checkpoint 04A.
3. Sections 5-6: Docker/database/backend foundation, checkpoint 04B.
4. Sections 7-9: data semantics, internal APIs, fixtures, and persistence, checkpoint 04C.
5. Section 10: existing viewer integration, checkpoint 04D.
6. Sections 11-14: acceptance, operating runbook, blockers, and final handoff, checkpoint 04E.
7. Section 15: portable source references.

---

## 1. Basis, authority, and evidence limits

### 1.1 Source register

| Ref | Source | What was available when writing | How to use it |
| --- | --- | --- | --- |
| S1 | `Project_KnowledgeBase.md`, v1.0.0, compiled 2026-09-16; supplied file `Project_KnowledgeBase(1).md` | Supplied document contents and local file. | Primary consolidated source for project decisions, architectural constraints, provenance, and unresolved questions. It explicitly does not certify implementation. |
| S2 | `EBuilding_UIT_BEIVN.pdf`, 8 pages | Supplied PDF pages/text. | Page 3: floor-detail/marker reference; page 5: access/presence reference; page 7: dashboard reference. Images are mockups, not operational data. Page 8 is a historical proposal timeline, not this phase's schedule. |
| S3 | `GIS_UIT_Bao_cao_ket_qua_hop_IoT_v2(1).docx` | Supplied report contents. | Confirms PostgreSQL greenfield, the application/IoT boundary, supported device groups, and original/custom coordinate requirements. |
| S4 | `Bao_cao_nhanh_Digital_Twin_Toa_E_2026-09-08.docx` | Supplied report contents/page views. | Historical architecture and first-demo context. Its older schedule does not override later product decisions. |
| S5 | Immediately preceding Small Phase 04 discussion in this conversation | Available in the conversation. | Basis for the agreed planning direction: internal contracts first, NestJS and PostgreSQL together, then a narrow persistent-marker workflow, divided into 04A-04E. |
| S6 | Owner's current request | Available in the conversation. | Requests an actionable Markdown handoff; reports Docker Desktop newly installed; permits project-related Docker CLI image acquisition with visible commands. |
| R1 | Repository, `AGENTS.md`, package manifests, scenes/prefabs, current tests | **Not available to the plan author.** | Implementing agent must inspect them directly before source changes or implementation claims. |
| R2 | `GIS_NEW_AGENT_HANDOFF.md`, current `phase_03_floor_prefab_loading_plan.md`, and actual Phase 03 implementation handoff | Described by S1; originals not independently inspected for this plan. | Read actual files when available. S1's technical snapshots are guidance, not proof of current source state. |
| R3 | Live IoT API, credentials, endpoint paths, sample/dummy payloads, physical reference points | **Unavailable at planning time.** | Do not fabricate them. Their absence does not block the local fixture-backed milestone. |

Within this document, `[S1, section 7]` means the portable source above, not a ChatGPT citation token. Technical references `[T1]` onward are listed in section 15 and support tool usage only; they do not establish project requirements.

### 1.2 Authority rules

Use the latest explicit owner decision for the same topic. The source code determines what is implemented, not what the product requirement should become. Preserve source conflicts and record missing evidence rather than silently resolving them.

**Source-derived requirements** are distinguished below from **plan-proposed implementation defaults**. Passing this file to an implementing agent provides a concrete plan to follow, but does not turn its new endpoint names, SQL model, ports, ORM recommendation, or local fixture policy into historical decisions from an IoT meeting.

Record the chosen defaults in the 04A decision record. Adjust purely technical details when repository evidence requires it, with a written reason. Do not change product ownership, live-data semantics, security exposure, or deferred scope without owner direction.

---

## 2. Scope and invariants

### 2.1 Required outcomes

| ID | Outcome | Boundary |
| --- | --- | --- |
| P04-01 | Reproducible PostgreSQL development environment, migrations, and persistent storage. | A newly provisioned application database; no MongoDB migration. |
| P04-02 | NestJS configuration, DB connectivity, validation, controlled errors, health endpoints, and documented internal APIs. | A modular application backend, not a microservice platform. |
| P04-03 | Device identity and floor mapping with separate source position, source-fetch time, and custom display override. | Minimal application inventory, not management of the IoT network. |
| P04-04 | Explicit fixture ingestion through the same domain persistence path used by the future real adapter. | Internal test data, not a mock server pretending to be the IoT team's API. |
| P04-05 | Display/select/edit/save/reload workflow on one correctly identified, configured floor. | Prefer floor `4`; use floor `6` or another genuinely mapped floor only if repository evidence requires it and document the choice. |
| P04-06 | Tests for persistence, stale responses, frame mismatch, concurrent edits, missing source, and invalid data. | Runtime results must be demonstrated, not inferred from compilation. |
| P04-07 | A repeatable runbook and evidence-based implementation handoff. | Include commands actually run, actual image digest/version, source changes, test outcomes, and remaining blockers. |

One pilot floor is sufficient for the end-to-end marker workflow. Navigation regression tests still need another valid route; that route may legitimately have no model. Do not create or mislabel a second model just to satisfy a test.

### 2.2 Non-negotiable source-derived constraints

- Application stack: **PostgreSQL + NestJS + existing Next.js/Unity WebGL**. PostgreSQL is greenfield. MongoDB/Mongoose instructions are superseded for this work. [S1, sections 4-5, 9]
- IoT team owns MQTT, TSDB, IoT backend, and device/network operations. Do not provision those components or replicate raw telemetry. [S1, sections 4, 6]
- Preserve one outer repository, `UnityContent/`, `web/`, and singular `UnityContent/Assets/Script/`. Read actual instructions before selecting the new backend location. [S1, section 10]
- Preserve one Unity runtime, one `useUnityContext`, one canvas, existing `Campus`/`FloorDetail` scenes, URL-driven navigation, Orbit Map Camera, and `AppBootstrap` as the only persistence owner. [S1, section 10]
- Canonical viewer floor IDs are strings `G`, `1` through `12`. Display label `04` is not the canonical ID `4`; external IDs require an explicit mapping. [S1, sections 8.3, 10.3]
- Prepared floor prefabs and remote Addressables remain the floor-content strategy. Do not revive `phase_03_floor_content_document_loading_plan.md`. Dashboard JSONB does not authorize a JSON floor reconstruction system. [S1, sections 11, 15.3]
- Original IoT coordinates originate at the **centre of the floor plan**, but units, axes, exact origin definition, and real calibration are unresolved. Camera framing or mesh bounds do not establish that origin. [S1, sections 7, 11.4]
- A user-adjusted icon position changes presentation, not physical installation data, and must not be written back to IoT. [S1, section 7]
- `lasttime fetch` refers to obtaining original data from IoT, not a sensor measurement, icon edit, fixture import, or frontend read. [S1, sections 5.7, 7]

### 2.3 Explicitly out of scope

Do not implement full dashboards, report caching, Redis, faculty profiles/presence/history, production accounts/RBAC, camera streams, automatic new-device webhooks, telemetry history, alerting, floor geometry editing, PostGIS, Kubernetes, Proxmox configuration, or public deployment.

These are deferred for **Small Phase 04**, not removed from Product Phase 1. In particular, marker-position editing is not a wall/furniture editor. The proposal's page 7 "Step 4" and its month-four timeline are unrelated to the technical name "Small Phase 04". [S1, sections 3, 5, 8, 15; S2]

---

## 3. Proposed implementation defaults to adopt or refine at 04A

The following are new, bounded design proposals from this plan, not claims about existing code or confirmed IoT contracts.

| Decision | Default for this milestone | Reconsider only when |
| --- | --- | --- |
| Application shape | One NestJS application with domain modules; add `backend/` beside `web/` if no appropriate backend exists. | Repository instructions or existing code specify another location. Do not introduce a new root workspace/build system unnecessarily. |
| DB image | Official `postgres:17-bookworm` for initial development; resolve and record the digest, then pin it for reproducibility. | An existing, approved PostgreSQL version is found, or compatibility/security evidence requires another supported version. Never silently mount a different major version on existing data. |
| Node/Nest versions | Select a supported Node runtime compatible with the actual repository and selected NestJS packages; record exact installed/resolved versions. | Do not copy historical Next.js/Unity versions from the KB as upgrade instructions. |
| ORM | Reuse an existing PostgreSQL ORM if present. Otherwise recommend **TypeORM + `@nestjs/typeorm` + `pg`**, with reviewed migrations and `synchronize: false`. | Document a different single-tool choice in 04A before writing migrations. Do not install multiple ORMs. |
| Process placement | PostgreSQL in Docker; NestJS and the existing Next.js application on the host for the first milestone. | Containerizing the application is separately justified. A Node image is not required for this baseline. |
| Default local ports | PostgreSQL `127.0.0.1:5432`; NestJS `127.0.0.1:3001`; retain the verified web port, commonly `3000`. | A port is occupied or repository configuration differs. Do not kill unrelated processes. |
| Browser/backend path | Prefer a thin, allowlisted Next.js server-side proxy to NestJS, unless a suitable verified API client pattern already exists. | Avoid a generic arbitrary-URL proxy. Keep business logic and DB access in NestJS. |
| Position storage | Absolute **floor-wrapper-local 3D** positions for overrides, bound to a frame ID and version. Screen pixels and camera-relative coordinates are prohibited. | Repository frame design demonstrates a better compatible representation; document a migration-safe choice. |
| Override ownership | One shared override per device **for the isolated local pilot**. No per-user settings or user tables. | Before real shared deployment, owner must resolve shared versus per-user ownership and permissions. The pilot choice does not resolve that product question globally. |
| Refresh policy | Preserve compatible overrides; retain but invalidate them when floor/frame context changes. Do not infer deletion from an incomplete/unknown catalogue. | A real IoT contract and owner-approved lifecycle policy become available. |
| Concurrency | A transactional integer `placementRevision`; reject stale updates instead of last-write-wins. | Repository already provides an equivalent tested mechanism. |
| Time | Application timestamps use `timestamptz`, UTC serialization, and explicit semantic names. | Source event time is introduced later; do not infer IoT timestamp conventions now. |
| Test data | Explicit namespace `phase04-fixture-v1`, no sensor values, no fake online status, no automatic fallback. | Fixture scenarios change; retain stable identity and provenance. |
| Minimum edit UX | Select marker -> edit floor-local coordinates with preview -> Save/Cancel -> Reset override. | Drag-on-plane editing may be added only if straightforward and within scope. It is not required for acceptance. |

**04A must record:** what is adopted, what differs, why it differs, and which unresolved product questions remain gated from live deployment. Do not ask the owner to choose PostgreSQL or NestJS again.

---

## 4. Checkpoint 04A - inspect, establish baseline, and close local design decisions

### 4.1 Inspect before modifying

Read root/subtree `AGENTS.md`, current KB, applicable technical handoffs, latest full prefab-loading plan, and any actual Phase 03 completion report. Inventory source changes belonging to the owner. Do not reset, stash, clean, rename assets, or upgrade frameworks merely to obtain a clean baseline.

Suggested non-mutating discovery commands, run in the actual repository and adapted to available tools:

```bash
git status --short
git rev-parse --show-toplevel
git branch --show-current
git rev-parse --verify HEAD
rg --files -g AGENTS.md -g package.json -g package-lock.json -g pnpm-lock.yaml -g yarn.lock -g ProjectVersion.txt -g manifest.json -g packages-lock.json
rg -n 'useUnityContext|ApplyViewerRoute|ViewerStateChanged|FloorContentStateChanged|requestId' web/src UnityContent/Assets/Script
rg -n 'FloorContentLoader|FloorContentMetadata|FloorContentRegistry|coordinateFrame|calibrationStatus' UnityContent/Assets/Script
node --version
npm --version
```

Verify actual package-manager and script choices before running install/build commands. Do not run these paths unmodified if discovery shows another layout.

### 4.2 Produce a concise evidence table

Record file/path, version or commit, directly read versus only referenced, relevant responsibility, and limitation. Separately record:

- Repository/branch/HEAD and pre-existing working-tree changes.
- Current backend/DB code, if any; existing Compose files and occupied ports.
- Current Unity/Next.js/package versions and tools available for build/testing.
- Phase 03 route/content readiness events and correlation-token implementation.
- Pilot floor's actual prefab identity, metadata, content release, and frame status.
- Existing bridge ownership and the safe insertion point for marker messages.
- Existing baseline lint/build/test failures, clearly separated from new failures.

Do not conclude that all floors are configured because all IDs exist in the navigation catalogue. Do not treat a scene acknowledgement as proof that the requested floor's content is ready.

### 4.3 Adopt the local contracts

Create `web/doc/phase_04_decisions.md` or the repository-equivalent decision record. It must cover:

1. Backend location, Node/package-manager/Nest versions, ORM, image, ports, DB roles, and migration commands.
2. Canonical building/floor mapping and the uniqueness boundary of fixture device IDs.
3. Frame authority, metadata export/registration mechanism, override representation, and coordinate validation.
4. Shared-local-pilot ownership, preserve/invalidate/reset policies, and revision conflict behaviour.
5. Exact internal endpoints, response states, browser/backend access pattern, and local-write protections.
6. Fixture activation, production safeguards, and genuine IoT work still blocked.

### 4.4 Phase 03 dependency gate

If the necessary Phase 03 behaviour exists, reuse it. If a small integration prerequisite is missing, identify it and implement only the narrowly necessary repair when consistent with repository instructions and this plan. Do not conceal a substantial loader rewrite inside this phase.

If the loader or pilot asset is genuinely unavailable, **04B and backend parts of 04C may proceed independently**. Record 04D as blocked until a valid content/frame context is available. Do not substitute an unrelated model or call the full phase complete.

### 4.5 Exit criteria

04A is complete when the implementer has a verified baseline, one identified pilot, explicit local design decisions, a Docker target check, and a precise list of integration points/blockers. At this point the internal contract may be implemented; a partner IoT contract has not been invented or approved.

---

## 5. Checkpoint 04B, part 1 - Docker and PostgreSQL foundation

### 5.1 Image manifest and permission boundary

| Image | Requirement | Purpose | Initial action |
| --- | --- | --- | --- |
| `postgres:17-bookworm` | Required proposed baseline | Development PostgreSQL; reuse the same image for isolated integration tests. | Verify local context, print command, pull, record resolved digest/version/architecture. |
| Node image | Not required by this plan | Only needed if application containerization is separately chosen. | Do not pull by default. |
| pgAdmin/Adminer | Optional convenience, not an acceptance dependency | GUI administration. | Do not add or pull by default. Existing `psql` inside the Postgres container is sufficient for checks. |
| MongoDB, Redis, MQTT brokers, TSDBs, PostGIS, Proxmox-related images | Out of scope | Not needed for this application slice. | Do not install. |

The selected Postgres tag exists in the official image catalogue. A major/distribution tag can change over time; use the **observed repository digest**, not a fabricated hash, to make the accepted environment reproducible. [T1, T2]

### 5.2 Verify the target before pulling

The owner has installed Docker Desktop, but daemon readiness, Linux-container mode, architecture, and selected context are not yet verified.

```bash
docker version
docker compose version
docker context show
docker context ls
docker context inspect
docker info --format '{{.OSType}}/{{.Architecture}}'
```

Inspect both client and server results. Check any `DOCKER_HOST` or `DOCKER_CONTEXT` environment overrides privately; record whether they are set without disclosing credentials or private endpoint details. The selected context and environment together determine the target. [T3]

Do not switch contexts automatically or assume `default` means local. If the endpoint is remote or ambiguous, pause Docker mutations and ask which endpoint the owner intends. If Desktop is stopped, request that it be started rather than attempting an unrelated engine installation.

Before executing, print a small operation manifest like:

```text
Docker target: <verified local Desktop context; no credentials>
Image: postgres:17-bookworm
Purpose: GIS-UIT Phase 04 application database
Command: docker pull postgres:17-bookworm
Planned host binding: 127.0.0.1:<chosen DB port>
Volume: <project-scoped named volume>
Destructive actions: none
```

After confirming the target:

```bash
docker pull postgres:17-bookworm
docker image inspect postgres:17-bookworm --format '{{json .RepoDigests}}'
docker image inspect postgres:17-bookworm --format '{{.Os}}/{{.Architecture}}'
```

Record exit codes and actual output. Do not report a pull as successful if the command was merely printed. Reuse a suitable installed image rather than downloading unrelated images for diagnostics. Do not force `linux/amd64` on an ARM machine without a demonstrated need.

### 5.3 Materialize a project-scoped Compose file

Proposed root file: `compose.phase04.yml`. Adapt its location if the repository already has an established infrastructure directory. The example below is a design starting point, **not an existing file or a validated deployment**.

```yaml
name: gis-uit-p04-dev
services:
  postgres:
    image: ${POSTGRES_IMAGE:-postgres:17-bookworm}
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-gis_uit_dev}
      POSTGRES_USER: ${POSTGRES_ADMIN_USER:-gis_bootstrap}
      POSTGRES_PASSWORD: ${POSTGRES_ADMIN_PASSWORD:?Set POSTGRES_ADMIN_PASSWORD in the ignored local env file}
      TZ: UTC
    ports:
      - "127.0.0.1:${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \"$${POSTGRES_USER}\" -d \"$${POSTGRES_DB}\""]
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 10s
    stop_grace_period: 30s
volumes:
  postgres_data:
```

For the proposed **PostgreSQL 17** image, mount the data volume at `/var/lib/postgresql/data`. PostgreSQL 18+ official images have a different documented layout; do not change only the major tag while retaining an unreviewed volume configuration. [T1]

The named volume belongs to the Compose project. Do not use a global `container_name`, a shared existing volume, or a bind mount into the application source tree. Keep the local DB inaccessible through an all-interface port publication.

Create `.env.phase04.example` with variable names and non-secret defaults, and an ignored `.env.phase04.local` containing generated development secrets. Add both the actual local env path and backup output paths to `.gitignore` without weakening existing rules. Preserve an existing env file; do not overwrite it during setup.

Required env groups:

| Group | Variables or equivalent | Rules |
| --- | --- | --- |
| Compose/Postgres | `POSTGRES_IMAGE`, `POSTGRES_DB`, `POSTGRES_PORT`, `POSTGRES_ADMIN_USER`, `POSTGRES_ADMIN_PASSWORD` | Pin the resolved image digest before the accepted rebuild test. Bootstrap credentials are not application credentials. |
| Migration role | Migration username/password/connection settings | Used only by provisioning/migration commands; not shipped to the browser or ordinary Nest runtime. |
| Runtime DB role | Runtime username/password/connection settings | Limited to required application data operations. |
| Application | `APP_ENV`, `HOST`, `PORT`, DB connection settings, allowed local web origin | `HOST=127.0.0.1` for the host-run NestJS process. Fail on missing required configuration. |
| Fixture controls | `DEVICE_SOURCE_MODE`, `ALLOW_FIXTURES`, `DEVICE_SOURCE_NAMESPACE` | Default source mode is `disabled`; fixture activation must be intentional. |
| Local editing/proxy | `ENABLE_LOCAL_POSITION_EDITING`, server-only write/proxy token if needed | Never put secrets in `NEXT_PUBLIC_*`, Unity assets, generated client code, or API responses. |

Provide a small cross-platform secret/env initialization utility if helpful, but do not print generated secrets. Ensure it does not overwrite existing configuration and does not silently enable fixtures or editing. A generated file is still sensitive even on a development machine.

### 5.4 Validate and start, after creating configuration

Run from the repository root **only after** creating the Compose file and populated ignored env file:

```bash
docker compose --env-file .env.phase04.local -f compose.phase04.yml config --quiet
docker compose --env-file .env.phase04.local -f compose.phase04.yml config --images
docker compose --env-file .env.phase04.local -f compose.phase04.yml up -d --wait postgres
docker compose --env-file .env.phase04.local -f compose.phase04.yml ps
```

`--wait` waits for configured readiness/health; a running container alone is not sufficient. If the installed Compose does not support it, use a bounded, documented readiness check rather than an arbitrary sleep. Do not confuse `docker compose wait`, which waits for containers to stop, with `up --wait`. [T4, T5]

Do not print a full expanded Compose config containing passwords. `config --quiet` and `config --images` are sufficient for routine public setup output.

Host-run NestJS connects to `127.0.0.1:<published port>`. A future Compose-hosted backend would connect to service `postgres:5432`; do not copy a host-side loopback URL into a container and expect it to reach the database.

### 5.5 Roles, migrations, and repeatability

Implement a documented, re-runnable bootstrap step using local administrative credentials to create a non-superuser migration owner and a non-superuser application role. Restrict their rights to the application's database/schema. Never run the NestJS server as the image's initial superuser: `POSTGRES_USER` creates a bootstrap superuser, not a least-privilege application account. [T1]

The role/bootstrap script must work with an already initialized database and must not rely exclusively on `/docker-entrypoint-initdb.d`. Official initialization scripts run only for an empty data directory. Changing env passwords or init scripts does not update an existing cluster automatically. [T1]

Requirements:

- One migration tool and one tracked migration history. Disable schema auto-synchronization, including in the normal development workflow. [T6]
- Apply migrations explicitly; do not perform destructive schema changes during ordinary API startup.
- Create schema, keys, constraints, indexes, and grants deterministically. Default privileges must cover objects subsequently created by the migration owner.
- The runtime role may perform only the required data operations, not create/drop the database or alter the schema. Test this distinction.
- Bootstrap/migration and Nest runtime should validate configuration through consistent code, but must use separate credentials.
- Keep migrations and fixture ingestion separate. Starting the database or API must not automatically create demo devices.
- Record the actual Postgres server version via SQL, not just the image tag.
- Re-running bootstrap and running migrations again must be safe and observable. Never fake a migration as applied to make a failed setup appear successful.

**04B database exit:** image and target recorded, DB healthy, roles provisioned, migrations applied, runtime connection tested, no accidental public binding, and persistent storage verified. Final full recreation/restore evidence is required in 04E.

---

## 6. Checkpoint 04B, part 2 - NestJS foundation

### 6.1 Proposed module structure

Use the repository's conventions. The following is a minimum responsibility map, not a demand to create an empty file for every name:

```text
backend/
  src/
    config/                 validated configuration
    database/               data source, migrations, bootstrap support
    health/                 live/readiness endpoints
    floors/                 canonical references and frame-context lookup
    devices/                catalogue reads, detail reads, persistence
    device-positions/       effective position, save/reset, revisions
    iot/                    provider interface and disabled implementation
    fixtures/               explicitly gated local provider/import commands
    common/                 error shape, validation, safe logging, local guards
  test/                     unit and real-Postgres integration/e2e tests
  package.json
  <one lockfile>
```

Do not scaffold a replacement `web/`, initialize nested Git, move Unity assets, or install a global Nest CLI without a concrete need. Prefer local dependency scripts.

### 6.2 Foundation requirements

| Area | Required behaviour |
| --- | --- |
| Configuration | Validate on startup. Missing DB configuration, unknown modes, or unsafe fixture/exposure combinations must fail clearly. No silent localhost/demo defaults in non-local environments. |
| Validation | Validate DTOs, nested objects, paths, and headers. Reject unknown fields, invalid IDs, non-finite coordinates, malformed revisions, wrong frame context, and oversized bodies. Use concrete DTO validation, not TypeScript interfaces alone. [T7] |
| Data access | Parameterized queries/ORM operations; a single runtime pool. No database connections inside Unity or browser code. |
| Error contract | Stable machine-readable error code, safe message, and request correlation ID. No SQL text with credentials, stack traces, or partner secrets in responses. |
| Liveness | Indicates the API process can serve requests; does not imply DB/IoT health. |
| Readiness | Checks application DB access and required migration state. Returns non-ready when either is unavailable. Missing IoT is separately reported and is not a readiness failure for this local milestone. |
| Logging | Log request/mutation/import identifiers, result, and duration. Redact credentials, tokens, connection URLs, and secret-bearing headers. Do not build a reporting/analytics platform. |
| API documentation | Publish/export OpenAPI for the internal API in local/test mode. Mark examples as fixtures and endpoints as application-owned. [T8] |
| Shutdown | Close DB pool and registered handlers cleanly. Keep retry/backoff finite and documented. |
| Reproducibility | Commit the appropriate lockfile. Record actual dependency versions and supported Node runtime; do not claim that an unverified "latest" dependency is installed. |

### 6.3 Minimal local protection without implementing full auth

Reuse existing verified authorization if it exists. Otherwise, the pilot is **local-only**: bind web/backend/DB to loopback for this mode, gate writes explicitly, and deny non-local deployment with fixture editing enabled.

For the proposed Next.js server-side proxy:

- Proxy only fixed application endpoints and methods. Strip user-supplied authorization/proxy headers; attach any internal token server-side from an ignored secret.
- Require the existing CSRF protection or strict local Host/Origin checks on browser mutations; a server-to-server token alone does not protect an exposed browser proxy.
- Validate the same inputs again in NestJS. Do not treat CORS as authorization.
- Keep DB, migration, IoT, and internal write credentials out of the client bundle.
- Run local production-build smoke tests with `NODE_ENV=production` but an explicit `APP_ENV=local`. Deployment classification and framework build mode are not the same thing.
- Do not enable the unauthenticated pilot on a LAN/public hostname. Shared/published operation needs a separate authorization decision and review.

The minimal guard is a development containment measure, not a completed production authentication system.

---

## 7. Checkpoint 04C, part 1 - data and coordinate contracts

### 7.1 Identity and source ownership

Use an application-generated internal device ID; keep the external device identifier as opaque text. Do not parse it as an integer or assume it is a UUID. A display-name change must not change identity.

A proposed unique key is `(source_namespace, external_device_id)`. For fixtures this has a known, documented scope. For real data the adapter must first confirm the upstream uniqueness/lifecycle boundary; if IDs are scoped by gateway/floor/tenant, represent that scope explicitly. **Do not silently guess global uniqueness or treat a floor move as a new identity.**

Keep canonical `(buildingId, floorId)` references. Do not expose unrestricted floor/device creation CRUD in this phase. Reference data and device catalogue imports are controlled internal operations.

The source remains authoritative for device identity, declared floor, and original position. The application owns only the custom presentation overlay. Do not let a position-update endpoint modify source IDs, source position, source-fetch time, or device kind.

### 7.2 Minimal logical schema

Names below are proposed. The implementer may combine or rename tables if all invariants and tests remain explicit.

| Logical table | Minimum responsibilities/fields | Important constraints |
| --- | --- | --- |
| `floors` | Canonical building/floor references; optional current registered frame ID/version and metadata fingerprint. | Compound key; seed from the verified application catalogue, not mockup labels. A floor reference does not prove model availability. |
| `device_bindings` | Internal ID; source namespace/kind; opaque external ID; display name/type; floor reference; original coordinate descriptor; source-fetch time; import time; `placement_revision`. | Unique source identity within confirmed scope; floor FK; source kind clearly distinguishes fixtures; source coordinate payload is bounded/validated, not arbitrary telemetry storage. |
| `device_display_overrides` | Device FK; floor context at save; frame ID/version; absolute local x/y/z; validity status; update time. | At most one pilot override per device; non-finite values rejected; preserve original data separately; stale context cannot be applied. |
| `catalogue_sync_state` | Source/floor scope; last attempt result; last successful ingestion time; last successful IoT-fetch time when applicable; safe error code. | A failed fetch does not advance last success. No full queue, event store, or scheduler is required. |

Use standard relational keys/constraints/indexes for identity and references. Index catalogue reads by source scope and building/floor. Avoid speculative indexes or a generalized schema for future dashboard/faculty domains. PostgreSQL's documented PK, FK, and uniqueness mechanisms support these requirements. [T9]

If original coordinate shape is not yet fixed, use a small validated coordinate descriptor in `jsonb`, for example dimension, numeric components, coordinate-space kind, and source-frame reference. That flexibility is for **coordinate provenance**, not permission to dump every IoT response into a generic JSON store. Any real external payload must later be explicitly normalized by its adapter.

### 7.3 Timestamp rules

| Field/concept | Meaning | Update rule |
| --- | --- | --- |
| `source_fetched_at` / internal API `lastIotFetchAt` | Time original data was successfully received from the real IoT source. | Update only for a valid real-source ingestion that commits. Record receive time separately from any sensor observation time. |
| `ingested_at` | Application ingestion time, regardless of source kind. | Update on successful committed import. Fixture imports use this; they do not fabricate an IoT fetch. |
| `override_updated_at` | Time a display override is saved/reset or changes validity. | Controlled by the application mutation. It must not modify `lastIotFetchAt`. |
| `last_attempt_at` / result | Time/result of a catalogue refresh attempt. | Failures update attempt status without overwriting the successful snapshot/time. |
| Sensor observation time | When a device produced a measurement. | Not implemented in this milestone. |

For every fixture record, `lastIotFetchAt` must be `null`. Display its fixture/import timestamp as such. Never put the browser's current read time in a field implying source freshness.

### 7.4 Frame authority and mapping

Use the actual Phase 03 floor-wrapper metadata as the authority for model-space identity. S1 describes `frameId`, `frameVersion`, `sourceOrigin`, `originInFloorLocal`, basis vectors, and `calibrationStatus`; verify what the current implementation actually contains. [S1, sections 7.5, 11.4]

Register a **read-only, versioned snapshot** of the required frame metadata for backend validation/mapping. Prefer a small export/setup utility using existing Unity metadata. Record the source asset/release, frame tuple, and fingerprint. Do not establish a second manually maintained, conflicting frame authority in PostgreSQL.

If no export mechanism exists, implement only the minimum needed for the pilot. If metadata cannot be verified, backend tests may use a clearly named synthetic test frame, but the real viewer integration remains blocked until the actual pilot frame is known.

For an established source frame, the existing planned mapping is:

```text
d = sourcePosition - sourceOrigin
pLocal = originInFloorLocal + basisX*d.x + basisY*d.y + basisZ*d.z
pWorld = floorWrapper.TransformPoint(pLocal)
```

Basis vectors already include unit conversion. Do not convert units twice. Prefer one application-side source-to-local resolver and send **resolved floor-local positions** to Unity; Unity then performs only the wrapper-local/world transform. If repository architecture keeps source mapping in Unity instead, document that single ownership explicitly and adjust API/test expectations together. Do not unknowingly apply both mappings.

For this phase, fixture original positions may be explicitly declared `floor-local-fixture` positions tied to the actual registered wrapper frame. This avoids pretending to know IoT units/axes. Synthetic source-to-local mapping cases can still test the mathematical helper. Neither case verifies physical calibration.

Backend/Unity must agree on frame identity/version before plotting or editing. Unverified physical calibration permits a **labelled local fixture demo**, not a claim that real sensors are at their measured positions. Do not label a frame Verified merely because synthetic tests pass.

### 7.5 Effective position and invalidation

Resolve positions deterministically:

```text
if a compatible active override exists:
    use the override in its registered floor-local frame
else if an original position can be mapped into the current frame:
    use the mapped original position
else:
    return unplaced with a specific reason; do not invent a position
```

A retained but invalid override must be visibly reported as `needs_review`. It is not silently applied, silently deleted, or silently reinterpreted in a new frame. A mapped original position may be shown as the fallback with the review warning; otherwise the device remains unplaced/listed.

Plan-default behaviour:

| Event | Source data | Override | Revision/UI |
| --- | --- | --- | --- |
| User saves display position | Unchanged. | Save validated local position with current frame. | Increment revision; confirm only after committed response. |
| User cancels edit | Unchanged. | Unchanged. | Restore last confirmed position. |
| User resets override | Unchanged. | Remove override in a controlled mutation. | Increment revision; use original if resolvable, otherwise unplaced. |
| Compatible catalogue refresh | Update source fields/time only. | Preserve. | Revision changes only if placement-relevant source data changed; fetch-time-only updates need not invalidate an edit. |
| Confirmed floor move | Update declared source floor. | Retain but mark `needs_review`; never reuse old-floor position. | Increment revision; remove from previous floor response. |
| Frame/origin/units/axes change | Register a new frame version. | Invalidate incompatible overrides. | Revalidate reads and saves; reject stale context. |
| Record absent from partial/unknown snapshot | Do not delete it or its override. | Preserve. | Record that reconciliation is incomplete/unknown. |
| Failed/invalid catalogue response | Preserve last successful snapshot. | Preserve. | Report error; never replace inventory with successful-empty. |

Automatic deletion and live-device lifecycle reconciliation remain gated by the future upstream contract. Reset is an explicit **application display** operation, not a write to the physical IoT system.

### 7.6 Concurrency and atomicity

Use a monotonic `placementRevision` on the parent device binding. Source updates affecting placement, override save/reset, and frame invalidation must participate in the same transaction/locking discipline.

A simple implementation is: lock the device row within a transaction, verify current floor/frame and the caller's expected revision, apply the one permitted mutation, increment revision, and commit. Check and write must be atomic; an application-level check followed by an unguarded write is insufficient.

Return a conflict for stale edits. Do not automatically retry an old user position over a newer one. For catalogue imports, validate before committing; reject invalid batches without partially replacing the accepted snapshot. Keep network calls outside DB locks. Serialize imports per relevant source scope for this small milestone, using a DB-visible mechanism or a documented single importer, not an unjustified distributed queue.

Repeated fixture imports must update the same identities without duplicates or wiping overrides. A duplicate source ID within one batch is a validation error, not an arbitrary last-row-wins rule.

---

## 8. Checkpoint 04C, part 2 - proposed internal API

These are **application-owned routes**, not partner IoT endpoints. Finalize paths/DTOs in 04A and export them in OpenAPI. Existing compatible API conventions take precedence over the example prefix.

### 8.1 Minimum endpoints

| Method/path | Purpose | Minimum behaviour |
| --- | --- | --- |
| `GET /health/live` | Process liveness. | Does not claim DB or IoT is healthy. |
| `GET /health/ready` | Application readiness. | DB/migration check; controlled non-ready result on failure. |
| `GET /api/v1/buildings/:buildingId/floors/:floorId/devices` | Read stored catalogue and effective marker positions. | Canonical IDs; source mode and provenance; explicit source/inventory state; no synchronous IoT fetch just because the user opens a floor. |
| `GET /api/v1/devices/:deviceId` | Read selected device metadata/position detail. | Return original versus override, frame status, revision, provenance, and honest unknown telemetry state. |
| `PUT /api/v1/devices/:deviceId/display-position` | Create/update the display override. | Require expected placement revision and current building/floor/frame; persist atomically; reject changes to source fields. |
| `DELETE /api/v1/devices/:deviceId/display-position` | Reset the display override. | Same revision/context protection; preserve source data; return current authoritative position state. |

Use a validated `X-Expected-Placement-Revision` header on both mutation methods, or a single equivalent contract adopted at 04A. Missing/malformed values are bad requests; stale values are `409 POSITION_REVISION_CONFLICT`. For reset, supply/validate floor/frame context through an agreed query or request contract; do not allow an old-floor UI to reset a new-floor binding accidentally.

Do not add public device CRUD, arbitrary JSON import endpoints, live sync endpoints, or webhook handlers solely because they may be useful later. A local fixture CLI is enough for the import path.

### 8.2 Representative response shape

**Documentation example only.** IDs, coordinates, names, and frame below are invented for explaining the internal schema; they are not records to seed as real devices or a verified Unity frame.

```json
{
  "schemaVersion": 1,
  "buildingId": "E",
  "floorId": "4",
  "source": {
    "mode": "fixture",
    "namespace": "phase04-fixture-v1",
    "sourceState": "fixture",
    "inventoryState": "ready",
    "lastIotFetchAt": null,
    "lastSuccessfulIngestionAt": "2026-09-17T00:00:00Z"
  },
  "devices": [
    {
      "id": "d0ba7a2a-f40d-4b39-885b-6dc79815a104",
      "externalId": "FIXTURE-E4-001",
      "name": "Fixture temperature/humidity marker",
      "kind": "temperature_humidity",
      "buildingId": "E",
      "floorId": "4",
      "dataOrigin": "fixture",
      "operatingStatus": "unknown",
      "telemetry": null,
      "placementRevision": 1,
      "originalPosition": {
        "space": "floor-local-fixture",
        "frameId": "example/E/4/floor-local",
        "frameVersion": 1,
        "coordinates": {"x": 1.5, "y": 0.0, "z": -2.0}
      },
      "displayOverride": null,
      "effectivePosition": {
        "source": "original",
        "frameId": "example/E/4/floor-local",
        "frameVersion": 1,
        "coordinates": {"x": 1.5, "y": 0.0, "z": -2.0}
      },
      "placementStatus": "placed",
      "overrideStatus": "none",
      "calibrationStatus": "Unverified",
      "lastIotFetchAt": null
    }
  ]
}
```

Use actual registered frame values and deliberate fixture IDs when building the local test dataset. Unknown external IDs remain opaque; only the application-generated ID above has a UUID shape.

Example PUT contract:

```http
PUT /api/v1/devices/<internal-device-id>/display-position
Content-Type: application/json
X-Expected-Placement-Revision: 1
```

```json
{
  "buildingId": "E",
  "floorId": "4",
  "frameId": "example/E/4/floor-local",
  "frameVersion": 1,
  "position": {"x": 2.0, "y": 0.0, "z": -1.5}
}
```

Return the authoritative updated representation and revision after commit. Validation limits must be documented in configuration/contracts; do not derive a physical coordinate limit from a screenshot or arbitrarily clamp an invalid position into bounds.

### 8.3 State and error semantics

Keep **source state**, **stored inventory state**, **content-loading state**, and **device operating status** separate.

| Situation | Required interpretation |
| --- | --- |
| Source disabled/unconfigured | Show `not_configured` and inventory `unknown`, not "zero devices installed". Do not leak existing fixture rows into disabled/live modes. |
| Successful empty import into a fresh/empty source-floor scope | `ready` with an empty list, explicitly scoped to that accepted import/source. It is not an error or evidence about other scopes. |
| Empty refresh after records were previously stored | Under this phase's no-implicit-removal policy, retain the stored records and flag reconciliation as unresolved. Do not present them as freshly confirmed by the empty batch or claim the stored catalogue is empty. |
| No successful import yet | `not_synced`/`unknown`; not a proven empty building. |
| Refresh failed but stored data exists | Return last accepted data with a refresh error/age indication; do not imply it was just refreshed. |
| DB unavailable | Controlled `503`; never substitute fixtures or an empty list to mask it. |
| Invalid building/floor ID | Controlled `400` or `404` according to the adopted API convention, consistently tested. Preserve canonical IDs. |
| Valid floor with no configured model | Data state and viewer `unavailable` remain distinct. No marker is attached to another floor's model. |
| Missing transform or incompatible frame | Unplaced/frame-mismatch state; no invented coordinates. |
| Unknown device | `404 DEVICE_NOT_FOUND`. |
| Stale revision | `409 POSITION_REVISION_CONFLICT`; client reloads the authoritative position before another save. |
| Wrong current floor/frame | `409 POSITION_CONTEXT_CHANGED` or a documented equivalent. |
| Write disabled/unauthorized | Controlled `403`/`401`, with no DB mutation. |

Treat response bodies as untrusted in both web and Unity layers. Do not accept arbitrary shape just because the backend is local.

---

## 9. Checkpoint 04C, part 3 - fixture/provider and catalogue workflow

### 9.1 Provider boundary

Define a small injected provider interface for **catalogue acquisition**, separate from the importer and HTTP controllers. NestJS custom providers can select or replace implementations for this boundary. [T10]

```typescript
// Illustrative internal contract; not an IoT team's HTTP contract.
interface DeviceCatalogueProvider {
  fetchFloorCatalogue(request: {
    buildingId: string;
    floorId: string;
    requestId: string;
  }): Promise<NormalizedCatalogueBatch>;
}
```

`NormalizedCatalogueBatch` must identify source kind/namespace, requested and resolved floor context, coordinate representation, completeness (`full`, `partial`, or `unknown`), and records. The importer validates identity, schema, floor mapping, provenance, and coordinate/frame suitability before changing accepted data.

Implement only:

- **Disabled provider:** reports `IOT_NOT_CONFIGURED`; no network calls and no hidden fixture fallback.
- **Fixture provider/loader:** returns named deterministic scenarios only when local/test fixture mode is explicitly enabled.
- **Future live adapter boundary:** documented integration seam. Do not write guessed partner URLs or claim a real adapter exists.

### 9.2 Explicit modes

| Mode | Permitted behaviour |
| --- | --- |
| `DEVICE_SOURCE_MODE=disabled` | Default. Health/database functions work; catalogue reports not configured. Does not display fixture rows left in the DB. |
| `DEVICE_SOURCE_MODE=fixture` | Requires `APP_ENV=local` or `test`, `ALLOW_FIXTURES=true`, and the fixture namespace. All catalogue/detail/UI outputs disclose fixture provenance. |
| `DEVICE_SOURCE_MODE=iot` | Reserved until a real adapter and contract are implemented. Reject startup/configuration with a clear unsupported/unconfigured message in this phase; never fall back to fixture mode. |

Do not derive deployment safety only from `NODE_ENV`: a local production-build smoke test may still deliberately use fixtures under `APP_ENV=local`. Conversely, `APP_ENV=staging` or `production` must never accept the fixture mode or unauthenticated pilot-edit mode.

Namespace filtering applies to **every** read/mutation/import, including lookup by internal device ID. Looking up a fixture ID directly must not bypass the active source-mode restriction.

### 9.3 Minimum fixture scenarios

Use a small deterministic set, not a visual population of every room. A few markers representing supported groups are enough; do not import all sensor icons from the proposal. Supported groups come from S1/S3: water meter, temperature/humidity, Smart Building, UHF reader, and camera. No camera stream or sensor metric values are necessary.

| Scenario | Purpose |
| --- | --- |
| `initial` | A few known fixture devices in the registered pilot frame, clearly synthetic names/IDs and no telemetry. |
| `repeat-identical` | Re-import proves idempotency and preservation of a saved override. |
| `add-device` | One added identity proves catalogue insertion without rebuilding the client or resetting existing overrides. |
| `move-source-position` | Original position changes while a compatible custom display position remains. |
| `move-floor` | A binding moves to another valid floor; the old override is retained but invalidated. Backend test does not require a second detailed model. |
| `change-frame-version` | Stale custom coordinates and stale UI writes are not reused. |
| `partial-or-empty` | Test successful-empty in a fresh source-floor scope separately from an empty/partial refresh of an existing scope. Preserve existing records under the no-implicit-removal policy and disclose unresolved reconciliation. |
| `invalid-or-failed` | Duplicate IDs, wrong floor, malformed coordinates, provider failure; accepted snapshot remains intact. |

Do not include personal faculty information, real card IDs, secret endpoints, or fake online/offline values. Fixture assertions may use a fixed test clock; ordinary imports record their actual ingestion time.

### 9.4 Import controls

Provide a local CLI, for example `fixtures:import -- --scenario=initial`, rather than a permanently exposed import endpoint. The exact command is an implementation deliverable, not a currently existing script.

It must use the domain importer and actual PostgreSQL repositories. It must be explicit, idempotent, fail safely, and refuse an unsupported environment/source mode. A future live adapter should feed the same normalized importer without rewriting position-save business logic.

Do not simulate successful refresh by editing database rows in a GUI and then mark the provider/import test as passed. SQL inspection can verify results, but the tested workflow must exercise the application code.

**04C exit:** documented APIs and domain model, real-DB save/reset/conflict behaviour, separated timestamps/source provenance, controlled fixtures, and tested refresh/invalidation semantics.

---

## 10. Checkpoint 04D - integrate with the existing Next.js/Unity viewer

### 10.1 Ownership map

| Component | Responsibility |
| --- | --- |
| Next.js router | Canonical selected route; no competing navigation state. |
| Existing web viewer runtime | Single Unity context/canvas and shared bridge listeners. |
| Web device layer | Calls application API; tracks catalogue/selection/edit state; sends validated current-context marker data. |
| NestJS | Source identity, persistence, revision/context validation, and effective-position resolution. |
| Unity scene-local marker component | Creates markers beneath the active floor context; picking/preview; local/world transform; cleanup. |
| Existing content loader/host | Authoritative content lifecycle and frame readiness. Never replaced by the device API. |

Do not add a second persistent manager or Unity runtime for markers. Keep device UI state out of the core URL navigation contract unless the existing route design explicitly supports device selection.

### 10.2 Readiness and correlation gate

A catalogue HTTP result can arrive before or after content. Plot only when **both** are valid for the same active context:

```text
current route request/generation
+ buildingId/floorId
+ active content ready
+ registered/loaded frameId and frameVersion
+ current catalogue response generation
```

Reuse actual Phase 03 `requestId` semantics where available; add a separate data-request generation only where needed. Abort obsolete HTTP requests when possible **and still check correlation on completion**. An abort is not proof that an operation never finished.

`A -> B -> A` must reject results for the first A even though its floor ID matches again. Apply the same rule to marker selection, preview, save acknowledgements, reset acknowledgements, and frame-ready events.

A save that commits while the user navigates away may remain stored server-side. Ignore its stale visual acknowledgement; do not claim navigation cancelled the DB write or try to undo it automatically.

On Campus, unavailable content, loader error, or floor replacement, disable/clear old markers immediately so they cannot appear under a new breadcrumb. Late callbacks must not attach markers to a destroyed host.

### 10.3 Bridge additions

Verify existing bridge names and schemas first. Proposed additions, only if no equivalent exists:

| Direction | Message | Essential context |
| --- | --- | --- |
| Web -> Unity | Apply current floor marker set | Schema version, viewer request/generation, building/floor, frame tuple, catalogue generation, device IDs and resolved local positions. |
| Unity -> Web | Device selected | Same current context and internal device ID. |
| Web -> Unity | Preview/reset selected marker position | Current context, device ID, local position, edit/preview generation. |
| Unity -> Web | Optional placement interaction result | Current context, device ID, finite local position; never sends credentials or writes directly to DB. |

These names are not asserted to exist. Add typed validation, listeners, and cleanup through the established bridge pattern; do not bypass route synchronization or create unrelated globals.

### 10.4 Minimal UI and interaction

Keep the existing floor UI/style. Add only what is necessary:

1. A clear source badge (`Fixture data` / `IoT not configured`) and calibration status.
2. A device list/marker selection detail showing name, type, IDs, frame, original versus custom position, and meaningful source/import timestamps.
3. An explicit edit mode with floor-local numeric coordinates, preview, Save, and Cancel. Label unverified units honestly as local units; do not call them metres without evidence.
4. Reset-to-original action, with a warning if the source cannot currently be mapped.
5. Loading, saving, saved, error, conflict, unplaced, and needs-review states.

The UI must not invent telemetry, show fake green online states, or imply fixture count equals actual installed inventory. A database/API error is not "no devices".

Preview is temporary. Save success is shown only after a committed response. Prevent duplicate concurrent saves for the same edit; after a conflict, display/reload the authoritative state rather than silently retrying. Cancel or failed-save handling restores the last confirmed position and leaves the error visible when appropriate.

Dragging a marker is optional. If added, it must be an explicit placement mode using the actual floor plane/local transform. It must not move the model, alter physical coordinates, or conflict with Orbit Map Camera. UI events/scrolls must not accidentally control the camera.

### 10.5 Marker lifecycle

Use a scene-local marker root associated with the active floor wrapper/host, with one marker per internal device ID. Do not place markers under an unrelated geometry object whose transform changes independently. Any visual offset to avoid z-fighting belongs to presentation, not persisted coordinates.

On replacement/unload, remove markers, event subscriptions, and selection references. Repeated floor switching must not accumulate GameObjects, listeners, materials, or hidden marker caches. Preserve existing material/asset/GUID ownership rules. Avoid a broad pooling or optimization framework without measurement.

### 10.6 Actual Unity build and browser proof

C# changes require an appropriate Unity compile/build and a compatible WebGL release; source edits alone do not update the browser player. Reuse the established Addressables/player build and release process. Do not overwrite immutable release URLs or omit required support files. [S1, sections 11.5-11.8]

Verify direct deep links, reload, Back/Forward, floor transitions, errors, and retry with the **new actual player** in both development and local production-serving modes where supported. Record player/content release IDs and commands. If Unity tooling, a license, WebGL module, or browser capability is unavailable, report that test as blocked/not run; do not reuse an old successful build as evidence.

**04D exit:** the existing viewer demonstrates the real API/DB workflow on an actual mapped pilot floor, without violating runtime/navigation/content invariants.

---

## 11. Checkpoint 04E - acceptance and regression evidence

### 11.1 Test matrix

All rows start as **NOT RUN**. Record exact command/manual steps, environment, result, and evidence path. Use real PostgreSQL for database integration tests; an in-memory substitute alone cannot satisfy persistence/constraint/transaction acceptance.

| ID | Test | Expected result | Evidence level |
| --- | --- | --- | --- |
| T04-01 | Fresh local setup from documented env/bootstrap/migration steps | Starts on the recorded image; DB healthy; API ready; no implicit fixture seed. | Docker + real DB + API |
| T04-02 | Re-run bootstrap and migrations | No duplicates/destructive changes; correct migration history. | Real DB |
| T04-03 | Runtime DB role attempts a prohibited schema operation | Operation rejected while required application reads/writes succeed. | Real DB |
| T04-04 | Default disabled source | Clear not-configured state; no leaked stored fixture rows or false zero-inventory claim. | API + UI |
| T04-05 | Explicit initial fixture import | Known identities/frame/provenance; no fabricated telemetry or IoT fetch time. | Importer + real DB |
| T04-06 | Device catalogue/detail read | Correct source/floor; direct ID lookup cannot bypass source mode. | API |
| T04-07 | Save override, reload browser | Saved position recovered through API/DB; original unchanged. | Browser + real DB |
| T04-08 | Cancel preview and reject invalid input | No DB mutation; marker returns to last confirmed position. | UI + API |
| T04-09 | Reset override | Source retained; original position restored or explicit unplaced state. | UI + real DB |
| T04-10 | Timestamp separation | Save/read/reset do not change original IoT-fetch time; fixtures keep it null. | API + SQL assertion |
| T04-11 | Two edits with same expected revision | Exactly one wins; other gets a controlled conflict; no silent overwrite. | Concurrent real-DB test |
| T04-12 | Catalogue update races a position save | Transactional context/revision checks prevent a misplaced/lost override. | Concurrent real-DB test |
| T04-13 | Identical fixture re-import/add-device | Idempotent identities; existing valid overrides survive; only intended addition appears. | Importer + real DB |
| T04-14 | Source position changes, same frame | Source changes, custom remains effective, semantics/revision as documented. | Importer + API |
| T04-15 | Floor move/frame version change | Old override retained as needs-review; stale save rejected; no old-floor placement. | Domain + real DB |
| T04-16 | Partial/unknown/malformed/failed import | No implicit deletion or partial accepted-snapshot replacement; success time not advanced on failure. | Importer + real DB |
| T04-17 | Coordinate fixtures and round trip | Registered source-to-local cases pass; wrapper local/world conversions stable; camera movement does not change stored coordinates. | Unit/EditMode + runtime |
| T04-18 | API arrives before content / content before API | Only matching ready context produces markers. | Web/bridge tests + browser |
| T04-19 | Rapid A -> B -> A and late save acknowledgement | Obsolete generations ignored, including first-A results and old edit acknowledgements. | Browser + deterministic tests |
| T04-20 | Return to Campus/unload during load | No orphan markers or late attachments; navigation remains usable. | Browser/Unity |
| T04-21 | Valid floor without model, invalid route, content error/retry | Distinct controlled states; no substitute model/markers; one runtime/canvas. | Browser |
| T04-22 | Deep link, refresh, Back/Forward | Correct URL/content/data context without Unity reboot. | Browser |
| T04-23 | DB outage and API/network error | Controlled error/unready state; no fallback fixtures, false save success, or empty-inventory masking. | Real DB + API + UI |
| T04-24 | Unsafe modes, missing token, cross-origin mutation, extra source fields | Rejected; no mutation; secrets absent from client/logs/responses. | Configuration + API/proxy |
| T04-25 | Recreate DB container with same named volume | Previously saved override and source data survive; exact same DB/volume identity verified. | Docker + API/SQL before/after |
| T04-26 | Logical backup and restore into an isolated target | Counts, identities, representative source/override values, constraints, and migration history verified. | Real restore, not dump creation alone |
| T04-27 | Repeated floor switches/selection cycles | No growing markers/listeners or second canvas; record observations, not a fabricated performance claim. | Browser/Unity |
| T04-28 | Current backend/web checks and actual Unity/WebGL smoke | Builds/tests run against new code/player; pre-existing failures distinguished; dev and local production serving checked. | Tool output + browser |

A live-IoT acceptance row must be separately marked **OUT OF SCOPE / BLOCKED BY CONTRACT**, not passed using fixtures. Physical calibration is likewise unverified until measured references are provided.

### 11.2 Isolation and safety during tests

Use a separate test database and, where useful, a separate Compose project such as `gis-uit-p04-test` with a non-conflicting local port. Reuse the same locked Postgres image. Do not point test reset/migration-down helpers at the developer's working database.

Safety guards must check the intended environment/database before any test cleanup. Do not trust only a process variable named `NODE_ENV=test`. Avoid deleting any volume as part of default tests. If destructive cleanup of a disposable test resource is needed, identify it explicitly and obtain the required owner approval.

### 11.3 Completion labels

Use `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, and `OUT OF SCOPE` accurately. A written test is not an executed test. A compilation pass is not a browser demonstration. A fixture-backed pass is not live integration.

If mandatory 04D/04E runtime checks cannot be performed, hand over the completed code and exact remaining commands, but mark the phase **partially implemented / not fully verified**. Do not assert that Small Phase 04 is fully complete.

---

## 12. Operating runbook requirements

The implementing agent must turn this section into executable, OS-appropriate instructions using actual script names. Commands below illustrate the required operations after the corresponding files/scripts have been created.

### 12.1 First run sequence

```text
1. Verify repository baseline and intended local Docker endpoint.
2. Print and pull only the approved Postgres image; record/pin digest.
3. Create ignored local config/secrets without overwriting existing files.
4. Validate Compose and start PostgreSQL; wait for health.
5. Run explicit role/bootstrap command.
6. Apply reviewed application migrations.
7. Start NestJS and confirm DB-aware readiness with source mode disabled.
8. Start existing Next.js app in the agreed loopback configuration.
9. Confirm the no-IoT/no-fixture UI state.
10. Explicitly enable local fixture mode and local editing; restart config consumers.
11. Run the fixture importer once through the domain service.
12. Open the actual pilot, demonstrate edit/save/reload, and run acceptance tests.
```

Define and document package scripts equivalent to `db:bootstrap`, `db:migrate`, `db:migration:status`, `fixtures:import`, `test`, `test:integration`, `lint`, and `build`. These are deliverables, not pre-existing commands. Include the actual env-loading mechanism; separate shells should not be assumed to inherit variables automatically.

### 12.2 Normal stop/start and non-destructive recreation

After materializing `compose.phase04.yml` and local configuration:

```bash
docker compose --env-file .env.phase04.local -f compose.phase04.yml stop postgres
docker compose --env-file .env.phase04.local -f compose.phase04.yml up -d --wait postgres
```

For the controlled persistence test, first save and record a known fixture override, then recreate only the project DB container:

```bash
docker compose --env-file .env.phase04.local -f compose.phase04.yml up -d --force-recreate --wait postgres
```

Confirm the volume identity did not change, reconnect/restart the application as appropriate, and verify the exact saved values through the API and SQL. A named volume persists independently of a container, but the actual configuration still needs this test. [T11]

Do not use `docker compose down -v`, `docker volume rm`, `docker system prune`, `docker volume prune`, or `docker compose down --remove-orphans` as routine setup/troubleshooting. Never run a blanket cleanup on the owner's newly installed Docker Desktop.

### 12.3 Backup and restore smoke test

Provide a logical `pg_dump`/`pg_restore` workflow using the installed Postgres image's tooling. Make the dump inside the container and copy the completed file out, or use another binary-safe method. Avoid shell redirection that could corrupt binary custom-format dumps in some host shells. `pg_dump` supports custom-format archives for use with `pg_restore`. [T12]

The runbook must name the source DB, destination file, isolated restore DB, credentials/role approach, and verification queries without exposing passwords. Restore into a **new isolated target**, never over the working developer database. Verify representative source positions, custom overrides, IDs, timestamps, constraints, and migration history.

A database dump is not a complete backup of roles, ignored configuration, Unity assets, or build releases. Document provisioning of required roles/config for restore. No production backup schedule or RPO/RTO is being promised in this phase.

### 12.4 Troubleshooting without data loss

| Symptom | Safe first action |
| --- | --- |
| Docker client works but server unavailable | Confirm Desktop is running and the intended local context/overrides are selected. |
| Port collision | Identify the listener and change this project's host port/config; do not kill unrelated services. |
| Password mismatch after editing env | Remember initial image env values do not rotate existing DB credentials. Apply a deliberate credential change with the proper role, or correct local config. Never delete the volume as the default fix. |
| DB healthy but NestJS not ready | Check runtime role, connection target, migration status, and redacted logs. Health at the DB process layer does not prove app permissions. |
| Fixture importer refuses to run | Verify deliberate local/test mode, fixture flag, source namespace, and expected target DB. Do not disable its guard globally. |
| Markers absent while catalogue exists | Check content readiness, current request/generation, frame agreement, and unplaced reasons; do not fall back to a different floor. |
| Saved position appears stale | Inspect revision, acknowledged request context, API response cache policy, and actual DB. Do not silently clear the override. |
| Unity source updated but browser unchanged | Verify the actual new WebGL player/content release and URLs rather than editing unrelated UI state. |

---

## 13. Work that remains blocked by genuine upstream inputs

Do not block the local foundation on these items, and do not mark them resolved by internal fixtures.

| Needed input | Why it matters | Work still possible now |
| --- | --- | --- |
| Actual endpoint/base URL, HTTP contract, auth, errors, limits, timeouts | Required to implement/test a real source adapter. | Internal APIs, domain model, disabled/fixture providers. |
| Sample device catalogue and detail response | Required to verify field mapping and state meanings. | Explicitly synthetic catalogue tests; no invented sensor readings. |
| External ID uniqueness, lifecycle, replacement rules | Required for stable real device identity. | Namespace-scoped fixture identities and storage safeguards. |
| External building/floor/room codes | Required for real catalogue-to-viewer mapping. | Canonical application references; explicit mapping seam. |
| Coordinate dimensions/units/axes, floor centre definition, measured reference points | Required for physical mapping/calibration. | Floor-local override workflow and synthetic mapper tests; calibration remains Unverified. |
| Full/partial snapshot and pagination semantics | Required before absence can imply removal. | Preserve-on-unknown reconciliation, failure and partial-batch tests. |
| New-device webhook contract, verification, retries/recovery | Required for automatic source-triggered synchronization. | Local explicit import through a reusable service; webhook implementation deferred. |
| Shared versus personal override policy and edit permissions | Required before multi-user deployment. | One documented shared override in an isolated local fixture pilot. |
| Production host/network/backup/access decisions | Required for an actual handover deployment. | Reproducible local setup and isolated restore smoke test. |

Do not contact partners, create cloud resources, or publish a webhook endpoint without an explicit task. When the contract arrives, treat live integration as a follow-on milestone that replaces the provider implementation, verifies mapping/calibration, and tests real failure behaviour.

---

## 14. Deliverables, checkpoint reporting, and final agent handoff

### 14.1 Expected repository deliverables

Use established paths if different; document exact locations.

| Deliverable | Expected content |
| --- | --- |
| `backend/` or verified backend location | Working NestJS source, one lockfile, migrations, bootstrap scripts, DTOs, provider/import path, real-DB tests, and README. |
| `compose.phase04.yml` | Project-scoped Postgres service, local binding, healthcheck, named volume, locked image configuration. |
| `.env.phase04.example` and appropriate backend/web templates | Variable documentation only; no usable secrets. Real env/config ignored. |
| Frame registration/export artifact | Actual pilot frame reference/fingerprint and provenance; no invented calibration. |
| Internal OpenAPI export | Exact endpoint/DTO/error definitions; fixture examples and no claim of upstream compatibility. |
| Explicit fixture files/import utility | Small deterministic scenarios, provenance, safe guards, and idempotency. |
| Minimal web/Unity integration changes | Correct current-context marker display, selection, preview/save/reset, cleanup, and build integration. |
| `web/doc/phase_04_decisions.md` | Adopted defaults, repository-driven deviations, local-only decisions, and unresolved product/live questions. |
| `web/doc/phase_04_implementation_handoff.md` | Evidence-based implementation report, never a copy of this plan labelled complete. |
| Existing KB update | Update only decisions/implementation status supported by actual work; preserve deferred/live-unverified distinctions. |

Do not commit generated DB contents, secrets, dumps, editor-local settings, unnecessary build artifacts, or asset churn. Follow existing policies for whether WebGL release outputs belong in Git or another artifact location.

### 14.2 Checkpoint tracking

| Checkpoint | Main outputs | Initial status |
| --- | --- | --- |
| 04A | Verified source baseline, pilot/frame, integration points, decision record. | NOT STARTED |
| 04B | Docker/Postgres, roles/migrations, NestJS foundation, local safety. | NOT STARTED |
| 04C | Domain/API contracts, provider/fixtures, durable positions, concurrency/refresh tests. | NOT STARTED |
| 04D | Existing viewer workflow, frame/request guards, actual player integration. | NOT STARTED |
| 04E | Full acceptance evidence, recreation/restore, runbook, final handoff/KB update. | NOT STARTED |

The authoring session created only this plan. An implementing agent should replace these states using actual evidence, not inferred progress.

At each checkpoint, report: completed requirements, files changed, commands/tests run and their results, new decisions, remaining blockers, and the next checkpoint. Continue through feasible tasks without unnecessary re-approval of already settled stack choices.

### 14.3 Required final implementation report

Include:

1. **Source identity:** repository/branch, starting and ending commit if available, dirty-tree context, changed file list, actual package/tool versions. A commit is not required to report uncommitted work accurately.
2. **Docker execution log:** verified target, image reference, resolved digest, server version/architecture, project/service/volume/port, commands executed, and exit status. Distinguish printed-but-not-run from completed operations; redact secrets.
3. **Database/API:** schema/migration state, role model, source namespace/mode, exact start/seed/reset commands, internal API documentation path, and how timestamps/overrides are protected.
4. **Viewer:** pilot floor and asset/release identity, frame/provenance/calibration status, bridge changes, and readiness/correlation ownership.
5. **Test matrix:** pass/fail/blocked/not-run for T04-01 through T04-28, evidence paths, and pre-existing failures.
6. **Demonstration:** open floor, select, preview, save, reload, reset; show missing-source state; prove container recreation persistence.
7. **Recovery:** backup/restore procedure and actual isolated restore result; any untested operational assumptions.
8. **Remaining gates:** no live IoT contract, no physical calibration proof, local-only override ownership/security, and all deferred features.
9. **Next action:** the smallest concrete next task, not an unsolicited platform expansion.

### 14.4 Suggested assignment text for the owner

```text
Implement Small Phase 04 using
web/doc/phase_04_backend_postgresql_device_positions_plan.md.
Start with 04A and inspect actual repository instructions/source state.
Reuse existing work and continue from the first incomplete requirement.

Keep NestJS + PostgreSQL greenfield and the existing single-runtime
Next.js/Unity viewer. Implement the explicit fixture-backed catalogue,
marker-position save/reset/reload workflow, and its real-DB/runtime tests.
Do not invent the unavailable IoT contract or claim live integration.

Docker Desktop was just installed. You may use Docker CLI for the
project-required Postgres image after verifying the intended local engine.
Print the image manifest and commands before execution, then report actual
results/digest. Do not delete volumes, alter remote hosts, add unrelated
services, or deploy publicly.

Follow 04A-04E, record scoped decisions and evidence, and finish with an
accurate implementation handoff. Mark unavailable runtime tests as blocked,
not passed. Preserve user changes, asset GUIDs, and deferred scope.
```

---

## 15. Portable references and document provenance

### 15.1 Project sources

- **S1:** `Project_KnowledgeBase.md`, v1.0.0, compiled 2026-09-16. Primary sections: 2 (authority), 4-7 (architecture/database/IoT/coordinates), 9-12 (configuration/viewer/content/evidence), 14 (open questions), 18 (agent workflow).
- **S2:** `EBuilding_UIT_BEIVN.pdf`, pages 3, 5, 7, and historical timeline page 8.
- **S3:** `GIS_UIT_Bao_cao_ket_qua_hop_IoT_v2(1).docx`, supplied post-meeting report: PostgreSQL greenfield; supported device groups; four IoT capabilities; original/fetch-time/custom coordinate distinction.
- **S4:** `Bao_cao_nhanh_Digital_Twin_Toa_E_2026-09-08.docx`, historical two-page progress report.
- **S5:** Previous Small Phase 04 planning response in this conversation. Its old citation IDs are not reused as independent evidence in this file.
- **S6:** Current owner request for a detailed Markdown implementation handoff and visible Docker CLI/image operations.

Local source fingerprints recorded during document creation, for identifying these specific supplied files rather than asserting equivalence to another Drive copy:

```text
Project_KnowledgeBase(1).md
SHA-256 e0bb9e230766b29a6de5ef72efa17f79b12e4ad4977ea184ef249e0e0cb74c90

EBuilding_UIT_BEIVN.pdf
SHA-256 22d9f197da224576e9e58d9f92a5e31c8f3654e3261e002fa52dd786f239027f
```

### 15.2 Technical references checked for this plan

Official technical documentation was consulted on 2026-09-17. These references justify mechanics, not source-derived project scope. Recheck installed-version compatibility when implementing.

| Ref | Topic | Official source |
| --- | --- | --- |
| T1 | Official Postgres image: tags, init behaviour, users, env, and volume layouts | `https://hub.docker.com/_/postgres` |
| T2 | Official image tag manifest | `https://raw.githubusercontent.com/docker-library/official-images/master/library/postgres` |
| T3 | Docker contexts and endpoint selection | `https://docs.docker.com/engine/manage-resources/contexts/` |
| T4 | Compose startup/readiness semantics | `https://docs.docker.com/compose/how-tos/startup-order/` |
| T5 | Compose `up`, including `--wait` and container recreation | `https://docs.docker.com/reference/cli/docker/compose/up/` |
| T6 | NestJS database integration and migrations | `https://docs.nestjs.com/techniques/database` |
| T7 | NestJS request validation | `https://docs.nestjs.com/techniques/validation` |
| T8 | NestJS OpenAPI support | `https://docs.nestjs.com/openapi/introduction` |
| T9 | PostgreSQL 17 constraints | `https://www.postgresql.org/docs/17/ddl-constraints.html` |
| T10 | NestJS custom providers | `https://docs.nestjs.com/fundamentals/custom-providers` |
| T11 | Docker volume persistence | `https://docs.docker.com/engine/storage/volumes/` |
| T12 | PostgreSQL 17 `pg_dump` and archive/restore workflow | `https://www.postgresql.org/docs/17/app-pgdump.html` |

### 15.3 Revision history

| Version | Date | Change |
| --- | --- | --- |
| 1.0.0 | 2026-09-17 | Initial implementation handoff for 04A-04E, with Docker operation boundaries, internal catalogue/position design, local fixture policy, viewer integration gates, and acceptance/runbook requirements. No implementation claimed. |

**End of plan.**
