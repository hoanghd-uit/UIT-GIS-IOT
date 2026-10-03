# Big Phase 02 — Phase 12 / Small Phase 25 Supplement: IAQ Room Ranking & Floor Compliance

> **Project:** GIS — UIT Building E Digital Twin  
> **Document ID:** `BP2-P12-SP25-ENVIRONMENT-DERIVED-SUPPLEMENT`  
> **Ngày lập:** 2026-10-03, Asia/Ho_Chi_Minh  
> **Trạng thái:** PLAN ONLY — READY FOR CODING AGENT; CHƯA IMPLEMENT phần bổ sung  
> **Stable backlog ID:** Small Phase **25**, bổ sung cho detailed Phase **12**; không tạo/renumber Small Phase mới  
> **Trang duy nhất:** Page 03 — Môi trường (IAQ), `/dashboard/environment`  
> **Dependency đã delivered:** `bp2_phase12_page03_sb_co2_environment_upgrade_handoff.md` — mandatory source/CO₂ branch  
> **Matching handoff mới bắt buộc:** `web/doc/bp2_phase12_page03_derived_ranking_floor_compliance_supplement_handoff.md`

---

## 1. Authority, mục tiêu và giới hạn

Đây là handover plan cho coding agent, **không phải yêu cầu planner implement**. Lần cập nhật này chỉ sửa tài liệu. Đọc `Dashboard_Knowledge_Base.md` §§9.3–9.6, current roadmap, `IoTBackend_API_HandOver.md`, original Phase 12 plan/handoff, Phase 05 baseline/handoff, UI alignment handoff và applicable `AGENTS.md` trước khi coding. Đọc relevant Next.js 16 guides trong `web/node_modules/next/dist/docs/` theo `web/AGENTS.md` trước khi viết Next.js code.

Latest stakeholder decisions:

1. Chuyển **“Phòng CO₂ cao nhất lúc này”** từ demo sang thống kê derived khi có actual room metadata và real CO₂ samples.
2. Đổi **“% thời gian đạt chuẩn CO₂” → “% thời gian đạt chuẩn”**. Chỉ đạt khi **cả ba metric đồng thời** đạt ngưỡng; không còn đánh giá CO₂ đơn lẻ.
3. Đánh giá theo **giá trị trung bình từng metric theo tầng**, không tính từng phòng rồi tổng hợp tỷ lệ phòng.
4. Dùng upper warning limits trong config: **CO₂ ≤ 1.000 ppm, nhiệt độ ≤ 27°C, độ ẩm ≤ 70%**. Equality là đạt; không áp dụng lower limits 24°C/40% từ footer demo cũ.
5. Khoảng mất dữ liệu được xem là **không đạt**, giữ trong full-window denominator. Tầng hoàn toàn không có dữ liệu hiển thị **`—`**, không phải `0%`.
6. **Phase này chỉ đọc config mặc định.** Component “Ngưỡng cảnh báo” và phép tính đọc cùng config; **sửa/lưu ngưỡng triển khai ở Small Phase 21**, không runtime RAM editor, localStorage persistence hay PostgreSQL config mới trong phase này.
7. Giữ IAQ refresh hiện tại: mount, selected-source/preset và existing manual detail refresh. **Không auto refresh 5 phút**, polling, background retry hoặc callback notify loop. Cadence 5 phút của Page 07 không áp dụng ở đây.

**Protected-page rule — bắt buộc:** Không quay lại các trang đã implement (Water/Energy, Alerts, IoT, Overview, Parking…) để đổi text/label, restyle hoặc refactor không cần thiết. Stakeholder đã chỉnh labels. Trên IAQ chỉ sửa đúng hai widget trên, ba warning-limit rows/config presentation cần thiết và wiring/API/types/tests liên quan. Heatmap, KPI, selected telemetry, source picker, VOC/PM2.5 và shared shell vẫn giữ nguyên, trừ evidenced blocking bug với smallest necessary diff được giải thích trong handoff. Không sửa page khác chỉ để làm xanh tests cũ.

## 2. Baseline và điều gì được supersede

Source audit 2026-10-03; không gọi live IoT API, không có browser/runtime capture hoặc test execution mới của planner. Handoff gốc báo mandatory branch implemented/verified; không coi các kết quả test lịch sử đó là verification của supplement.

| Component/boundary | Current source evidence | Supplement |
| --- | --- | --- |
| Source/detail/KPI | Solar + SB, `rawCo2`, latest-sample CO₂ summary, standard-unit metadata đã delivered | Reuse; không implement lại mandatory branch |
| `Co2DemoRanking.tsx` | Fixture ranking, top 6, room/floor labels và horizontal bars | Data adapter derived; preserve card geometry/title |
| `Co2DemoCompliance.tsx` | Fixture CO₂ sample-count ratio; tầng empty thành 0%; footer 24–27°C/40–70% | Thay bằng full-window, three-metric floor calculation và null-aware UI |
| `EnvironmentThresholdTable.tsx` | Local `THRESHOLD_ROWS`: CO₂ warning `> 1.000`; temperature/humidity `Chưa xác nhận`; disabled edit | Read centralized defaults 1000/27/70, read-only; không mở editor |
| Default config ownership | Các số đang xuất hiện trong JSX/fixture, chưa có single backend config provider cho ba warning limits | Extract/centralize defaults trong NestJS; table và calculator không hard-code độc lập |
| IAQ lifecycle | Mount sources/24h summary; source/preset/manual detail reads; no polling timer | Preserve; chỉ thêm bounded initial data cho hai widget |
| Alert registry | Runtime authoritative rules vẫn empty | Không activate Page 06 alerts/badge từ statistical compliance config |

**Phân biệt gates:** room ranking chỉ cần actual room/floor metadata và explicit aggregation policy, **không cần room-to-2D-cell binding**. Floor compliance chỉ cần actual floor assignment + history + rules đã chốt, **không cần room ID/grid mapping**. Những gates grid/primary-cell binding trong plan/handoff gốc chỉ còn áp dụng cho heatmap/Overview grid live migration, không được dùng để chặn hai widget này.

Latest decisions ở §1 supersede phần giữ ranking/compliance demo và phần “chưa có approved compliance thresholds/no-data rules” của plan gốc, **chỉ trong phạm vi supplement này**. Không rewrite historical handoff hoặc nhận vơ supplement đã delivered.

## 3. Single-source default config — read-only

### 3.1 Backend ownership

Tạo Environment-scoped, typed/validated, immutable default provider trong NestJS, ví dụ `environment-default-config.ts` + provider. Reuse existing centralized config nếu re-audit tìm thấy đúng ba defaults; không tạo bản sao cạnh tranh. Không parse text `'> 1.000 ppm'` từ JSX hoặc lấy business policy từ `CO2_DEMO_FIXTURE`.

Default version, ví dụ `environment-compliance-defaults-v1`:

| Metric key | Source | Unit | `warningHigh` | Pass condition |
| --- | --- | --- | ---: | --- |
| `co2` | SB `rawCo2` | ppm, `assumed_standard` | 1000 | floor mean ≤ configured value |
| `temperature` | Solar `rawTemperature` | °C, `documented_contract` | 27 | floor mean ≤ configured value |
| `humidity` | Solar `rawHumidity` | %, `documented_contract` | 70 | floor mean ≤ configured value |

Config response phải có scope `page03_compliance`, version, metric keys/units, `warningHigh`, source `application_default`, `editable: false`. Đây là stakeholder-approved application criterion, **không phải hardware calibration hoặc health/regulatory certification**.

Warning-table presentation là `> configured warningHigh`; compliance dùng `<=` cùng numeric config. Không copy `>=` của existing alert evaluator vì evaluator đó có boundary convention khác và vẫn ngoài scope. Config/metric invalid phải explicit unavailable/error, không `Number(null)`, truthy fallback hoặc tự lấy số demo.

### 3.2 Threshold component

- Giữ title “Ngưỡng cảnh báo”, `(Read-only)`, columns, spacing, disabled “Sửa ngưỡng”. Necessary tooltip có thể cập nhật thành chờ Small Phase 21; không còn nói identity chưa delivered.
- Ba warning cells render từ backend config: `> 1.000 ppm`, `> 27°C`, `> 70%`. Chính các values đó được calculator dùng và footer compliance đọc.
- Ba rows này mark `Config mặc định`, không `Demo`/`Chờ xác nhận phần cứng` chỉ vì unit hardware review còn pending; unit caveat vẫn giữ riêng.
- CO₂ danger 1.500 từ demo, temperature/humidity danger chưa xác nhận, VOC demo và PM2.5 unavailable **không trở thành approved live danger rules**. Preserve các row/value còn lại và provenance của chúng; danger cells có own demo/pending tooltip/badge khi cần để row badge `Config mặc định` không nhận vơ danger policy đã approved. Header/data-state phải phản ánh mixed default/demo/unavailable, không global `Live` hoặc global `Demo` cho các defaults đã approved.
- Không thêm form/modal, mutation route, write permission, accounts/password reset, config entity/migration/seed/job. Viewer/Manager đều read-only ở phase này.
- Provider interface/version chuẩn bị cho Phase 21 thay implementation bằng persisted configuration; phase này không implement database fallback hoặc giả vờ config đã được lưu.

## 4. Room CO₂ ranking — latest per-source descriptive aggregate

### 4.1 Identity và calculation

Reuse kết quả latest samples trong existing Environment summary (24h, total cap20, concurrency2, limit1); **không thêm fleet reads riêng cho ranking**. Extend summary additively để NestJS trả `roomRanking` và ranking-specific coverage; frontend chỉ render, không tự định nghĩa business math. Nested ranking có own availability tính từ actual source results; không dùng legacy top-level summary `empty` để che all-failed ranking và không refactor legacy KPI states ngoài scope.

- Catalogue `externalDeviceId`/`deviceId` là opaque join key với reading `dev_eui`; không dùng friendly network name.
- Group key `(buildingId, actual source floorLevel, exact-case trimmed source roomId)`. Chỉ sources có source-backed floor assignment và nonempty room ID; giữ room ID/case, không đoán room từ coordinates/EUI/demo label hoặc bind qua `roomDemoId`.
- Null/unmapped/development-fallback floor hoặc room bị exclude, kèm reason/count; source floor0 không tự chuyển thành tầng4/6. Reuse actual FloorCatalog mapping; không sửa catalogue placement/fallback của các page khác.
- Named policy `room_latest_co2_mean_v1`: mỗi SB device đóng góp **một latest row** trong 24h window; nếu row đó có finite CO₂, tính arithmetic mean các device values cùng phòng, equal device weight. Latest null không backfill lịch sử vô hạn. Không chọn ngẫu nhiên một primary sensor hoặc count packets thành rooms.
- Sort descending unrounded room mean, deterministic tie-break bằng stable floor/room key; trả top6. Preserve zero; không frontend round trước khi sort. `contributingDeviceCount`, min/max source observedAt, unit-assumption và subset coverage đi cùng room value.
- Label rõ latest **available** readings trong bounded window; source timestamp/freshness không phải `fetchedAt`. 24h là lookback, không xác nhận mọi sample “vừa nhận” hoặc online. Không tự thêm hardware-freshness TTL chưa có contract.

### 4.2 UI/state

Giữ title “Phòng CO₂ cao nhất lúc này”, card footprint, top6 bars, room/floor layout và footer hiện hữu. Đổi badge thành `Derived` khi có real result. Scale bars theo max của returned values/config upper limit, xử lý all-zero; visual axis không phải danger threshold.

Không đem fixture moderate boundary800 hoặc danger1500 vào real ranking. Nếu giữ status chip, chỉ dùng binary `Trong ngưỡng` / `Vượt ngưỡng` theo configured CO₂ upper limit; đây là numeric comparison của widget, **không tạo Alert event/room health/three-metric pass claim**. Đây là necessary semantic copy change, không permission đổi các labels khác.

Không có actual room assignments: explicit empty `Chưa có nguồn CO₂ được gán phòng`; không điền E4.1/E6.2 từ demo hoặc device EUI thành room. All upstream failures: error/unavailable, không “không có phòng”. Capped/mixed-success summary: partial scope/counts; không claim top6 toàn tòa nhà. Live error không tự fallback sang fixture.

## 5. % thời gian đạt chuẩn — floor means, three-metric AND

### 5.1 Time model và denominator

Giữ **rolling 7-day window** của widget, UTC `start < stop`, max7d, ending at request reference time. Không để selected-detail preset24h/72h tự đổi widget vẫn ghi7ngày. Window/range snapshot ổn định trong một request; không dùng render-time `Date.now()` làm effect dependency.

**Implementation policy được chọn cho plan:** thống kê theo **buckets 5 phút**, version `floor_three_metric_bucket_compliance_v1`. Đây là độ phân giải tính toán của ứng dụng, **không phải cadence thiết bị hoặc yêu cầu auto-refresh**. UI/helper phải ghi đây là **ước tính theo buckets5phút**, không chứng minh từng giây/medical IAQ compliance. Không suy upstream device sampling interval từ con số này.

1. Partition `[start, stop)` theo UTC5-minute boundaries; leading/trailing bucket duration là phần giao thực tế với requested window. Weighted durations tổng đúng `stop - start`; không thêm thời gian ngoài window. Upstream bounds inclusive, nhưng mỗi row chỉ thuộc một half-open bucket; sample đúng `stop` không thêm duration.
2. Group devices theo **actual floor**, không room. Không cần cả ba metrics từ một device: SB cung cấp CO₂, Solar cung cấp temperature/humidity; chỉ compose ở statistical floor level, không fabricate một sensor record đa metric.
3. Trong từng bucket, lấy arithmetic mean các finite values **của từng device/metric** sau timestamp/identity dedup; sau đó lấy arithmetic mean các device means cho floor/metric. Equal device weight; device gửi nhiều packets không có nhiều weight hơn. Giữ zero; missing/null/malformed không thành0.
4. Một bucket đạt khi cả ba floor means có dữ liệu và đồng thời `co2Mean <= config.co2.warningHigh && temperatureMean <= config.temperature.warningHigh && humidityMean <= config.humidity.warningHigh`.
5. Bucket thiếu **bất kỳ** metric nào, hoặc có một floor mean vượt upper limit, tính toàn bộ duration bucket là không đạt. Không interpolate, carry-forward, mượn data bucket khác/tầng khác hoặc demo để lấp gap. Không nhân ba separate pass percentages hoặc kiểm tra ba averages của cả7ngày.
6. Với floor có ít nhất một valid relevant metric sample trong window và history query usable: `percent = 100 * passingDurationMs / fullWindowDurationMs`. Leading/trailing missing time và lịch sử trước khi sensor bắt đầu có data vẫn nằm trong denominator.
7. Floor **zero valid samples cho cả ba metrics trong toàn window**: `percent: null`, state `no_data`, UI`—`, không arithmetic fallback0. Floor có data nhưng temperature/humidity/CO₂ thiếu cả window: `0%` là có nghĩa theo missing-as-fail, kèm `missingMetrics`/coverage. Không hiển thị0 do API fail, device bị cap loại hoặc window bị truncate.

Missing một source nhưng còn source hợp lệ cùng floor/metric: mean dựa trên available contributors, disclose reduced source coverage; không gọi đó là full-fleet/floor representative measurement. Không có nguồn cho metric ở bucket thì bucket fail. Đây là floor-statistics policy đã chọn, không đánh giá mọi phòng/mọi installed sensor đều đạt.

### 5.2 Quality, mapping và whole-building row

- Use registered/shared floor labels/order; preserve existing displayed floors khi có trong app floor configuration. Floors không có samples vẫn show`—`. Không lấy số liệu/floor membership từ fixture room data. Không invent floor mapping; source-floor0/dev fallback không được coi là real T4/T6.
- `percent` null cần reason riêng: `no_data`, `not_evaluated`, `upstream_unavailable`, `incomplete_history`. Tầng không được attempt do source cap không được gán `no_data` từ absence trong subset.
- **Telemetry gap khác retrieval failure/truncation.** Successful complete query nhưng bucket trống → fail. History bị truncated/reached-limit chưa xác định completeness, request lỗi hoặc malformed coverage → affected floor percentage unavailable`—` + reason; không coi phần chưa tải là confirmed sensor gap rồi tính một tỷ lệ sai. Other complete floors có thể hiển thị riêng với envelope partial.
- Nếu source-set bị capped, arithmetic trên selected contributing sources có thể trả derived **subset** result khi retrieved histories complete; expose candidate/attempted/contributor counts và `populationPartial`. Không gọi subset là toàn bộ tầng/tòa nhà. Floor có zero attempted sources là `not_evaluated`.
- Existing “Toàn nhà (Tổng hợp)” row: aggregate **floor-time durations**, `100 * sum(passingDurationMs) / sum(fullWindowDurationMs)` chỉ trên floors có numeric evaluable percentage. Không average rounded percentages hoặc làm missing floors thành0; `no_data`/unavailable floors loại khỏi numeric aggregation và expose excluded floor count. Không có evaluable floor →`—`. Caption/tooltip nói rõ “Tổng hợp các tầng có dữ liệu đánh giá”, không complete-building claim.
- Không cần room/cell/primary-device bindings cho phép tính này. Không tự migrate heatmap/Overview để đủ mapping.

### 5.3 UI

Giữ secondary row 2 equal columns, current card styles, bars và floor-row ordering. Title **`% thời gian đạt chuẩn`**; period`7 ngày` ở nearby subtitle/helper. Badge`Derived`, khi partial có readable coverage/reason. `—` không kèm `%`, không progress fill hoặc0%-label; numeric0% phải render được với explanation nếu thiếu một metric.

Footer render từ **same config response/version**: `Chuẩn: CO₂ ≤ 1.000 ppm, nhiệt độ ≤ 27°C, độ ẩm ≤ 70%`. Bỏ lower-bound demo text và CO₂-only meaning đúng user request; không đổi unrelated labels. Tooltip/helper: full7d denominator, three-metric AND, gaps fail, 5-minute statistical estimate và partial scope khi có.

## 6. API, resource bounds và refresh

### 6.1 Application-only read paths

| NestJS boundary | Delivery |
| --- | --- |
| Existing `GET /api/v1/dashboard/buildings/E/environment/summary` | Additive room ranking/coverage from already-fetched latest SB samples; preserve existing KPI summary fields/24h cap |
| New `GET /api/v1/dashboard/buildings/E/environment/config` | Immutable default config only; no IoT/DB read needed, usable even if live telemetry unavailable |
| New `GET /api/v1/dashboard/buildings/E/environment/compliance?start=...&stop=...` | Bounded real history → floor compliance/quality/provenance; config snapshot/version included |

New routes are **application APIs**, not new upstream APIs. Use same-origin `/api/devices/dashboard/buildings/E/environment/...`, existing session/CASL Dashboard-read guards and a narrow exact GET proxy allowlist. No POST/PUT/DELETE/PATCH config endpoint. Reject invalid building, duplicate/invalid ranges, future bounds and duration>7d before telemetry calls. No client-provided device type, arbitrary limit, metrics/threshold override or URL/path input.

Compliance orchestration: reuse catalogue/type validation and `IotTelemetryService`; actual-floor Solar/SB candidates only, deterministic fair type interleaving, **global cap20 selected devices**, **max2 concurrent telemetry reads**, **one request/device/window with limit1000**, no automatic partition/backfill/retry. Max20 history calls, max20,000 returned rows before validation for this endpoint. Existing summary remains max20/limit1/24h; không nâng shared/detail/upstream caps. Return load/cap/selection metadata. Với sparse current data, complete7d response có thể dùng; khi vượt history cap, explicit incomplete result theo §5.2, không silently fetch vô hạn hoặc mở PostgreSQL để chữa. Further bounded chunking/load changes cần plan riêng nếu thực tế chứng minh cần.

Use typed response with config snapshot/version, calculation version, requested range, bucket duration, per-floor `percent: number | null`, passing/window/covered/missing durations, metric/source counts, reason/state, excluded/unattempted source/floor counts, source/history truncation, unit metadata and observed/fetched/calculated timestamps. `coveredDurationMs` là duration buckets có đủ3metrics, không đồng nghĩa passing duration; missing+covered =window cho complete evaluable histories. Không round percentages ở backend.

Config snapshot trong compliance/summary thống kê phải khớp table config; immutable defaults làm race ít nhưng frontend vẫn không mix versions. Khi config/API unavailable, giữ explicit state; không fallback vào duplicate frontend constants hoặc demo.

### 6.2 Lifecycle — no cadence change

- Mount: load immutable config once + current sources/summary; sau baseline load, một bounded compliance request cho7d window. Serialize fleet summary/compliance initial work để không tạo hai uncontrolled fleet fan-outs; không chặn rendering của baseline widgets đến khi history complete.
- Ranking reuse summary response; config/ranking/compliance state owned bởi page controller, không fetch trong mỗi row hoặc child `useEffect` notify parent liên tục.
- Selected-source/preset/manual detail behavior **giữ nguyên**. Những actions đó không tự scan fleet7d lại hoặc đổi period của compliance; floor/metric controls trong demo heatmap không điều khiển real ranking/compliance.
- Re-render, config object identity, fetchedAt, countdown, focus/visibility hoặc idle>5min không trigger mới. Không thêm timer/subscription/auto retry. Abort/ignore obsolete responses khi navigate/logout; upstream deadline bounded bằng existing request timeout, không leak session data.
- Nếu notify/update thật sự cần, stable callback và chỉ notify khi semantic summary thay đổi, không dùng fresh object/fetchedAt khiến feedback loop. Không refactor shared Page07 scheduler hoặc global refresh framework.

## 7. Task sequence và affected-file allowlist

1. **Freeze/re-audit:** git status, baseline IAQ screenshots/text, mandatory handoff vs actual code, current threshold values; preserve dirty user edits. Record config extraction source, floor mapping and upstream completeness contract. Không cần mockup mới: reuse current aligned IAQ và supplied screenshot.
2. **Central defaults/read API:** implement typed default provider, config GET/DTO/guards, numeric boundary validation; wire warning rows/footer to same defaults. Edit stays disabled.
3. **Room rank:** extend existing summary additively with actual-room grouping policy/coverage; no additional telemetry reads or grid gate.
4. **Compliance:** new bounded history orchestration, pure bucket/floor calculator, time-weighted denominator, null/error/partial states and per-floor projection.
5. **UI wiring:** supply data props to existing ranking/compliance card layout; optional clear component names `EnvironmentCo2Ranking` / `EnvironmentCompliance` without repo-wide rename. Keep heatmap fixture untouched; preserve existing detail/KPIs/cadence.
6. **Verify/document/handoff:** tests below, scoped UI checks; update roadmap/KB delivery status from actual evidence. Record floor/room availability gates separately from implementation completion.

Expected allowlist:

- Backend: Environment service/controller/summary and scoped new config/compliance helpers/service/DTO/query/tests; `dashboard.module.ts` only necessary provider registration; generated OpenAPI via established process.
- Web: `EnvironmentDashboard.client.tsx`, `Co2DemoRanking.tsx`, `Co2DemoCompliance.tsx`, `EnvironmentThresholdTable.tsx` (or their narrow replacements), Environment API/types and scoped data-state helpers/tests.
- Existing proxy `web/src/app/api/devices/[...path]/route.ts`: exact additional GET patterns only, unchanged auth/session/write allowlists.
- Documents: this supplement, roadmap, master Dashboard KB, matching **new** handoff. Original plan may carry a supplement-reference note; **do not overwrite historical implementation handoff**.
- Tests/script registration where necessary; only superseded demo/CO₂-only assertions updated, no weakening security/provenance checks to pass.

**No default edits:** Page01/02/06/07/09/11, `Co2DemoHeatmap`, environment demo fixtures, completed KPI/detail/picker labels, global CSS/tokens/shared shell/grid/chart, CASL role matrix, identity credentials, shared IoT parser/client, alert evaluator/registry or migrations. Explain/obtain approval for material expansion; blocking bugs alone permit documented smallest necessary exceptions.

## 8. Verification và acceptance

Exercise actual calculators/services/components, không chỉ source-string checks hoặc duplicate formulas trong test runner.

| Case | Expected evidence |
| --- | --- |
| Default config + table + calculations | One source/version, numeric1000/27/70; warning`>` vs pass`<=`; no readonly editor bypass |
| Equality and one-metric exceedance | 1000/27/70 passes; increase only any one beyond config fails; units/raw identity preserved |
| Config replacement in test | Changing any warningHigh changes table/footer/math consistently without JSX constants; no mutation API needed |
| No lower bounds | Valid low temperature/humidity samples are not rejected solely for being <24°C/<40%; null/non-finite still invalid |
| Floor, not room evaluation | e.g. same floor CO₂ device means900 &1100 → floor1000; with temp27/humidity70 bucket passes, not room-count50% |
| Multiple packets/device | Equal device weighting; packet rate/duplicates do not change its relative weight |
| Temporal AND | CO₂ valid in bucketA, temp/humidity only bucketB → neither passes; no cross-bucket fill |
| Full denominator + gaps | Test10min window: one complete passing5min bucket + one missing bucket →50%, not100% |
| Fully no data vs missing metric | Floor with zero samples →null/`—`; floor with real CO₂ only →0% + missing temp/humidity reasons |
| Partial edges/time ordering | Newest-first input sorted immutably, UTC half-open boundaries, edge durations weighted, sample atstop not double-counted |
| Unavailable/truncated/unattempted | No false0%, no history completeness claim; affected null reasons; other complete floors can remain usable |
| Floor mapping | Actual floor works without room ID; floor0/dev fallback not assigned toT4/T6; missing floor rows stay`—` |
| Whole-building subset | Sum durations of evaluable floors, missing/null floors excluded/count disclosed; allnull →`—` |
| Ranking rooms/multiple SB/ties | Exact room/floor key, equal-device latest mean, top6 descending, deterministic ties; no primary/grid requirement |
| Ranking missing room/latest null/zero | No demo replacement; zero preserved; latest null not unlimited backfill; error distinct from empty |
| Resource bounds | cap20/historylimit1000/concurrency≤2, total calls≤20; ranking adds zero telemetry requests; no chunk/retry/background scan |
| Auth/proxy/secrecy | Viewer/Manager read; anonymous401; writes rejected; narrow proxy; no bearer/internalURL/raw sensitive identifiers leaked |
| Refresh/render loop | Mount only new reads; detail events unchanged; idle>5min no automatic reads; stable updates, no maximum-update-depth error |
| Protected-page/UI regression | Required title/footer/three rows only; other labels/cadences/layouts untouched; no misleading Demo/Live modes |
| Persistence boundary | No new DB schema/entity/migration/config writes/jobs; existing identity/session infrastructure not reset |

Run established backend Environment tests + new supplement cases, backend build, scoped frontend tests (including existing Phase12/05 and Page07 hotfix regression), web lint/build. Confirm command names exist before running; do not install a new test framework just for static checks. Report historical/obsolete/pre-existing failures honestly; no Water/IoT label changes to fix unrelated tests.

Browser QA if environment available: Page03 mixed real/default/demo modes; actual-room empty and populated ranking; per-floor `—`/0%/partial/error; config1000/27/70; updated compliance title/footer; preserved source/detail controls; request counts and console after source/preset/manual interactions. Compare screenshots at1842×1222,1440×900,1024×768,390×844 for existing card ratios, keyboard access, readable state helpers, long IDs and no body overflow. Do not create rooms/floor assignments or mutate upstream to manufacture QA data; controlled mocks are valid, live QA absent must be marked NOT RUN.

Accept only when config/table/math are coherent, both widgets have honest derived/empty/error/partial paths, temporal AND/missing/full-denominator/null rules are tested, history load bounded, IAQ cadence and other pages preserved, no early editor/persistence/alerts, and matching new handoff exists. Production missing assignments may leave widget unavailable/empty, but tested adapter delivery and actual live-data availability must be reported separately.

Remaining outside this supplement: verified room-to-cell/heatmap history mapping and Page01 grid live migration; IAQ score; VOC concentration; hardware calibration; authoritative alert duration/state/notification rules; **Manager config editing + PostgreSQL config persistence in Small Phase21**. Three approved Page03 warning limits do not close these unrelated gates.

## 9. Bắt buộc tạo handoff ở cuối phase

**Coding Agent: sau khi implement và verify phần bổ sung Small Phase25, bắt buộc tạo `web/doc/bp2_phase12_page03_derived_ranking_floor_compliance_supplement_handoff.md` trước khi tuyên bố hoàn tất hoặc bắt đầu phase khác.** Ghi delivered/deferred tasks, changed files/reasons, default config source/version, ranking/floor/bucket formulas, full-window/missing/null/partial semantics, actual source/room/floor availability, API/load limits, protected labels/pages và refresh audit, authorization/persistence effects, exact tests/results (kể cả fail/NOT RUN), screenshots nếu có và remaining gates. Không overwrite handoff gốc, không nhận vơ test/live verification chưa chạy, không mở config editor/persistence trước Small Phase21.
