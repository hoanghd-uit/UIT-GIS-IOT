# Small Phase 04 - Technical Decision Record

**Document ID:** GIS-UIT-SMALL-PHASE-04-DECISIONS  
**Date:** 2026-09-17  
**Status:** ADOPTED  
**Target Repository:** `web/doc/phase_04_decisions.md`  

---

## 1. Context and Authority

This document records the architectural and implementation decisions for **Small Phase 04** ("NestJS, PostgreSQL, and persistent device marker positions") of the GIS - UIT Building E Digital Twin project, based on the implementation plan in `web/doc/phase_04_backend_postgresql_device_positions_plan.md` and approved by the owner.

---

## 2. Adopted Architecture & Stack Defaults

### 2.1 Backend Process & Location
- **Location**: `backend/` at the repository root, alongside `web/` and `UnityContent/`.
- **Runtime**: Node.js v22.x LTS (installed: `v22.22.1`), npm (installed: `10.9.4`).
- **Framework**: NestJS 11 (`@nestjs/core`, `@nestjs/common`, `@nestjs/config`, `@nestjs/swagger`).
- **ORM & Driver**: TypeORM + `pg` (PostgreSQL client). Schema synchronization is strictly disabled (`synchronize: false`); all schema mutations occur via explicit TypeORM migrations.
- **Process Placement**: Local host process bound to loopback `127.0.0.1:3001` for development.

### 2.2 Database & Containerization
- **Image**: Official Docker image `postgres:17-bookworm` running under the verified local Docker Desktop engine (`desktop-linux`, `linux/aarch64`).
- **Compose Service**: Defined in `compose.phase04.yml` with project name `gis-uit-p04-dev`.
- **Host Binding**: `127.0.0.1:5432` (strictly bound to localhost, not `0.0.0.0`).
- **Storage**: Project-scoped named volume `postgres_data` mounted at `/var/lib/postgresql/data`.
- **Database Roles**:
  - `gis_bootstrap` (superuser): Used only by Docker initialization and bootstrap script.
  - `gis_migration_owner`: Non-superuser owner of the application database and schema, used by `npm run db:migrate`.
  - `gis_app_runtime`: Non-superuser least-privilege role used by the NestJS application at runtime (SELECT, INSERT, UPDATE, DELETE on application tables; no DDL/DROP/ALTER rights).

### 2.3 Pilot Floor & Coordinate Frame
- **Pilot Floor**: Building `E`, Floor `4` (canonical ID `"4"`). Floor 6 (`"6"`) is also registered in Addressables/Unity for secondary verification.
- **Active Frame ID**: `E/4/floor-local`.
- **Frame Version**: `1`.
- **Calibration Status**: `Unverified` (calibration against physical survey benchmarks remains separate pending real IoT/survey measurements).
- **Coordinate Space**: Floor-wrapper-local 3D coordinates (meters), represented as `{x, y, z}` floats.

### 2.4 Data Model & Provenance
- **Identity**: Internal device IDs are application-generated UUIDs (`id`). Upstream external identifiers (`external_device_id`) remain opaque strings scoped by `(source_namespace, external_device_id)`.
- **Fixture Namespace**: `phase04-fixture-v1`.
- **Timestamps**:
  - `source_fetched_at`: Timestamp when raw data was fetched from real IoT source. For all fixture records, this is strictly `null`.
  - `ingested_at`: Application ingestion timestamp (set on fixture/catalogue commit).
  - `override_updated_at`: Timestamp when a custom display override was saved or reset.
- **Placement Revision**: Monotonic integer `placement_revision` on `device_bindings`. Incremented on every position override save, reset, or placement-altering catalogue change.

### 2.5 Concurrency & Mutations
- **Revision Header**: Mutations (`PUT /api/v1/devices/:id/display-position` and `DELETE /api/v1/devices/:id/display-position`) require the HTTP header:
  `X-Expected-Placement-Revision: <integer>`
- **Atomicity**: Mutations run inside a PostgreSQL transaction with pessimistic row-level locking (`SELECT ... FOR UPDATE`), checking that the current revision matches `X-Expected-Placement-Revision` and that the targeted floor and frame match. Stale edits return `409 POSITION_REVISION_CONFLICT`.

### 2.6 Local Web Proxy & Security
- **Web-Backend Intermediary**: Next.js server route `/api/devices/[...path]` acts as an allowlisted proxy to NestJS (`http://127.0.0.1:3001/api/v1/...`).
- **Access Scope**: Local-only pilot. Secrets and DB credentials are never exposed to the client bundle (`NEXT_PUBLIC_*`).

---

## 3. Unresolved Product Questions Gated from Live Production

The following items are explicitly deferred and remain gated until partner contracts and physical surveys are provided:
1. **Upstream IoT API Contract**: Endpoint paths, auth tokens, telemetry schemas, and rate limits.
2. **Physical Calibration**: Real benchmark survey points, true floor plan origin, and coordinate axes rotation/scaling.
3. **Multi-user / Per-user Overrides**: Small Phase 04 implements a single shared display override per device for local pilot validation. Multi-user RBAC and personal overrides will be resolved in a subsequent product phase.
4. **Automatic Deletion / Lifecycle**: Missing devices in partial batches do not trigger automatic deletion under the no-implicit-removal policy.

---

