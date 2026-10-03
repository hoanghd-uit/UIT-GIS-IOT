# BP2 Fix Plan — Page 07 Render Loop, Paged Telemetry & 5-Minute Refresh

> **Ngày:** 2026-10-03  
> **Trạng thái:** IMPLEMENTED & VERIFIED (Hotfix sau Small Phase 24)  
> **Loại:** Hotfix nhỏ sau Phase 11 / Small Phase 24; không tạo hoặc đổi ID Small Phase  
> **Trang:** Page 07 — Hệ thống IoT (`/dashboard/iot`)  
> **Cadence bổ sung:** Refresh telemetry mỗi 5 phút, chỉ Page 07; không áp dụng cho page khác  
> **Handoff bắt buộc:** `web/doc/bp2_fix_page07_render_loop_paged_telemetry_handoff.md`

## 1. Mục tiêu và kết quả kiểm tra roadmap

1. Sửa `Maximum update depth exceeded` khi mở chi tiết thiết bị, không dùng thay đổi polling để che lỗi React.
2. Phân trang **10 thiết bị/trang** cho component **Danh sách thiết bị** và tự tải RSSI/SNR/thời điểm mẫu cho các thiết bị có capability trên **trang đang hiển thị**, không cần chọn từng row.
3. Theo yêu cầu stakeholder bổ sung, tự refresh **mỗi 5 phút (`300000 ms`)** cho radio summary của visible page và chart/history của **thiết bị đang mở chi tiết**. Đây là ngoại lệ polling được duyệt riêng cho Page 07, không phải thay đổi cadence chung của Dashboard.

Đã đối chiếu remaining Small Phases **25, 17, 18, 26, 20, 21, 22** và optional **27**:

| Small Phase tương lai | Scope liên quan | Có giải quyết yêu cầu tải radio summary theo trang + paging 10 thiết bị? |
| --- | --- | --- |
| 25 | Environmental sources và room/grid adapters | Không; không phải catalogue Page 07 |
| 17 / 18 / 26 / 27 | PCCC, Energy demo, optional webhook inspection | Không |
| 20 | Cross-page integration, provenance và bounded raw reads | Không có task triển khai tính năng này; chỉ kiểm tra tích hợp chung |
| 21 | Report/alert PostgreSQL persistence có entry gate | Không; không phải giải pháp bắt buộc cho row radio summary |
| 22 | Acceptance/hardening | Không; không phải feature phase |

**Kết luận: không skip yêu cầu thứ hai; triển khai cả hai mục gốc và cadence 5 phút bổ sung trong hotfix này.** Small Phase 24 đã delivered raw `sb`/`smoke` detail theo handoff và current source, nhưng không delivered automatic page summaries hoặc catalogue paging. Paging 20 dòng trong `IotRawTelemetryDetails` là **lịch sử telemetry**, không phải paging danh sách thiết bị.

Roadmap còn wording lịch sử nói Small Phase 24 pending trong một số đoạn, dù header/status và Phase 11 handoff đã ghi complete. Không dùng wording cũ đó để triển khai lại bridge `sb`/`smoke`. Hotfix chỉ bổ sung UX này; không tự bắt đầu Small Phase 25 hay phase khác.

**Lượt lập/cập nhật plan chỉ sửa tài liệu. Không implement code, gọi live IoT, thay runtime fetch rate, tạo account hoặc chạy migration.** Yêu cầu cadence mới trong plan này thay đúng các quy tắc `no timer/no polling` cũ **trên Page 07**; mọi yêu cầu khác vẫn giữ nguyên.

## 2. Required reading và baseline

Coding Agent đọc trước khi implement:

- `web/AGENTS.md` và relevant bundled Next.js guides trong `web/node_modules/next/dist/docs/` trước khi viết web code.
- `web/doc/dashboard_big_phase_small_phase_plan.md`: remaining scopes, protected-page rules, persistence boundary.
- `web/doc/Dashboard_Knowledge_Base.md`: Page 07, DataMode và auth rules.
- `web/doc/IoTBackend_API_HandOver.md`: §§9, 14, 16–19, 24.3, 30–31; không có upstream `/latest` hoặc documented cursor/offset paging.
- `web/doc/bp2_phase11_page07_sb_smoke_raw_telemetry.md` và matching handoff; `bp2_fix_align_UI.md` và matching handoff. Handoff là snapshot, không thay runtime verification.
- Current Page 07 orchestration/table/detail, telemetry API/range/types, backend Dashboard telemetry service/query DTO và relevant tests.

Khi tài liệu cũ yêu cầu không polling, decision stakeholder mới nhất cho phép **chỉ Page 07** refresh 5 phút theo mục 6.4. Không cập nhật polling policy trong shared Dashboard shell, các page khác hoặc backend jobs để áp yêu cầu này.

Baseline đã đọc bằng source:

- `IotCataloguePanel.client.tsx` truyền inline `onTelemetryLoaded`; callback gọi `setSelectedTelemetrySummary`.
- `IotDeviceTelemetryPanel.client.tsx` có effect `[data, onTelemetryLoaded]`, tạo summary object mới mỗi lần effect chạy. Callback identity mới → effect → state object mới → parent render → callback mới: nguyên nhân vòng lặp sau khi có mẫu.
- Table chỉ dùng `selectedTelemetrySummary` cho row được chọn; row khác cố ý hiện `—`. Không có per-device summary map hoặc catalogue pagination.
- Catalogue được filter local theo search/type rồi truyền toàn bộ `filteredDevices` vào table. Floor/room filters dùng application catalogue API.
- Dashboard telemetry hỗ trợ `solar | avc | sb | smoke`, có `latestSample`, range max 7 ngày và `limit` 1..1000. Frontend helper hiện hard-code `limit=1000`; default detail preset là `last-72h`.
- NFC contract chỉ có scan events, không RSSI/SNR/Gateway. NFC/unknown chưa được hỗ trợ bởi Dashboard telemetry endpoint; không giả capability.

Baseline này không phải fresh browser/network/test verification. Coding Agent phải reproduce và đo request counts với mocked source trước/sau fix.

## 3. Scope và bảo vệ nội dung stakeholder

**Không quay lại các page đã implement — Overview, Water/Energy, Environment, Alerts, Parking, PCCC — để sửa text/labels, UI hoặc logic không liên quan.** Stakeholder đã tự chỉnh nội dung; không phục dựng wording từ mockup hay plan cũ. Bug khác phải báo riêng; chỉ sửa thêm khi thật sự block hotfix, có reproduction và minimal diff, hoặc được stakeholder duyệt.

Page 07 cũng được bảo vệ: giữ header, KPI titles/count scope, filters, table columns/status text, Gateway card, support cards, selected-detail location và Solar/AVC/SB/Smoke presentation. Không global restyle, sửa shell/CSS hoặc đưa radio summaries vào alert evaluator/menu badge.

Ngoại lệ UI/copy được phép chỉ gồm:

- Footer phân trang, row-summary loading/error/empty/unsupported hints và action refresh của trang hiện tại.
- Thay đúng tooltip cũ nói RSSI/SNR/thời điểm mẫu chỉ có khi chọn thiết bị, vì behavior mới khiến thông tin đó sai.
- Không đổi nhãn `RSSI`, `SNR`, `Lần cuối`, `Pin`, `Firmware`, `Trực tuyến trong API` hoặc wording stakeholder khác.

Không cần mockup mới: screenshot/current aligned Page 07 là reference; chỉ thêm compact footer theo design tokens hiện có. Nếu muốn redesign vượt phạm vi này, hỏi stakeholder trước.

Không PostgreSQL schema/entity/migration, telemetry/report persistence, server-side background job, webhook, upstream write, role/account/password change. Chỉ được thêm browser refresh scheduler do Page 07 sở hữu theo mục 6.4; không global timer, cron hoặc change default refresh behavior của shared callers. Reuse Viewer/Manager read permissions và existing session/proxy; hai role vẫn bị chặn placement update/delete. Report/alert persistence vẫn ở Small Phase 21.

## 4. Task A — Chặn state/effect feedback loop

1. Ổn định callback parent (`useCallback` hoặc stable state callback phù hợp), không truyền callback mới liên tục vào effect đồng bộ dữ liệu.
2. **Chỉ notify/update khi summary thực sự thay đổi.** Equality gồm device identity, Gateway, RSSI, SNR và observed timestamp; cùng giá trị thì giữ summary state reference cũ và không gọi lại callback chỉ vì refresh tick, object identity, query window, local `fetchedAt` hoặc request generation mới. Refresh/provenance metadata cập nhật riêng khi cần. Chart data giữ reference nếu series thực sự không đổi; response object mới không tự đồng nghĩa series mới. Không bỏ dependencies hoặc suppress hooks lint để che lỗi.
3. Callback/result phải gắn với đúng `externalDeviceId`; bỏ response/callback cũ sau switch, close hoặc unmount. Tách lifecycle theo ID (ví dụ keyed detail panel) và invalidate request generation/abort khi cleanup để không gắn data thiết bị trước vào thiết bị mới.
4. Giữ history fetch/preset/manual refresh của selected detail, bổ sung background refresh 5 phút theo mục 6.4; click row không refetch catalogue hay tất cả page summaries. Parent/table rerender, summary notify và chart metric switch không tạo network request mới hoặc reset refresh clock.
5. Tách selected-detail/Gateway summary khỏi page-row summary ở Task C. Callback `null` khi detail loading/close không được xóa summary của mọi row; summary từ range lịch sử không ghi đè radio snapshot mới hơn hoặc khác range.

## 5. Task B — Catalogue paging 10 thiết bị/trang

1. Filter trước, paginate sau: `filteredDevices` → slice tối đa **10** devices → render table. Giữ thứ tự catalogue hiện tại ổn định trong cùng một response; không sort lại theo thứ tự telemetry trả về.
2. Default page 1; tính page count từ **số devices đã tải và khớp filter**. Reset page 1 khi search/type/floor/applied room đổi; clamp/reset an toàn khi catalogue thay đổi. Row disclosure không tính thành một thiết bị riêng.
3. Giữ title counter hiện tại là filtered/loaded catalogue counts, không đổi thành count của riêng trang. Footer mới hiển thị `Hiển thị 1–10 / 11 thiết bị`, `Trang 1 / 2`, nút `Trước`/`Sau`; page size cố định 10, không thêm selector.
4. Dùng button semantics, keyboard focus, disabled boundary và accessible loading/progress indication. 0 kết quả dùng empty state hiện có; không render `Trang 1 / 0`. 1–10 kết quả vẫn có footer/count, hai navigation buttons disabled.
5. Khi page/filter đổi làm selection không còn trong visible rows, đóng detail/clear selected Gateway summary; row summary cache không bị xóa chỉ vì đóng detail. Technical disclosure không trỏ tới row đã rời trang.
6. Đây là **client-side paging trên catalogue đã tải**, không gửi `page`, `offset`, `cursor` tới upstream hoặc tuyên bố đã load toàn fleet. Nếu catalogue truncated, giữ caveat và chỉ tính trên accepted loaded subset. Page navigation/search/type không refetch catalogue; floor/room reload vẫn theo behavior hiện tại.

## 6. Task C — Tự tải radio summary của visible page

### 6.1 Policy được chọn cho hotfix

- Auto-load sau khi catalogue/filter/page ổn định, chỉ cho tối đa 10 visible IDs; không prefetch các trang ẩn hoặc scan fleet.
- `solar | avc | sb | smoke`: dùng existing same-origin Dashboard telemetry endpoint; backend vẫn resolve type từ trusted metadata, không browser chọn upstream endpoint.
- Snapshot window **72 giờ qua**, reuse `last-72h` hiện có; lấy một reference time cố định khi bắt đầu mỗi initial/manual/5-minute refresh batch, không tính lại mỗi render. Đây là app UX policy, không upstream cadence hoặc lời đảm bảo online.
- Explicit `start`, `stop`, **`limit=1`**, newest-first: lấy coherent newest valid returned sample trong window. Empty/invalid result vẫn honest empty; không tự mở rộng range/backfill khi thiếu dữ liệu. Không gọi undocumented `/latest`.
- Tối đa **2 telemetry request đồng thời trên Page 07**, bao gồm page-summary queue và selected-detail history, không phải hai request mỗi component. Tối đa một snapshot request cho mỗi supported visible device trong một refresh cycle, trừ retry/refresh do người dùng. Concurrency 2 là app load bound, không upstream rate-limit contract. Không rapid automatic retries; lần tự đọc tiếp theo chỉ theo cadence 5 phút ở mục 6.4.
- Selected-detail history là query riêng theo **preset đang chọn** và default `limit=1000`; snapshot một mẫu không đủ để coi history đã tải. Mỗi refresh tính rolling range mới cho preset đó. Không reset metric/preset/technical disclosure chỉ vì refresh, tăng limits hay thay history paging 20 dòng.

### 6.2 Data flow và cache

1. Mở rộng `fetchDashboardDeviceTelemetry` để nhận optional validated `limit` 1..1000; default vẫn 1000 cho callers cũ, summary gọi 1. Backend đã hỗ trợ limit 1; mặc định **không cần endpoint/service/DTO mới**.
2. Tạo typed row-summary map theo `externalDeviceId`, gồm device/type identity, query window, observed/fetched time, radio/Gateway values và status `loading | ready | empty | error | unsupported`. Chỉ lấy các field common từ `latestSample`, cùng mẫu; null khác 0. Kiểm tra response device identity/range trước khi apply.
3. Table render map cho **mọi visible row**, không phụ thuộc `isSelected`. Map updates không đổi visible-ID/generation identity và không kích hoạt fetch effect lại. Không để child mỗi row tự fetch.
4. Dùng stable query key gồm building, catalogue/filter scope generation, ID/type, window và limit; không tạo `new Date()`/range mới mỗi render. Queue/effect phải có input identity ổn định, không phụ thuộc map vừa cập nhật hoặc inline callbacks.
5. RAM snapshot cache chỉ tồn tại trong route lifetime, tối đa **20 entries** (hai page-size), theo logical slot building/scope/device/type và rolling `last-72h` policy; mỗi entry giữ exact result/query key, source window, fetch time và last-attempt time. Page back có thể reuse snapshot thành công chưa quá 5 phút, dù window trước hơi khác, nhưng phải giữ đúng provenance/window của kết quả cũ; không giả đó là response cho window mới. Entry cũ hơn cần revalidate khi visible; không dùng stale hit để skip refresh vô thời hạn. Retain old values với stale/error hint khi revalidate, không refetch trang ẩn. In-flight dedup vẫn theo **exact** ID/range/limit key; không dùng cache này thay arbitrary detail-history query. Evict bounded entries; không localStorage/IndexedDB/PostgreSQL, TTL job hoặc cross-user/global cache. Catalogue scope change invalidates đúng scope; unmount/logout giải phóng state. Refresh update/replace slot, không tích lũy 20 entries mới sau mỗi tick.
6. Deduplicate cùng key đang in-flight; abort obsolete flights và hủy queued work khi page/scope/window đổi hoặc unmount. Generation guard chặn response late kể cả transport không thực sự cancel. Sau switch chỉ queue visible IDs mới; không tiếp tục chạy phần queue của trang cũ.
7. Reuse existing request cancellation/error boundary. Một row 502/network/empty không làm toàn catalogue reload/error và không chặn rows khác. App-session 401/403 dừng queue và dùng existing auth handling; upstream credential 502 không logout user hoặc bị xem là session expiry. Không retry-loop lỗi.
8. Footer thêm action **`Làm mới dữ liệu trang`**: chỉ refresh visible supported rows với reference time mới, giữ catalogue và không tải các trang ẩn; disable khi refresh đang chạy. Manual action và scheduled refresh dùng cùng bounded loader; không tạo scheduler thứ hai. Detail manual refresh chỉ refresh selected history, không force toàn page snapshot.

### 6.3 Presentation và thiếu capability

- RSSI, SNR, `Lần cuối` hiện ngay sau row-summary completion, không cần click; preserved selected-row highlight độc lập. Gateway card vẫn chỉ đại diện selected device, không lấy device đầu tiên vừa hoàn thành queue.
- `Lần cuối` = latest **sample observedAt trong window**, không catalogue `updated_at`, local fetch time hoặc proof of network online. Tooltip có full observed time và window; giữ format cell hiện có.
- Row loading có compact accessible indication; empty/error/unsupported dùng `—` kèm lý do phân biệt. Ready rows không biến mất khi row khác chậm/thất bại. Có thể cho biết load progress trong footer, không blocking full-page spinner.
- Background refresh giữ table/chart và last successful data đang hiển thị, có refreshing indicator. Nếu refresh fail, giữ old data với stale/error hint và thời điểm lần thành công trước; không reset thành initial-loading, giả `fetchedAt` mới, hoặc im lặng coi dữ liệu cũ là fresh.
- NFC/unknown được phân loại `unsupported` ngay, **không gọi Dashboard telemetry biết chắc sẽ reject**. NFC không có radio fields; không fetch scan/card/person events để lấp cell. Firmware/battery percentage vẫn unavailable; không quy đổi voltage/flags thành % hoặc tự thêm metric/KPI.
- `limit=1` không chứng minh history đầy đủ; giữ window/provenance/quality caveat, không suy online/offline, IAQ hoặc fire state từ row summaries.

### 6.4 Task D — Refresh 5 phút, chỉ Page 07

1. **Initial load vẫn fetch ngay** cho visible supported rows; mở selected detail vẫn tải history ngay. Sau đó mỗi consumer (visible-page snapshot batch / selected-device history) đăng ký cadence **`300000 ms` sau lần attempt settle gần nhất** với một scheduler Page 07-owned. Manual refresh cập nhật deadline của đúng consumer; không ảnh hưởng cadence consumer còn lại. Render/state update không tạo timer hoặc reset deadline.
2. Scheduler chỉ chạy khi Page 07 mounted/active, tab visible, browser online và app session hợp lệ. Không selected supported device thì không có detail-history subscription. Ra page khác, logout hoặc unmount phải clear timer/listeners, hủy queued work và abort requests thuộc Page 07. Không đặt scheduler ở shared shell, module initialization, global fetch helper, reusable chart hoặc backend.
3. Chỉ dispatch consumers đã đến hạn, với reference time cố định cho mỗi batch. Page summaries chỉ lấy **visible supported IDs**, không refetch catalogue metadata/floors/KPIs hoặc trang ẩn. Detail chỉ fetch đúng current selected ID và current preset; không fetch chart các device từng chọn trước đó.
4. Một timer/clock điều phối subscriptions, không timer mỗi row/chart và không thêm timer riêng trong child cho cùng subscription. Mỗi consumer chỉ có một cycle in-flight; cycle chậm chưa xong thì không chồng cycle, không xếp backlog/catch-up ticks. Request generation, AbortController và bounded queue vẫn áp dụng cho initial/manual/scheduled paths. Scheduler backpressure giữ tổng telemetry concurrency ≤2, ưu tiên detail interaction để không bị queue rows chặn trải nghiệm.
5. Cùng exact query đang in-flight phải dedup. Có thể reuse `latestSample` của selected history cho row snapshot **chỉ khi** device/type/window/policy tương thích và đúng identity/provenance; không coi `last-24h`/`last-7d` response là `last-72h` snapshot. Nếu reuse full response, ghi query limit thực tế, không giả đã gọi `limit=1`. Khác range/limit có thể là hai query hợp lệ, không phải permission cho duplicate exact GET.
6. Tab hidden/offline: pause scheduling, không background polling hoặc retry-loop. Khi visible/online lại, chỉ thực hiện tối đa **một overdue cycle cho mỗi active consumer**, nếu đã quá 5 phút; không replay số ticks đã bỏ lỡ và không refetch focus khi chưa đến hạn. Generation guards chống late responses; runtime không cần bảo đảm tick đúng giây khi browser throttles.
7. Page/filter change dùng cached fresh rows hoặc tải ngay IDs mới/stale theo mục 6.2; chỉ đăng ký lại snapshot consumer cần thiết, không restart history vì table state đổi. Close/change device hủy subscription/request của detail cũ, giữ snapshot rows. Không tự clear cache toàn route sau mỗi tick. Error attempt cũng có cadence 5 phút (không lập tức retry); app 401/403 dừng scheduler, upstream 502 không logout user.
8. Request được refresh không có nghĩa data phải mutate: summary bằng giá trị cũ thì không notify/set lại; chart series bằng cũ thì không thay chart data reference. Chỉ quality/provenance/refresh-state metadata cần thiết cập nhật riêng. Giữ đầy đủ Task A, paging 10, cache bounds, unsupported states và no-touch labels/pages.

## 7. File allowlist và implementation order

Expected changes:

- `web/src/components/dashboard/iot/IotCataloguePanel.client.tsx`: pagination, stable callback/selection lifecycle, bounded visible-page orchestration và ownership của scheduler 5 phút.
- `web/src/components/dashboard/iot/IotDeviceCatalogueTable.tsx`: per-ID summaries và relevant obsolete tooltips; giữ labels/style.
- `web/src/components/dashboard/iot/IotDeviceTelemetryPanel.client.tsx`: callback identity/coherence, cleanup và subscription selected-detail refresh; không rewrite metric branches hoặc thêm independent polling timer.
- `web/src/lib/dashboard/iot-telemetry-api.ts`: optional limit, giữ defaults/routing/auth; **không thêm timer hoặc auto-refetch vào shared helper**.
- Scoped typed summary/pagination/queue/refresh helper hoặc hook, compact footer component dưới existing Page 07 directories nếu cần; scheduler chỉ wired vào Page 07, không generic data-platform/global polling refactor.
- Relevant runtime/unit tests và minimal `web/package.json` test script/dev-test setup nếu cần. Không đổi chart/runtime dependencies để sửa hotfix.
- Roadmap hotfix reference/status và matching handoff. Không sửa source API handover hoặc historical handoffs để làm mất baseline.

Backend là **inspect/test-only** mặc định: existing authenticated route/query contract đã đủ. Nếu phát hiện evidenced blocking defect của limit/latest identity, ghi reproduction và minimal allowlist extension trong handoff; materially broader API change phải hỏi stakeholder trước.

Thứ tự: reproduce → Task A + runtime regression → Task B → Task C → Task D (mục 6.4) → targeted/regression/browser QA → handoff. Không bắt đầu numbered Small Phase mới.

## 8. Verification và acceptance

**Không dùng source-string assertions làm bằng chứng duy nhất.** Test phải mount/exercise React component lifecycle hoặc browser với mocked HTTP, đếm requests và kiểm tra rendered values. Existing Phase 11 T20 chỉ kiểm tra text abort/generation trong source, không bắt được vòng lặp callback.

| Case | Bằng chứng cần đạt |
| --- | --- |
| Open/close/reopen Solar, AVC, SB, Smoke; parent rerender | Không maximum-depth/console error, không perpetual loading; sau settle không thêm requests cho tới due 5 phút hoặc explicit interaction |
| React Strict Mode, rapid A→B, close/unmount trước response | Cleanup an toàn; aborted dev replay phân biệt với duplicate completed calls; A không cập nhật B/Gateway hoặc requeue trang cũ |
| 11 devices | Page 1 đúng 10 rows, page 2 đúng 1; initial snapshot requests chỉ supported IDs page 1, page 2 chỉ IDs còn thiếu của page 2 |
| 0 / 1 / 10 / 21 devices, search/type/floor/room thay đổi | Footer/page clamp/reset đúng; filter trước slice, counts không sai; giữ catalogue scope/truncation caveat |
| Mixed supported/NFC/unknown | Tất cả visible rows có trạng thái rõ; unsupported không request, không expose NFC events |
| Bounded load và cache | Tổng active Page 07 telemetry concurrency ≤2; snapshot `limit=1` hoặc qualified history reuse; ID/window đúng; không off-page prefetch, cache ≤20; page back reuse fresh cache, stale hit revalidate |
| Zero/null, negative RSSI/SNR, empty/malformed/mismatch | 0 hiển thị đúng; same-sample mapping; không giả giá trị, không apply wrong device/range |
| Slow/failing row, source 502, app 401/403 | Ready rows vẫn dùng được, no catalogue reload/retry-loop; session-vs-upstream error distinction đúng |
| Detail preset/refresh vs row snapshot | History vẫn đầy đủ theo bounded selected query; callback không xóa/cross-contaminate map hoặc ghi đè bằng sample range cũ |
| Explicit page refresh | Chỉ visible supported IDs, window mới, reset đúng snapshot deadline; không source sweep hoặc tạo thêm timer |
| Fake clock 299999 / 300000 ms; no selected detail | Trước due không có periodic GET; đến due đúng một bounded visible-page cycle; không history query khi detail đóng |
| Selected detail + due refresh | Snapshot và current detail/preset cập nhật sau 5 phút; rolling windows mới, limits cũ, total concurrency ≤2; không refetch catalogue hoặc prior selected devices |
| Same samples qua nhiều ticks | Callback notify count/summary reference không đổi chỉ vì `fetchedAt`/window/cycle mới; chart data ổn định nếu series không đổi; refresh metadata vẫn đúng |
| Slow requests, Strict Mode, manual gần tick | Một consumer không overlap cycles; dedup exact queries; một scheduler, không catch-up burst hoặc reset timer do render |
| Hidden/offline/resume; route leave/logout | Pause/cleanup đúng; resume overdue tối đa một cycle mỗi consumer, không focus refetch trước due; page khác không phát sinh scheduled GET |
| Labels/layout/auth/no persistence | Protected labels/pages unchanged ngoài exact exceptions; Viewer/Manager read; no token/upstream URL exposure hoặc new database effects |

Commands dành cho Coding Agent (planning agent không chạy): scoped hotfix behavioral suite; `npm run test:bp2:p03`, `npm run test:bp2:p09`, `npm run test:bp2:p10`, `npm run test:bp2:p11`, `npm test`, `npm run lint`, `npm run build` trong `web/`; relevant backend telemetry tests/build nếu cần contract regression. Existing aggregate `npm test` chưa gồm p10/p11, nên chạy riêng.

Scope-update Phase 03 T24/Phase 11 T19 wording về **selection-only/no catalogue-triggered telemetry** khi obsolete bởi yêu cầu mới. Phase 03 T23 và Phase 11 T19 assertions tuyệt đối `no timer/no polling` cũng phải thay bằng behavioral assertions **chỉ Page 07 refresh 300000 ms**, không fast/global/per-row polling. Giữ bounded visible-page load, no row-local fetching, no unsupported/NFC calls và no mutation/secret safeguards; không xóa coverage vì cadence đổi. Không sửa stakeholder labels hoặc page khác để làm historical test xanh; báo rõ pre-existing failures.

Browser QA `/dashboard/iot` với mocked source và current Viewer/Manager sessions: trước khi chọn row đã có radio values; 10+1 paging, manual/5-minute refresh, rapid selection/page/filter switching, hidden/offline/resume, navigation ra page khác và narrow viewport. Dùng fake timers/controllable clock cho automated cadence tests; không cần chờ thật nhiều chu kỳ 5 phút. Ghi console/network counts, scheduler cleanup và before/after screenshots; xác nhận page khác không thêm auto-fetch. Không seed/reset accounts, chạy database-mutating audit, migration hoặc gọi live upstream để verify plan. Real IoT smoke check chỉ khi được duyệt riêng cho target environment; nếu không, ghi `NOT RUN`.

Done khi runtime-loop regression, visible-page paging/fetch và Page 07-only 5-minute refresh tests pass, UI/text protection được audit, request/cache/scheduler bounds có evidence và handoff đã tạo. Không claim feature complete chỉ từ lint/build hoặc static tests.

## 9. Bắt buộc tạo handoff file sau implementation

**Coding Agent: sau khi implement và verify đúng hotfix này, bắt buộc tạo `web/doc/bp2_fix_page07_render_loop_paged_telemetry_handoff.md` trước khi báo hoàn thành hoặc chuyển sang Small Phase khác.**

Handoff phải ghi root cause/reproduction/fix, exact changed files, pagination/reset/count decisions, snapshot window/limit/concurrency/cache policy, **cadence 300000 ms và scheduler Page 07-only**, manual-vs-scheduled deadlines, hidden/offline pause/resume, unchanged-summary behavior, supported-vs-unavailable fields, selection/race/timer cleanup, measured render/request results, runtime/browser/automated test evidence và tests chưa chạy, protected labels/pages audit, no-new-persistence/auth/source-boundary audit và remaining issues. Link plan này, ghi đây là **BP2 Page 07 hotfix sau Small Phase 24**, không renumber phases; roadmap chỉ mark hotfix implemented khi có evidence. Không sửa hoặc overwrite Phase 11/UI-alignment historical handoffs.
