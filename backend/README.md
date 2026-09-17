# GIS-UIT Building E Digital Twin - Backend Application

## 1. Overview
This is the NestJS backend application for the GIS-UIT Digital Twin project, providing:
- PostgreSQL persistence for Building E device catalogue and floor bindings.
- Storage and transactional updates for user-adjusted floor-local 3D marker positions (`device_display_overrides`).
- Optimistic concurrency control via monotonic `placement_revision` checks (`X-Expected-Placement-Revision`).
- Explicit fixture ingestion (`phase04-fixture-v1`) with honest provenance tracking (`lastIotFetchAt: null` for fixtures).
- Strict separation of database roles: administrative bootstrap, migration owner, and least-privilege runtime application user.
- OpenAPI 3.0 specification served at `/api/docs` and exported to `openapi.json`.

---

## 2. Prerequisites
- **Node.js**: v22.x LTS (tested on `v22.22.1`).
- **Docker Desktop**: Engine running in Linux container mode (`desktop-linux`, `linux/aarch64`).
- **PostgreSQL**: `postgres:17-bookworm` (containerized via `compose.phase04.yml`).

---

## 3. Quick Start & Runbook

### Step 1: Configuration
Ensure `.env.phase04.local` exists in the repository root (see `.env.phase04.example` for reference).

### Step 2: Start PostgreSQL
From the repository root:
```bash
docker compose --env-file .env.phase04.local -f compose.phase04.yml up -d --wait postgres
```

### Step 3: Bootstrap Database Roles
Provisions `gis_migration_owner` and `gis_app_runtime` with least privileges:
```bash
npm --prefix backend run db:bootstrap
```

### Step 4: Run TypeORM Migrations
Applies tables (`floors`, `device_bindings`, `device_display_overrides`, `catalogue_sync_state`) and seeds canonical Building E floors:
```bash
npm --prefix backend run db:migrate
```

To view migration status:
```bash
npm --prefix backend run db:migration:status
```

### Step 5: Import Initial Fixture Devices
Ingests the deterministic `initial` fixture scenario into Floor 4:
```bash
npm --prefix backend run fixtures:import -- --scenario=initial
```

### Step 6: Start Backend Application
For development:
```bash
npm --prefix backend run start:dev
```
For production / local build:
```bash
npm --prefix backend run build
npm --prefix backend run start:prod
```
The server listens on `http://127.0.0.1:3001`.
OpenAPI documentation is available at `http://127.0.0.1:3001/api/docs`.

---

## 4. Test Suite
Run the automated end-to-end integration test suite against the real PostgreSQL container:
```bash
npm --prefix backend run test:e2e
```

---

## 5. API Endpoints

| Method | Path | Description | Required Headers |
|---|---|---|---|
| `GET` | `/health/live` | Process liveness check | None |
| `GET` | `/health/ready` | DB connectivity and migration readiness | None |
| `GET` | `/api/v1/buildings/:buildingId/floors/:floorId/devices` | Read device catalogue & effective marker positions | None |
| `GET` | `/api/v1/devices/:deviceId` | Read device details & placement metadata | None |
| `PUT` | `/api/v1/devices/:deviceId/display-position` | Save custom display position override | `X-Expected-Placement-Revision: <int>` |
| `DELETE` | `/api/v1/devices/:deviceId/display-position` | Reset display position back to original source | `X-Expected-Placement-Revision: <int>` |

---

## 6. Maintenance & Backup

### Recreating Container without Data Loss
```bash
docker compose --env-file .env.phase04.local -f compose.phase04.yml up -d --force-recreate --wait postgres
```

### Logical Backup & Restore
Backup:
```bash
docker exec -i gis-uit-p04-dev-postgres-1 pg_dump -U gis_bootstrap -d gis_uit_dev -Fc -f /tmp/backup.dump
```
Restore into isolated test database:
```bash
docker exec -i gis-uit-p04-dev-postgres-1 psql -U gis_bootstrap -d postgres -c "CREATE DATABASE gis_uit_restore_test OWNER gis_migration_owner;"
docker exec -i gis-uit-p04-dev-postgres-1 pg_restore -U gis_bootstrap -d gis_uit_restore_test /tmp/backup.dump
```

