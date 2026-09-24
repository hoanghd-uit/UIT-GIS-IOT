# IoTBackend API HandOver

> **Project:** GIS — UIT Building E Digital Twin  
> **Document role:** Single authoritative IoTBackend API handover / knowledge base for planner agents and coding agents.  
> **Version:** 2026-09-24  
> **Supersedes:** All earlier copies of `IoTBackend_API_HandOver.md`. Do **not** merge this file with yesterday's handover; this file already contains the complete current contract needed for the active small phase.  
> **Current small-phase scope:** Device catalogue, per-device metadata lookup, plus type-specific data retrieval for `solar`, `avc`, and `nfc` devices.  
> **Current upstream base URL:** `https://api.ttlab.manhthao.uk`  
> **Authentication:** Bearer token; project owner holds a Master Bearer Token.  
> **Integration mode:** Read-only server-to-server calls from NestJS.  
> **Important:** The public Swagger contains more APIs than this handover. Only the five GET endpoints explicitly documented here are approved for this small phase.

---

## 0. Read this first

This document is intended to let a future planner/coding agent answer implementation questions without rediscovering the IoT API contract and without accidentally broadening access to the external IoT system.

### 0.1 Mandatory integration rules

1. **Next.js browser code and Unity WebGL must not call the IoT backend directly.**
2. **NestJS is the only application component allowed to hold the IoT bearer token and call the IoT backend.**
3. **The upstream IoT backend is read-only from our application in this small phase.**
4. **Do not implement or call `POST`, `PUT`, `PATCH`, or `DELETE` against the IoT backend.**
5. **Do not update device metadata, coordinates, device registration, or physical state on the IoT backend.**
6. **Do not expose, log, commit, persist in PostgreSQL, or return the Master Bearer Token to clients.**
7. **Do not probe undocumented endpoints or brute-force device identifiers.**
8. **Do not assume fields marked `Unconfirmed. Pending hardware team review` have stable physical meaning yet.**
9. **Do not silently invent units, enum values, coordinate mapping, time windows, or device-type behavior not present in this handover.**
10. Additional Swagger endpoints remain out of scope until the project owner explicitly adds them to this handover/current phase.

### 0.2 Current in-scope upstream endpoints

```text
GET /api/v1/devices
GET /api/v1/devices/{dev_eui}
GET /api/v1/solar
GET /api/v1/avc
GET /api/v1/nfc
```

All five are read operations.

### 0.3 Current capability summary

| Endpoint | Device/domain | Required input | Main output | Mutation risk |
| --- | --- | --- | --- | --- |
| `GET /api/v1/devices` | Registered active devices | Optional query `floor_level` | Device catalogue + 3D installation metadata (`x/y/z`) | Read-only |
| `GET /api/v1/devices/{dev_eui}` | One registered device | Path `dev_eui` (`device_id`) | One device's metadata | Read-only |
| `GET /api/v1/solar` | `solar` | `dev_eui`, `start`, `stop`; optional `limit` | Solar/environment/radio readings | Read-only |
| `GET /api/v1/avc` | `avc` = water meter | `dev_eui`, `start`, `stop`; optional `limit` | Water-meter + LoRaWAN readings | Read-only |
| `GET /api/v1/nfc` | `nfc` door scanner | `dev_eui`, `start`, `stop`; optional `limit` | NFC door scan events | Read-only |

### 0.4 Authority of this file

Treat this file as the **complete current contract snapshot** for the active small phase. A planner/coding agent should be able to implement against this file without opening or merging older handover versions.

Current approved endpoint set:

```text
GET /api/v1/devices
GET /api/v1/devices/{dev_eui}
GET /api/v1/solar
GET /api/v1/avc
GET /api/v1/nfc
```

If a future API document adds or changes information, update **this same file in place** so that it remains the single source of truth. Do not make agents reconstruct the current contract from a chain of delta documents.

---

## 1. System boundary

### 1.1 Application-side architecture

```text
Next.js / Unity WebGL
        |
        | our application API
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

- Next.js UI and dashboard.
- Unity WebGL viewer and IoT marker interactions.
- NestJS application backend.
- PostgreSQL application database.
- Device-type routing between our domain and the upstream read APIs.
- Mapping/normalization between IoT payloads and our application-domain payloads.
- Local display overrides for IoT marker positions.
- Local professor/card mapping if/when the NFC feature uses that project data.

The external IoT team owns:

- IoT backend and its API contract.
- Device/network infrastructure.
- ChirpStack/LoRaWAN ingestion represented in the API payloads.
- Upstream device metadata and installation coordinates.
- Upstream time-series/history data.
- Upstream authentication policy.
- Hardware semantics that are still marked pending review.

### 1.3 Source of truth boundary

```text
Device/source metadata and IoT readings     -> IoT backend
Application display overrides              -> our PostgreSQL
Application user/profile/dashboard data    -> our PostgreSQL
Raw historical telemetry source            -> IoT-side system unless a later design explicitly copies/caches it
```

Do not treat a local display override as a change to the physical IoT installation.

---

## 2. Authentication and Master Bearer Token

The documented API error is:

```text
401 Missing or invalid bearer token
```

The request authentication shape is therefore:

```http
Authorization: Bearer <TOKEN>
```

The project owner possesses a **Master Bearer Token** supplied by the IoT team.

### 2.1 What `Bearer` means

A bearer token is a credential where possession of the token is sufficient to authenticate with whatever permissions the server has assigned to that token.

Conceptually:

```text
NestJS
  |
  | Authorization: Bearer <secret>
  v
IoT backend
```

### 2.2 What `Master` means here

`Master` is **not** a standard HTTP/OAuth token type. It is a role/name chosen by this IoT system.

The current source does not document the exact token scope. Do not assume any of the following:

- full administrator access;
- read-only access;
- write access;
- token expiry behavior;
- token rotation behavior;
- JWT format;
- environment scope;
- production/test equivalence.

Because the credential is named `Master`, handle it as a **high-value secret** even though this application only uses read endpoints.

### 2.3 Token storage requirements

Recommended server-side configuration placeholder:

```env
IOT_API_BASE_URL=https://api.ttlab.manhthao.uk
IOT_API_MASTER_TOKEN=<secret-value-owned-by-project-owner>
```

A repository may use a different environment-file convention; follow the existing backend configuration system. The real token must not be placed in:

```text
NEXT_PUBLIC_* variables
React state
browser JavaScript
Unity assets / ScriptableObject
Unity StreamingAssets
web/public
PostgreSQL
Git repository
README / Markdown handover
Swagger examples
application logs
client-visible error responses
```

Only the server-side IoT integration client should be allowed to read the token.

### 2.4 Preferred long-term security improvement

If the IoT backend supports scoped service credentials, request a dedicated GIS **read-only service token** restricted to the five approved GET capabilities.

This is a least-privilege improvement, not a requirement to block the current phase.

---

## 3. Common request/response conventions

### 3.1 Common telemetry/history query parameters

`/solar`, `/avc`, and `/nfc` share the same query structure.

| Parameter | Type | Required | Contract |
| --- | --- | ---: | --- |
| `dev_eui` | `string` | Yes | Device identifier used to query the type-specific data endpoint. In this source it corresponds to the device identifier from the catalogue. |
| `start` | ISO-8601 date-time string | Yes | Inclusive range start. Must be strictly before `stop`. |
| `stop` | ISO-8601 date-time string | Yes | Inclusive range end. Must be strictly after `start`. |
| `limit` | integer | No | Max rows. Default `1000`; hard cap `10000`. |

Generic request shape:

```http
GET /api/v1/<type>?dev_eui=<device-id>&start=<iso-8601>&stop=<iso-8601>&limit=<optional-int>
Authorization: Bearer <TOKEN>
Accept: application/json
```

### 3.2 Ordering and limit semantics

The source explicitly states for the three type-specific APIs:

- results are ordered **newest first**;
- default `limit` is `1000`;
- hard cap is `10000`;
- when the cap/limit truncates a range, the most recent rows are retained and older rows are dropped.

Implications for our application:

- do not assume ascending chronological order;
- if a chart requires oldest-to-newest order, transform the already-fetched result in our backend/frontend layer;
- do not request `10000` by default just because it is allowed;
- do not silently use an unbounded/all-history range because `start` and `stop` are mandatory.

### 3.3 Common response envelope

The documented success responses use:

```ts
export interface IoTUpstreamListResponse<T> {
  data: T[];
  meta: IoTUpstreamMeta;
}

export interface IoTUpstreamMeta {
  count?: number;
  truncated?: boolean;
  [key: string]: unknown;
}
```

The documented error envelope is:

```ts
export interface IoTUpstreamErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
```

### 3.4 Why `meta` is intentionally tolerant

Swagger/document examples show:

```json
{
  "count": 0,
  "truncated": true
}
```

Earlier actual device responses included both:

```json
{}
```

and:

```json
{
  "count": 10
}
```

Therefore our runtime parser should require `meta` to be an object when supplied by the documented endpoint, but should not fail only because `count` or `truncated` is missing.

The exact semantic guarantee of `meta.truncated` is not separately defined in the source. Do not build critical logic that depends on undocumented behavior of that flag alone.

### 3.5 Common documented errors for type-specific APIs

For `/solar`, `/avc`, and `/nfc`:

```text
400 Invalid or missing query parameters
401 Missing or invalid bearer token
```

Error body:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

---

## 4. Device identity semantics — read carefully

Several fields use similar names but are not interchangeable.

### 4.1 Catalogue identity

From `GET /api/v1/devices`:

```text
device_id
```

is the catalogue device identifier. For the current type-specific API queries, this is the value to use as the `dev_eui` query parameter unless a future contract states otherwise.

Treat it as an **opaque string**.

Do not enforce:

- uppercase hex;
- lowercase hex;
- fixed length;
- UUID format;
- numeric format.

Earlier observed examples included EUI-looking IDs and `dummy...` IDs.

### 4.2 `solar.device_id` is NOT the same concept

Inside a `/api/v1/solar` reading:

```text
dev_eui     = queried device identifier
device_id   = friendly device name assigned in the LoRaWAN network/application server
```

This is a critical collision in naming. Do not overwrite or confuse the catalogue ID with `solar.device_id`.

Recommended adapter names:

```ts
sourceDeviceId      // catalogue device_id / telemetry dev_eui
networkDeviceName   // solar device_id
```

### 4.3 AVC identity fields

Inside `/api/v1/avc`:

```text
dev_eui      = stable query identifier represented by the API
dev_addr     = short-lived LoRaWAN session address; different from dev_eui
device_name  = ChirpStack friendly device name
meter_sn     = physical water meter serial number
```

Do not use `dev_addr` as the application primary device ID.

Do not replace `dev_eui` with `meter_sn` unless a later mapping contract explicitly requires that.

### 4.4 NFC identity fields

Inside `/api/v1/nfc`:

```text
dev_eui            = scanning door unit identifier
detected_card_id   = scanned NFC card identifier
batch_id           = upload/transmission batch identifier
```

`batch_id` is explicitly **not** a card ID and **not** a person ID.

If the application later maps a scan to a lecturer, the likely application-side mapping input is `detected_card_id`, but the actual card-to-person mapping contract must come from our PostgreSQL/profile design. Do not infer a person directly from `batch_id` or `dev_eui`.

---

## 5. `GET /api/v1/devices`

### 5.1 Purpose

List active devices registered in the IoT backend. The endpoint can now optionally filter the upstream catalogue by installation floor.

### 5.2 Request

All active devices:

```http
GET /api/v1/devices
Authorization: Bearer <TOKEN>
Accept: application/json
```

Only devices installed on one upstream floor level:

```http
GET /api/v1/devices?floor_level=<integer>
Authorization: Bearer <TOKEN>
Accept: application/json
```

### 5.3 Parameters

| Parameter | Type | Required | Contract |
| --- | --- | ---: | --- |
| `floor_level` | integer | No | Filters the returned active-device list to devices installed on that floor. Omit it to list devices on every floor, preserving the previous endpoint behavior. |

Important interpretation rules:

- `floor_level` is an **upstream building-floor integer**, not automatically the same thing as the viewer's string `floorId`.
- Negative floor values are valid upstream floor levels for basement floors (for example `-1`).
- The supplied contract does not define how viewer `G` maps to an upstream integer. Do not hard-code `G -> 0` unless the project has an explicit mapping elsewhere.
- Validate the query as an integer before making the upstream request. The source does not document a numeric min/max range.

### 5.4 Success response — `200`

Current documented shape as of 2026-09-24:

```json
{
  "data": [
    {
      "device_id": "string",
      "device_type": "string",
      "create_timestamp": "2026-09-24T10:32:48.074Z",
      "last_updated_timestamp": "2026-09-24T10:32:48.075Z",
      "install_location": {
        "install_floor_level": 0,
        "install_x": 0,
        "install_y": 0,
        "install_z": 0
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

### 5.5 Field semantics

| Field | Type | Meaning / constraint |
| --- | --- | --- |
| `device_id` | `string` | Upstream device identifier; treat as opaque. Used as `dev_eui` when querying the corresponding type-specific API in this small phase. |
| `device_type` | `string` | Device type. Current small-phase routes cover `solar`, `avc`, `nfc`. Keep parser open to unknown future values. |
| `create_timestamp` | date-time string | Upstream record creation timestamp. |
| `last_updated_timestamp` | date-time string | Upstream metadata update timestamp. Not the same as our `fetchedAt`. |
| `install_location.install_floor_level` | integer | Upstream building floor on which the device is installed. Negative values are basement levels. Viewer-floor mapping remains an application concern. |
| `install_location.install_x` | number | Source installation X coordinate. Unit/axis convention is not documented here. |
| `install_location.install_y` | number | Source installation Y coordinate. Unit/axis convention is not documented here. |
| `install_location.install_z` | number | Source installation Z coordinate. Unit/axis convention and relation to Unity axes are not documented here. Preserve it without inventing physical semantics. |
| `is_active` | boolean | Whether the device is active. `false` means soft-deleted/decommissioned; past readings still link to this record, but it will not show up in the default active-device list. |

### 5.6 Error responses

`400 Invalid or missing query parameters`:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

For this endpoint, the currently documented query parameter is optional `floor_level`; malformed/invalid query input must be treated as a contract/query error. Prevent invalid local values before calling upstream.

`401 Missing or invalid bearer token`:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

### 5.7 Earlier executed response snapshot and compatibility note

An actual API execution captured on 2026-09-21 returned 10 active devices (`5 x solar`, `2 x avc`, `3 x nfc`) and demonstrated that catalogue IDs may be EUI-looking strings or `dummy...` identifiers.

That executed snapshot **predates the current 2026-09-24 `/devices` contract**. In particular, the old snapshot did not include `install_z` and was captured before `floor_level` filtering was documented. Therefore:

- keep it only as historical evidence for identity/device-type observations;
- do **not** use the old payload as the authoritative fixture for the current `/devices` response schema;
- new mocks/tests for `/devices` must include `install_z`;
- floor-scoped behavior must be tested with the optional `floor_level` query.

### 5.8 Planner/coding interpretation

When the application already knows which floor it is loading, prefer the scoped upstream read:

```text
GET /api/v1/devices?floor_level=<mapped upstream floor integer>
```

rather than fetching every active device and filtering locally. This reduces unnecessary payload/read load and aligns with the upstream contract.

Use the unfiltered `GET /api/v1/devices` only when the application intentionally needs the complete active catalogue (for example an explicit full-catalogue synchronization flow).

Do not pass a frontend/viewer floor string directly to upstream. Resolve it through the application's floor-ID mapping first.

---

## 6. `GET /api/v1/devices/{dev_eui}`

### 6.1 Purpose

Retrieve metadata for one registered device by its device identifier.

This endpoint is part of the current approved API set and remains in scope for the active small phase.

### 6.2 Request

```http
GET /api/v1/devices/{dev_eui}
Authorization: Bearer <TOKEN>
Accept: application/json
```

### 6.3 Path parameter

| Parameter | Type | Required | Meaning |
| --- | --- | ---: | --- |
| `dev_eui` | `string` | Yes | Device identifier. The current contract maps this identifier to catalogue `device_id`. Treat it as an opaque string rather than enforcing a LoRa EUI format. |

### 6.4 Success response — `200`

Documented schema:

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

Use the previously documented detail-device shape for this endpoint. The 2026-09-24 update only supplied a new `/devices` list schema, so do not claim that detail lookup now requires `install_z`. A forward-compatible runtime parser may accept optional numeric `install_z` if the backend starts returning it. Treat `meta` as tolerant/optional-field metadata because the captured executed response returned an empty object.

### 6.5 Actual executed response captured on 2026-09-21

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

This is an executed-response snapshot, not a guarantee about the current live value of that device or its coordinates.

### 6.6 Errors

`401 Missing or invalid bearer token`:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

`404 No device registered with that dev_eui`:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

### 6.7 Planner/coding interpretation

Use this endpoint when the feature needs authoritative metadata for one known device without re-fetching/processing the whole catalogue. It is also useful for validating a stored device binding or refreshing one device's source metadata.

Do not brute-force identifiers or enumerate guesses. The normal source of known IDs is the catalogue/application database.

---

## 7. `GET /api/v1/solar`

### 7.1 Purpose

Query solar monitoring readings for one device over a required time range.

### 7.2 Request

```http
GET /api/v1/solar?dev_eui=<device-id>&start=<iso-8601>&stop=<iso-8601>&limit=<optional>
Authorization: Bearer <TOKEN>
Accept: application/json
```

### 7.3 Parameters

Uses the common query contract in section 3.1.

### 7.4 Success response — `200`

```json
{
  "data": [
    {
      "dev_eui": "string",
      "timestamp": "2026-09-22T04:28:11.970Z",
      "device_id": "string",
      "application_id": "string",
      "gateway_id": "string",
      "current_uA": 0,
      "voltage": 0,
      "temperature": 0,
      "humidity": 0,
      "lux": 0,
      "rssi": 0,
      "snr": 0,
      "state": 0,
      "f_cnt": 0
    }
  ],
  "meta": {
    "count": 0,
    "truncated": true
  }
}
```

### 7.5 Field semantics

| Field | Type | Meaning / status |
| --- | --- | --- |
| `dev_eui` | `string` | Device identifier for the reading. |
| `timestamp` | date-time string | When the reading was recorded. |
| `device_id` | `string` | Friendly device name assigned in the LoRaWAN network/application server; **different from `dev_eui`**. |
| `application_id` | `string` | LoRaWAN application/integration the device is registered under. |
| `gateway_id` | `string` | Gateway that received the uplink. |
| `current_uA` | number | Measured current draw, in microamps (`uA` / microampere). |
| `voltage` | number | Measured supply/battery voltage. **Unconfirmed; pending hardware-team review.** Unit is not specified by the supplied source. |
| `temperature` | number | Measured ambient temperature. **Unconfirmed; pending hardware-team review.** Unit is not specified by the supplied source. |
| `humidity` | number | Measured relative humidity. **Unconfirmed; pending hardware-team review.** Unit is not specified by the supplied source. |
| `lux` | number | Measured ambient light level, in lux. |
| `rssi` | number | LoRaWAN RSSI in dBm. More negative = weaker signal. |
| `snr` | number | LoRaWAN Signal-to-Noise Ratio in dB. |
| `state` | number | Device state/status code. **Unconfirmed; pending hardware-team review.** Do not invent enum meanings. |
| `f_cnt` | number | LoRaWAN uplink frame counter; increments with messages and is used by the network for ordering/replay protection. |

### 7.6 Errors

```text
400 Invalid or missing query parameters
401 Missing or invalid bearer token
```

Body uses the common error envelope.

### 7.7 Implementation warnings

- Do not label `voltage` with a unit until the hardware team confirms it.
- Do not assume `temperature` is Celsius or `humidity` is percentage solely from common convention; the source marks their semantics pending review and does not state units.
- Do not invent meaning for `state` values.
- Do not treat `f_cnt` as an application reading ID.
- Keep `dev_eui` distinct from the row's `device_id` friendly name.

---

## 8. `GET /api/v1/avc`

### 8.1 Purpose

Query AVC **water meter** readings delivered through ChirpStack uplinks.

The current source explicitly identifies `avc` as the water-meter API. This supersedes the previous handover's unresolved meaning of `avc`.

### 8.2 Request

```http
GET /api/v1/avc?dev_eui=<device-id>&start=<iso-8601>&stop=<iso-8601>&limit=<optional>
Authorization: Bearer <TOKEN>
Accept: application/json
```

### 8.3 Parameters

Uses the common query contract in section 3.1.

### 8.4 Success response — `200`

```json
{
  "data": [
    {
      "dev_eui": "string",
      "timestamp": "2026-09-22T04:33:13.001Z",
      "dev_addr": "string",
      "device_name": "string",
      "gateway_id": "string",
      "meter_sn": "string",
      "region": "string",
      "tag_source": "string",
      "fwd_volume_m3": 0,
      "rev_volume_m3": 0,
      "instant_flow_m3h": 0,
      "valve_open": 0,
      "pipe_leak": 0,
      "pipe_burst": 0,
      "battery_low": 0,
      "frozen": 0,
      "tamper": 0,
      "reverse_flow": 0,
      "frequency_hz": 0,
      "spreading_factor": 0,
      "dr": 0,
      "fcnt": 0,
      "rssi": 0,
      "snr": 0,
      "temp_c": 0
    }
  ],
  "meta": {
    "count": 0,
    "truncated": true
  }
}
```

### 8.5 Field semantics

| Field | Type | Meaning / status |
| --- | --- | --- |
| `dev_eui` | `string` | Device LoRaWAN identifier used by this API. |
| `timestamp` | date-time string | When the reading was recorded. |
| `dev_addr` | `string` | LoRaWAN device session address; short-lived and different from `dev_eui`. |
| `device_name` | `string` | ChirpStack-assigned friendly device name. |
| `gateway_id` | `string` | Gateway that received the uplink. |
| `meter_sn` | `string` | Physical water meter serial number. |
| `region` | `string` | LoRaWAN regional parameter band, e.g. `as923_2`. |
| `tag_source` | `string` | Ingestion pipeline/integration identifier. **Unconfirmed; pending hardware-team review.** |
| `fwd_volume_m3` | number | Cumulative forward-direction water volume in m3. **Unconfirmed; pending hardware-team review.** |
| `rev_volume_m3` | number | Cumulative reverse-direction water volume in m3. **Unconfirmed; pending hardware-team review.** |
| `instant_flow_m3h` | number | Instantaneous flow in m3/hour. **Unconfirmed; pending hardware-team review.** |
| `valve_open` | number | Meter valve status. **Unconfirmed; pending hardware-team review.** Numeric encoding is not documented. |
| `pipe_leak` | number | Leak-detected flag. Numeric encoding/domain is not separately documented. |
| `pipe_burst` | number | Pipe-burst-detected flag. Numeric encoding/domain is not separately documented. |
| `battery_low` | number | Low-battery warning flag. Numeric encoding/domain is not separately documented. |
| `frozen` | number | Freeze-detected flag. Numeric encoding/domain is not separately documented. |
| `tamper` | number | Tamper-detected flag. Numeric encoding/domain is not separately documented. |
| `reverse_flow` | number | Flag indicating water currently flowing backward. Numeric encoding/domain is not separately documented. |
| `frequency_hz` | number | LoRaWAN radio frequency in Hz. |
| `spreading_factor` | number | LoRa spreading factor; description says SF7-SF12. The documented example uses `0`, so do not enforce a strict 7-12 validator until real response behavior is confirmed. |
| `dr` | number | LoRaWAN data-rate index; mapping is region-specific. |
| `fcnt` | number | LoRaWAN uplink frame counter; same concept as solar `f_cnt`, with different source naming. |
| `rssi` | number | LoRaWAN RSSI in dBm. |
| `snr` | number | LoRaWAN SNR in dB. |
| `temp_c` | number | Ambient or meter temperature in degrees Celsius; source does not resolve whether the probe represents ambient vs meter temperature. |

### 8.6 Errors

```text
400 Invalid or missing query parameters
401 Missing or invalid bearer token
```

Body uses the common error envelope.

### 8.7 Implementation warnings

- Do not calculate authoritative water consumption from differences in `fwd_volume_m3` until the hardware team confirms counter semantics, reset behavior, and data quality.
- Do not coerce numeric status/flag fields into booleans unless the IoT team confirms their domain, e.g. `0/1` only.
- Do not use `dev_addr` as a stable device key.
- Do not assume `meter_sn` and catalogue `device_id` are interchangeable identifiers.
- Preserve the distinction between `fcnt` and application-level record identity.

---

## 9. `GET /api/v1/nfc`

### 9.1 Purpose

Query NFC door scan events for one scanning device over a required time range.

### 9.2 Request

```http
GET /api/v1/nfc?dev_eui=<device-id>&start=<iso-8601>&stop=<iso-8601>&limit=<optional>
Authorization: Bearer <TOKEN>
Accept: application/json
```

### 9.3 Parameters

Uses the common query contract in section 3.1.

### 9.4 Success response — `200`

```json
{
  "data": [
    {
      "dev_eui": "string",
      "timestamp": "2026-09-22T04:34:34.960Z",
      "batch_id": "string",
      "detected_card_id": "string",
      "moving_direction": "in"
    }
  ],
  "meta": {
    "count": 0,
    "truncated": true
  }
}
```

### 9.5 Field semantics

| Field | Type | Meaning / status |
| --- | --- | --- |
| `dev_eui` | `string` | Identifier of the scanning device / door unit. |
| `timestamp` | date-time string | When the scan was recorded. |
| `batch_id` | `string` | Group of scans uploaded together in one transmission. **Not related to card or person identity.** |
| `detected_card_id` | `string` | Scanned NFC card identifier. |
| `moving_direction` | `"in" \| "out"` | Detected travel direction at the scan point. Explicit enum: `in`, `out`. |

### 9.6 Errors

```text
400 Invalid or missing query parameters
401 Missing or invalid bearer token
```

Body uses the common error envelope.

### 9.7 Application/project interpretation

For the Building E application:

```text
NFC scanner dev_eui
      -> identifies the door/scanner device

detected_card_id
      -> candidate input for our card/person mapping

moving_direction + timestamp
      -> access event information
```

Do not equate `detected_card_id` directly to `IDGV` unless our PostgreSQL mapping explicitly establishes that relationship.

Do not use `batch_id` to identify a lecturer, card, room, or access event owner.

---

## 10. Source payload status: documented schema vs actual execution

The current authoritative `/devices` contract was updated on 2026-09-24. It documents:

- optional integer query parameter `floor_level`;
- floor-scoped list behavior when that parameter is supplied;
- `install_location.install_z` in addition to floor/X/Y;
- `400 Invalid or missing query parameters` for invalid query input.

No new real executed `/devices` payload was supplied with this update. Therefore the current list schema above is the **documented contract**, while the 2026-09-21 executed device catalogue remains only a pre-change historical observation.

The current source does **not** provide a new contract block for `GET /api/v1/devices/{dev_eui}`. Keep that endpoint's previously documented contract as authoritative for detail lookup and do not automatically claim that `install_z` is required there until the IoT documentation or an executed response confirms it. Runtime code may be forward-compatible by accepting an optional `install_z` on detail payloads, but the distinction must remain explicit.

For `/solar`, `/avc`, and `/nfc`, the 2026-09-22 supplied source contains documented `200` response blocks but no separately labeled actual executed payload with real device values. Therefore:

- treat those blocks as the current documented response contract/example;
- do not claim the example zeros or strings are real sensor values;
- do not claim field presence/units beyond what the comments explicitly state;
- retain runtime validation and contract-drift handling.

---

## 11. Upstream TypeScript schema reference

The following representation reflects the current documented contract and intentionally preserves the difference between the updated catalogue item and the previously documented device-detail item.

```ts
export interface IoTUpstreamMeta {
  count?: number;
  truncated?: boolean;
  [key: string]: unknown;
}

export interface IoTUpstreamErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface IoTUpstreamInstallLocationBase {
  install_floor_level: number;
  install_x: number;
  install_y: number;
}

// Current /devices list contract (2026-09-24): Z is documented and required.
export interface IoTUpstreamDeviceListItem {
  device_id: string;
  device_type: string;
  create_timestamp: string;
  last_updated_timestamp: string;
  install_location: IoTUpstreamInstallLocationBase & {
    install_z: number;
  };
  is_active: boolean;
}

// /devices/{dev_eui} has not received a new documented schema in the
// 2026-09-24 delta. Keep Z optional for forward-compatible parsing rather
// than falsely claiming it is required by the detail contract.
export interface IoTUpstreamDeviceDetailItem {
  device_id: string;
  device_type: string;
  create_timestamp: string;
  last_updated_timestamp: string;
  install_location: IoTUpstreamInstallLocationBase & {
    install_z?: number;
  };
  is_active: boolean;
}

export interface IoTUpstreamDeviceListQuery {
  floor_level?: number;
}

export interface IoTUpstreamDeviceListResponse {
  data: IoTUpstreamDeviceListItem[];
  meta: IoTUpstreamMeta;
}

export interface IoTUpstreamDeviceDetailResponse {
  data: IoTUpstreamDeviceDetailItem;
  meta: IoTUpstreamMeta;
}

export interface IoTUpstreamRangeQuery {
  dev_eui: string;
  start: string;
  stop: string;
  limit?: number;
}

export interface IoTUpstreamSolarReading {
  dev_eui: string;
  timestamp: string;
  device_id: string;
  application_id: string;
  gateway_id: string;
  current_uA: number;
  voltage: number;
  temperature: number;
  humidity: number;
  lux: number;
  rssi: number;
  snr: number;
  state: number;
  f_cnt: number;
}

export interface IoTUpstreamAvcReading {
  dev_eui: string;
  timestamp: string;
  dev_addr: string;
  device_name: string;
  gateway_id: string;
  meter_sn: string;
  region: string;
  tag_source: string;
  fwd_volume_m3: number;
  rev_volume_m3: number;
  instant_flow_m3h: number;
  valve_open: number;
  pipe_leak: number;
  pipe_burst: number;
  battery_low: number;
  frozen: number;
  tamper: number;
  reverse_flow: number;
  frequency_hz: number;
  spreading_factor: number;
  dr: number;
  fcnt: number;
  rssi: number;
  snr: number;
  temp_c: number;
}

export type IoTUpstreamNfcDirection = 'in' | 'out';

export interface IoTUpstreamNfcEvent {
  dev_eui: string;
  timestamp: string;
  batch_id: string;
  detected_card_id: string;
  moving_direction: IoTUpstreamNfcDirection;
}

export type IoTUpstreamSolarResponse =
  IoTUpstreamListResponse<IoTUpstreamSolarReading>;

export type IoTUpstreamAvcResponse =
  IoTUpstreamListResponse<IoTUpstreamAvcReading>;

export type IoTUpstreamNfcResponse =
  IoTUpstreamListResponse<IoTUpstreamNfcEvent>;
```

Implementation note: if the repository already has a shared device schema, update it carefully so `/devices` requires `install_z` while `/devices/{dev_eui}` remains tolerant until its contract is explicitly updated. Do not weaken the list parser just to avoid separating the two current evidence levels.

---

## 12. Device type to data-endpoint routing

Current approved routing table:

| Catalogue `device_type` | Data endpoint | Domain interpretation |
| --- | --- | --- |
| `solar` | `GET /api/v1/solar` | Solar/environment monitoring device data |
| `avc` | `GET /api/v1/avc` | Water-meter readings via ChirpStack |
| `nfc` | `GET /api/v1/nfc` | Door NFC scan events |

Recommended allowlisted dispatch:

```ts
const DATA_ROUTE_BY_DEVICE_TYPE = {
  solar: 'solar',
  avc: 'avc',
  nfc: 'nfc',
} as const;
```

Do **not** construct arbitrary upstream paths from an untrusted device type, for example:

```ts
// Do not do this.
GET(`/api/v1/${userProvidedType}`)
```

Unknown/future device types should remain valid catalogue records but should return an application-level `unsupported data type` condition until a documented endpoint is added.

---

## 13. Recommended application-domain model

### 13.1 Device catalogue normalization

The frontend should not depend directly on upstream snake_case fields.

Recommended normalized device metadata:

```ts
export interface DeviceSourceMetadata {
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

| IoT upstream | Application domain |
| --- | --- |
| `device_id` | `externalDeviceId` |
| `device_type` | `sourceDeviceType` |
| `create_timestamp` | `sourceCreatedAt` |
| `last_updated_timestamp` | `sourceUpdatedAt` |
| `install_location.install_x` | `sourceLocation.x` |
| `install_location.install_y` | `sourceLocation.y` |
| `install_location.install_z` | `sourceLocation.z` (required for current list responses; optional for detail responses until detail contract is updated) |
| `install_location.install_floor_level` | `sourceLocation.floorLevel` |
| `is_active` | `active` |
| local successful fetch time | `fetchedAt` |

`fetchedAt` must be generated by our application and must not be copied from `last_updated_timestamp`.

Do not use `z` to infer Unity vertical position or convert axes until the coordinate-frame contract is confirmed. Preserve the upstream value first.

### 13.2 Type-specific data should remain type-specific

Do not flatten all three source payloads into a single generic `Record<string, number>` model prematurely.

Recommended discriminated application response concept:

```ts
export type DeviceDataResult =
  | {
      deviceType: 'solar';
      externalDeviceId: string;
      data: SolarReading[];
    }
  | {
      deviceType: 'avc';
      externalDeviceId: string;
      data: WaterMeterReading[];
    }
  | {
      deviceType: 'nfc';
      externalDeviceId: string;
      data: NfcScanEvent[];
    };
```

This lets the UI render a type-specific detail panel without losing field meaning.

### 13.3 Do not strengthen unconfirmed semantics during normalization

Examples:

```text
solar.voltage
solar.temperature
solar.humidity
solar.state
avc.tag_source
avc.fwd_volume_m3
avc.rev_volume_m3
avc.instant_flow_m3h
avc.valve_open
```

are partially or explicitly unconfirmed by the hardware team.

Until confirmed, prefer names that preserve upstream meaning rather than renaming them to stronger business claims such as:

```text
batteryVoltageV
roomTemperatureC
waterConsumedToday
valveIsOpen
```

unless a later contract validates those semantics and units.

---

## 14. Time-range policy and the meaning of “latest/current data”

All three type-specific endpoints require both `start` and `stop`.

There is no documented current-phase endpoint of the form:

```text
GET /api/v1/<type>/latest
```

Therefore a UI requirement such as “show current/latest sensor data when clicking a device” needs an application policy for a lookback window.

### 14.1 Do not invent the lookback window in the bridge

The bridge itself should accept explicit:

```ts
{
  start: string;
  stop: string;
  limit?: number;
}
```

If the product wants a convenience `latest` API, the planner must first define the lookback window/recovery behavior, for example what happens if no row exists in that window.

This handover does **not** choose `1 hour`, `24 hours`, `7 days`, or any other default because the IoT API source does not specify one.

### 14.2 Efficient latest-row pattern after policy is defined

Once a lookback range is explicitly chosen by product/backend design, the newest-first API ordering means a latest-row query can use a low `limit` such as `1`.

Do not use `limit=10000` to emulate “latest”.

---

## 15. Recommended NestJS bridge

### 15.1 Separation of concerns

Recommended conceptual layers:

```text
Application service
       |
       v
IotDeviceDataService
       |
       +--> device catalogue gateway
       |       |
       |       +--> optional floor-level filter mapper
       |
       +--> type router
                |
                +--> solar gateway
                +--> avc gateway
                +--> nfc gateway
                         |
                         v
                read-only HTTP client
                         |
                         v
                    IoT backend
```

### 15.2 Application-facing gateway interfaces

A practical interface shape:

```ts
export interface IotDeviceListFilter {
  floorLevel?: number;
}

export interface IotDeviceGateway {
  listDevices(filter?: IotDeviceListFilter): Promise<DeviceSourceMetadata[]>;
  getDevice(deviceId: string): Promise<DeviceSourceMetadata>;
}

export interface IotDataRange {
  start: string;
  stop: string;
  limit?: number;
}

export interface IotDeviceDataGateway {
  querySolar(
    deviceId: string,
    range: IotDataRange,
  ): Promise<IoTUpstreamSolarReading[]>;

  queryAvc(
    deviceId: string,
    range: IotDataRange,
  ): Promise<IoTUpstreamAvcReading[]>;

  queryNfc(
    deviceId: string,
    range: IotDataRange,
  ): Promise<IoTUpstreamNfcEvent[]>;
}
```

`listDevices({ floorLevel })` should serialize the filter only when a floor value is present:

```text
undefined floorLevel -> GET /api/v1/devices
floorLevel = 6       -> GET /api/v1/devices?floor_level=6
floorLevel = -1      -> GET /api/v1/devices?floor_level=-1
```

Do not send `floor_level=` with an empty string and do not send a viewer label such as `G` directly.

An application service may then expose:

```ts
getDeviceData(deviceId, deviceType, range)
```

using an allowlisted dispatch table.

### 15.3 Do not expose a generic unrestricted proxy

Avoid interfaces such as:

```ts
request(method: string, path: string, body?: unknown)
```

or:

```ts
get(pathFromClient: string)
```

They make it too easy for application code to reach undocumented/mutating endpoints.

### 15.4 Suggested source layout

Adapt to the repository's existing NestJS conventions; do not restructure unrelated modules only to match this example.

```text
backend/src/integrations/iot/
├── iot.module.ts
├── config/
│   └── iot.config.ts
├── client/
│   ├── iot-readonly-http.client.ts
│   └── iot-auth.provider.ts
├── common/
│   ├── iot-range-query.ts
│   ├── iot-response.types.ts
│   └── iot-runtime.schemas.ts
├── devices/
│   ├── iot-device.gateway.ts
│   ├── iot-device.mapper.ts
│   └── iot-device.types.ts
├── telemetry/
│   ├── iot-device-data.service.ts
│   ├── iot-data-router.ts
│   ├── solar/
│   │   ├── solar.gateway.ts
│   │   └── solar.types.ts
│   ├── avc/
│   │   ├── avc.gateway.ts
│   │   └── avc.types.ts
│   └── nfc/
│       ├── nfc.gateway.ts
│       └── nfc.types.ts
└── errors/
    └── iot-error.mapper.ts
```

### 15.5 Read-only client allowlist

The client should expose only the current approved GET operations:

```text
GET /api/v1/devices[?floor_level=<integer>]
GET /api/v1/devices/{dev_eui}
GET /api/v1/solar
GET /api/v1/avc
GET /api/v1/nfc
```

The optional floor query does not change the read-only safety boundary. Do not implement upstream mutation methods in this integration client.

---

## 16. Local request validation before touching the IoT backend

Validate requests in NestJS before making an upstream call.

### 16.1 `floor_level` for `GET /api/v1/devices`

- optional;
- integer when present;
- negative integers are valid in the documented floor model (for example basement `-1`);
- no min/max range is documented, so do not invent one as an upstream contract fact;
- omit the query parameter entirely when the caller intentionally requests the full active catalogue;
- do not serialize an empty string, `NaN`, floating-point floor, or viewer string label directly;
- perform viewer-floor-ID -> upstream-floor-level mapping in an application mapper/config layer rather than inside the low-level HTTP client.

A malformed floor filter should be rejected locally and should not result in an upstream request.

### 16.2 `dev_eui`

- non-empty string;
- treat as opaque;
- URL-encode as a query/path value;
- do not enforce LoRa-EUI format because the catalogue may contain non-EUI-looking/dummy identifiers.

### 16.3 `start` and `stop`

- required for `solar`, `avc`, `nfc`;
- parse/validate as ISO-8601 date-time strings;
- require `start < stop`;
- preserve the source contract that both endpoints are inclusive bounds;
- reject invalid ranges locally instead of sending them upstream.

### 16.4 `limit`

- optional;
- integer when present;
- must not exceed `10000`;
- do not send values above the documented hard cap;
- omitting the value lets the upstream default of `1000` apply.

The source does not explicitly state a minimum value. Do not invent one as an upstream fact. Our own public API may choose a positive-integer validation policy as an application rule, but label it as our rule.

---

## 17. Runtime response validation

TypeScript interfaces alone are insufficient because upstream JSON is external data.

### 17.1 Catalogue response

Validate the current `/devices` list contract:

- `data` is an array;
- `device_id` required string;
- `device_type` required string, open vocabulary;
- source timestamps are strings/valid date-time according to chosen runtime parser;
- `install_location` is an object;
- `install_floor_level`, `install_x`, `install_y`, and **`install_z`** are numeric;
- `is_active` is boolean;
- `meta` is an object; tolerate missing `count`/`truncated` fields if actual upstream behavior remains looser than the documented example.

`install_z` is part of the current list response contract and should be covered by fixtures/tests. Do not silently replace a missing list `install_z` with `0`; a missing required field should be treated as contract drift unless the implementation deliberately enters a compatibility mode that is documented and tested.

### 17.2 Device-detail response

The 2026-09-24 update did not provide a new schema for `/devices/{dev_eui}`. Validate the previously documented detail fields and:

- `data` is one device object rather than an array;
- `meta` remains an object and may be `{}`;
- handle upstream `404` as a known device-not-found condition; do not synthesize a placeholder device;
- optionally accept numeric `install_z` if it appears, for forward compatibility, but do not require it until detail documentation confirms that change.

### 17.3 Solar response

Validate documented field types, but do not invent units or state enum meanings.

In particular:

```text
voltage/temperature/humidity/state
```

must remain accepted as documented numeric fields even though their detailed semantics are pending review.

### 17.4 AVC response

Keep documented status/flag fields numeric.

Do not silently coerce:

```text
0 -> false
1 -> true
```

until their value domain is confirmed.

Because the documented example uses `spreading_factor = 0` even while the description says SF7-SF12, avoid a strict range validator that would reject the provided documented shape. Record the discrepancy and wait for actual response evidence/hardware clarification.

### 17.5 NFC response

`moving_direction` has an explicit documented enum:

```text
in
out
```

A strict runtime enum check is appropriate here; any other value should be treated as contract drift rather than guessed.

---

## 18. Error handling

### 18.1 Known upstream statuses

| Endpoint family | Status | Upstream meaning | Recommended application handling |
| --- | ---: | --- | --- |
| All current endpoints | `200` | Success | Validate and normalize. |
| `/devices` | `400` | Invalid or missing query parameters | Prefer preventing malformed `floor_level` locally. If still returned, sanitize and map deliberately. |
| `/devices/{dev_eui}` | `404` | No device registered with that `dev_eui` | Map to a deliberate device-not-found condition/our API `404` according to project conventions. |
| `/solar`, `/avc`, `/nfc` | `400` | Invalid/missing query parameters | Prefer preventing with local validation. If still returned, sanitize and map deliberately. |
| All current endpoints | `401` | Missing/invalid bearer token | Treat as integration/auth failure; do not forward token details to browser. |
| Network/timeout | Not specified | Upstream unavailable | Map to sanitized dependency failure such as `502`/`503` according to project API conventions. |
| Schema mismatch | Not specified | Contract drift/unexpected response | Reject/flag; do not invent missing values. |

### 18.2 Do not mirror upstream auth failure as client auth failure

Our user/browser authentication is a separate concern from the server-to-server IoT credential.

An upstream `401` should not normally become a browser message such as:

```text
IoT master token invalid
```

Use a sanitized dependency/integration error and keep credential details server-side.

### 18.3 Log redaction

Never log:

```text
Authorization: Bearer <actual-token>
IOT_API_MASTER_TOKEN=<actual-token>
```

Request logs may include safe metadata such as endpoint name, upstream floor level, device ID, range, duration, status code, and correlation ID, provided the project's logging/privacy rules permit them.

---

## 19. Upstream-call safety and load policy

The explicit project requirement is to avoid actions that can affect the other team's backend.

### 19.1 Safe operations

| Upstream operation | Current permission |
| --- | --- |
| `GET /api/v1/devices` | Allowed for intentional full active-catalogue reads. |
| `GET /api/v1/devices?floor_level=<integer>` | Allowed and preferred for a known floor-scoped catalogue read. |
| `GET /api/v1/devices/{dev_eui}` | Allowed read lookup for one known device. |
| `GET /api/v1/solar` | Allowed read query. |
| `GET /api/v1/avc` | Allowed read query. |
| `GET /api/v1/nfc` | Allowed read query. |
| `POST` | Prohibited in this small phase. |
| `PUT` | Prohibited. |
| `PATCH` | Prohibited. |
| `DELETE` | Prohibited. |
| Device/coordinate write-back | Prohibited. |
| Device registration/decommission | Prohibited. |
| Probing undocumented APIs | Prohibited. |

### 19.2 Avoid excessive read load

Rate limits/SLA are not documented. Therefore coding agents should not introduce:

- per-frame Unity polling;
- sub-second browser polling;
- automatic repeated `limit=10000` queries;
- broad historical sweeps on every floor render;
- full-catalogue `/devices` reads when a floor-scoped query is sufficient;
- retry loops without a bound;
- concurrent duplicate requests for the same floor/device/range without need.

Recommended product behavior for this phase:

- when loading/refreshing one floor, use `GET /api/v1/devices?floor_level=<mapped floor>`;
- reserve unfiltered `GET /api/v1/devices` for intentional full-catalogue workflows;
- fetch type-specific data on explicit need, such as opening a device detail/popup or a deliberate refresh;
- if repeated UI reads become frequent, add a measured/read-through cache policy on **our** backend rather than increasing upstream call rate;
- keep retries bounded and only for safe GET operations.

No specific cache TTL or retry count is mandated by the IoT source; choose those in the implementation plan based on repository conventions and test evidence.

---

## 20. PostgreSQL guidance

### 20.1 Device metadata

The existing project requirement is to preserve upstream/source location separately from local display override.

A reasonable application-side metadata model should preserve at least:

```text
external_device_id
source_device_type
source_install_x
source_install_y
source_install_z
source_floor_level
source_is_active
source_created_at
source_updated_at
last_fetched_at
```

`source_install_z` is new relative to the earlier `/devices` contract. If the current PostgreSQL schema stores only X/Y/floor, the coding agent must inspect migrations/entities first and add a backward-compatible migration or equivalent storage change. Existing rows may legitimately have `NULL`/unset Z until refreshed from the new list contract; do not fabricate `0` for historical rows merely to satisfy a non-null schema.

Optional compatibility/audit field:

```text
raw_metadata jsonb
```

The exact SQL names are not mandated here; coding agents must inspect the existing Phase 04/current schema/migrations before changing database structure.

### 20.2 Floor-scoped synchronization state

Because `/devices` can now be fetched per `floor_level`, any cache/staleness/sync-state implementation that refreshes one floor should preserve that scope. A successful refresh for floor `6` must not incorrectly mark the entire device catalogue or unrelated floors as freshly synchronized.

If the repository already has a floor-scoped synchronization record, reuse it. If it has only one global catalogue timestamp, the implementation plan must address whether that representation is still correct for the current per-floor fetch flow before changing schema.

### 20.3 Do not automatically mirror telemetry history

The IoT/backend side is the source for time-series/history data. This handover does **not** authorize wholesale persistence of `/solar`, `/avc`, or `/nfc` history into our PostgreSQL.

Default integration principle for this small phase:

```text
query upstream -> validate -> normalize -> serve feature
```

rather than:

```text
query upstream -> permanently duplicate all telemetry/history in PostgreSQL
```

A later cache/report/presence design may persist derived or selected data, but that requires an explicit project decision/schema.

### 20.4 Never store authentication secret

Do not store in PostgreSQL:

```text
master token
Authorization header
Bearer token value
```

---

## 21. Device position and floor mapping

The current `/devices` list contract exposes:

```text
install_floor_level
install_x
install_y
install_z
```

and documents that negative floor values represent basements, e.g. `-1`.

Still unresolved:

- unit of `install_x`/`install_y`/`install_z`;
- axis orientation and which upstream axis corresponds to Unity vertical;
- coordinate origin details in this API document;
- how source coordinates map into Unity floor-local/world space;
- exact mapping between upstream integer floor levels and viewer floor IDs such as `G`;
- whether earlier zero-valued positions were placeholders/unassigned.

Therefore:

- preserve `install_z` as source data but do not assume it equals Unity world/local Y or Z;
- do not map upstream `0` automatically to viewer `G` without an explicit project mapping;
- do not treat `(0,0,0)` as calibrated solely because the fields are numeric;
- do not overwrite source coordinates when the user adjusts an icon visually;
- do not write coordinates back to the IoT backend;
- keep viewer-floor mapping centralized and testable so it can be updated without changing the low-level IoT client.

---

## 22. Recommended application-facing API

The frontend should call our NestJS API, not the IoT host.

Exact route names must follow the existing repository conventions. Do not create duplicate public routes solely because the upstream API added `floor_level`; adapt the existing floor/device route where possible.

Conceptually, an application API may support:

```http
GET /api/devices?floorLevel=<application-floor>
GET /api/devices/:deviceId
GET /api/devices/:deviceId/data?start=<iso>&stop=<iso>&limit=<n>
```

or an existing floor-scoped route such as:

```http
GET /api/buildings/:buildingId/floors/:floorId/devices
```

For a floor-scoped request, the application layer should:

1. validate/resolve the application/viewer floor ID;
2. map it to the upstream integer `floor_level`;
3. use `GET /api/v1/devices?floor_level=<integer>`;
4. validate the returned list including `install_z`;
5. update/read our PostgreSQL cache according to the current project policy;
6. return the existing application-facing DTO, extended only where the new Z source coordinate is intentionally exposed.

The device-data endpoint can:

1. resolve/validate the device's known `device_type`;
2. dispatch through the allowlisted type router;
3. call exactly one of `/solar`, `/avc`, `/nfc`;
4. validate the upstream response;
5. return a discriminated normalized result.

Possible application response envelope:

```json
{
  "deviceId": "...",
  "deviceType": "solar",
  "range": {
    "start": "...",
    "stop": "..."
  },
  "data": []
}
```

This route is **our application design**, not an upstream IoT endpoint.

### 22.1 Why the frontend should not choose the upstream path

Do not accept a client-supplied arbitrary value such as:

```text
upstreamPath=/api/v1/anything
```

The backend should resolve the route from known application state and fixed allowlists.

### 22.2 Type mismatch handling

If the catalogue says a device is `avc`, the application should not call `/solar` merely because the browser asks for it.

Prefer the server-side catalogue/domain mapping as the route authority.

---

## 23. Safe testing strategy

Preferred sequence:

```text
1. Unit-test request validators locally.
2. Unit-test raw response schemas with documented fixtures.
3. Unit-test floor-ID -> upstream-floor-level mapping separately from HTTP serialization.
4. Unit-test mappers/type router locally.
5. Unit-test HTTP client with mocked upstream responses.
6. Integration-test NestJS application API with a mocked IoT backend.
7. Only when explicitly approved, perform minimal real GET checks.
8. Never use mutation endpoints for testing this phase.
```

### 23.1 Fixture set

At minimum include:

```text
current device catalogue item with install_floor_level + install_x + install_y + install_z
GET /devices without floor_level
GET /devices?floor_level=6
GET /devices?floor_level=-1
invalid/non-integer floor_level rejected locally
upstream /devices 400 response
device detail success using previously documented shape
device detail response with optional install_z (forward-compatibility case)
device detail meta = {}
device detail upstream 404
device catalogue with solar/avc/nfc
device catalogue with unknown device_type
opaque/dummy-looking device ID
negative install_floor_level
zero install coordinates including zero install_z
meta = {}
meta = { count: N }
meta = { count: N, truncated: true }
valid solar response
valid avc response
valid nfc response
nfc moving_direction = in
nfc moving_direction = out
400 telemetry/history upstream response
401 upstream response
malformed upstream response
network timeout
empty data array
range with start >= stop
limit > 10000
```

### 23.2 Floor-scoped cache/sync tests

If the application caches device catalogue data per floor, verify at least:

```text
load floor 6 -> upstream call contains floor_level=6
manual refresh floor 6 -> upstream call contains floor_level=6
successful floor 6 refresh -> only floor 6 sync/freshness state changes
floor 6 upstream error -> existing cached floor 6 data is not falsely marked fresh
empty valid floor 6 result -> handled as an empty successful catalogue according to current reconciliation policy
full-catalogue workflow -> omits floor_level intentionally
```

Do not change existing delete/decommission/reconciliation semantics merely because the upstream endpoint gained a filter; preserve the current project policy unless the active implementation plan explicitly changes it.

### 23.3 Do not turn schema examples into real-world assertions

The `/solar`, `/avc`, and `/nfc` payload blocks are sufficient fixtures for parser/unit tests, but they are not a basis for asserting that real devices currently produce zeros, particular gateway IDs, or particular state values.

Likewise, the current `/devices` documented example establishes the schema, including `install_z`, but its zero coordinate values are examples rather than proof that real devices are installed at `(0,0,0)`.

---

## 24. Confirmed facts vs unresolved items

### 24.1 Confirmed by the current handover

- Base host: `https://api.ttlab.manhthao.uk`.
- Bearer authentication is required by the documented current endpoints.
- Project owner has a Master Bearer Token.
- Current small-phase endpoints are `GET /devices`, `GET /devices/{dev_eui}`, `GET /solar`, `GET /avc`, and `GET /nfc`.
- `/devices` accepts optional integer `floor_level`; omit it to list active devices across all floors.
- `/devices?floor_level=<integer>` returns active devices installed on that upstream floor level.
- Current `/devices` list items contain `install_floor_level`, `install_x`, `install_y`, and `install_z`.
- `/devices` documents `400` for invalid/missing query parameters and `401` for missing/invalid bearer token.
- `/devices/{dev_eui}` returns one device's metadata for a known device identifier and documents `404` when no device is registered with that identifier.
- No 2026-09-24 detail-endpoint schema update was supplied, so `install_z` is not claimed as required for `/devices/{dev_eui}` by this handover.
- Inactive devices are described as soft-deleted/decommissioned and excluded from the default device list while historical readings remain linked.
- Negative `install_floor_level` values represent basement floors.
- `solar`, `avc`, and `nfc` all require `dev_eui`, `start`, and `stop`.
- `start`/`stop` are inclusive bounds and must satisfy `start < stop`.
- `limit` defaults to `1000` and has hard cap `10000`.
- Results are newest-first; truncation retains the newest rows and drops older rows.
- `avc` is documented as the water-meter data endpoint via ChirpStack uplinks.
- `nfc` returns door scan events.
- NFC `moving_direction` enum is `in` / `out`.
- NFC `batch_id` is an upload batch, not a card/person identifier.
- Solar response `device_id` is a friendly network/application name and differs from `dev_eui`.
- AVC `dev_addr` is short-lived and differs from `dev_eui`.
- Several solar/AVC fields are explicitly pending hardware-team review.
- Type-specific endpoints document `400` for bad/missing query parameters and `401` for auth failure.

### 24.2 Confirmed by the 2026-09-21 executed device snapshot

- Actual catalogue values previously included `solar`, `avc`, and `nfc`.
- Actual IDs previously included both EUI-looking and `dummy...` values.
- Previous installation X/Y/floor values were all zero in that snapshot.

This snapshot predates the 2026-09-24 list-contract update and therefore must not be used as the authoritative current `/devices` fixture because it does not contain `install_z`.

### 24.3 Still unresolved — do not invent

- Exact privilege scope of the Master Bearer Token.
- Token expiry/rotation format.
- Whether a scoped read-only token is available.
- Full/formal device-type vocabulary beyond current small-phase types.
- Rate limits, SLA, recommended polling cadence, and upstream timeout policy.
- Exact semantic guarantee of `meta.truncated` beyond the documented presence and limit description.
- Coordinate X/Y/Z units, axes, floor-plan origin, and Unity calibration.
- Viewer-floor-ID <-> upstream `floor_level` mapping, especially viewer `G` and upstream `0`.
- Whether current source coordinates are fully populated/calibrated in live data.
- Whether `install_z` is also guaranteed by `GET /devices/{dev_eui}`; current update only documents it on the list endpoint.
- Solar `voltage` unit/meaning beyond the pending-review description.
- Solar temperature/humidity units and confirmed physical source.
- Solar `state` enum.
- AVC `tag_source` semantics.
- Final verified semantics/reset behavior for cumulative volume fields.
- Numeric domains for AVC status/flag fields.
- Whether AVC `temp_c` is ambient or meter temperature.
- Product-defined lookback window for “current/latest” data.
- Whether/how telemetry history should be cached or persisted by our application.
- Any API not listed in this handover.

---

## 25. Planner-agent checklist

When preparing an implementation phase that uses this handover, the plan should explicitly answer:

1. Which of the five approved GET APIs are needed by the feature?
2. Is device catalogue retrieval floor-scoped or intentionally full-catalogue?
3. How does the application's floor ID map to upstream integer `floor_level`? Do not assume viewer `G == 0` without evidence.
4. Where in the existing NestJS repository does the IoT integration module belong?
5. How is the token injected server-side without exposing it to client bundles/logs?
6. Does the current DB/domain schema preserve `install_z`, and if not, what backward-compatible migration is needed?
7. If per-floor caching/sync state exists, how is freshness scoped so refreshing one floor does not mark unrelated floors fresh?
8. How are `start`, `stop`, and `limit` obtained/validated for type-specific data endpoints?
9. If the UI asks for “latest”, what lookback window has the product/backend owner approved?
10. How does the backend get/verify the device type before selecting `/solar`, `/avc`, or `/nfc`?
11. What runtime schema library/convention already exists in the repository?
12. How will `/devices` `400`, all-endpoint `401`, detail `404`, network failures, and schema drift be sanitized/mapped?
13. What read-call frequency is expected, and how will duplicate/excessive upstream calls be avoided?
14. Does the feature need persistence, or can it query/serve upstream data on demand?
15. Which fields remain unconfirmed and therefore must not be converted into stronger business semantics?
16. How will the feature be tested with mocks before any real upstream GET request?

A plan must not add upstream writes merely for convenience.

---

## 26. Coding-agent checklist

Before implementation:

- inspect current repository and `AGENTS.md`/local instructions;
- inspect existing device bridge/client, DTO/runtime schemas, floor mapping, Phase 04/current database schema, and current catalogue-cache/sync logic before editing;
- keep the IoT host/token server-side;
- implement only allowlisted GET methods;
- update `GET /devices` client support for optional integer `floor_level`;
- use floor-scoped upstream reads when the current feature already knows a mapped floor;
- add `install_z` to current list response validation and source-location normalization/storage as appropriate;
- do not silently assume `/devices/{dev_eui}` requires `install_z` until its detail contract confirms that;
- preserve raw identity distinctions;
- keep source location separate from display override;
- keep floor mapping centralized; do not hard-code viewer `G -> 0` without project evidence;
- add local range validation for telemetry/history endpoints;
- add runtime response validation;
- do not persist all telemetry/history by default;
- use mocks/fixtures for most tests.

Before reporting completion:

- verify no real token entered Git/diff/logs;
- verify browser/Unity bundles do not contain the token;
- verify there is no generic arbitrary-path proxy to the IoT backend;
- verify no POST/PUT/PATCH/DELETE method was added to this integration;
- verify `listDevices()` can serialize both no filter and valid integer `floor_level` without producing empty/invalid query values;
- verify invalid floor filter is rejected before upstream call;
- verify current `/devices` fixture includes `install_z` and parser/mapping/storage preserve it;
- verify a floor-scoped refresh does not incorrectly mark unrelated floors fresh;
- verify invalid range/limit requests are rejected before upstream call;
- verify unknown device type is handled without guessing an endpoint;
- verify NFC `batch_id` is not used as person/card identity;
- verify solar `device_id` is not confused with `dev_eui`;
- verify AVC `dev_addr` is not used as the stable device ID;
- report whether real-service GET tests were run or not run.

---

## 27. Quick reference

### 27.1 Approved upstream reads

```text
GET /api/v1/devices
GET /api/v1/devices?floor_level=<integer>
GET /api/v1/devices/{dev_eui}
GET /api/v1/solar?dev_eui=...&start=...&stop=...&limit=...
GET /api/v1/avc?dev_eui=...&start=...&stop=...&limit=...
GET /api/v1/nfc?dev_eui=...&start=...&stop=...&limit=...
```

### 27.2 Current `/devices` list contract delta

```text
optional query: floor_level : integer
omit floor_level -> all active devices
provide floor_level -> active devices installed on that floor
install_location now includes:
  install_floor_level
  install_x
  install_y
  install_z
400 -> invalid/missing query parameters
401 -> missing/invalid bearer token
```

### 27.3 Auth

```http
Authorization: Bearer <IOT_API_MASTER_TOKEN>
```

### 27.4 Common range rules

```text
start: required ISO-8601, inclusive
stop:  required ISO-8601, inclusive
start < stop
limit: optional, default 1000, hard cap 10000
ordering: newest first
```

### 27.5 Type routing

```text
solar -> /api/v1/solar
avc   -> /api/v1/avc   (water meter)
nfc   -> /api/v1/nfc   (door scans)
unknown -> no guessed endpoint
```

### 27.6 Identity rules

```text
catalogue device_id -> query dev_eui
solar device_id     -> friendly device name, NOT dev_eui
avc dev_addr        -> transient session address, NOT stable device key
avc meter_sn        -> physical meter serial, not automatically dev_eui
nfc detected_card_id-> scanned card ID
nfc batch_id        -> upload batch, NOT person/card ID
```

### 27.7 Non-negotiable safety rules

```text
server side only
read-only upstream
prefer floor-scoped /devices read when floor is known
no upstream mutation
no arbitrary-path proxy
no token in client
no token in Git
no token in DB
no token in logs
bounded reads only
validate floor/range before call
preserve X/Y/Z source coordinates without inventing axis semantics
preserve uncertain sensor semantics
no automatic telemetry mirroring
```

---

## 28. Document authority and maintenance rule

### 28.1 Single-source rule

`IoTBackend_API_HandOver.md` is the **single current API knowledge base** for this integration scope. It supersedes older handover copies. Planner agents and coding agents should query this file directly rather than reconstructing state from prior versions or update/delta documents.

Current authoritative endpoint set:

```text
GET /api/v1/devices[?floor_level=<integer>]
GET /api/v1/devices/{dev_eui}
GET /api/v1/solar
GET /api/v1/avc
GET /api/v1/nfc
```

The schemas, field semantics, safety rules, normalized models, bridge guidance, unresolved items, and test guidance in this file are the current project interpretation of those APIs.

### 28.2 Evidence incorporated into this snapshot

This current handover already incorporates the information supplied from:

- device catalogue/detail API documentation and executed device responses captured on 2026-09-21;
- 2026-09-22 updates for `/devices`, `/solar`, `/avc`, and `/nfc`;
- project-owner clarification that `GET /api/v1/devices/{dev_eui}` remains active;
- **2026-09-24 `/api/v1/devices` contract update** adding optional `floor_level`, `install_location.install_z`, and documented `400` query errors.

These provenance notes are for auditability only. **Agents do not need to merge those source documents to use this handover.**

Where an actual response snapshot is included, it is evidence that the payload shape was observed at that time; it is not a guarantee of current live values. The 2026-09-21 `/devices` execution snapshot predates the 2026-09-24 list schema and must not replace the current documented list contract.

### 28.3 How to update this handover later

When the project owner supplies another API or changes an existing contract, update this file **in place**:

1. update the current endpoint/capability summary;
2. update the exact method/path and parameters;
3. update documented response codes and schemas;
4. add or replace actual executed-response snapshots when safely supplied;
5. preserve distinctions between documented schema, observed response, and inferred application mapping;
6. mark hardware semantics as unresolved when the source says they are pending review;
7. update identity and device-type routing rules;
8. update runtime-validation, error-mapping, safety, storage, and test guidance;
9. update normalized application models only when the upstream contract justifies it;
10. remove statements that are no longer current rather than asking agents to reason across conflicting old sections;
11. keep the real bearer token out of this document;
12. increment the `Version` date at the top.

If a later source conflicts with this file, resolve the current-contract section using the newer explicit project information and retain only a concise provenance note if it materially helps auditing. The operational content of this file must remain internally consistent and up to date.

---

## 29. Current document status

```text
status: CURRENT
version: 2026-09-24
role: single authoritative IoTBackend API handover / knowledge base
supersedes: earlier IoTBackend_API_HandOver.md copies
approved upstream mode: read-only GET
approved endpoint count: 5
latest contract change: /api/v1/devices optional floor_level + install_z + 400 query error
```
