# Big Phase 02 — Phase 09: Minimal Identity & CASL Foundation

> **Project:** GIS — UIT Building E Digital Twin
> **Loại tài liệu:** Kế hoạch bàn giao cho Coding Agent
> **Trạng thái:** PLAN ONLY — CHƯA IMPLEMENT, CHƯA TẠO TÀI KHOẢN
> **Ngày:** 2026-10-01
> **Roadmap mapping:** Small Phase 16 — Identity decision and CASL authorization foundation
> **Roles duy nhất:** `viewer` (Viewer), `manager` (Manager)
> **Plan tiếp theo sau Parking:** Phase 08 / Small Phase 19 đã có implementation handoff; Phase 09 này quay lại Small Phase 16 theo yêu cầu stakeholder.

---

## 1. Quyết định stakeholder và mục tiêu

Stakeholder đã gỡ temporary hold của Small Phase 16 để lập kế hoạch triển khai với phạm vi tối thiểu:

- Viewer chỉ xem Dashboard, không nhập/sửa/xóa dữ liệu nghiệp vụ.
- Manager được nhập dữ liệu Dashboard.
- Câu trả lời bổ sung đã chốt: Manager được **tạo, sửa và xóa** bản ghi PCCC (bình chữa cháy và diễn tập/hồ sơ).
- Câu trả lời bổ sung đã chốt: **cả Viewer và Manager đều không được sửa/xóa vị trí hiển thị thiết bị**.
- Tạo hai application account riêng biệt khi Coding Agent triển khai:

| Username | Role key | Display role | Initial password |
| --- | --- | --- | --- |
| `beiviewer` | `viewer` | Viewer | `bei1234` |
| `beimanager` | `manager` | Manager | `bei1234` |

Mục tiêu phase: có login/logout, identity/session đáng tin cậy, CASL enforcement ở NestJS và ability context ở Next.js; chuẩn bị nền tảng cho manual PCCC Small Phase 17.

Đây là plan để Coding Agent thực hiện. Account creation, migration, package installation và mọi code change thuộc lượt implementation sau; tài liệu này không chứng minh chúng đã tồn tại.

## 2. Authority, tài liệu và baseline

### 2.1 Authority

1. Yêu cầu stakeholder hiện tại, bao gồm hai câu trả lời về xóa PCCC và chặn device-placement writes.
2. `web/doc/Dashboard_Knowledge_Base.md`, đặc biệt sections 3, 13, 14, 19–21.
3. `web/doc/dashboard_big_phase_small_phase_plan.md`, Small Phases 16–22.
4. Plan này; repository/runtime evidence quyết định trạng thái implementation thật.
5. `web/doc/bp2_fix_align_UI.md` và `web/doc/bp2_fix_align_UI_handoff.md` cho shell/design tokens.
6. Handoff Phase 04–08 cho các domain đang hoạt động và capability còn disabled.

Chỉ đọc `IoTBackend_API_HandOver.md` thêm nếu integration chạm IoT adapter; phase này không thay upstream contract. Coding Agent phải đọc `web/AGENTS.md` và relevant bundled Next.js docs trước khi viết web code.

### 2.2 Baseline đã kiểm tra

- Branch `feature/dashboard`; HEAD tại lúc lập plan: `ecd5593a712a9a07d45cb17f2287dcbf657c517f`.
- Working tree có `GISUIT.code-workspace` là user-owned modification; phải re-audit lúc triển khai.
- NestJS 11, Next.js 16.3.4, React 19.2.8, TypeORM và PostgreSQL đã có infrastructure.
- Chưa có application user/session/authentication/CASL module hoặc package.
- Database entities/migrations hiện có phục vụ floors, device bindings, display overrides và catalogue sync.
- Runtime và migration datasource đều đăng ký entities bằng danh sách explicit.
- Runtime đọc `DB_NAME`; migration/bootstrap đọc `POSTGRES_DB`; default env paths khác nhau. Phải xác nhận cùng resolved DB target trước migration/seed.
- Next catch-all `web/src/app/api/devices/[...path]/route.ts` hiện không forward application cookie hay `Set-Cookie`, và có thể chuyển path tùy ý tới `/api/v1`.
- `web/src/app/dashboard/layout.tsx` là server layout; `DashboardShell.tsx` là client shell với sidebar footer nhỏ, phù hợp để bổ sung account controls.
- Backend `DevicesController` hiện có `PUT` và `DELETE /api/v1/devices/:deviceId/display-position` chưa enforce identity/CASL.
- Page 06 alert mutations, Page 03 threshold editing và Page 11 manual forms chưa hoạt động; identity không tự cung cấp persistence, baseline hoặc domain API.
- Parking Phase 08 có handoff hoàn thành; mọi Parking data vẫn là deterministic demo.

## 3. Protected work và giới hạn thay đổi

Không quay lại Page 01 Overview, Page 02 Energy/Water, Page 03 Environment, Page 06 Alerts, Page 07 IoT hoặc Page 09 Parking để đổi text, label, dịch thuật, demo fixture, chart, data calculation hoặc layout cho đẹp hơn. Stakeholder đã tự sửa nội dung; **repository text hiện tại thắng nội dung trong plan/handoff cũ**.

Các thay đổi tối thiểu được phép vì là yêu cầu trực tiếp của phase:

- Thêm verified-session check ở route entry/DAL của bảy Dashboard pages; giữ nguyên JSX/domain content bên trong.
- Thêm account/role/logout block trong shared shell footer và provider dùng chung; không sửa từng page header/avatar để đồng bộ tài khoản.
- Thêm guards/decorators trên Dashboard backend controllers; không sửa data service semantics.
- Bảo vệ hai legacy display-position mutation endpoints để đóng authorization bypass đã được stakeholder xác nhận.
- Disable/hide đúng device-placement edit/reset controls bằng shared ability check nếu chúng đang reachable; giữ workflow đọc catalogue/Unity và nội dung khác.
- Điều chỉnh tests cũ đang giả định anonymous placement writes được phép vì assumption đó đã bị stakeholder thay đổi.

Mọi protected-file edit phải liệt kê rõ trong handoff: exact path, lý do cần thiết và regression evidence. Không reset/clean/reformat/stage unrelated work.

## 4. Phạm vi

### 4.1 In scope

- Exactly two application roles, typed CASL subjects/actions và backend ability factory.
- PostgreSQL application users và opaque sessions; code-defined permission matrix.
- Explicit, idempotent local/test account seed cho hai usernames đã chốt.
- NestJS login, current-user và logout endpoints.
- Next.js same-origin auth routes, server session verification và client ability provider.
- Login screen nhỏ theo aligned UI; identity/role/logout trong shared Dashboard shell.
- Enforce authenticated Dashboard reads và deny unauthorized direct HTTP/proxy writes.
- Session expiry/revocation, password hashing, login rate limit và CSRF controls phù hợp cookie API.
- Unit, HTTP integration, isolated PostgreSQL và browser tests có evidence.

### 4.2 Out of scope

- Không thêm Admin/Editor, dynamic permission editor, account-management UI, registration, SSO, MFA, email/password-reset flow hoặc organization/tenant model.
- Không implement Page 11 records/grid/forms, AlertConfig tables/forms hoặc alert lifecycle/notification actions.
- Không bật các nút nhập liệu của Page 03/06/11 chỉ vì user là Manager.
- Không thêm report/aggregate/alert-state/event PostgreSQL tables hoặc telemetry jobs: vẫn deferred tới Small Phase 21.
- Không thay Page 02 Energy, Page 07 missing-data fallbacks hoặc Parking fixture.
- Không thêm upstream IoT writes, camera/LoRa integration, chart library hay Unity runtime.
- Không grant device-placement abilities cho hai roles hoặc giữ anonymous bypass cho old tests.

## 5. Minimal CASL contract

### 5.1 Roles, subjects và actions

Role keys: `viewer | manager`. Persist đúng một role trên mỗi application user.

Named subjects tối thiểu:

- `Dashboard` — đọc bảy trang và dữ liệu Dashboard hiện có.
- `AlertConfig` — configuration domain tương lai, không phải demo alert events.
- `FireExtinguisher` — PCCC manual records.
- `FireDrill` — PCCC diễn tập/hồ sơ manual records.
- `DeviceDisplayPosition` — chỉ dùng để biểu diễn denial trên legacy mutation routes; không có allow rule cho hai roles.

Actions: `read | create | update | delete`. Không cần `manage`, `all`, Admin hoặc Editor.

### 5.2 Matrix đã chốt

| Subject / action | Viewer | Manager | Runtime feature gate |
| --- | --- | --- | --- |
| `Dashboard:read` | Allow | Allow | Phase 09 / Small Phase 16 |
| `AlertConfig:read` | Allow | Allow | Domain endpoint/data chỉ khi đã tồn tại |
| `AlertConfig:update` | Deny | Allow | Small Phase 21 + approved config schema/baselines |
| `AlertConfig:create/delete` | Deny | Deny | Không nằm trong minimal config-edit scope |
| `FireExtinguisher:read` | Allow | Allow | Small Phase 17 |
| `FireExtinguisher:create/update/delete` | Deny | Allow | Small Phase 17 |
| `FireDrill:read` | Allow | Allow | Small Phase 17 |
| `FireDrill:create/update/delete` | Deny | Allow | Small Phase 17 |
| `DeviceDisplayPosition:update/delete` | Deny | Deny | Chặn hai endpoint hiện hữu trong phase này |
| User/role administration, unknown subjects/actions | Deny | Deny | Không có production API/UI |

Anonymous, inactive user hoặc unknown role: không có Dashboard ability. Một request không có verified session trả 401; verified user thiếu ability trả 403.

**Ability cho phép không đồng nghĩa feature đã sẵn sàng.** Các manual/config controls chỉ hoạt động khi `ability.can(action, subject)` AND domain API/persistence/semantics capability đã sẵn sàng. Phase này không sửa disabled controls để thử quyền Manager.

### 5.3 Organization phù hợp CASL

- Backend có một typed ability factory, dùng `@casl/ability` APIs tương thích version được cài; có thể dùng `AbilityBuilder` và `createMongoAbility` với named subjects.
- `createMongoAbility` không yêu cầu thêm MongoDB; database của project vẫn là PostgreSQL.
- Backend map current DB role sang explicit named rules; không đọc role/user ID từ request body/header/client rule payload.
- Frontend nhận sanitized serialized ability rules từ `/auth/me` và dựng CASL instance qua một provider; không tự maintain một role matrix thứ hai.
- Không serialize entity, hash, session token hoặc service credential vào rules/context/RSC payload.
- `@casl/react` chỉ thêm nếu phù hợp React 19 và cần wrapper; `@casl/ability` + existing React context đủ cho minimum phase.
- Guards dùng action/subject metadata, không rải `if role === manager` trong domain controllers/components.
- Unknown action/subject và missing policy metadata trên protected handlers phải fail closed. Public/read legacy routes được inventory riêng; không blanket-deny toàn ứng dụng.

## 6. PostgreSQL persistence tối thiểu

### 6.1 Application users

Conceptual table `application_users`:

| Field | Yêu cầu |
| --- | --- |
| `id` | UUID primary key; stable audit identity cho phases sau |
| `username` | Non-null, normalized lowercase, unique; chỉ seed hai names đã chốt |
| `password_hash` | Non-null encoded password hash; never select into public DTO |
| `role` | Non-null text/check constraint `viewer` hoặc `manager` |
| `is_active` | Boolean default true |
| `created_at`, `updated_at` | `timestamptz`, theo DB convention |

Không thêm roles/permissions join tables chỉ để lưu hai roles. Có thể mở rộng code-defined role union + migration/check constraint sau này bằng decision mới.

### 6.2 Sessions

Conceptual table `application_sessions`:

| Field | Yêu cầu |
| --- | --- |
| `id` | UUID primary key, internal only |
| `user_id` | FK tới application user |
| `token_hash` | Unique SHA-256 digest của random opaque session secret |
| `created_at` | `timestamptz` |
| `expires_at` | `timestamptz`, indexed where justified |
| `revoked_at` | Nullable `timestamptz` |

Session table không lưu role snapshot làm authority. Mỗi protected request verify token digest, expiry/revocation, active account và **current DB role**. Logout/role change/deactivation phải có hiệu lực ở request tiếp theo.

Không cần JWT, refresh-token chain, Redis hoặc session cleanup scheduler để hoàn thành minimum phase. Có thể document bounded operator cleanup cho expired/revoked session rows; không xóa valid sessions khi seed lại.

### 6.3 Migrations và database target

- Add migration mới; không sửa migration initial đã applied; `synchronize: false` giữ nguyên.
- Register entities trong cả runtime `database.module.ts` và `data-source.migration.ts`.
- Dùng existing migration-owner/runtime service roles; `beiviewer` và `beimanager` **không phải PostgreSQL LOGIN roles**.
- Migration, seed, runtime và e2e phải resolve cùng env profile/DB target. Kiểm tra `DB_NAME`/`POSTGRES_DB`; nếu cùng được khai báo nhưng khác nhau thì fail rõ ràng thay vì chọn ngầm một DB khác.
- Document explicit resolved env path, DB host/port/name và migration status, không in DB password/token.
- Không chạy lại bootstrap với chức năng đổi DB-role passwords chỉ để thêm users.
- Verify runtime role có DML cần thiết trên auth tables nhưng không cần DDL/superuser.
- Tests có writes dùng isolated test DB/namespace; không chạy destructive existing e2e cleanup lên stakeholder DB.

Identity/session tables là application-owned auth persistence của Small Phase 16; không thay đổi quyết định deferred IoT report/alert persistence tới Small Phase 21.

## 7. Password và account seed

- Hai initial passwords phải đúng `bei1234`, theo yêu cầu; không tự thay bằng mật khẩu random hoặc ép đổi trước lần login kiểm thử.
- Dùng backend password-hashing service: asynchronous Node `scrypt`, random salt tối thiểu 16 bytes, versioned encoded parameters + hash; compare constant-time bằng `timingSafeEqual` với kiểm tra độ dài.
- Baseline scrypt đề xuất `N=2^17, r=8, p=1`, memory allowance lớn hơn yêu cầu thuật toán; Coding Agent benchmark và ghi rõ nếu chọn equivalent documented profile phù hợp runtime. Không dùng SHA-256 đơn thuần cho password.
- Password không trim/normalize; DTO giới hạn input length hợp lý nhưng phải chấp nhận password 7 ký tự đã chốt. Login UI không tự đặt `minLength=8`.
- Không hard-code plaintext trong frontend/backend runtime, SQL migration, committed env hoặc console log. Password xuất hiện trong plan là stakeholder-provided bootstrap specification; seed nhận giá trị qua env/input riêng cho operator.
- Seed command conceptual `auth:seed-local`, chỉ explicit local/test; không tự chạy trên app startup/migration và không tạo public account-seed endpoint.
- Mỗi account có salt riêng dù password giống nhau; IDs/hashes khác nhau.
- Seed transaction/idempotency: tạo account thiếu, giữ existing password/role/active flag của account đã tồn tại. Nếu account existing role lệch mapping đã chốt, dừng với report để operator xử lý; không silently promote/reset.
- Rerun không tạo duplicate account, reset password hoặc revoke session đang dùng. Không thêm bulk/reset command ngoài scope.
- Handoff ghi account usernames/roles và seed success, không chép password hash/session secret. Cần rotate initial credentials khi chuyển môi trường thật; không tự triển khai rotation workflow trong phase này.

## 8. Login/session design

Chosen implementation design: **NestJS local credentials + PostgreSQL opaque sessions + same-origin HttpOnly cookie**. Hai accounts nhỏ không cần identity provider ngoài hoặc auth application riêng.

- Login validate username/password ở NestJS; username canonicalization được freeze và test; nonexistent/inactive/wrong-password trả cùng generic 401 response.
- New login tạo cryptographically random session secret tối thiểu 32 bytes; DB lưu digest, browser nhận opaque secret qua cookie. Không reuse session ID client đưa vào.
- Cookie name conceptual `bei_session`; `HttpOnly`, `SameSite=Lax`, `Path=/`, không Domain attribute; `Secure` bắt buộc khi HTTPS, local HTTP profile cho phép `Secure=false` được document rõ.
- Fixed expiry mặc định 8 giờ; server TTL là authority; cookie max-age/expiry nhất quán. Không remember-me hoặc silent renewal trong phase này.
- Nếu login khi có valid prior cookie, revoke prior session trước/transactionally với replacement; không reset các phiên khác của user ngoài yêu cầu.
- Logout revoke current persisted session và expire cookie cùng name/path/settings; replay token bị từ chối. Invalid/expired cookie được clear khi route handler có thể clear; không set/delete cookie trong Server Component render.
- Backend/DB lỗi -> 503/unavailable, không tạo guest identity, không fallback sang Manager hoặc demo auth.
- Login chống brute-force bằng bounded attempt limiter, ví dụ per normalized username + server-observed peer key, có 429 và reset window; limiter trước expensive hash. Có bounded hash concurrency để tránh unlimited scrypt allocations.
- Không tin arbitrary `X-Forwarded-For`; chỉ dùng forwarding khi proxy trust đã được cấu hình rõ. Không bổ sung Redis/limiter tables nếu một local NestJS instance đủ.
- DTO validation và logs không in submitted passwords, raw cookies, hashes hoặc SQL parameter payloads.

### 8.1 CSRF cho cookie API

Minimum JSON API pattern: mọi unsafe browser request (`POST/PUT/PATCH/DELETE`) phải có configured exact allowed web Origin, `application/json` nếu có body, và custom header `X-BEI-Request: 1`; reject missing/null/mismatched Origin hoặc thiếu header. Đây là custom-header + strict-origin CSRF approach, **không phải session token header**.

- Áp dụng login và logout, future manual/config mutations, cũng như legacy placement mutation routes trước khi service write có thể chạy.
- Browser form submit login dùng JS fetch JSON cùng origin; không cho alternate form/text/plain paths bypass checks.
- Next forward original browser Origin/custom header qua allowlist; không invent trusted Origin thay cho browser request bị thiếu.
- NestJS compare configured `AUTH_ALLOWED_WEB_ORIGINS`, không so trực tiếp backend Host vì frontend/proxy khác host/port.
- CORS không wildcard với credentials, không bật direct-browser-to-NestJS login chỉ để tiện test. Browser tiếp tục same-origin Next API.
- Test direct HTTP clients đặt Origin/custom header hợp lệ để exercise auth/CASL; CSRF controls không thay thế verified session/ability.

## 9. API contract

### 9.1 Endpoints mới

| Next browser route | NestJS route | Method | Kết quả |
| --- | --- | --- | --- |
| `/api/auth/login` | `/api/v1/auth/login` | POST | Login, set session cookie, safe current-user DTO |
| `/api/auth/me` | `/api/v1/auth/me` | GET | Verified user + sanitized CASL rules; 401 nếu invalid |
| `/api/auth/logout` | `/api/v1/auth/logout` | POST | Revoke current session, expire cookie, success response |

Payload login: chỉ `username`, `password`; reject role/userId/rules/extra fields qua validation. Current-user DTO tối thiểu:

```text
user:
  id
  username
  role: viewer | manager
  displayRole: Viewer | Manager
abilityRules: sanitized explicit action/subject rules
sessionExpiresAt
```

Không trả password/hash/session secret hoặc PostgreSQL entity. Các endpoints dùng `Cache-Control: no-store`, không shared-cache response theo user; error shape phù hợp existing exception filter.

### 9.2 Existing route classification

| Route/domain | Identity/policy trong phase này |
| --- | --- |
| Bảy `/dashboard/*` pages và `/dashboard` entry | Verified application session + `Dashboard:read` |
| Nest `/api/v1/dashboard/...` controllers | Session guard + read policy; cả roles đọc được |
| `/api/devices/dashboard/...` proxy | Forward only app session cookie; backend remains authority |
| `PUT/DELETE /api/v1/devices/:id/display-position` | Session guard + named update/delete policy; cả roles 403 |
| Proxy tới hai placement mutations | Cùng backend guard; không có alternate unguarded route |
| Existing campus/floor/device telemetry GETs, health/static Unity assets | Giữ current public-read policy; không broad global auth rollout |
| Future PCCC CRUD và AlertConfig update | CASL policy đã có; production endpoints chưa tạo trong phase này |

Anonymous placement mutation trả 401; Viewer/Manager với valid session và hợp lệ CSRF headers trả 403 trước service/DB mutation. State/revision không đổi. DTO validation/revision checks không trở thành bypass.

## 10. Backend guard và legacy-write integration

- Auth guard trước CASL guard: load verified active account, attach safe principal; sau đó ability factory/policy check.
- Dùng reusable `RequireAbility(action, subject)` hoặc naming theo convention; Dashboard reads bắt buộc có read metadata.
- Không cài global auth guard khiến health, campus GETs hoặc existing service-level tests bị chặn ngoài approved scope.
- Chặn placement writes bằng ability absence cho `DeviceDisplayPosition:update/delete`; không special-case username, hardcoded password hoặc role header.
- Seed/importer CLI nội bộ vẫn là trusted operator workflow, không thêm HTTP importer để bypass guard.
- Giữ service revision/transaction/source-mode semantics hiện có; không xóa hoặc rewrite placement persistence subsystem.
- Tests cũ cần anonymous PUT/DELETE success phải điều chỉnh thành auth-denial contract. Giữ transactional/concurrency/reset logic coverage bằng isolated service tests; không thêm third role hoặc test-only production bypass cho các tests cũ.
- HTTP allow/deny cho Manager PCCC được verify qua test-only controller trong test module, cùng production guards/factory. Không tạo fake PCCC write endpoint hoặc bảng mẫu trong production.
- Không đổi alert rule registry, evaluator, demo events hoặc report calculations. Existing `authorizationAvailable` capability chỉ đổi bằng minimal backend patch nếu handoff định nghĩa rõ nó biểu thị auth foundation; nó không bật event/config mutation capabilities. Ưu tiên để domain payload hiện tại nguyên trạng và defer capability reconciliation cho domain phase.

## 11. Next.js session boundary và proxy

### 11.1 Verified reads

- Server-only session/DAL helper gọi fixed Nest `/auth/me` với `cache: 'no-store'`, forwarding only `bei_session`; không chuyển cả Cookie header.
- Layout có thể fetch identity để render shell/provider, nhưng **không coi layout check là authorization duy nhất**. Next layouts không recheck mọi client navigation và không chặn nested route/RSC execution.
- Thêm minimal `await requireDashboardSession()` ở các Dashboard server page entries hoặc equivalent verified route boundary trước khi render protected page; giữ domain content/labels nguyên vẹn.
- Bảo vệ cả direct navigation, refresh, RSC request, prefetch và cached-back client transitions. Optional `proxy.ts` chỉ dùng optimistic missing-cookie redirect, không coi cookie tồn tại là valid identity.
- Redirect unauthenticated tới `/login`; `next` chỉ accept approved internal Dashboard pathname/query, không absolute/protocol-relative URL hoặc arbitrary route. Default `/dashboard/overview`.
- Backend/DB unavailable cho auth render error/retry, không tạo redirect loop giữa login/dashboard.
- Auth provider nhận safe DTO/rules qua props; không import server-only helper vào client components. Client abilities chỉ quyết định presentation.
- Public campus/Viewer components nằm ngoài Dashboard provider: ability hook/wrapper phải có empty/deny-all fallback, không throw hoặc bắt login chỉ để render read-only device panels. Không wrap global campus application trong Dashboard authentication gate.
- Handle 401 ở common proxy/auth boundary bằng clear authenticated client state và đưa về login; không rewrite widget error text để biến hết thành auth text.
- Revalidate identity ở navigation/focus hoặc request boundary phù hợp; không background polling telemetry. Backend kiểm tra mỗi protected request kể cả client provider đang giữ rules cũ.
- Login/logout navigation phải clear/revalidate client identity và route cache, hoặc dùng full navigation tới validated target, để back navigation không khôi phục authenticated shell/actions của phiên đã logout. Không cache `/auth/me` hoặc authenticated RSC payload vào shared public cache.

### 11.2 Proxy routing/cookies

- Tạo dedicated auth route handlers với exact method/path allowlist; catch-all devices proxy phải từ chối `auth/*` để không bypass auth-route CSRF/cookie handling.
- Generic devices proxy cần explicit **existing path + method allowlist** trước khi tạo upstream URL, sau segment decoding/normalization. Reject dot segments, decoded slash/backslash trong segment, malformed encoding và traversal/alias như encoded `../` dẫn tới auth path; prefix check `auth/*` riêng không đủ. Re-audit current approved floor/device/Dashboard paths để giữ valid GET workflows.
- Preserve existing GET/proxy parameters, request IDs và placement-revision forwarding.
- Forward chỉ application session cookie tới approved Dashboard/placement routes. Không forward arbitrary Authorization, X-User/X-Role hoặc upstream bearer token.
- Preserve backend status/content-type/cache headers cần thiết. `Set-Cookie` auth headers phải chuyển độc lập, không split bằng dấu phẩy; giữ attributes và expiry của cookie trong response Next.
- Generic device proxy không trở thành pass-through cho tùy ý `Set-Cookie`/auth endpoint.
- `PATCH` chỉ export khi actual approved route cần; không mở method/path mới không tồn tại. Unknown/disallowed auth paths/methods -> 404/405 consistent.
- Same-origin API handlers không tự suy role; direct Nest HTTP vẫn được guards bảo vệ.

## 12. UI Architecture & Mockup Alignment

### 12.1 Reference và ownership

Không có login mockup riêng. Minimum login form có thể dùng existing aligned Dashboard design tokens mà không cần dựng lại page mockup. Reference shell: UI alignment full viewport `1842 × 1222`, High-Level Sidebar 64 px, Dashboard Sidebar 288 px; bảy business routes giữ nguyên.

`/login` nằm ngoài `/dashboard` layout để không login-loop; đây là authentication utility route, không phải Dashboard Page 08/10 hoặc route thứ tám trong menu.

```text
Root application layout
├── /login
│   └── LoginCard + LoginForm
└── /dashboard/*
    ├── Verified server route boundary
    ├── DashboardAbilityProvider (safe user/rules)
    └── DashboardShell
        ├── Existing high-level rail and seven-route sidebar
        ├── DashboardAccountControls (sidebar footer)
        └── Existing page content unchanged
```

### 12.2 Geometry, labels và behavior

| Vùng | Desktop | Mobile | Nội dung |
| --- | --- | --- | --- |
| Login canvas | Full viewport, centered | Full viewport, 20–24 px gutter | Existing dark background |
| Login card | Max width 400–440 px, padding 28–32 px | Fluid width, padding 20–24 px | Brand BEI, title `Đăng nhập Dashboard` |
| Inputs | Full width, min height 44 px, gap 12–16 px | Same touch targets | `Tên đăng nhập`, `Mật khẩu` |
| Submit | Full width, min height 44 px | Full width | `Đăng nhập`, pending `Đang đăng nhập…` |
| Inline result | Reserved compact area, no raw error | Wrap naturally | Generic invalid credentials; retry on unavailable |
| Sidebar account block | Existing footer area, compact two lines + logout | Inside existing drawer | Verified username, Viewer/Manager, `Đăng xuất` |

- Không đặt role dropdown hoặc account switcher để user tự chọn quyền.
- Không hiển thị password, account seed instructions hay DB/CASL technical fields trong user UI.
- Form có associated labels, autocomplete `username`/`current-password`, Enter submit, visible focus và polite error announcement.
- Submit disabled khi pending; tránh duplicate login; safe retry khi error.
- Logout là POST, disable khi pending, chuyển login sau confirmed revoke; nếu backend lỗi thì không báo logout success giả.
- Page headers/AT avatars hiện có giữ nguyên; account block mới là nơi hiển thị verified account. Không cần sửa text/icon hàng loạt.
- Cả roles có cùng Dashboard visual/data values; difference chỉ ở allowed future actions.
- DeviceManagementPanel edit/reset controls bị disabled/hidden cho cả roles và anonymous theo CASL; shared control có thể thêm concise denial tooltip nếu cần, không restyle panel/Unity.

### 12.3 Tokens và deliberate differences

Reuse near-black/slate surfaces, teal `#4FB9AD`, one-pixel subtle borders, radius 12–14 px, app font và existing responsive shell. Login title 24–28 px; form text 13–14 px; role/helper 11–12 px. Không đổi global CSS tokens gây lệch các page đã hoàn thành.

| Reference | Phase 09 handling | Lý do |
| --- | --- | --- |
| Existing aligned Dashboard shell | Giữ geometry/navigation/content | Stakeholder bảo vệ các trang cũ |
| Neutral header avatars | Không rewrite; verified identity tại footer | Tránh page-specific edits |
| Không có login mockup | Minimal card từ existing tokens | Authentication utility, không full page redesign |
| Existing placement edit/reset | Denied/disabled cho hai roles | Stakeholder đã xác nhận |
| Disabled alert/environment controls | Giữ disabled | Domain/persistence chưa sẵn sàng |

Visual QA: `1842 × 1222`, `1440 × 900`, `1024 × 768`, `390 × 844`; login + both-role shell screenshots; verify footer/drawer không overflow, focus/keyboard hoạt động và page content không bị thay đổi.

## 13. Expected file impact

Names conceptual; re-audit naming trước implement, tránh duplicate architecture.

```text
backend/src/auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  password-hasher.service.ts
  session-auth.guard.ts
  dto/*
  tests/*
backend/src/authorization/
  authorization.module.ts
  casl-ability.factory.ts
  require-ability.decorator.ts
  policies.guard.ts
backend/src/database/entities/
  application-user.entity.ts
  application-session.entity.ts
backend/src/database/migrations/<new>-ApplicationIdentityTables.ts
backend/src/auth/scripts/seed-local-accounts.ts
backend/test/auth-authorization.e2e-spec.ts

web/src/app/login/page.tsx
web/src/app/api/auth/{login,me,logout}/route.ts
web/src/lib/auth/{session.server,auth-api,ability}.ts
web/src/types/auth.ts
web/src/components/auth/{LoginForm,DashboardAbilityProvider,DashboardAccountControls}.tsx
web/test-bp2-phase09.mjs
```

Authorized existing integration edits:

- Backend app/database/configuration/datasource/package-lock/package scripts; auth env example without real credentials.
- Dashboard controller/module guard registration.
- Devices controller/module guards; service tests chỉ khi cần preserve old transaction coverage.
- `web/src/app/api/devices/[...path]/route.ts`.
- Dashboard layout, `web/src/app/dashboard/page.tsx` entry và bảy page entries **chỉ verified-session wrapper**; giữ global `web/src/app/page.tsx` và public campus redirect hiện tại.
- DashboardShell footer integration.
- `web/src/components/devices/DeviceManagementPanel.tsx` và common device API error boundary **chỉ permission denial handling**.
- Web package/lock/test aggregate registration, minimal common auth-error integration nếu cần.
- Existing placement HTTP tests do policy change đã chốt; không xoá checks business transaction.

Không thêm PCCC/AlertConfig/report tables, endpoint CRUD hoặc page-specific refactor. Handoff phải phân biệt implementation edits với user-owned working-tree modifications.

## 14. Implementation checkpoints cho Coding Agent

1. **Re-audit:** git/working tree, exact packages, auth/mutation inventory, protected page labels và env/DB target; đọc relevant bundled Next docs. Không dùng current env credentials trong output.
2. **Contract/CASL:** freeze typed roles/actions/subjects/matrix trong section 5; factory + guard tests; no third role/broad grant.
3. **Auth persistence:** add migration/entities, verify runtime permissions và isolated migration tests; preserve floors/device/report boundary.
4. **Seed accounts:** explicit local/test seed two usernames đúng requested password via operator input/env; verify idempotency/current-role preservation without logging secrets.
5. **Session endpoints:** login/me/logout, hashing, cookie lifecycle, rate limit, CSRF, safe DTO, 401/403/503 behavior.
6. **Authorization enforcement:** guard existing Dashboard reads and placement writes; verify direct Nest/proxy denial trước service writes.
7. **Next integration/UI:** dedicated auth routes + server helper/page boundaries + client provider + login/footer; deny legacy placement UI controls; preserve existing page labels/layout.
8. **Verification:** tests/build/lint, session replay/tampering/expiry, both-account browser checks, protected diff audit và screenshots.
9. **Handoff:** tạo file section 18; update implementation status docs với evidence. Chỉ sau nghiệm thu mới cho Small Phase 17 bắt đầu.

## 15. Test matrix và verification

| Nhóm | Cases bắt buộc |
| --- | --- |
| Ability factory | Anonymous/unknown/inactive fail closed; full Viewer/Manager matrix; Manager PCCC delete allow; placement update/delete deny cả roles; unknown action/subject denied |
| Seed/hash | Two unique accounts, correct roles, salted hashes khác nhau, requested password login succeeds; seed rerun không duplicate/reset/promote; mismatched existing role reported |
| Login/session | Invalid credentials generic 401; DTO role injection rejected; rate limit 429; session fixation prevented; password/hash/token absent public DTO/logs |
| Lifecycle | Fixed expiry, logout revoke + cookie expiry, replay denied, deactivate/role-change next request effective, backend/DB failure fail closed |
| Protected reads | Anonymous Dashboard APIs 401; both roles success; identical data/provenance; no business data fetched before denied auth |
| Placement writes | Anonymous 401; both roles 403 through Nest + Next, with valid CSRF headers; position/revision unchanged; no role/header/body/path bypass |
| Future PCCC policy | Test-only controller using real production guards: Viewer C/U/D 403; Manager C/U/D allow; test-only endpoint không xuất hiện production OpenAPI |
| CSRF/proxy | Missing/null/wrong Origin/custom header denied; no form/plain-text bypass; decoded path/method allowlist và traversal/alias rejection; cookie/Set-Cookie attributes preserved; no arbitrary Cookie/identity header forwarding |
| Next route boundary | Direct navigation/refresh/RSC/prefetch/back navigation/session invalidation; page-level verified check + backend guard; login open-redirect protection; backend failure không login-loop |
| Browser/UI | Both real accounts login/logout; username/role đúng; Viewer không có input privileges; Manager future capabilities không tự bật domain forms; both placement controls denied; public campus empty-ability fallback không crash; mobile keyboard/focus |
| Regression | All BP2 prior tests, Water/Environment/Alerts/IoT/Parking data + labels unchanged; Unity/campus read workflow và seven-route shell preserved; service transaction coverage vẫn còn |
| PostgreSQL | Auth migration clean + rerun, check constraints, FK/indexes, runtime DML/no DDL; existing floor/device data preserved; no report/alert/PCCC table added |

Run appropriate commands from package manifests: backend unit/build/e2e against explicitly isolated DB; web phase09 + aggregate tests/lint/build. Add phase09 test to aggregate without replacing previous phases.

Existing `backend/test/app.e2e-spec.ts` loads a fixed env profile and deletes fixture namespace rows. Do not run it blindly against stakeholder data. Adapt test targeting/isolation as needed; document exact resolved target before tests containing writes.

Verification must include behavioral HTTP assertions and DB unchanged-state evidence; file-text snapshots alone không chứng minh authorization. Report skipped tests/environment blockers honestly; không tuyên bố verified nếu chỉ viết tests.

## 16. Acceptance criteria

Phase 09 / Small Phase 16 hoàn thành khi:

1. Exactly two typed application roles; CASL matrix section 5 passes.
2. `beiviewer` và `beimanager` tồn tại trong intended local/test PostgreSQL và login được với initial password đã chốt, hashes salted khác nhau.
3. Users/session persistence có migration; seed explicit/idempotent; không account-admin domain hoặc per-user PostgreSQL LOGIN roles.
4. Login/me/logout hoạt động qua same-origin Next routes; session validation/revocation/expiry server-side.
5. Anonymous Dashboard access denied; both accounts đọc Dashboard qua verified route/API boundary.
6. Viewer không thể production domain writes; Manager PCCC create/update/delete policies verify qua test-only boundaries; production CRUD vẫn chờ Small Phase 17.
7. Both roles và anonymous bị chặn placement mutations đúng 401/403; current DB positions/revisions preserved.
8. Domain-disabled alert/environment/PCCC controls không tự bật; no early report/alert/telemetry persistence.
9. Seven Dashboard pages, stakeholder labels, live raw fetch/calculation và deterministic demo values không thay đổi ngoài listed auth integration.
10. No password/hash/token leaks; cookie/CSRF/rate limit/tampering tests pass.
11. Build/lint/tests/migration/browser/visual/protected diff evidence có trong handoff.
12. Mandatory handoff file tồn tại trước khi report completed.

## 17. Roadmap và implementation references

- Small Phase 16: `READY FOR IMPLEMENTATION — PLAN ONLY`; temporary hold đã được stakeholder gỡ, chưa claim implemented.
- Small Phase 17: chờ Small Phase 16 implementation/handoff; Manager authorized PCCC CRUD theo quyết định mới.
- Small Phase 18: chờ Small Phases 15 + 17; chưa implement fire grid trong phase này.
- Small Phase 19: Parking completed theo `bp2_phase08_demo_completion_energy_parking_handoff.md`.
- Small Phase 20: integration sau required dependencies.
- Small Phase 21: vẫn là last implementation subphase cho IoT-derived report/alert persistence; identity tables không đóng IoT semantics/volume gate.
- Page 02 Energy completion chưa có dedicated current task sau Parking-only scope; không tự đưa vào Small Phase 16.

Technical references, checked 2026-10-01; Coding Agent verify installed APIs rather than copying old examples:

- [CASL official repository](https://github.com/stalniy/casl): explicit action/subject abilities, serializable rules.
- [NestJS v11 authorization](https://docs.nestjs.com/v11/security/authorization): guards and CASL integration; use versioned guidance phù hợp repo.
- [Node.js crypto](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback): asynchronous scrypt/random salt/constant-time comparison primitives.
- [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): scrypt parameter profiles.
- [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html): custom-header JSON API pattern and exact Origin checks.
- Repository bundled `web/node_modules/next/dist/docs/01-app/02-guides/authentication.md`, especially DAL/layout/Route Handler guidance; `.../03-api-reference/04-functions/cookies.md` for async cookies and handler-only mutation.

## 18. Mandatory handoff sau implementation

Coding Agent **bắt buộc tạo**:

`web/doc/bp2_phase09_minimal_identity_casl_foundation_handoff.md`

Handoff gồm tối thiểu:

- Branch/HEAD, initial working tree, exact new/modified files, preservation of user-owned modifications.
- Approved two-role/action matrix và capability-vs-domain-readiness explanation.
- Account seed evidence usernames/roles/idempotency, không password hash/session secret.
- DB/env target resolution, migration status, runtime privilege evidence và existing data preservation.
- Login/session/cookie/CSRF/rate-limit contract, expiry/revocation/tampering tests.
- Direct Nest + Next HTTP allow/deny results, đặc biệt no placement writes cho cả roles.
- Test-only future CRUD authorization evidence; production OpenAPI không có fake PCCC/config endpoints.
- Protected route/page edits and justification; before/after label/layout regression evidence.
- Browser screenshots cho login và cả roles tại section 12 viewports, keyboard/mobile results.
- Unit/e2e/web/build/lint results, exact environment limitations/open issues.
- Small Phase 17 entry checklist, Small Phase 21 persistence gates vẫn mở và roadmap status cập nhật dựa trên evidence.

> **Final instruction to Coding Agent:** Implement only Phase 09 / Small Phase 16 from this plan. Create the two application accounts `beiviewer` (Viewer) and `beimanager` (Manager) with the requested initial password through explicit local/test seeding and hashed storage. Enforce the approved CASL matrix: Viewer reads only; Manager may create/update/delete PCCC manual records when Small Phase 17 supplies their domain; neither role may update/delete device display positions. Preserve stakeholder-edited content and the aligned UI of completed pages, making only the minimal verified auth/guard integrations listed here. Do not implement PCCC CRUD/fire grid, enable unavailable alert editing or advance IoT report/alert PostgreSQL persistence. After implementation and verification, you **must create `web/doc/bp2_phase09_minimal_identity_casl_foundation_handoff.md` before reporting completion**.
