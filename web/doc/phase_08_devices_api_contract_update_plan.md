# Small Phase 08 — Adapt Source to Updated IoT `/api/v1/devices` Contract

> **Project:** GIS — UIT Building E Digital Twin  
> **Plan version:** 2026-09-24  
> **Primary implementation target:** NestJS backend + PostgreSQL device-catalogue/cache integration; update application-facing DTOs only where required.  
> **Authoritative API knowledge base:** `IoTBackend_API_HandOver.md` version `2026-09-24`.  
> **Important:** The handover is a complete current snapshot. Do **not** merge older IoT API handover files or delta notes into implementation logic.

---

## 0. Goal

Update the existing source so the application correctly consumes the new upstream contract for:

```text
GET /api/v1/devices
```

The upstream endpoint now:

1. accepts optional integer query parameter `floor_level`;
2. can return only devices installed on one requested floor;
3. returns `install_location.install_z` in addition to `install_floor_level`, `install_x`, and `install_y`;
4. documents `400 Invalid or missing query parameters` in addition to `401`;
5. still supports calling `/api/v1/devices` without `floor_level` to retrieve the full active-device catalogue.

The implementation must preserve the existing small-phase behavior around PostgreSQL caching/synchronization and the manual **“Tải lại danh sách thiết bị”** action, but adapt those flows to the new upstream contract.

This phase is an **integration-contract adaptation**, not a redesign of unrelated IoT features.

---

## 1. Non-negotiable safety boundary

The IoT backend belongs to the other team. Our application must not perform actions that modify it.

Allowed upstream operations for this work:

```text
GET /api/v1/devices
GET /api/v1/devices?floor_level=<integer>
GET /api/v1/devices/{dev_eui}
GET /api/v1/solar...
GET /api/v1/avc...
GET /api/v1/nfc...
```

For this task, only the `/devices` integration should need modification.

Do **not** add or call:

```text
POST
PUT
PATCH
DELETE
```

Do not:

- update device metadata upstream;
- update physical coordinates upstream;
- register/decommission devices upstream;
- probe undocumented endpoints;
- expose the Master Bearer Token to Next.js, Unity, logs, Git, PostgreSQL, or public error payloads.

Use mocks/fixtures for normal development and tests. A real upstream request, if needed at all, must be a minimal GET and only after local tests pass.

---

## 2. Contract delta the implementation must support

### 2.1 Optional floor filter

Current upstream request forms:

```http
GET /api/v1/devices
```

or:

```http
GET /api/v1/devices?floor_level=6
```

Contract:

```text
floor_level: optional integer
```

If omitted:

```text
return active devices across all floors
```

If supplied:

```text
return active devices installed on that upstream floor level
```

Negative values are valid for basement levels, e.g. `-1`.

### 2.2 Current list response location shape

```json
{
  "install_location": {
    "install_floor_level": 0,
    "install_x": 0,
    "install_y": 0,
    "install_z": 0
  }
}
```

`install_z` is now part of the documented `/devices` list response contract.

Do not invent coordinate units or Unity-axis meaning. Preserve the source value first.

### 2.3 New documented error

```text
400 Invalid or missing query parameters
```

The backend should reject malformed local floor filters before making an upstream request whenever possible.

### 2.4 Detail endpoint remains active

```text
GET /api/v1/devices/{dev_eui}
```

remains valid and in scope.

The 2026-09-24 API update only supplied a new schema for the list endpoint. Do not automatically make `install_z` mandatory for the detail endpoint. A detail parser may accept optional numeric `install_z` for forward compatibility.

---

## 3. Expected application behavior after this change

### 3.1 Normal floor load

Current intended application flow remains conceptually:

```text
User opens floor
    |
    v
NestJS checks PostgreSQL/cache freshness for that floor
    |
    +-- data present and fresh --> return cached application data
    |
    +-- missing/stale ----------> GET IoT /api/v1/devices?floor_level=<mapped floor>
                                    |
                                    v
                                  validate
                                    |
                                    v
                                  upsert source metadata into PostgreSQL
                                    |
                                    v
                                  return floor devices
```

Do not keep fetching the whole upstream catalogue and filtering locally when a valid upstream floor mapping is already known.

### 3.2 Manual refresh button

The existing button with tooltip:

```text
Tải lại danh sách thiết bị
```

must retain its behavior.

When the user refreshes the current floor:

```text
current application floor
    -> map to upstream floor_level
    -> GET /api/v1/devices?floor_level=<mapped value>
    -> validate/upsert
    -> update current floor result
```

A manual refresh of floor `6` must not trigger an unnecessary full-catalogue read unless existing product behavior explicitly requests a global refresh.

### 3.3 Full catalogue reads

Keep support for:

```http
GET /api/v1/devices
```

without a query parameter, but use it only in workflows that intentionally need all active devices.

Do not remove the parameterless call because it remains part of the current upstream contract.

---

## 4. Phase A — Repository audit before editing

The coding agent must inspect the actual repository before changing code.

### 4.1 Read repository instructions

Locate and read applicable:

```text
AGENTS.md
backend/package.json
backend configuration files
current database migrations/entities/schema
existing IoT integration code
current Small Phase 08 implementation/handoff if present
```

Do not rebuild the backend architecture or rename unrelated modules.

### 4.2 Find every impacted use of the old contract

Search for at least:

```text
/api/v1/devices
listDevices
install_location
install_x
install_y
install_floor_level
device catalogue
device sync
catalogue_sync_state
last_fetched
refresh devices
Tải lại danh sách thiết bị
```

Identify:

1. raw upstream DTO/type definitions;
2. runtime validation schemas;
3. read-only HTTP client/gateway;
4. upstream -> domain mapper;
5. PostgreSQL entity/repository fields;
6. catalogue sync/staleness logic;
7. floor-ID mapping logic;
8. application-facing DTO/API;
9. Next.js manual-refresh call path;
10. tests/fixtures based on the old response.

Record the actual paths in the implementation handoff. Do not assume the sample file layout in `IoTBackend_API_HandOver.md` exactly matches the repository.

---

## 5. Phase B — Update the upstream client contract

### B1. Extend list-device query input

Change the IoT device gateway/client from a no-argument-only list operation to an optional floor filter.

Conceptual interface:

```ts
interface IotDeviceListFilter {
  floorLevel?: number;
}

interface IotDeviceGateway {
  listDevices(filter?: IotDeviceListFilter): Promise<DeviceSourceMetadata[]>;
  getDevice(deviceId: string): Promise<DeviceSourceMetadata>;
}
```

Required serialization behavior:

```text
listDevices()
    -> GET /api/v1/devices

listDevices({ floorLevel: 6 })
    -> GET /api/v1/devices?floor_level=6

listDevices({ floorLevel: -1 })
    -> GET /api/v1/devices?floor_level=-1
```

Never produce:

```text
?floor_level=
?floor_level=undefined
?floor_level=NaN
?floor_level=G
```

### B2. Validate `floorLevel` locally

When supplied:

- it must be an integer;
- negative integer values are allowed;
- do not invent a min/max floor range unless the project has a separate explicit mapping/configuration;
- invalid input must fail before touching the IoT backend.

### B3. Keep the client read-only

Do not add generic methods such as:

```ts
request(method, path, body)
get(pathFromClient)
```

Keep allowlisted, typed methods only.

---

## 6. Phase C — Update response schemas and runtime validation

### C1. `/devices` list item

Current required location fields:

```ts
install_location: {
  install_floor_level: number;
  install_x: number;
  install_y: number;
  install_z: number;
}
```

For the **list endpoint**, `install_z` is part of the current documented contract.

Update:

- TypeScript DTO/interface;
- runtime schema validator;
- mocks/fixtures;
- mapper tests.

Do not silently default a missing list `install_z` to `0` just to make parsing succeed. A missing required field is contract drift and should follow the project's upstream-schema-error path.

### C2. `/devices/{dev_eui}` detail compatibility

Do not weaken current evidence by claiming the detail endpoint definitely changed too.

Recommended compatibility shape:

```ts
install_z?: number;
```

for detail parsing until its response is explicitly updated/documented.

If the repository currently shares one strict schema between list and detail, refactor minimally so:

```text
list   -> install_z required
detail -> install_z optional/tolerated
```

Do not copy the old list schema forward unchanged.

### C3. Preserve `meta` tolerance

Do not regress current tolerant handling of:

```json
{}
```

versus:

```json
{
  "count": 10,
  "truncated": true
}
```

unless newer evidence explicitly tightens the contract.

---

## 7. Phase D — Update normalized domain model

The application should preserve the new source coordinate without making the frontend dependent on upstream snake_case.

Conceptual model:

```ts
interface DeviceSourceMetadata {
  externalDeviceId: string;
  sourceDeviceType: string;
  sourceCreatedAt: string;
  sourceUpdatedAt: string;
  sourceLocation: {
    x: number;
    y: number;
    z?: number;
    floorLevel: number;
  };
  active: boolean;
  fetchedAt: string;
}
```

Mapping:

```text
install_x           -> sourceLocation.x
install_y           -> sourceLocation.y
install_z           -> sourceLocation.z
install_floor_level -> sourceLocation.floorLevel
```

For current list responses, `sourceLocation.z` should be populated.

Do not use `install_z` to redefine Unity axis orientation in this task. The coordinate-frame/unit mapping remains a separate concern unless the repository already contains an explicit mapper that can consume Z safely.

---

## 8. Phase E — Adapt PostgreSQL storage without losing source/custom separation

### E1. Inspect current schema first

Do not assume table/column names.

If source coordinates currently persist only:

```text
X
Y
floor
```

add support for source Z using the repository's existing migration strategy.

Conceptual field:

```text
source_install_z
```

or equivalent.

### E2. Migration requirements

If a migration is necessary:

- existing rows must remain valid;
- prefer nullable/backward-compatible storage for pre-update rows unless the current schema architecture provides a safer equivalent;
- do not backfill old devices with artificial `0` merely because the new upstream example shows zero;
- a successful refresh using the new list contract should populate Z from upstream.

### E3. Preserve display overrides

Do not overwrite or redesign user-adjusted icon positions merely because source metadata gained Z.

Keep the conceptual separation:

```text
IoT source position     = upstream physical/source metadata
application override    = user-adjusted display position
```

A source refresh must follow the existing override-preservation behavior.

---

## 9. Phase F — Adapt floor mapping and floor-scoped fetch flow

### F1. Do not pass viewer IDs directly upstream

Viewer/application IDs include values such as:

```text
G
1
2
...
12
```

The upstream API expects:

```text
integer floor_level
```

Use an existing centralized floor mapper if one exists.

Do **not** add this undocumented assumption solely for convenience:

```text
G -> 0
```

If the current repository already contains an explicitly approved mapping, reuse it. Otherwise:

- numeric floor IDs can be mapped only according to current project rules;
- keep `G` mapping as an explicit unresolved/configured case rather than silently guessing;
- surface a controlled application/configuration error rather than sending an invalid upstream query.

### F2. Use upstream floor filtering for floor loads

Once a floor has a valid upstream integer mapping:

```text
floor page / refresh
      |
      v
GET /api/v1/devices?floor_level=<mapped floor>
```

Do not:

```text
GET all devices -> filter in JavaScript
```

for normal floor-specific refresh unless a deliberate full-catalogue workflow requires it.

---

## 10. Phase G — Revisit cache/staleness semantics

The existing Small Phase 08 requirement is to consult PostgreSQL first and fetch upstream when data for the queried floor is missing/stale, while keeping manual refresh available.

The new floor-filtered API makes the synchronization unit explicitly floor-scoped.

### G1. Audit current sync-state representation

Determine whether freshness is stored:

```text
per device
per floor
or globally for the whole catalogue
```

### G2. Required correctness rule

A successful upstream refresh for floor `6` must **not** incorrectly mark floor `4`, floor `7`, or the entire catalogue as fresh.

If current code already scopes sync state by floor, preserve it.

If current code uses one global catalogue timestamp, modify the design minimally so the new per-floor fetch path has correct freshness semantics. Follow existing database conventions rather than introducing a parallel cache subsystem.

### G3. Empty floor response

An upstream success with:

```json
{
  "data": [],
  "meta": { ... }
}
```

is not automatically an error.

Handle it using the current catalogue reconciliation policy.

Do not introduce destructive deletion of local rows solely from absence in one scoped response unless the existing project design explicitly defines that behavior.

---

## 11. Phase H — Application-facing API and frontend compatibility

### H1. Preserve existing public routes where possible

Do not create a second redundant device-list API merely because upstream now supports `floor_level`.

If the application already has a route such as:

```text
GET /api/buildings/:buildingId/floors/:floorId/devices
```

adapt its internal fetch path.

If it has a different existing route, keep that route unless the current source architecture requires a documented breaking change.

### H2. Exposing Z

If the current application DTO already has a 3D source position, populate it.

If the public DTO currently exposes only 2D display coordinates:

- preserve/store source Z in backend/domain/database;
- do not redesign unrelated UI/Unity rendering just to expose Z;
- extend the public DTO only if the current marker/rendering path genuinely needs it and tests cover the change.

### H3. Manual refresh UX

Retain existing refresh-button behavior.

On upstream error (`400`, `401`, network/timeout, schema mismatch), preserve the project's existing visible failure notification behavior. Do not fail silently and do not expose token details.

---

## 12. Phase I — Error handling updates

Add/update explicit handling for `/devices`:

| Upstream result | Application interpretation |
| --- | --- |
| `200` | Validate current list schema, normalize, persist/cache according to flow. |
| `400` | Query/contract error; normally prevented by local floor validation. Sanitize. Do not retry blindly. |
| `401` | Server-to-server credential/integration failure. Never expose token. |
| timeout/network | Dependency failure according to existing `502/503` convention. |
| malformed/missing `install_z` in list item | Contract drift/schema validation failure; do not fabricate values silently. |

Do not convert upstream `401` into website-user `401` unless the existing application architecture explicitly does so for dependency failures.

---

## 13. Phase J — Test plan

Do not consider the adaptation complete without automated coverage for the contract delta.

### J1. Query serialization tests

Required:

```text
listDevices()                  -> /api/v1/devices
listDevices({ floorLevel: 6 }) -> /api/v1/devices?floor_level=6
listDevices({ floorLevel:-1 }) -> /api/v1/devices?floor_level=-1
```

Reject locally:

```text
NaN
1.5
"G"
empty string
undefined serialized as literal query value
```

### J2. List-schema tests

Current fixture must include:

```json
{
  "install_location": {
    "install_floor_level": 6,
    "install_x": 1.25,
    "install_y": -2.5,
    "install_z": 0.75
  }
}
```

Verify:

- parser accepts the current shape;
- mapper preserves X/Y/Z/floor;
- database write/update preserves Z;
- `fetchedAt` is local fetch time, not `last_updated_timestamp`.

Also test list contract drift:

```text
install_z missing
install_z wrong type
install_floor_level wrong type
```

### J3. Detail endpoint tests

Verify existing detail lookup still works.

Test both:

```text
detail payload without install_z
detail payload with optional install_z
```

until upstream detail documentation is explicitly updated.

### J4. Error tests

Include:

```text
/devices upstream 400
/devices upstream 401
network timeout
malformed response
```

Verify the token never appears in returned errors/log fixtures.

### J5. Floor-cache integration tests

At minimum:

```text
fresh floor data -> no upstream call
stale floor 6 -> exactly one floor_level=6 upstream call
missing floor 6 -> floor_level=6 upstream call
manual refresh floor 6 -> floor_level=6 upstream call even if cache is fresh
successful floor 6 refresh -> only floor 6 freshness state updated
floor 6 upstream failure -> floor 6 not falsely marked fresh
full-catalogue workflow -> floor_level omitted intentionally
```

### J6. Regression tests

Ensure this change does not break:

```text
GET /api/v1/devices/{dev_eui}
solar data retrieval
avc data retrieval
nfc data retrieval
device icon/filter UI
custom device-position override
existing floor navigation
```

---

## 14. Verification commands

Do not assume script names. Inspect `backend/package.json` and repository instructions first.

Run the existing equivalents of:

```text
backend lint/typecheck
backend unit tests
backend integration/e2e tests
backend production build
migration validation
```

If frontend DTO/API typing changes, also run the existing web lint/typecheck/build/tests that cover the changed client path.

Before any optional real upstream GET smoke test:

1. all mock tests must pass;
2. confirm only GET is used;
3. use one known floor/device only;
4. avoid repeated polling;
5. do not print the Bearer token;
6. report that a real-service request was executed and exactly which read endpoint was used.

A real upstream call is not required merely to claim code compilation/unit-test completion.

---

## 15. Acceptance criteria

The task is complete only when all applicable items below are true.

### Contract/client

- [ ] `GET /api/v1/devices` still works without a filter.
- [ ] `floor_level` is supported as an optional integer query.
- [ ] Floor-scoped requests use the upstream filter instead of full-catalogue local filtering when a mapping is available.
- [ ] Invalid floor filters are rejected locally.
- [ ] No upstream write method was added.

### Schema/domain

- [ ] `/devices` list validator requires numeric `install_z`.
- [ ] X/Y/Z/floor are preserved in the normalized source metadata.
- [ ] Detail lookup remains compatible and does not falsely require Z unless separately documented.
- [ ] `fetchedAt` remains distinct from upstream `last_updated_timestamp`.

### Database/cache

- [ ] PostgreSQL can preserve source Z if device metadata is persisted.
- [ ] Existing rows remain valid after migration.
- [ ] No fake Z backfill is introduced.
- [ ] Local display overrides remain separate from source coordinates.
- [ ] Refresh freshness/state is correct for the floor being fetched.

### UX/error handling

- [ ] Manual “Tải lại danh sách thiết bị” still works.
- [ ] Failed upstream refresh produces the existing visible application notification instead of silent failure.
- [ ] Upstream `400` is handled deliberately.
- [ ] Master token is not exposed in UI/errors/logs/source.

### Regression/safety

- [ ] `/devices/{dev_eui}` behavior remains intact.
- [ ] `solar`, `avc`, and `nfc` integration remains intact.
- [ ] No POST/PUT/PATCH/DELETE to the IoT backend exists in this change.
- [ ] Tests/build pass according to repository scripts.

---

## 16. Required implementation handoff from coding agent

After implementation, create/update an implementation handoff containing:

1. repository branch/commit/HEAD identity;
2. exact files changed;
3. actual IoT client/gateway signatures after implementation;
4. actual floor mapping used and source for that mapping;
5. DB migration/entity changes for Z, if any;
6. cache/sync-state changes, if any;
7. current application-facing route behavior;
8. tests added/updated;
9. exact commands run and pass/fail results;
10. whether any real IoT GET request was executed;
11. confirmation that no upstream mutation request was made;
12. remaining blockers/open questions, especially viewer `G` mapping or coordinate units/axes.

Do not claim runtime behavior was verified if only static build/unit tests were run.

---

## 17. Coding-agent execution summary

Use this sequence:

```text
1. Read IoTBackend_API_HandOver.md (2026-09-24).
2. Audit repository + AGENTS.md + existing Small Phase 08 implementation.
3. Find all old /devices assumptions.
4. Add optional floor_level support to the typed read-only client.
5. Add install_z to list response schema/mapping.
6. Keep detail install_z optional until separately documented.
7. Persist source Z if catalogue metadata is persisted.
8. Route floor load/manual refresh through floor-scoped upstream GET.
9. Ensure sync freshness is scoped correctly per floor.
10. Preserve custom display overrides and existing telemetry APIs.
11. Add contract-delta tests + regressions.
12. Run repository lint/test/build/migration checks.
13. Produce implementation handoff with evidence.
```

The implementation objective is to **adapt the existing system to the updated upstream read contract with the smallest safe change**, not to redesign the IoT architecture.
