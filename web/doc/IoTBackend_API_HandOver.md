# IoTBackend API HandOver

> **Project:** GIS — UIT Building E Digital Twin  
> **Purpose:** Authoritative handover for planner agents and coding agents integrating the application backend with the external IoT backend.  
> **Scope of this version:** Only the IoT API endpoints explicitly documented in `IoTBackend_API.md` and selected for the current small phase.  
> **Current upstream base URL:** `https://api.ttlab.manhthao.uk`  
> **Current integration mode:** Read-only from our NestJS backend to the IoT backend.  
> **Last source snapshot represented here:** 2026-09-21.

---

## 0. Read this first

This document exists so that future planner/coding agents can implement the IoT integration without rediscovering the current API contract or accidentally broadening scope.

The rules below are mandatory for the current small phase:

1. **Do not call the IoT backend directly from Next.js browser code or Unity WebGL.**
2. **The NestJS application backend is the only component allowed to hold the IoT bearer token and call the IoT backend.**
3. **Treat the upstream IoT backend as read-only in this small phase.**
4. **Do not implement or call `POST`, `PUT`, `PATCH`, or `DELETE` against the IoT backend.**
5. **Do not send any position/device update back to the IoT backend.**
6. **Do not expose, log, commit, persist in PostgreSQL, or return the master token to clients.**
7. **Only the endpoints documented in this file are in scope for implementation in this small phase.**
8. If the upstream Swagger exposes additional endpoints, they are **out of scope until explicitly documented and approved**.

Current in-scope upstream endpoints:

```text
GET /api/v1/devices
GET /api/v1/devices/{dev_eui}
```

---

## 1. System boundary

### 1.1 Application-side architecture

```text
Next.js / Unity WebGL
        |
        | HTTPS
        v
NestJS application backend
        |
        | server-to-server HTTPS
        | Authorization: Bearer <token>
        v
IoT backend
https://api.ttlab.manhthao.uk
```

### 1.2 Ownership boundary

Our application owns:

- Next.js UI.
- Unity WebGL viewer.
- NestJS application backend.
- PostgreSQL application database.
- Mapping/normalization between IoT data and application-domain data.
- Local display overrides for IoT marker positions.

The external IoT team owns:

- IoT backend.
- Device/network infrastructure.
- Upstream device metadata.
- Upstream device installation coordinates.
- Upstream authentication policy.

The application must not treat local display overrides as authoritative changes to the physical IoT system.

---

## 2. Authentication

The documented API responses include:

```text
401 Missing or invalid bearer token
```

Therefore, the documented authentication mechanism for these endpoints is a Bearer token:

```http
Authorization: Bearer <TOKEN>
```

The project owner currently possesses a **Master Bearer Token** supplied by the IoT team.

### 2.1 What “master token” means here

`Bearer` is the authentication mechanism: possession of the token allows the caller to authenticate with the permissions granted to that token.

`Master` is **not a standard HTTP/OAuth token type**. It is a name/role chosen by the IoT backend. From the available API document, the exact privilege scope is not documented.

Do **not** assume any of the following unless the IoT team explicitly confirms them:

- that the token is full administrator access;
- that it is read-only;
- that it never expires;
- that it is a JWT;
- that it may be safely used by client applications;
- that it is valid across production/test environments.

Because the token is named `Master`, treat it as a **high-value secret**.

### 2.2 Token storage requirements

Recommended local backend configuration:

```env
IOT_API_BASE_URL=https://api.ttlab.manhthao.uk
IOT_API_MASTER_TOKEN=<secret-value-owned-by-project-owner>
```

Recommended location:

```text
backend/.env.local
```

The real token must not be placed in:

```text
NEXT_PUBLIC_* variables
React state
Unity assets / ScriptableObject
StreamingAssets
web/public
PostgreSQL
Git repository
README / Markdown handover
Swagger examples
application logs
error responses sent to browser
```

Only the server-side IoT integration client should be allowed to access the token.

### 2.3 Preferred long-term security improvement

If the IoT backend supports scoped service credentials, request a dedicated **read-only integration token** for the GIS application after the integration contract stabilizes.

Desired principle:

```text
least privilege
```

For the current small phase, the required upstream capability is only:

```text
GET /api/v1/devices
GET /api/v1/devices/{dev_eui}
```

---

## 3. Upstream API contract

## 3.1 `GET /api/v1/devices`

### Purpose

List registered/active devices available from the IoT backend.

### Request

```http
GET /api/v1/devices
Authorization: Bearer <TOKEN>
Accept: application/json
```

### Parameters

None.

### Success response — `200`

Documented shape:

```json
{
  "data": [
    {
      "device_id": "string",
      "device_type": "string",
      "create_timestamp": "2026-09-21T07:35:35.887Z",
      "last_updated_timestamp": "2026-09-21T07:35:35.887Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    }
  ],
  "meta": {
    "count": 0,
    "truncated": true
  }
}
```

Actual response snapshot on 2026-09-21:

```json
{
  "data": [
    {
      "device_id": "70B3D57ED0073E9D",
      "device_type": "solar",
      "create_timestamp": "2026-09-20T19:09:17.355Z",
      "last_updated_timestamp": "2026-09-20T19:09:17.355Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    },
    {
      "device_id": "70B3D57ED0076947",
      "device_type": "solar",
      "create_timestamp": "2026-09-20T19:09:17.566Z",
      "last_updated_timestamp": "2026-09-20T19:09:17.566Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    },
    {
      "device_id": "70B3D57ED0076948",
      "device_type": "solar",
      "create_timestamp": "2026-09-20T19:09:17.773Z",
      "last_updated_timestamp": "2026-09-20T19:09:17.773Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    },
    {
      "device_id": "70B3D57ED0078FD9",
      "device_type": "solar",
      "create_timestamp": "2026-09-20T19:09:18.005Z",
      "last_updated_timestamp": "2026-09-20T19:09:18.005Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    },
    {
      "device_id": "70B3D57ED0078FEA",
      "device_type": "solar",
      "create_timestamp": "2026-09-20T19:09:18.225Z",
      "last_updated_timestamp": "2026-09-20T19:09:18.225Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    },
    {
      "device_id": "8cf9572000149bd3",
      "device_type": "avc",
      "create_timestamp": "2026-09-20T19:09:18.451Z",
      "last_updated_timestamp": "2026-09-20T19:09:18.451Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    },
    {
      "device_id": "8cf9572000149d1f",
      "device_type": "avc",
      "create_timestamp": "2026-09-20T19:09:18.690Z",
      "last_updated_timestamp": "2026-09-20T19:09:18.690Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    },
    {
      "device_id": "dummy01801182ed2814",
      "device_type": "nfc",
      "create_timestamp": "2026-09-20T19:09:18.918Z",
      "last_updated_timestamp": "2026-09-20T19:09:18.918Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    },
    {
      "device_id": "dummy025dac961b2431",
      "device_type": "nfc",
      "create_timestamp": "2026-09-20T19:09:19.142Z",
      "last_updated_timestamp": "2026-09-20T19:09:19.142Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    },
    {
      "device_id": "dummy0319d0f5a73511",
      "device_type": "nfc",
      "create_timestamp": "2026-09-20T19:09:19.365Z",
      "last_updated_timestamp": "2026-09-20T19:09:19.365Z",
      "install_location": {
        "install_x": 0,
        "install_y": 0,
        "install_floor_level": 0
      },
      "is_active": true
    }
  ],
  "meta": {
    "count": 10
  }
}
```

### Error response — `401`

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

Meaning documented by Swagger:

```text
Missing or invalid bearer token
```

---

## 3.2 `GET /api/v1/devices/{dev_eui}`

### Purpose

Retrieve metadata for one registered device.

### Request

```http
GET /api/v1/devices/{dev_eui}
Authorization: Bearer <TOKEN>
Accept: application/json
```

### Path parameter

| Name | Type | Required | Meaning |
| --- | --- | --- | --- |
| `dev_eui` | `string` | Yes | Device identifier; corresponds to upstream `device_id`. |

Important implementation rule: even though the path parameter is named `dev_eui`, treat its value as an **opaque string identifier**. Do not enforce a LoRa-EUI/hex-only format because actual documented data contains IDs such as `dummy01801182ed2814`.

### Success response — `200`

```json
{
  "data": {
    "device_id": "string",
    "device_type": "string",
    "create_timestamp": "2026-09-21T07:39:35.910Z",
    "last_updated_timestamp": "2026-09-21T07:39:35.910Z",
    "install_location": {
      "install_x": 0,
      "install_y": 0,
      "install_floor_level": 0
    },
    "is_active": true
  },
  "meta": {
    "count": 0,
    "truncated": true
  }
}
```

Actual response snapshot on 2026-09-21:

```json
{
  "data": {
    "device_id": "70B3D57ED0073E9D",
    "device_type": "solar",
    "create_timestamp": "2026-09-20T19:09:17.355Z",
    "last_updated_timestamp": "2026-09-20T19:09:17.355Z",
    "install_location": {
      "install_x": 0,
      "install_y": 0,
      "install_floor_level": 0
    },
    "is_active": true
  },
  "meta": {}
}
```

### Error response — `401`

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

Meaning:

```text
Missing or invalid bearer token
```

### Error response — `404`

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

Meaning:

```text
No device registered with that dev_eui
```

---

## 4. Upstream schema reference

The following TypeScript representation reflects the documented upstream payload at this snapshot.

```ts
export interface IoTUpstreamDevice {
  device_id: string;
  device_type: string;
  create_timestamp: string;
  last_updated_timestamp: string;
  install_location: {
    install_x: number;
    install_y: number;
    install_floor_level: number;
  };
  is_active: boolean;
}

export interface IoTUpstreamMeta {
  count?: number;
  truncated?: boolean;
  [key: string]: unknown;
}

export interface IoTUpstreamDeviceListResponse {
  data: IoTUpstreamDevice[];
  meta: IoTUpstreamMeta;
}

export interface IoTUpstreamDeviceDetailResponse {
  data: IoTUpstreamDevice;
  meta: IoTUpstreamMeta;
}

export interface IoTUpstreamErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
```

### 4.1 Why `meta` fields are optional

Swagger examples show:

```json
{
  "count": 0,
  "truncated": true
}
```

but actual responses observed on 2026-09-21 include both:

```json
{}
```

and:

```json
{
  "count": 10
}
```

Therefore coding agents must not require both `count` and `truncated` to exist.

---

## 5. Observed values and current limitations

### 5.1 `device_type`

Observed actual values in the documented response:

```text
solar
avc
nfc
```

Do not convert these observed values into a closed compile-time enum unless the IoT team publishes a formal enum contract.

Recommended handling:

```ts
sourceDeviceType: string;
```

A separate mapping layer may later map upstream strings to application categories.

Do not infer what `avc` means from its name; the supplied API document does not define it.

### 5.2 Device identifier

Observed examples include:

```text
70B3D57ED0073E9D
8cf9572000149bd3
dummy01801182ed2814
```

Therefore:

```ts
deviceId: string;
```

must be treated as opaque.

Do not enforce:

- uppercase hex;
- lowercase hex;
- fixed length;
- UUID format;
- numeric format.

### 5.3 Installation location

Current documented fields:

```text
install_x
install_y
install_floor_level
```

Current actual snapshot has:

```text
install_x = 0
install_y = 0
install_floor_level = 0
```

for every listed device.

This proves that the location fields exist in the schema, but does **not** prove that actual calibrated/device-specific location data has been populated.

Important rules:

- Do not interpret `install_floor_level = 0` as viewer floor `G` without an explicit mapping contract.
- Do not treat `(0,0)` as a usable device position merely because it is syntactically valid.
- Do not write local custom display coordinates back into these upstream fields.
- Upstream position and application display override remain separate concepts.

### 5.4 Timestamp distinction

Upstream provides:

```text
create_timestamp
last_updated_timestamp
```

Our application should additionally create its own:

```text
fetchedAt
```

These are different concepts.

```text
sourceCreatedAt  <- create_timestamp
sourceUpdatedAt  <- last_updated_timestamp
fetchedAt        <- time our NestJS successfully fetched/processed the upstream response
```

Never derive `fetchedAt` by copying `last_updated_timestamp`.

---

## 6. Recommended application-domain model

The application should not expose the IoT backend schema directly to Next.js/Unity.

Recommended normalized representation:

```ts
export interface DeviceSourceMetadata {
  externalDeviceId: string;

  sourceDeviceType: string;

  sourceCreatedAt: string;
  sourceUpdatedAt: string;

  sourceLocation: {
    x: number;
    y: number;
    floorLevel: number;
  };

  active: boolean;

  fetchedAt: string;
}
```

Mapping:

| IoT upstream | Application domain |
| --- | --- |
| `device_id` | `externalDeviceId` |
| `device_type` | `sourceDeviceType` |
| `create_timestamp` | `sourceCreatedAt` |
| `last_updated_timestamp` | `sourceUpdatedAt` |
| `install_location.install_x` | `sourceLocation.x` |
| `install_location.install_y` | `sourceLocation.y` |
| `install_location.install_floor_level` | `sourceLocation.floorLevel` |
| `is_active` | `active` |
| local application time | `fetchedAt` |

This normalized model protects our frontend/domain code if the IoT provider later changes field naming or adds transport-specific metadata.

---

## 7. Recommended NestJS bridge

## 7.1 Integration interface

Recommended application-facing abstraction:

```ts
export interface IotDeviceGateway {
  listDevices(): Promise<DeviceSourceMetadata[]>;
  getDevice(deviceId: string): Promise<DeviceSourceMetadata>;
}
```

Do not expose a generic unrestricted proxy such as:

```ts
request(method: string, path: string, body?: unknown)
```

because that makes it too easy for application code to call unsupported/mutating IoT endpoints.

## 7.2 Suggested source layout

```text
backend/src/integrations/iot/
├── iot.module.ts
├── config/
│   └── iot.config.ts
├── client/
│   ├── iot-readonly-http.client.ts
│   └── iot-auth.provider.ts
├── devices/
│   ├── iot-device.gateway.ts
│   ├── iot-device.mapper.ts
│   ├── iot-device.schemas.ts
│   └── iot-device.types.ts
└── errors/
    └── iot-error.mapper.ts
```

The exact paths may be adapted to the repository's existing NestJS conventions. Do not restructure unrelated modules solely to match this document.

## 7.3 Read-only HTTP client policy

For this small phase, the IoT HTTP client should only expose:

```ts
listDevices()
getDevice(deviceId)
```

Recommended internal allowlist:

```text
GET /api/v1/devices
GET /api/v1/devices/{dev_eui}
```

Do not implement in this bridge:

```text
POST
PUT
PATCH
DELETE
```

against the upstream IoT host.

This is both a scope constraint and a safety control.

---

## 8. PostgreSQL integration guidance

The existing project requirement is to preserve upstream/original location separately from local display override.

A reasonable storage model for the IoT source metadata in the application database should preserve at least these concepts:

```text
external_device_id
source_device_type
source_install_x
source_install_y
source_floor_level
source_is_active
source_created_at
source_updated_at
last_fetched_at
```

Optional compatibility/audit field:

```text
raw_metadata jsonb
```

The actual SQL table/column names are not mandated by this handover; coding agents must align with the existing Phase 04 schema and migrations.

### Never store

```text
master token
Authorization header
Bearer token value
```

in the PostgreSQL application database.

---

## 9. Device position and display override

The application has two distinct concepts:

```text
upstream physical/source location
                  +
application display override
```

Recommended conceptual flow:

```text
IoT backend
  install_x/install_y/install_floor_level
        |
        v
source device metadata in PostgreSQL
        |
        +---------------------------+
        |                           |
        v                           v
coordinate mapping           custom display override
        |                           |
        +------------+--------------+
                     v
              displayed marker
```

Do not overwrite source location when the user drags an icon for presentation purposes.

Do not call the IoT backend to update coordinates in this small phase.

---

## 10. Application API recommendation

The frontend should consume our NestJS API rather than the upstream API.

Possible application-facing endpoints:

```http
GET /api/devices
GET /api/devices/:deviceId
```

or, once floor mapping becomes reliable:

```http
GET /api/buildings/:buildingId/floors/:floorId/devices
```

The exact public endpoint naming remains an application design decision and is not defined by the IoT backend document.

A future floor-scoped endpoint should be implemented in our backend through mapping/filtering from stored/source metadata rather than assuming the upstream backend has a floor query endpoint.

---

## 11. Error handling

Known upstream responses:

| Upstream condition | Status | Recommended application treatment |
| --- | ---: | --- |
| Device list/detail success | `200` | Validate, normalize, return/use data. |
| Missing/invalid bearer token | `401` | Treat as upstream integration/auth failure; do not expose token details to browser. |
| Device not registered | `404` | Map to application `DeviceNotFound` / appropriate `404`. |
| Timeout/network error | Unknown by current document | Treat as upstream unavailable, typically `502`/`503` at our API boundary. |
| Unexpected schema | Unknown | Reject/flag response; do not silently invent missing values. |

Do not return messages such as:

```text
"IoT master token is invalid"
```

to the browser if a sanitized integration error is sufficient.

Logging must redact authorization material.

---

## 12. Runtime validation requirements

Coding agents should perform runtime validation of upstream JSON rather than relying only on TypeScript compile-time interfaces.

Important validation behavior:

- `device_id`: required string.
- `device_type`: required string, but open vocabulary.
- timestamps: required strings matching/parsable as expected ISO-8601 timestamps.
- `install_location`: required object according to current documented schema.
- `install_x`, `install_y`, `install_floor_level`: numeric.
- `is_active`: boolean.
- `meta`: object, with optional/unknown fields tolerated.

Do not reject a response solely because `meta.count` or `meta.truncated` is absent.

Do not convert unknown `device_type` values to errors by default.

---

## 13. Current small-phase implementation scope

### In scope

- Server-side IoT API configuration.
- Bearer-token authentication from NestJS.
- Read-only IoT HTTP client.
- `GET /api/v1/devices` integration.
- `GET /api/v1/devices/{dev_eui}` integration.
- Runtime response validation.
- Mapping from upstream snake_case schema to application-domain schema.
- Appropriate sanitized error mapping.
- Optional/local synchronization of source metadata into PostgreSQL according to the existing Phase 04 schema.
- Application API(s) for Next.js/Unity to consume normalized device metadata.
- Tests using mocks/fixtures based on the documented payload.

### Explicitly out of scope unless a later document adds a contract

- sensor telemetry readings;
- solar telemetry readings;
- water-meter readings;
- access history;
- NFC/RF-UHF event/webhook ingestion;
- camera data;
- telemetry history APIs;
- device creation/update/deletion;
- write-back of physical location;
- device registration;
- any other Swagger endpoint not documented in this handover.

---

## 14. Safety rules for planner/coding agents

| Operation against IoT backend | Current permission |
| --- | --- |
| `GET /api/v1/devices` | Allowed for implementation/integration testing when explicitly authorized to run against the real service. |
| `GET /api/v1/devices/{dev_eui}` | Allowed for implementation/integration testing when explicitly authorized to run against the real service. |
| `POST` to IoT backend | Prohibited in this small phase. |
| `PUT` to IoT backend | Prohibited. |
| `PATCH` to IoT backend | Prohibited. |
| `DELETE` from IoT backend | Prohibited. |
| Update upstream device metadata | Prohibited. |
| Update upstream coordinates | Prohibited. |
| Register upstream devices | Prohibited. |
| Probe/brute-force device IDs | Prohibited. |
| Expose token to client | Prohibited. |
| Log token | Prohibited. |
| Commit token | Prohibited. |

Planner agents should preserve these constraints in every implementation plan.

Coding agents should encode these constraints in the integration surface, not rely only on comments/convention.

---

## 15. Safe testing strategy

Preferred test sequence:

```text
1. Unit test schemas/mappers with local fixtures
2. Unit test HTTP client using mocked responses
3. Integration test NestJS application API with mocked IoT backend
4. Only when explicitly approved, perform minimal real GET checks
5. Never use mutation endpoints for testing this phase
```

Useful fixture cases:

```text
normal solar device
normal avc device
normal nfc/dummy ID device
meta = {}
meta = { count: 10 }
unknown device_type
all-zero install_location
401 upstream response
404 upstream response
malformed upstream response
network timeout
```

Real upstream requests should not be needed for most coding-agent work.

---

## 16. Facts vs unresolved items

### Confirmed by the supplied API document

- Base host: `https://api.ttlab.manhthao.uk`.
- Bearer authentication is required by the documented device endpoints.
- Project owner has a Master Bearer Token.
- `GET /api/v1/devices` exists and requires no request parameters.
- `GET /api/v1/devices/{dev_eui}` exists.
- `{dev_eui}` corresponds to the returned `device_id` concept.
- Device metadata includes type, creation/update timestamps, installation location, and active flag.
- `401` error shape is documented.
- Detail endpoint documents `404` for an unknown device.
- Actual responses on 2026-09-21 include `solar`, `avc`, and `nfc` device types.
- Actual device IDs are not consistently strict hexadecimal EUI-looking values.
- Actual installation coordinates/floor are all zero in the supplied snapshot.

### Still unresolved / do not invent

- Exact privilege scope of the Master Bearer Token.
- Token expiry/rotation format.
- Whether a scoped read-only token is available.
- Formal enum/dictionary of `device_type`.
- Meaning of `avc`.
- Whether `install_floor_level = 0` means ground floor or simply default/unassigned.
- Coordinate units and axis conventions.
- Calibration and mapping from IoT coordinates into Unity floor-local/world coordinates.
- Whether current zero coordinates will later be populated.
- Pagination semantics, if any.
- Formal semantics of `meta.truncated`.
- Rate limits/SLA/timeouts.
- Additional API endpoints not included in `IoTBackend_API.md`.

---

## 17. Quick reference for coding agents

### Upstream DTO

```ts
interface IoTUpstreamDevice {
  device_id: string;
  device_type: string;
  create_timestamp: string;
  last_updated_timestamp: string;
  install_location: {
    install_x: number;
    install_y: number;
    install_floor_level: number;
  };
  is_active: boolean;
}
```

### Read operations

```text
GET /api/v1/devices
GET /api/v1/devices/{dev_eui}
```

### Auth

```http
Authorization: Bearer <IOT_API_MASTER_TOKEN>
```

### Non-negotiable implementation rules

```text
server side only
read-only upstream
no token in client
no token in Git
no token in DB
no token in logs
opaque device ID
open device_type string
optional meta fields
source timestamps != fetchedAt
zero location != calibrated location
floor 0 != automatically viewer G
no upstream write-back
```

---

## 18. Source and maintenance rule

Primary source for this version:

```text
IoTBackend_API.md
snapshot/actual responses recorded on 2026-09-21
```

This handover intentionally does **not** reproduce undocumented Swagger endpoints from memory or inference.

When the project owner adds another IoT endpoint to the active small phase:

1. add the raw endpoint/method;
2. record all parameters;
3. record documented response codes;
4. record documented schema;
5. add an actual response sample if safely available;
6. state whether the operation is read-only or mutating;
7. add normalized application DTO mapping;
8. add error handling;
9. update the in-scope/out-of-scope sections;
10. keep the real bearer token out of this file.

Do not silently replace this document with assumptions from the public Swagger UI. The documented snapshot plus explicitly approved updates are the implementation handover source for the current phase.

