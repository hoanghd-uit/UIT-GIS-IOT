---
document_id: GIS-UIT-SMALL-PHASE-07
version: "1.2.0"
created_on: "2026-09-22"
updated_on: "2026-09-22"
project: "GIS — UIT Building E Digital Twin"
language: vi
purpose: "Implementation plan bàn giao cho coding agent"
implementation_status: "EXISTING_IMPLEMENTATION_REPORTED; CORRECTIVE_PLAN_NOT_YET_VERIFIED"
root_cause_status: "UNCONFIRMED; SCREENSHOTS_ONLY"
api_contract_status: "DOCUMENTED_CONTRACT_READ_2026-09-22; LIVE_NOT_TESTED"
api_source_version: "IoTBackend_API_HandOver.md — 2026-09-22"
test_window_hours: 72
default_row_limit: 1000
database_writes_in_scope: false
---

# Small Phase 07 — Fetch dữ liệu thiết bị và popup IoT trên trang chi tiết tầng

## 0. Mục tiêu và yêu cầu bắt buộc

Khi người dùng click một icon IoT trên mặt bằng tầng, mở popup gắn với thiết bị đó và **fetch dữ liệu mới từ API tương ứng với loại thiết bị**. Hỗ trợ ba API type hiện được người dùng nêu: `solar`, `avc`, `nfc`. Popup theo bố cục trang 3 của `EBuilding_UIT_BEIVN.pdf` và ảnh crop người dùng cung cấp, nhưng nội dung phải phản ánh đúng dữ liệu thật của từng loại.

| ID | Yêu cầu đã chốt cho Phase 07 |
| --- | --- |
| R01 | Click chọn thiết bị → fetch dữ liệu cho đúng ID và đúng API type. |
| R02 | Test mode: request dữ liệu trong **72 giờ gần nhất**, tính lại tại thời điểm chọn/làm mới. |
| R03 | **Giới hạn request mặc định 1.000 dòng cho thiết bị đang chọn**; không tự tăng hoặc fetch toàn bộ lịch sử. |
| R04 | Chọn lại cùng thiết bị, mở lại popup hoặc bấm refresh đều phải phát sinh lượt fetch mới. |
| R05 | **Không lưu dữ liệu fetch vào PostgreSQL hoặc bất kỳ database nào trong phase này.** Chỉ giữ state tạm trong RAM phục vụ popup hiện tại. |
| R06 | Popup có tiêu đề, nút đóng, vùng giá trị/sự kiện mới nhất, vùng trạng thái, lịch sử/biểu đồ và footer thời gian + refresh. |
| R07 | Dữ liệu thiếu, API lỗi, schema thay đổi, giới hạn số dòng phải được phản ánh trung thực; không đưa số minh họa vào luồng thật. |
| R08 | Kế thừa icon/tọa độ/viewer Phase 06, sửa selection theo plan này; bảo toàn filter loại thiết bị và filter object Phase 05. |
| R09 | **Bỏ hoàn toàn overlap cycling và click mở danh sách lọc cụm.** Mỗi marker bind một stable device ID; click không đổi type/glyph/identity. |
| R10 | **Popup mở ngay ở loading trước API**, render cả empty/error/unsupported; thiếu anchor không được làm popup biến mất. |
| R11 | **No data và lỗi fetch phải có floating notification** nhìn thấy trên viewer. Console log hoặc inline message đơn lẻ không đủ. |

**Phạm vi bản cập nhật:** sửa implementation Phase 07 hiện hữu theo phản hồi chủ dự án: click icon chưa có popup, console không báo lỗi. Agent phải truy vết code/runtime, bỏ overlap cycling và nối lại toàn bộ click → popup → fetch → notification. File này là kế hoạch sửa, chưa xác nhận root cause hoặc code đã sửa; không dựng lại viewer hoặc mở một small phase mới.

**Thứ tự áp dụng:** yêu cầu Phase 07 hiện tại quyết định hành vi 72h/1.000 dòng/fetch mỗi lần/không lưu DB; `IoTBackend_API_HandOver.md` quyết định HTTP contract; proposal quyết định bố cục tham chiếu. Những yêu cầu lưu thiết bị/tọa độ trong KB và biên bản họp là hướng dài hạn, không được kích hoạt trong Phase 07.

**Bản 1.2.0 thay thế toàn bộ bản 1.1.0 và 1.0.0**, dùng độc lập để ghi đè file plan cũ. Yêu cầu mới về bỏ overlap, popup luôn phản hồi và toast bắt buộc ưu tiên hơn mọi quy tắc selection/ẩn popup cũ của Phase 06/07. API handover 22/09/2026 đã đọc và được tích hợp; field hardware pending vẫn giữ nhãn, không phải lý do dừng toàn phase.

| API type | Nội dung popup mặc định của plan | Giới hạn cần hiển thị |
| --- | --- | --- |
| `solar` | Dòng điện `current_uA` (µA), chart 72h; selector phụ `lux` (lx) | Không có field công suất trong contract. Không tự tính W/kWh; không gắn °C/%/V cho các field pending. |
| `avc` — đồng hồ nước | Lưu lượng `instant_flow_m3h` (m³/h theo tài liệu), chart 72h; selector chỉ số nước/nhiệt độ | Lưu lượng và thể tích đang chờ xác nhận phần cứng; luôn có badge khi hiển thị. Không tính tiêu thụ 72h. |
| `nfc` — đầu đọc cửa | Lượt quét gần nhất, hướng Vào/Ra, mã thẻ; lịch sử event 72h | Mã thẻ không phải IDGV; không suy hiện diện hoặc quyền truy cập. |

Lựa chọn hero/selector trong bảng là **quyết định thiết kế mặc định của plan**, dựa trên field có thật; không phải sở thích đã được người dùng xác nhận riêng. Agent triển khai mặc định này mà không cần hỏi lại, trừ khi chủ dự án thay đổi hoặc payload thực tế mâu thuẫn với nguồn.

## 1. Kiểm kê nguồn và mức độ kiểm chứng

| Nguồn | Phiên bản/ngày nếu có | Đã đọc được? | Vai trò | Giới hạn |
| --- | --- | --- | --- | --- |
| Yêu cầu trực tiếp Small Phase 07 | Phiên hiện tại, 22/09/2026 | Có | Quyết định phạm vi, 72h, 1.000 dòng, fetch khi chọn, không DB | Chưa có response JSON đi kèm. |
| Ảnh crop `c0463dc3-e36a-41cb-96c6-e88361848db7.png` | Đính kèm phiên này | Có, xem ảnh trực tiếp | Chi tiết popup cần bám theo | Nhiệt độ 27.4°C, phòng A1, “Bình thường”, 24h và thời gian trên ảnh là dữ liệu minh họa. |
| `EBuilding_UIT_BEIVN.pdf` | Bản được cung cấp | Có, render và xem trang 3 | Popup nổi trong viewer, có đường nối với marker; giữ bố cục floor page | Không phải API schema hoặc xác nhận loại thiết bị hiện có. |
| `Project_KnowledgeBase(1).md` | Nội dung v1.0.0, 16/09/2026 | Có, các phần kiến trúc, IoT, viewer và quy tắc nguồn liên quan | Next.js + Unity WebGL + NestJS + PostgreSQL; bảo toàn viewer | Snapshot trước Phase 05–07; không chứng minh code hiện tại. |
| `GIS_UIT_Bao_cao_ket_qua_hop_IoT_v2(1).docx` | Bản v2 được cung cấp | Có, trích đọc nội dung | Danh mục thiết bị nghiệp vụ và ranh giới IoT/backend ứng dụng | Chưa có contract `solar`/`avc`/`nfc`; không tự map các type này với danh mục nghiệp vụ. |
| `Bao_cao_nhanh_Digital_Twin_Toa_E_2026-09-08.docx` | 08/09/2026 | Có, trích đọc nội dung | Phân chia Unity/web; cần chỉ số, đơn vị, payload thật | Roadmap cũ; không override yêu cầu phase này. |
| `IoTBackend_API_HandOver.md` | **2026-09-22** | **Có, đọc bản người dùng vừa đính kèm** | Contract hiện hành cho 5 GET, NestJS-only, identity, query, response và field semantics | `/solar`, `/avc`, `/nfc` là schema/example được tài liệu hóa, chưa có payload thực thi live riêng; nhiều field hardware vẫn pending. |
| Plan Phase 06, `phase_06_updating` và `phase_06_implementation_handoff.md` | Ngữ cảnh trao đổi ngày 21/09/2026 | Chỉ có ngữ cảnh hội thoại; chưa đọc file gốc | Biết có danh sách/icon IoT và một yêu cầu sửa cách render theo mockup | Chưa xác nhận bản sửa đã thực thi hoặc tên event/component hiện tại. |
| Phản hồi lỗi và ảnh `af027c61-33b1-49e3-9c8a-aeac206e1dab.png` | 22/09/2026 | Có, xem trực tiếp | Marker NFC được highlight; drawer “Danh sách thiết bị (1)” có “Đang lọc cụm: 1 thiết bị”, không thấy detail popup | Chỉ một frame; chưa biết đầy đủ state/DOM/network. |
| Ảnh log `dfb2c375-5eb9-42c7-8b3b-676d965278ba.png` | 22/09/2026 | Có, xem trực tiếp | GET danh sách thiết bị tầng 6 trả 200 | Không chứng minh history của thiết bị đã được gọi hoặc success; log chỉ là một phần. |
| Repository, `AGENTS.md`, source Unity/Next/Nest, API live | Chưa được cung cấp trong phiên lập plan | Chưa | Coding agent phải kiểm tra trước sửa | Không có kết quả compile, runtime, network hoặc DB audit trong tài liệu này. |

Đã xác nhận **theo tài liệu**, không phải bằng gọi API trong phiên lập plan: `GET /api/v1/devices` trả danh mục; `GET /api/v1/devices/{dev_eui}` trả metadata một thiết bị; `GET /api/v1/solar`, `/api/v1/avc`, `/api/v1/nfc` trả history theo query tại mục 3. Snapshot catalogue/detail ngày 21/09/2026 trong handover không phải inventory hiện tại. Ví dụ zero/string của ba API history không được dùng như dữ liệu thật.

### 1.1. Nhận định từ lỗi được báo — chưa phải root cause

Log chụp được: `GET /api/devices/iot/buildings/E/floors/6/devices 200 in 333ms`. Đây là **request danh sách tầng**, không phải bằng chứng request history `solar/avc/nfc` đã chạy. “Console không lỗi” cũng không chứng minh callback selection hoặc popup render đã chạy.

Giả thuyết ưu tiên: nhánh click đi vào cluster/list selection thay vì device-data selection; dòng “Đang lọc cụm: 1 thiết bị” là dấu hiệu liên quan ngay cả với cụm đơn. Cũng cần phân biệt bridge event bị mất, request chưa dispatch, điều kiện mount đợi data, anchor không có, stacking/clipping và chart container 0px. Agent phải ghi root cause đã chứng minh sau khi đọc code; không copy giả thuyết này thành kết luận.

Marker trong ảnh là **NFC**. Nó phải có popup chi tiết/lịch sử quét theo contract, không phải line chart nhiệt độ. Không có numeric chart không tự là bug; không có popup phản hồi khi click là hành vi cần sửa. ID dạng `dummy...` vẫn hợp lệ và cần query, không được suy nó chắc chắn không có data.

## 2. Phạm vi và các ràng buộc kế thừa

### 2.1. Trong phạm vi

- Nối marker và list-row click vào **một selection action**, bỏ overlap cycling/cluster click path và fetch đúng type.
- Adapter cho ba type sau khi đối chiếu contract; validate payload và normalize cho UI.
- Popup nổi trên viewer, định vị theo marker, không làm mất tương tác floor page.
- Hiển thị chỉ số/sự kiện mới nhất trong dữ liệu nhận được, trạng thái có nguồn, lịch sử trong cửa sổ 72h.
- Loading, empty, partial, unknown type, API/schema error, retry và manual refresh; **toast nổi bắt buộc cho no-data/error** từ host độc lập.
- Chống response cũ ghi đè selection mới; cleanup khi đổi tầng/đóng popup.
- Kiểm tra chức năng và visual; cập nhật tài liệu bàn giao bằng kết quả thực tế.

### 2.2. Ngoài phạm vi

- DB migration, telemetry tables, lưu snapshot danh sách/detail, persistent cache hoặc đồng bộ dữ liệu định kỳ.
- Ghi vị trí icon custom hoặc triển khai lại cơ chế lưu tọa độ tương lai.
- Dashboard tổng, webhook, streaming, polling liên tục hoặc background prefetch mọi thiết bị.
- Tính toán sản lượng điện, cảnh báo vượt ngưỡng, hiện diện giảng viên hoặc quyền ra/vào khi contract chưa hỗ trợ.
- Tạo hồ sơ giảng viên từ NFC, đối chiếu DB nhân sự, phát video camera hoặc bổ sung endpoint cho nhóm chưa có contract.
- Nâng framework, đổi scene/prefab strategy hoặc thiết kế lại toàn trang. Với marker, chỉ sửa selection/render binding cần thiết để bỏ overlap; không thay tọa độ nguồn hoặc thêm offset/spiderfy/editor Design.

### 2.3. Viewer phải giữ nguyên

- Một Unity runtime, một `useUnityContext`, một canvas; `Campus` và `FloorDetail` theo kiến trúc hiện tại.
- URL vẫn điều khiển view/tòa/tầng; mở popup không tự đổi route hoặc reload scene/canvas.
- `AppBootstrap` vẫn là chủ sở hữu `DontDestroyOnLoad` duy nhất; giữ Orbit Map Camera, remote Addressables và floor IDs `G`, `1`–`12`.
- Giữ `Ceiling`, `Interior`, `Wall` độc lập; `Floor` luôn hiển thị. Kiểm tra tag thực tế nếu repo dùng spelling cũ `Ceilling`; không rename hàng loạt trong phase này.
- Không thực thi `phase_03_floor_content_document_loading_plan.md` cũ.

## 3. Phase 07A — Audit code và chốt API contract

### 3.1. Việc agent làm trước khi chỉnh code

1. Đọc `AGENTS.md` tại root và subtree liên quan; kiểm tra branch/HEAD, `git status`, thay đổi đang có của người dùng.
2. Mở bản hiện hành của `IoTBackend_API_HandOver.md`, Phase 06 plan/updating/handoff và source thực tế. Tìm bằng `rg`; không assume path hoặc event từ tài liệu cũ còn đúng.
3. Xác định marker đang render ở Unity hay web overlay; handler click, stable device ID, raw type, floor context và nguồn screen anchor.
4. Xác định module tích hợp IoT hiện tại trong **NestJS**, cấu hình/auth, timeout và cache middleware. Chỉ NestJS giữ bearer token và gọi host IoT; Next.js/Unity gọi API ứng dụng. Nếu source hiện tại khác ràng buộc này, sửa đúng ranh giới trong phần tích hợp của phase; không nhân đôi proxy hoặc để token ở Next.js.
5. Đối chiếu popup hiện tại với ảnh và trang 3. Nếu selection/anchor của Phase 06 chưa hoạt động, sửa tối thiểu phần prerequisite và báo rõ trong handoff; không mặc định Phase 06 đã hoàn chỉnh.

### 3.2. Contract đã xác nhận từ handover

**Nguồn:** `IoTBackend_API_HandOver.md` §§0–9, 12, 14, 16–18, phiên bản 22/09/2026.

| Nội dung | `solar` | `avc` | `nfc` |
| --- | --- | --- | --- |
| Method/path | `GET /api/v1/solar` | `GET /api/v1/avc` | `GET /api/v1/nfc` |
| Ngữ nghĩa type | Thiết bị solar/environment | **Đồng hồ nước** qua ChirpStack | Sự kiện quét NFC tại cửa |
| Type dùng dispatch | Catalogue `device_type = solar` | Catalogue `device_type = avc` | Catalogue `device_type = nfc` |
| Query ID | `dev_eui = catalogue.device_id` | `dev_eui = catalogue.device_id` | `dev_eui = catalogue.device_id` |
| Time range | `start`, `stop`: ISO-8601, **inclusive**, `start < stop` | Như solar | Như solar |
| Limit | `limit`: integer; default **1000**, hard cap **10000** | Như solar | Như solar |
| Ordering | **Newest first**; khi giới hạn, giữ các dòng mới nhất | Như solar | Như solar |
| Success envelope | `{ data: Reading[], meta: object }` | `{ data: Reading[], meta: object }` | `{ data: Event[], meta: object }` |
| Row identity | `dev_eui` | `dev_eui` | `dev_eui` là đầu đọc, không phải thẻ |
| Row time | `timestamp`: date-time lúc bản đọc được ghi nhận | `timestamp`: date-time lúc bản đọc được ghi nhận | `timestamp`: date-time lúc lượt quét được ghi nhận |
| Hero của plan | `current_uA` → µA | `instant_flow_m3h` → m³/h, **pending hardware** | `moving_direction` (`in`/`out`) + `timestamp` + `detected_card_id` |
| Status | `state` numeric, **chưa có enum** | Flags numeric, **chưa có miền mã hóa** | Không có field health/online trong event |
| Errors đã tài liệu hóa | `400` query không hợp lệ; `401` bearer lỗi/thiếu | Như solar | Như solar |

Thông tin chung:

- Host cấu hình server: `https://api.ttlab.manhthao.uk`.
- Header upstream do **NestJS** gắn: `Authorization: Bearer <server-secret>` và `Accept: application/json`.
- Tên env đề xuất của handover: `IOT_API_BASE_URL`, `IOT_API_MASTER_TOKEN`; dùng cấu hình backend sẵn có nếu tương đương. Không in/commit/đưa token vào tài liệu, Next.js hoặc Unity.
- `meta` có `count?: number`, `truncated?: boolean`, chấp nhận `{}` và các field bổ sung. **Không có contract `total`, `has_more`, cursor hoặc pagination.** Không yêu cầu những field này để parser chạy.
- Ý nghĩa bảo đảm của `meta.truncated` chưa được định nghĩa đầy đủ; không dùng một mình nó để chứng minh coverage hoặc tổng record.
- Nullability/scaling không được định nghĩa như một phép chuyển đổi chung: nguồn khai báo các measurement là `number`. Null/missing/numeric-string là vấn đề dữ liệu cần xử lý có nhãn, không tự ép thành 0 hoặc đổi scale.

### 3.3. Identity và server-side routing

1. `catalogue.device_id` là stable source ID, dạng **opaque string**. Giữ nguyên case/chuỗi, encode đúng path/query; không ép hex/EUI/UUID và không loại `dummy...` chỉ vì định dạng.
2. NestJS resolve type từ metadata đã nhận từ upstream ở luồng Phase 06. Có thể dùng map metadata RAM hiện hữu của lần tải danh mục; đây chỉ là dữ liệu định tuyến, không phải cache lịch sử thay fetch.
3. Nếu backend không còn metadata đáng tin cho ID, gọi `GET /api/v1/devices/{dev_eui}` **một lần để resolve**, rồi mới dispatch telemetry. Detail trả `data` là một object, không phải array; `404` nghĩa là không có thiết bị đăng ký cho ID đó. Không fetch lại toàn danh mục mỗi click.
4. Client có thể gửi type đang biết để detect mismatch, nhưng type từ upstream/NestJS mới là nguồn chọn route. Không chấp nhận `upstreamPath` tùy ý hoặc route theo type do browser tự sửa. Nếu mismatch, trả lỗi có kiểm soát để đồng bộ selection; không hiển thị payload dưới renderer sai loại.
5. Allowlist chính xác `solar → /api/v1/solar`, `avc → /api/v1/avc`, `nfc → /api/v1/nfc`. Unknown type vẫn là catalogue record hợp lệ; popup báo chưa hỗ trợ, không đoán route.
6. `solar.device_id` trong **reading** là friendly name mạng, không phải query ID. AVC `dev_addr` là session address, `meter_sn` là serial vật lý; không thay thế `dev_eui`. NFC `detected_card_id` là mã thẻ; `batch_id` chỉ là lô truyền, không phải event/card/person ID.

Mỗi selection thông thường có **một GET history**; thêm tối đa một GET detail khi cần resolve metadata. Detail không cung cấp live health và không thay thế history. Không gọi `/latest`, endpoint ghi hoặc API Swagger ngoài 5 GET trong handover.

### 3.4. Phần còn cần kiểm tra khi coding

Contract đã đủ để triển khai adapters và UI. Agent chỉ cần xác minh integration path/event/source thực tế trong repo, sau đó so response thật với schema khi môi trường cho phép. Không yêu cầu chủ dự án xác nhận lại rằng AVC là đồng hồ nước, NFC có in/out hoặc limit default là 1.000.

Những điểm **vẫn mở trong nguồn**: đơn vị/ngữ nghĩa cuối của solar `voltage`, `temperature`, `humidity`; enum solar `state`; xác nhận hardware cho các chỉ số nước; miền mã hóa AVC flags; reset counter; vị trí probe `temp_c`; bảo đảm của `meta.truncated`; cadence/timeout/rate limit và live payload. Dùng quy tắc UI ở mục 7 để triển khai được mà không tự bù nghĩa.

Nếu response lệch contract: ghi field/example đã làm sạch, parse phòng vệ và báo trạng thái partial/error đúng. Có thể hoàn tất phần code với fixtures được tài liệu hóa và ghi live check `NOT_RUN`; không gọi schema example là response thực. Chỉ hỏi người dùng khi một quyết định mới thực sự ảnh hưởng dữ liệu hiển thị và chưa có default an toàn trong plan.

### 3.5. Truy vết implementation đang lỗi

1. Đọc `AGENTS.md` đúng root/subtree; kiểm tra HEAD và thay đổi của người dùng.
2. Mở implementation handoff hiện có, tìm marker click handler, bridge Unity ↔ React, selection controller, popup component, history hook, NestJS gateway và notification host.
3. Dùng `rg` tìm theo biểu hiện thật và tên tương đương trong repo: `Đang lọc cụm`, `Hiện tất cả`, `cluster`, `overlap`, `cycle`, `selectedDevice`, `onMarkerClick`, `popup`, `toast`. Không giả định những tên này đã tồn tại hoặc xóa mọi kết quả tìm kiếm không đọc ngữ cảnh.
4. Xác định click đang được xử lý tại Unity, DOM overlay hay cả hai; chọn đúng một owner phát selection. Một gesture không được vừa mở cluster list vừa chọn thiết bị qua handler khác.
5. Kiểm tra bản Unity WebGL đang load có đúng build chứa bridge mới không. URL framework trong ảnh chỉ là tên build được quan sát, không chứng minh build đã cũ. Nếu sửa C#/jslib, build/publish asset theo quy trình repo và kiểm tra browser nhận đúng artifact.

#### Theo dõi từng mốc, không đoán từ một log

| Mốc | Bằng chứng cần lấy | Nếu mốc trước có nhưng mốc này không có |
| --- | --- | --- |
| Marker nhận click | Stable device ID, context tầng, origin Unity/DOM | Kiểm tra hit-test, pointer-events, listener và event propagation. |
| Controller nhận selection | ID/type/context + request generation | Kiểm tra cluster branch, return sớm, bridge payload/parser và event name. |
| Popup shell được mount/nhìn thấy | DOM và bounding rectangle có width/height > 0 | Kiểm tra điều kiện mount, provider khác instance, z-index, clipping, anchor và state bị reset. |
| Browser gọi API ứng dụng history | Request URL thực tế, range/limit, correlation ID | Kiểm tra query `enabled`, effect dependency, callback stale, ID undefined và handler chỉ highlight. |
| NestJS gọi history upstream | Endpoint type, query, status, duration; không bearer | Kiểm tra route ứng dụng, server type resolution, error mapping, cache/return sớm. |
| Result được classify | success/empty/error/partial và record counts | Kiểm tra JSON parse, response envelope và catch đang biến lỗi thành array rỗng. |
| Popup và notification cập nhật | Đúng ID/generation, chart/list hoặc empty/error + toast | Kiểm tra visibility, schema renderer, chart container 0px, notification provider và stale guard. |

Có thể thêm logging dev có cấu trúc cho các mốc trên; dùng một correlation ID xuyên suốt nếu convention repo có hỗ trợ. Không log master token, toàn bộ response hoặc NFC card history. Khi hoàn thành, xóa log spam/per-frame và giữ diagnostics cần thiết theo convention repo.

**Quan trọng:** không chỉ xóa overlap rồi báo hoàn thành. Phải chứng minh luồng từ click tới popup/network/notification đã nối được; sửa thêm chỗ đứt được phát hiện trong phạm vi này.

### 3.6. Bỏ overlap cycling và nhánh click lọc cụm

- Handler tăng `cycleIndex`, xoay qua danh sách thiết bị trùng vị trí hoặc đổi thiết bị đại diện của marker sau mỗi click.
- Marker đại diện cụm thay đổi icon/type/ID khi click; nhánh “click lần đầu chọn cụm, click tiếp mới chọn thiết bị”.
- Click marker tự mở drawer “Danh sách thiết bị” và áp `clusterId`/overlap filter thay vì mở detail.
- UI “Đang lọc cụm”, “Hiện tất cả” **thuộc filter cụm**, counter/selector riêng của overlap và state/listeners không còn được dùng.
- Early return kiểu “có overlap → xử lý cụm → return” khiến không chạy selection/fetch.

Nếu clustering đang gộp nhiều nguồn thành một marker, bỏ phép gộp trong luồng render/pick này để mỗi marker bind **một stable device ID**. Chỉ xóa code chuyên phục vụ overlap; giữ các utility tọa độ/projection dùng chung còn cần thiết.

#### Hành vi thay thế đơn giản

- Mỗi icon giữ nguyên type/icon/device ID theo dữ liệu. Click gọi một hành động selection trực tiếp.
- Vòng highlight của thiết bị đang chọn có thể giữ; highlight không được đổi danh tính hoặc glyph của icon.
- Khi hai marker vẫn trùng hit area, chọn một target theo thứ tự hit-test/render ổn định hiện hữu. Nếu cần tie-break, dùng quy tắc xác định một lần theo stable ID; **click lặp lại không xoay sang thiết bị khác**. Camera thay đổi có thể làm thứ tự nhìn thấy khác, nhưng click không tự mutate thứ tự để cycling.
- Giữ nút **Danh sách** ở toolbar cho người dùng mở chủ động. Danh sách áp filter loại thiết bị/tầng hiện hữu, không còn filter theo cụm.
- Click một row trong danh sách cũng gọi **cùng selection action** để mở popup và fetch đúng thiết bị. Đây là cách truy cập một thiết bị bị icon khác che trong giai đoạn hiện tại.
- Nếu drawer đang mở, chọn một marker/row có thể đóng drawer để popup không bị che; không xóa hoặc reset danh mục.

Không thay tọa độ nguồn, không tự offset/jitter, không spiderfy, không auto-spread, không thêm drag/editor và không lưu DB. Tính năng Design chỉnh vị trí là việc tương lai theo người dùng. Trong test data hiện tại vẫn có thể có overlap; không cần giả vờ nó đã hết để nghiệm thu.

## 4. Phase 07B — Fetch theo selection, 72 giờ và 1.000 dòng

### 4.1. Luồng chính và query cụ thể

1. Nhận click marker hoặc list row bằng `catalogue.device_id` và context tầng hiện tại. Binding hỏng phải có toast, không return im lặng; click không đi qua cluster selection.
2. Tăng request generation, abort lượt cũ, dismiss toast của selection cũ; set selected device và popup open/loading **trước mọi await API**. Clear data thiết bị khác, dùng anchor hợp lệ hoặc vị trí dự phòng.
3. Chụp một `requestTo = now` duy nhất; `requestFrom = requestTo - 72 * 60 * 60 * 1000`; `requestedLimit = 1000`.
4. Gửi range rõ ràng qua API ứng dụng. NestJS validate và resolve type theo mục 3.3, không tin raw path/type từ browser.
5. NestJS gọi đúng một API history với **`dev_eui`, `start`, `stop`, `limit=1000`**, không ghi DB.
6. Validate/normalize; chỉ apply result nếu context + request generation vẫn hiện hành.
7. Classify success/empty/error/partial; render body và phát floating notification theo mục 6 cho selection hiện hành. `fetchedAt` chỉ đổi khi fetch thành công, tách với row `timestamp` và metadata `last_updated_timestamp`.

Các query upstream chính xác:

```http
GET /api/v1/solar?dev_eui=<encoded-catalogue-device_id>&start=<ISO-8601-UTC>&stop=<ISO-8601-UTC>&limit=1000
GET /api/v1/avc?dev_eui=<encoded-catalogue-device_id>&start=<ISO-8601-UTC>&stop=<ISO-8601-UTC>&limit=1000
GET /api/v1/nfc?dev_eui=<encoded-catalogue-device_id>&start=<ISO-8601-UTC>&stop=<ISO-8601-UTC>&limit=1000
```

Pseudocode cho range, không phải source repo đã kiểm chứng:

```ts
const requestTo = new Date();
const requestFrom = new Date(requestTo.getTime() - 72 * 60 * 60 * 1000);
const range = {
  start: requestFrom.toISOString(),
  stop: requestTo.toISOString(),
  limit: 1000,
};
// Client gửi range qua API ứng dụng; NestJS gắn dev_eui + bearer và gọi upstream.
```

Không đổi sang `limit=1` chỉ để lấy latest vì popup còn cần chart/history. Không tạo request latest riêng khi response 1.000 dòng newest-first đã đáp ứng cả hai.

### 4.2. Range, validation và thứ tự dữ liệu

- Cửa sổ rolling 72 giờ theo thời gian tuyệt đối, không phải ba ngày lịch. Tính lại khi select/refresh, giữ cùng start/stop qua cả request.
- Gửi ISO-8601 UTC có `Z`; hai biên **inclusive**. Backend validate date hợp lệ và `start < stop` trước khi gọi IoT. Không dùng `from/to`, epoch hoặc tham số sort tự đặt thay `start/stop`.
- Phase này không cung cấp UI range/limit tùy ý; route dành cho popup phải giữ policy 72h/1.000. Nếu reuse một gateway tổng quát, vẫn validate integer `limit <= 10000`; quy tắc `limit >= 1` nếu dùng là policy ứng dụng, không phải minimum upstream được tài liệu hóa.
- Hiển thị `Asia/Ho_Chi_Minh` hoặc setting timezone đang có; chart/tooltip phải có ngày + giờ vì dài ba ngày.
- Row `timestamp` là lúc reading/scan **được ghi nhận** theo handover. Nhãn “Bản ghi lúc...” tránh khẳng định đó là thời điểm đo vật lý độc lập với ingest.
- Upstream trả **newest first** và giữ dòng mới nhất khi giới hạn. Hero dùng row mới nhất hợp lệ cho metric; copy/sort tăng dần để vẽ chart. NFC list giữ mới nhất trước.
- So `row.dev_eui` với ID request; row sai device, timestamp lỗi/ngoài inclusive range không được render. Báo partial/schema drift phù hợp.
- Hero ghi “Giá trị mới nhất trong 72 giờ” hoặc “Lượt quét gần nhất trong 72 giờ”; không nói realtime. Nếu không có record, báo empty và không tự mở rộng cửa sổ.

### 4.3. Limit và coverage thực tế

- Request mặc định **gửi rõ `limit=1000`**, dù upstream cho phép bỏ để nhận cùng default. Hard cap upstream **10000** đã được nguồn xác nhận; không tăng lên cap trong phase này.
- Không phân trang tự động; contract chưa có cursor/offset/total. Không chia nhiều cửa sổ để né limit.
- Lưu `returnedCount = data.length`, `validCount`, `invalidCount`, timestamp đầu/cuối thực nhận. `meta.count` là metadata trả về, **không phải tổng record 72h đã được bảo đảm**; không dùng nó làm mẫu số `N/total`.
- `meta.truncated === true`: hiển thị “API báo giới hạn kết quả; lịch sử có thể chưa đầy đủ”. Flag là tín hiệu cần giữ, không cho phép suy chính xác bao nhiêu record bị thiếu.
- `data.length >= 1000`: hiển thị “Đã đạt giới hạn 1.000 bản ghi; lịch sử có thể chưa đầy đủ”, kể cả `meta.truncated` thiếu hoặc false. Không tự khẳng định có record thứ 1.001.
- Dưới 1.000 và flag thiếu/false: hiện số dòng và phạm vi đầu/cuối; không thêm badge “Đủ 72h”. Ít record có thể do nhịp lấy mẫu, khoảng thiếu hoặc dữ liệu nguồn.
- `meta = {}` hợp lệ. Nếu `count` khác độ dài array hoặc `truncated=true` với array rỗng, giữ khả năng hiển thị empty/partial, ghi discrepancy; không tạo thêm record theo metadata.
- X-axis của chart là range 72h; không kéo giãn đoạn dữ liệu ngắn thành hình trông như bao phủ đủ ba ngày. Vùng không có sample để trống; không zero-fill.

### 4.4. Trigger và chống dữ liệu cũ

| Tình huống | Hành vi bắt buộc |
| --- | --- |
| Chọn A lần đầu | Mở popup A, fetch mới với cửa sổ/limit mới. |
| Chuyển A → B | Xóa dữ liệu A khỏi view B ngay; hủy/invalidate A; chỉ B được render. |
| A → B → A hoặc đóng → mở lại A | Fetch A mới, không dùng response cache của lần trước làm kết quả. |
| Click lại marker A đang được chọn | Giữ popup và refresh mới; không cycle ID/glyph hoặc toggle đóng. Không bỏ fetch chỉ vì `deviceId` không đổi. |
| Refresh | Tính lại `now`, gọi lại API cho selection hiện tại; không reload tầng/danh sách toàn tầng. |
| Một gesture sinh cả sự kiện Unity và DOM | Chỉ một handler sở hữu selection/fetch; không gọi hai lần do event propagation/bridge trùng. |
| Nhiều selection hợp lệ liên tiếp | Generation mới thay generation cũ; abort request cũ nếu có thể. |
| Camera pan/zoom/orbit, popup reposition, tooltip hoặc đổi metric | Chỉ render lại từ dữ liệu lần fetch hiện tại; không fetch thêm. |
| Đóng popup/đổi tầng/về Campus/unmount | Abort và invalidate, clear selection/data, dismiss toast cũ. Response đến muộn không mở popup hoặc báo lỗi cho selection mới. |

Không chỉ dựa vào `AbortController`: response có thể đã hoàn tất hoặc proxy không hủy upstream. Mọi success/error/finally phải kiểm tra request generation và context trước khi set state. Context gồm tòa, tầng, device ID, type và một sequence tăng dần; `deviceId` đơn lẻ không đủ cho A → B → A.

**Refresh cùng thiết bị:** có thể giữ dữ liệu RAM khi tải với nhãn đang làm mới/timestamp cũ. Refresh lỗi → nhãn dữ liệu cũ + error toast, không đổi timestamp. Refresh thành công nhưng empty → clear dữ liệu cũ, empty body + no-data toast. Chuyển thiết bị luôn clear data cũ. Guard generation/context áp dụng cả success/error/finally và notification; abort do chủ động đổi selection không phát toast, **timeout abort vẫn phải phát toast**.

## 5. Phase 07C — Data adapter và không persistence

### 5.1. Phân chia trách nhiệm

| Lớp | Trách nhiệm |
| --- | --- |
| Marker/bridge hiện hữu | Phát stable ID + floor context + thông tin anchor cần thiết; không gọi telemetry API từ từng object Unity. |
| Selection controller/hook phía web | Sở hữu selected device, request sequence, loading/error/data, cleanup và refresh. |
| Type registry/adapter NestJS | Resolve type từ upstream metadata; allowlist `solar`, `avc`, `nfc`; build query, parse riêng mỗi type và trả discriminated result. |
| IoT client trong NestJS | Thành phần duy nhất giữ bearer và gọi host IoT; query validation, timeout/error mapping, no-store; không truy cập DB để lưu kết quả. |
| Next.js API/BFF nếu repo có | Chỉ gọi/chuyển tiếp tới NestJS bằng cơ chế ứng dụng hiện tại; không giữ bearer IoT hoặc gọi host IoT trực tiếp. Không bắt buộc thêm một BFF mới. |
| Popup React | Mount theo selection/open state; body theo loading/success/empty/error. Không gate cả popup theo data.length/anchor/cluster. |
| Notification host trong shell | Reuse toast system; host độc lập với popup/chart/anchor, hiển thị no-data/error trên canvas và dedupe theo request generation. |

Ưu tiên reuse hạ tầng Phase 06. Nếu cần thêm route đọc ở NestJS, chọn tên theo convention thực tế; `GET /api/devices/:deviceId/data?start=...&stop=...&limit=1000` chỉ là thiết kế route ứng dụng tham khảo trong handover, không phải URL đã có trong repo hoặc upstream. Không dùng URL này để gọi host IoT. Chỉ 5 GET upstream đã được handover liệt kê nằm trong scope; không thêm mutation hay generic proxy.

### 5.2. View model nội bộ đề xuất

Đây là cấu trúc thiết kế phía ứng dụng, **không phải response schema của IoT backend**. Agent điều chỉnh theo codebase nhưng phải giữ các ý nghĩa sau:

| Nhóm | Nội dung tối thiểu |
| --- | --- |
| Identity | Stable device ID, raw API type, display name, building/floor; room chỉ khi có metadata thật. |
| Request | From/to/limit, request generation, `fetchedAt` khi thành công. |
| Coverage | Returned count, valid count, invalid count nếu có, timestamp đầu/cuối, tình trạng truncated/unknown/complete có bằng chứng. |
| Status | Raw solar state/AVC flags, nhãn chưa có mã hóa, timestamp; registration `is_active` tách biệt. Không có source online/offline hiện hành. |
| Numeric metrics | Metric key/label, unit có nguồn, sample time/value/null, semantics gauge/counter nếu đã biết. |
| Events | `timestamp`, `moving_direction` đúng enum, `detected_card_id`, `batch_id`; không có unique event ID trong contract hiện tại. |
| UI warnings | Thiếu field, một phần record không hợp lệ, thiếu unit, phạm vi có thể chưa đầy đủ. |

Không cần lưu raw payload đầy đủ vào state lâu hơn nhu cầu parse. Fixtures phục vụ test là dữ liệu tổng hợp hoặc sample đã làm sạch, không phải cơ chế tự lưu response người dùng.

### 5.3. Quy tắc normalize

- Validate envelope trước khi parse records: history `data` là array; detail `data` là object; `meta` là object có thể rỗng. Phân biệt response rỗng hợp lệ với schema sai.
- Giữ `0`, `false` là giá trị hợp lệ; `null`, missing, NaN, infinity không đổi thành 0.
- Chỉ parse numeric string hoặc scaling khi contract cho phép. Thiếu unit không tự gắn °C, %, W hay kWh.
- Record không có timestamp hợp lệ không được đặt tại `now` để vẽ chart. Nếu một phần lỗi, render phần hợp lệ cùng thông báo; nếu toàn bộ không hợp lệ, trả schema/data error, không giả làm empty.
- Dùng row `timestamp` lúc reading/scan được ghi nhận; không thay bằng metadata timestamp hoặc fetchedAt.
- Contract hiện tại không có unique reading/event ID. Không dedupe bằng `batch_id`, `f_cnt`, `fcnt`, timestamp hoặc card ID; giữ các row nguồn. Dùng key hiển thị có request generation + vị trí row gốc khi cần, không gọi đó là identity nghiệp vụ. Mỗi refresh thay array, không append để vô tình nhân đôi history.
- Mọi row history có `dev_eui`: kiểm tra khớp với ID query; không dùng solar row `device_id` để so identity. NFC `moving_direction` chỉ nhận `in`/`out`; giá trị khác là contract drift, không tự map thành hướng còn lại.
- Giữ solar `state`, AVC `valve_open`, `pipe_leak`, `pipe_burst`, `battery_low`, `frozen`, `tamper`, `reverse_flow` dạng số; không boolean-coerce hoặc dùng nonzero làm cảnh báo. Không reject `spreading_factor=0` chỉ vì mô tả SF7–SF12: source example có 0.
- Latest chọn theo timestamp hợp lệ của metric/event, không dựa vị trí phần tử đầu/cuối. Nếu latest record thiếu metric, có thể lấy sample gần nhất có metric đó nhưng phải dùng timestamp riêng của sample.
- Nhiều metric khác đơn vị không ép chung một trục; dùng selector/tab trong popup. Không lấy “field numeric đầu tiên” làm chỉ số chính.

### 5.4. Không lưu DB, không dùng cache thay fetch

**Không thêm hoặc gọi:** ORM create/update/upsert, repository save, DB table/migration, Redis/persistent report cache, file dump runtime, localStorage/sessionStorage/IndexedDB hoặc persisted client-query store cho dữ liệu này. Không thêm write vào selection, success callback hoặc refresh.

Được giữ **RAM tạm** cho history của selection hiện tại và refresh của nó; clear khi đóng/đổi context. Metadata RAM từ danh mục Phase 06 có thể phục vụ type routing theo mục 3.3, không ghi DB. Không tái dùng cache history cho lần chọn lại thiết bị.

Kiểm tra mọi lớp cache nằm trên integration path: browser fetch, client query library, Next/server cache, Nest cache interceptor, service worker/proxy nếu đang có. Cấu hình no-store/no-cache reuse phù hợp với version trong repo; không dựa vào default framework. Proxy phải forward mỗi selection hợp lệ ra upstream; local dedupe chỉ tránh việc một gesture phát hai handler.

`GET /api/v1/devices/{dev_eui}` chỉ trả metadata; `is_active` là tình trạng đăng ký/ngừng sử dụng, **không phải live health**. Chỉ gọi khi cần resolve/refresh metadata như mục 3.3. Nếu cần detail để xác định type, phải đợi detail rồi mới gọi history; không dispatch song song dựa type chưa xác minh. Không gọi detail để tìm field online/offline không tồn tại trong contract.

Gợi ý read-through cache và metadata persistence trong handover là hướng có điều kiện. Yêu cầu trực tiếp của Phase 07 **fetch mỗi lần, không DB** áp dụng cho phase này; không thêm TTL hoặc trả telemetry từ cache thay upstream.

Log vận hành chỉ giữ endpoint template, status, duration, request ID và count khi cần; không tự dump toàn bộ telemetry, token hoặc card ID. Các schema DB có sẵn của Phase 04 vẫn giữ nguyên.

## 6. Phase 07D — UI popup theo mockup

### 6.1. Khung chung

| Vùng trong ảnh tham chiếu | Triển khai Phase 07 |
| --- | --- |
| Card nổi trên mặt bằng | Nền navy tối, viền xanh mảnh, bo góc, shadow vừa phải; chữ sáng, accent cyan theo theme hiện hữu. |
| Header “Cảm biến Nhiệt độ - Phòng A1” + X | Tên thực tế + phòng nếu biết; fallback loại/ID rút gọn và tầng. Không điền A1 nếu không có nguồn. X đóng popup. |
| Icon + “Giá trị hiện tại” | Icon kế thừa Phase 06; số/đơn vị của metric đã map hoặc tóm tắt event mới nhất. Nhãn ưu tiên “Giá trị mới nhất”/“Sự kiện mới nhất”. |
| “Trạng thái” và chấm màu | Hiện raw state/flags với nghĩa còn chưa xác nhận, hoặc “Chưa có dữ liệu trạng thái”; màu trung tính. Không mặc định xanh. |
| “Xu hướng 24 giờ qua” | Numeric: “Xu hướng 72 giờ qua”; event: “Lịch sử 72 giờ qua”. Hiển thị rõ limit/coverage khi cần. |
| Chart giữa card | Time series theo metric cho số đo; event history phù hợp cho NFC nếu contract xác nhận event stream. |
| Footer “Cập nhật...” + refresh | Phân biệt “Bản ghi lúc...” với “Đã lấy lúc...”; dùng date/time đầy đủ trong tooltip. Nút refresh có trạng thái đang tải. |
| Đường nối marker–popup | Đường mảnh cyan, cập nhật theo anchor thực tế; không click-through gây chọn lại thiết bị. |

Đề xuất kích thước desktop khoảng 360–400 CSS px; chọn giá trị cụ thể theo layout hiện tại và độ dài dữ liệu. Trên viewport hẹp, giới hạn width theo vùng viewer, cho body scroll khi cần. Không ép kích thước từ ảnh crop vì ảnh không xác định CSS scale.

### 6.2. Popup luôn phản hồi: mount, vị trí và tương tác

**Không dùng** điều kiện tương đương những ví dụ này làm gate cho cả popup:

```ts
if (!data?.length) return null;
if (isLoading || error) return null;
if (!projectedAnchor) return null;
if (!selectedCluster) return null;
```

Mount popup theo **selection/open state**. Bên trong popup mới chọn `loading`, `success`, `empty`, `error`, `unsupported`. Một chart chưa đủ sample hoặc không có metric không đồng nghĩa toàn popup phải biến mất.

Chọn lại cùng ID phải mở/refresh mới, không toggle popup đóng, không bỏ fetch do `selectedDeviceId` không đổi. Dùng request generation/selection action cho lần click mới; không dựa độc nhất vào effect theo ID. Camera movement và render lại không tạo generation hoặc request mới.

#### Bảo đảm card thực sự nhìn thấy

- Card là web overlay nổi trong vùng viewer, nền navy/viền cyan theo mockup; có width và body/chart height thực tế. Giữ bố cục tiêu đề → giá trị/trạng thái → chart/history → footer/refresh.
- Kiểm tra `display`, `visibility`, `opacity`, stacking context, parent transform, `overflow`, portal target và canvas layer. Chỉ tăng z-index mà chưa kiểm tra stacking context không đủ.
- Dùng anchor theo screen/CSS pixel, kiểm tra devicePixelRatio, canvas offset và quy ước trục Y. Clamp/flip để card nằm trong vùng nhìn thấy và không che kín panel điều hướng.
- Nếu projection chưa có, dùng click position khi biết hoặc đặt card dự phòng ở góc trên phải vùng viewer sau khi trừ panel. Không chờ một projection frame mới để mở popup.
- **Thay quy tắc cũ “marker ra ngoài viewport thì ẩn card”:** khi selection còn mở mà marker offscreen/behind-camera, giữ card ở vị trí dự phòng, ẩn connector và có thể ghi nhỏ “Thiết bị ngoài vùng nhìn”. Khi anchor hợp lệ lại, card bám marker; không refetch.
- Nếu người dùng filter bỏ thiết bị, đổi tầng, về Campus hoặc đóng popup: clear selection/abort như lifecycle cũ. Đây là hành động kết thúc selection, khác thiếu anchor tạm thời.
- Pointer trong popup/toolbar/toast không truyền xuống orbit/picking. Kiểm tra cùng click mở card không bị handler background/outside-click đóng ngay sau đó.
- Nếu chart component lỗi render, giữ header/error body và hiện thông báo lỗi hiển thị. Dùng error boundary đã có hoặc boundary cục bộ cần thiết; không để chart làm mất toàn viewer/toast host.

Đóng bằng X hoặc Escape. Các nút có accessible name/focus visible; status có text cùng màu, không chỉ dựa màu. Không tạo focus trap toàn trang cho card không modal.

### 6.3. Status theo đúng contract hiện tại

**Contract không có live-online/health enum đã xác nhận cho ba loại.** Không copy chữ “Bình thường” và chấm xanh trong ảnh vào kết quả API thành công.

| Dữ liệu nguồn | Hiển thị Phase 07 |
| --- | --- |
| Solar `state` numeric | Vùng trạng thái ghi “Chưa xác nhận”; chi tiết “Mã trạng thái: <giá trị>”. Màu trung tính; không map 0/1 thành normal/alarm. |
| AVC flags numeric | Vùng trạng thái ghi “Chưa xác nhận mã cảnh báo”; raw flags nằm trong chi tiết, không kết luận có/không rò rỉ hoặc pin yếu. |
| AVC `valve_open` numeric | Hiện “Mã trạng thái van: <giá trị>” khi mở chi tiết; không map mở/đóng hoặc boolean. |
| NFC event | Hướng Vào/Ra thuộc sự kiện; vùng health ghi “Chưa có dữ liệu trạng thái”, không dùng hướng di chuyển làm health. |
| Metadata `is_active=true` | Nếu cần hiển thị, ghi “Đăng ký: đang sử dụng” trong metadata; không gọi online/Bình thường. |
| Metadata `is_active=false` | “Đăng ký: đã ngừng sử dụng”; history cũ vẫn có thể tồn tại. Không suy thao tác decommission là lỗi mạng. |
| Chỉ có HTTP 200 hoặc timestamp gần đây | Chỉ chứng minh request thành công/có bản ghi; không chứng minh thiết bị đang online. |
| Không có data/NFC event trong 72h | Empty state; không kết luận đầu đọc hỏng, không có người, phòng trống hoặc thiết bị offline. |

Không có ngưỡng freshness/heartbeat trong nguồn. Hiển thị tuổi bản ghi và thời gian cụ thể; không đặt ngưỡng alarm/offline tuỳ ý. Nếu sau này hardware xác nhận enum, cập nhật descriptor/mapping có nguồn ở phase phù hợp.

### 6.4. Floating notification bắt buộc — host và hiển thị

- Reuse toast/snackbar system đang có; chỉ bổ sung một host nhỏ dùng chung nếu repo chưa có. Không tạo nhiều host trong từng marker/popup.
- Host phải được mount ở viewer/application shell ổn định, **độc lập với data/chart/anchor và vòng đời nội dung popup**. Nếu có fullscreen hiện hữu, bảo đảm host nằm trong vùng hiển thị fullscreen thích hợp.
- Vị trí đề xuất góc trên phải viewport/vùng viewer, tránh toolbar/panel theo layout thật. Toast phải nằm trên canvas/popup và không bị parent `overflow`/transform cắt.
- Host wrapper không chặn pointer toàn màn hình; chỉ card toast/nút mới nhận pointer. Giữ nội dung đọc được trên nền 3D.
- Empty dùng info/warning trung tính; error dùng màu lỗi. Text có tên hoặc ID thiết bị để người dùng biết lỗi thuộc selection nào. Không dùng browser `alert()` thay thông báo nổi.
- Dùng live region phù hợp (`status`/polite cho no-data, `alert` cho lỗi mới), có nút đóng và tên truy cập cho retry. Notification không cướp focus khỏi popup đang tương tác.

### 6.5. Kết quả API → popup body + floating notification

Các nội dung dưới đây là copy mặc định; thay placeholder bằng dữ liệu có nguồn. Message không được chứa token, hostname nội bộ, stack trace hoặc chi tiết kỹ thuật không giúp người dùng.

| Kết quả | Popup vẫn hiển thị | Floating notification phải xuất hiện |
| --- | --- | --- |
| Success có sample/event hợp lệ | Chart Solar/AVC hoặc NFC event list | Không cần success toast. |
| HTTP 200 + `data: []` | Empty state, range 72h, refresh | **“Không có dữ liệu của thiết bị [tên/ID] trong 72 giờ gần nhất.”** |
| Upstream 400 / truy vấn bị từ chối | Error state, có đóng/refresh | **“Không thể tải dữ liệu thiết bị [tên/ID]. Yêu cầu truy vấn chưa hợp lệ.”** Không auto retry cùng query. |
| Upstream 401/403, được backend phân loại là lỗi tích hợp | Error state | **“Chưa thể truy cập dữ liệu thiết bị [tên/ID]. Vui lòng thử lại sau.”** Không yêu cầu người dùng đăng nhập lại hoặc nhập master token. |
| Detail 404 cho thiết bị đã chọn | Device-not-found state | **“Không tìm thấy thiết bị [tên/ID] trên hệ thống dữ liệu.”** Không tự xóa marker. |
| History route 404 nhưng không có bảo đảm là device-not-found | Error state | **“Dịch vụ dữ liệu cho thiết bị [tên/ID] hiện chưa khả dụng.”** Không đồng nhất với detail 404. |
| Upstream 5xx / ứng dụng nhận dependency error | Error state + retry | **“Dịch vụ IoT đang gặp lỗi. Chưa tải được dữ liệu thiết bị [tên/ID].”** |
| Network failure | Error state + retry | **“Không kết nối được dịch vụ dữ liệu cho thiết bị [tên/ID].”** |
| Timeout kể cả timeout dùng AbortController | Timeout state + retry | **“Quá thời gian tải dữ liệu thiết bị [tên/ID]. Vui lòng thử lại.”** |
| 429 nếu phát sinh | Rate-limit state | **“Đang có quá nhiều yêu cầu. Vui lòng thử lại sau.”** Tôn trọng Retry-After nếu có. |
| JSON/envelope lỗi hoặc toàn bộ records invalid/sai device | Data error state | **“Dữ liệu trả về của thiết bị [tên/ID] không hợp lệ hoặc chưa đúng định dạng.”** |
| Một phần record invalid hoặc metric đang chọn không có sample hợp lệ | Partial/missing-metric state, dữ liệu hợp lệ còn lại vẫn xem được | **“Một phần dữ liệu thiết bị [tên/ID] chưa hiển thị được.”** Một toast cho result, không từng row. |
| Type chưa hỗ trợ/binding hỏng khiến không thể fetch | Unsupported state nếu xác định được thiết bị | **“Chưa hỗ trợ dữ liệu cho loại thiết bị này.”** hoặc **“Không xác định được thiết bị đã chọn.”** |
| Chart render lỗi dù data đã tải được | Fallback body “Không thể hiển thị biểu đồ”; header/controls giữ | **“Đã tải dữ liệu nhưng chưa hiển thị được biểu đồ của thiết bị [tên/ID].”** |

`403/429/5xx` là xử lý phòng vệ; không tuyên bố tất cả đã có trong contract IoT. Trường hợp lỗi authentication của chính người dùng ứng dụng, nếu repo có, vẫn đi qua cơ chế auth hiện hữu; không nhầm với upstream bearer 401.

### 6.6. Vòng đời toast và chống thông báo trùng

- Một **logical request/result của selection hiện hành** phát tối đa một toast kết quả; choose message có mức ưu tiên cao nhất khi có nhiều lỗi. Không gọi toast trực tiếp trong render body hoặc mỗi projection frame.
- Dedupe theo request generation + notification kind; không dedupe vĩnh viễn theo device ID, vì người dùng retry mà vẫn lỗi cần được thông báo lại.
- No-data/partial: đề xuất tự đóng sau khoảng **8 giây**, có X. Error: giữ tới khi đóng, retry hoặc selection kết thúc. Hover/focus không khiến mất cơ hội đọc hoặc bấm action theo toast convention hiện hữu.
- Nút **Thử lại** chỉ retry đúng thiết bị/context hiện hành, tạo range/generation mới. Nếu selection đã đổi, toast cũ phải bị dismiss; callback cũ không được mở lại thiết bị trước.
- Chuyển A → B, đóng popup, đổi tầng, về Campus: dismiss toast liên quan selection cũ, abort/invalidate request. **Abort chủ động và response lỗi đến muộn của A không phát toast cho B.**
- Abort do deadline là **timeout**, phải có toast; không dùng quy tắc “mọi AbortError đều bỏ qua”. Lưu cancellation reason hoặc request state để phân biệt.
- Notification vẫn phải nhìn thấy nếu popup phải dùng anchor dự phòng, thiếu projection hoặc chart đang ở error boundary.
- Refresh thành công sau lỗi → bỏ error toast cũ, render dữ liệu mới. Refresh trả empty → clear dữ liệu cũ, empty body + no-data toast. Refresh thất bại → có thể giữ dữ liệu cũ đúng thiết bị với nhãn lỗi/cũ, **không đổi fetchedAt thành thời gian mới**; error toast vẫn bắt buộc.

### 6.7. Lỗi không được nuốt; loading có deadline

- Kiểm tra HTTP status trước khi coi response là success; `fetch` trả response non-2xx không nhất thiết tự throw.
- Parse/validate envelope; không chỉ kiểm tra request đã resolve Promise. Error envelope trong HTTP 200 do proxy xử lý sai cũng không phải success/empty.
- Tìm và sửa `catch { return [] }`, `catch { return null }`, log-only catch, mapper đổi mọi upstream error thành `200 data: []`, hoặc state bị reset ở `finally`.
- Empty hợp lệ: response success + data array thật sự rỗng. Tất cả record invalid/mismatch/time lỗi là data/schema issue, không đổi thành no-data.
- Error response cần được NestJS/BFF chuyển thành application error có kiểm soát để UI phân biệt empty, invalid response, integration auth và dependency failure. Không đưa bearer/token/raw stack tới browser.
- Có deadline hữu hạn cho toàn selection fetch để loading không vô tận. Reuse policy có sẵn nếu hữu hạn và được kiểm tra; nếu chưa có, đề xuất **20 giây tổng budget NestJS cho resolve metadata + history**, **25 giây client watchdog**. Đây là policy ứng dụng của bản sửa, không phải SLA IoT. Phân biệt timeout abort với abort do đổi selection.
- Không tự polling/retry nền liên tục; retry từ người dùng là fetch mới. Không ghi dữ liệu/history vào DB hoặc persistent cache.

## 7. Phase 07E — Mapping field → UI cho từng thiết bị

### 7.1. Solar — dòng điện và độ sáng là hai metric dùng ngay

**Endpoint:** `GET /api/v1/solar`. **Nguồn field:** handover §7. Hero/selector dưới đây là default của plan, đã chọn để tránh dùng các field pending làm số đo vật lý chắc chắn.

| Vị trí UI | Field nguồn | Nhãn / đơn vị | Quy tắc |
| --- | --- | --- | --- |
| Header | Catalogue ID; `device_id` trong reading nếu có tên hữu ích | “Thiết bị Solar — <tên/ID>” | Giữ stable ID riêng; room chỉ khi có mapping thực. Friendly name không thay query ID. |
| Hero mặc định | `current_uA` | “Dòng điện mới nhất” — **µA** | Đây là measured current draw; không gọi công suất phát điện/sản lượng. Không tự đổi scale. |
| Chart mặc định | `timestamp`, `current_uA` | “Dòng điện — 72 giờ qua”, trục Y µA | Điểm/số phải cùng metric và timestamp có nguồn. |
| Selector phụ | `lux` | “Độ sáng” — **lx** | Đổi hero + chart sang lux từ response hiện tại; không refetch. |
| Chi tiết tín hiệu | `rssi`, `snr` | RSSI dBm; SNR dB | Chỉ số vô tuyến; không phân hạng tốt/xấu khi chưa có ngưỡng sản phẩm. |
| Trạng thái | `state` | “Mã trạng thái: <raw> — chưa xác nhận” | Không enum hóa, không màu normal/alarm. |
| Chi tiết dữ liệu chưa xác nhận | `voltage`, `temperature`, `humidity` | Raw field + raw value; “Đơn vị/ngữ nghĩa chưa xác nhận” | Không gắn V/°C/% và không đưa vào selector mặc định. |
| Chi tiết kỹ thuật nếu cần debug | `application_id`, `gateway_id`, `f_cnt` | Giữ đúng tên/ý nghĩa | Không bày tất cả vào body chính của popup. |

**Không có field `power`, `energy` hoặc kWh trong schema này.** Không tính `current_uA × voltage` thành công suất vì điện áp/đơn vị/ngữ nghĩa phần cứng còn pending; không tạo chart năng lượng. Nếu metric đang chọn thiếu/null ở response thực, hiển thị không có số đo hợp lệ và cho đổi sang metric còn dữ liệu; không lặng lẽ đổi hero mà giữ nhãn cũ.

### 7.2. AVC — đồng hồ nước, giữ rõ nhãn chờ hardware

**Endpoint:** `GET /api/v1/avc`. **Đã xác nhận loại:** đồng hồ nước. **Nguồn field:** handover §8. Khác với bản plan đầu, không còn cần hỏi `avc` là thiết bị gì.

| Vị trí UI | Field nguồn | Nhãn / đơn vị | Mức độ xác nhận |
| --- | --- | --- | --- |
| Header | `device_name` hoặc catalogue ID | “Đồng hồ nước — <tên/ID>” | Friendly name từ ChirpStack; ID query vẫn là `dev_eui`. |
| Hero mặc định + chart 72h | `instant_flow_m3h`, `timestamp` | “Lưu lượng tức thời” — **m³/h** theo tài liệu | **Chờ xác nhận phần cứng**; badge luôn hiện cạnh nhãn metric. |
| Selector phụ | `fwd_volume_m3` | “Thể tích tích lũy chiều thuận” — **m³** theo tài liệu | **Chờ xác nhận phần cứng/counter semantics**. |
| Selector phụ | `rev_volume_m3` | “Thể tích tích lũy chiều ngược” — **m³** theo tài liệu | **Chờ xác nhận phần cứng/counter semantics**. |
| Selector phụ | `temp_c` | “Nhiệt độ đo được” — **°C** | Unit Celsius được nguồn nêu; chưa xác định probe môi trường hay thân đồng hồ. |
| Thông tin thiết bị | `meter_sn` | “Số serial đồng hồ” | Không dùng để query thay `dev_eui`. |
| Trạng thái tổng | Các flags bên dưới | “Chưa xác nhận mã cảnh báo” | Không tổng hợp `any(flag)` thành cảnh báo. |
| Chi tiết tín hiệu | `rssi`, `snr` | RSSI dBm; SNR dB | Không suy health từ độ mạnh tín hiệu. |

**Cách hiển thị field pending:** trong test mode vẫn có thể trình bày raw numeric value với tên/unit đã được handover nêu, nhưng luôn gắn badge “Chờ xác nhận phần cứng” ở hero và chart/tooltip của các metric nước. Tooltip nói rõ đây là mô tả tạm trong API. Không rename thành số tiêu thụ chính thức, báo cáo/cảnh báo hoặc đại lượng đã hiệu chuẩn. Badge giữ cả khi export ảnh minh chứng; không ẩn nó chỉ vì số nhìn hợp lý.

| Raw field | Nhãn chi tiết | Điều không được suy |
| --- | --- | --- |
| `valve_open` | Mã trạng thái van | Không tự coi 1 là mở, 0 là đóng. |
| `pipe_leak` | Mã phát hiện rò rỉ | Không coi nonzero là có rò rỉ. |
| `pipe_burst` | Mã vỡ ống | Không tự map boolean. |
| `battery_low` | Mã pin yếu | Không dùng màu đỏ/xanh từ 0/1 chưa xác nhận. |
| `frozen` | Mã đóng băng | Không suy mức nhiệt hoặc tình trạng thật từ mã. |
| `tamper` | Mã can thiệp thiết bị | Không khẳng định có hành vi can thiệp. |
| `reverse_flow` | Mã dòng chảy ngược | Không biến thành hướng/lưu lượng đã xác nhận. |

Các raw flags hiển thị trong vùng “Chi tiết” mở rộng với ghi chú chung “Mã chưa có quy ước xác nhận”, giữ dạng số. `tag_source` cũng pending. `dev_addr`, `region`, `gateway_id`, `frequency_hz`, `spreading_factor`, `dr`, `fcnt` không phải hero; giữ cho adapter/chi tiết kỹ thuật khi cần.

Không tính chênh lệch `fwd_volume_m3` thành “Nước dùng trong 72h”, không lấy tổng counter, không xử lý reset bằng suy đoán. Với `temp_c`, không ghi “Nhiệt độ phòng” hay “Nhiệt độ nước” vì source chưa chỉ rõ vị trí probe. Không dùng nhiệt độ làm hero mặc định thay lưu lượng chỉ để giống ảnh nhiệt kế.

### 7.3. NFC — lượt quét cửa, hướng di chuyển và lịch sử

**Endpoint:** `GET /api/v1/nfc`. **Nguồn field:** handover §9; `moving_direction` có enum đã xác nhận.

| Vị trí UI | Field nguồn | Hiển thị / xử lý |
| --- | --- | --- |
| Header | Catalogue `device_id` và room mapping hiện hữu nếu có | “Đầu đọc NFC — <ID/phòng có nguồn>”. Response NFC không có tên đầu đọc/phòng. |
| Hero | Row mới nhất theo `timestamp` | “Lượt quét gần nhất trong 72 giờ” + ngày/giờ. |
| Direction badge | `moving_direction` | **`in → Vào`, `out → Ra`**. Đây là hướng tại điểm quét, không tự là trạng thái hiện diện toàn tòa. |
| Dòng phụ hero | `detected_card_id` | “Mã thẻ: <ID>”; có thể rút gọn và tooltip đầy đủ theo convention UI. |
| Vùng lịch sử thay line chart | `timestamp`, `moving_direction`, `detected_card_id` | Danh sách mới nhất trước: thời gian · Vào/Ra · mã thẻ; body có scroll. |
| Thông tin phụ có ích | Đếm các row hợp lệ đang hiển thị | “Đã tải N lượt: X vào, Y ra”; luôn là số trong payload hiện tại, không phải tổng 72h. |
| Chi tiết kỹ thuật | `batch_id` | Lô truyền dữ liệu; không dùng làm tên người, thẻ hoặc unique event key. |
| Health | Không có field tương ứng | “Chưa có dữ liệu trạng thái”. |

Giữ header/hero/status/history/footer của mockup; phần history dùng **event list**, không vẽ `detected_card_id` hoặc `in/out` thành line chart số. Biểu đồ histogram là mở rộng tùy chọn sau này, không phải requirement để hoàn tất phase này.

Không query/tạo mapping PostgreSQL giảng viên trong phase này; không đồng nhất mã thẻ với `IDGV`. Không suy quyền truy cập, người đang ở trong phòng hoặc occupancy bằng X vào − Y ra vì thiếu trạng thái ban đầu và coverage. Không gộp nhiều event có cùng `batch_id`, cùng timestamp hoặc cùng mã thẻ.

### 7.4. Quy tắc chart, thời gian và field thiếu

- Solar/AVC: mỗi lần một metric trên chart; selector đổi cả hero/unit/trục Y/tooltip và badge pending. Dữ liệu khác unit không ép lên cùng một trục.
- X-axis là range 72h, có ngày/giờ và timezone; chart sort tăng dần bản copy, không làm NFC list đảo thứ tự.
- Giá trị mới nhất lấy theo timestamp hợp lệ của metric. Nếu row mới nhất thiếu metric nhưng row cũ hơn có, ghi đúng timestamp cũ của metric và nhãn thiếu dữ liệu; không mượn timestamp mới nhất của metric khác.
- Một sample → một điểm, không tạo trend giả. Zero là giá trị thật; null/missing là gap/drift, không biến thành zero.
- Không nội suy/fill gaps/làm mượt để giống đường trong mockup. Cadence chưa có trong handover nên không tự đặt ngưỡng offline.
- Reuse chart library hiện hữu. Không thêm dependency/framework ngoài nhu cầu thực tế.
- Badge pending/missing và coverage là thông tin giúp người xem hiểu số liệu. Debug keys/token/network internals không đưa vào main product flow.

### 7.5. Các quyết định không cần chặn implementation

- Hero Solar = `current_uA`; selector phụ = `lux`.
- Hero AVC = `instant_flow_m3h` có badge pending; có selector `temp_c` °C và hai counter nước có badge.
- NFC = event list + direction theo enum; không yêu cầu thêm chart nhiệt độ.
- Mọi health chưa có enum giữ trung tính. Các source field pending không được tự “xác nhận” bằng cách số có vẻ hợp lý.

Chủ dự án có thể đổi metric mặc định sau khi xem popup, thông qua registry/config UI; không cần thay adapter, API, database hoặc window 72h. Nếu live payload cho thấy field hero không còn tồn tại, báo đúng mismatch và dùng UI missing-data; chỉ lúc đó mới cần chốt thay đổi contract/default.

## 8. Trình tự triển khai và các mốc nghiệm thu

| Bước | Công việc | Điều kiện hoàn thành |
| --- | --- | --- |
| 07A — Audit/contract | Reproduce hiện trạng; đọc code/contract và truy vết click → selection → shell → history → result | Xác định điểm đứt có bằng chứng; không suy từ console hoặc GET catalogue 200. |
| 07B — Request lifecycle | Bỏ overlap cycling/filter click; dùng một selection action, mở popup trước API; generation/cancel/fresh fetch | Click trực tiếp mở shell; không đổi ID/icon; request và toast cũ không ghi đè A → B → A. |
| 07C — Adapter/integration | Dispatch allowlist, query đúng contract, parser, no-store, no persistence | Request/response đúng từng type; DB không nhận write từ luồng này. |
| 07D — Popup và notification | Render mọi state, anchor fallback, chart size/stacking, host toast độc lập, retry/deadline | Card nhìn thấy trước API; empty/error có floating toast, không bị canvas/clipping che. |
| 07E — Type views | Metric/event mapping, chart/list, status, timestamps, coverage | Không sai unit, không giả “Bình thường”, không tổng hợp từ lịch sử thiếu. |
| 07F — Kiểm tra | Tests quan trọng, live checks khả dụng, ảnh minh chứng | Kết quả được ghi pass/fail/not-run theo từng loại. |
| 07G — Handoff | File report, mappings thực, ảnh, test evidence, giới hạn | Người tiếp theo có thể chạy lại và biết chính xác phần chưa xác minh. |

Tên component/hook/adapter do agent chọn theo cấu trúc repo; các vai trò ở đây không yêu cầu tạo lớp/file mới nếu code hiện hữu đã đáp ứng. Giữ thay đổi tập trung; không dựng lại shell hay marker system.

## 9. Phase 07F — Kiểm thử và tiêu chí nghiệm thu

### 9.1. Kiểm tra logic có ý nghĩa

Ưu tiên test các nguy cơ sai dữ liệu và lifecycle dưới đây bằng test runner sẵn có. Không cần thêm một test framework riêng chỉ cho phase này.

| ID | Scenario | Kết quả bắt buộc |
| --- | --- | --- |
| T01 | Ba device có type `solar`, `avc`, `nfc` | Dispatch đúng adapter/path đã xác minh và đúng identifier, không lẫn type. |
| T02 | Freeze clock rồi chọn thiết bị; record nằm đúng hai biên | Query `start/stop` ISO-UTC cách nhau đúng 72h, hai biên inclusive, `limit=1000`; không gửi tham số sort tự đặt. |
| T03 | Click lại cùng marker; đóng/mở; A → B → A | Có request mới mỗi selection hợp lệ; mỗi lần tính lại cửa sổ; không cache hit thay upstream. |
| T04 | A trả chậm hơn B; A lỗi/empty sau khi B thành công | B giữ nguyên; success/error/finally hoặc toast cũ của A không đè B. |
| T05 | Response tới sau close/đổi tầng/về Campus | Không set data/mở lại popup/phát toast cũ; chủ động abort không tạo lỗi giả. |
| T06 | Response nhiều device hoặc record sai identity | Không render nhầm; lỗi/record bị loại được ghi đúng theo contract. |
| T07 | Số 0, null, numeric string, timestamp sai, array rỗng, schema sai | 0 hợp lệ; null không thành 0; empty khác schema error; không gắn timestamp `now`. |
| T08 | Unsorted rows, trùng timestamp, metric latest bị null | Latest dựa timestamp hợp lệ; không dedupe mất event thật; timestamp hero khớp sample. |
| T09 | `meta={}`; `truncated=true/false`; đúng 1.000 và ít hơn limit; count lệch array | Không cần `has_more/total`; count không thành tổng 72h; đạt limit vẫn cảnh báo coverage kể cả flag false/thiếu. |
| T10 | HTTP 200; `is_active=true/false`; solar state/AVC flags numeric; empty NFC | Không giả “Bình thường”/offline; registration khác health; không có người trong phòng không được suy từ empty. |
| T11 | Unknown type; thiếu metric; thiếu unit | Không gọi endpoint fallback sai; UI trung thực, không dùng dummy. |
| T12 | Refresh lỗi khi có dữ liệu A | Dữ liệu A có nhãn cũ/lỗi; `fetchedAt` không đổi; refresh sau có thể hồi phục. |
| T13 | Một gesture phát qua DOM/Unity; camera update; đổi metric | Một gesture → một lượt telemetry fetch; camera/metric change → không fetch. |
| T14 | Luồng select/refresh success, empty và error | Không ORM save/upsert, persistent cache, web storage hoặc file ghi payload. |
| T15 | Opaque/dummy ID; solar row device_id khác dev_eui; AVC dev_addr/serial khác ID | Query và row matching dùng catalogue.device_id ↔ dev_eui; không ép định dạng hoặc thay stable ID. |
| T16 | Browser gửi type sai/arbitrary path; server thiếu metadata; detail 404 | Server type là nguồn routing; không route theo client override; detail resolve trước history; 404 không sinh placeholder/history request. |
| T17 | Invalid ISO, start >= stop, limit không integer hoặc >10000 | Reject ở NestJS trước upstream; limit dương là policy ứng dụng nếu áp dụng. Không tự sửa invalid range bằng lookback khác. |
| T18 | Solar temperature/humidity/voltage/state có số; AVC flags 0/1/2 và spreading_factor=0 | Solar không tự có °C/%/V/normal; AVC không boolean-coerce; schema example SF=0 không bị reject vì range tự suy. |
| T19 | Đổi metric AVC giữa flow, counters, temp_c | Flow/counters giữ badge pending và đúng đơn vị theo source; temp_c có °C nhưng không gán vị trí probe; không tính tiêu thụ 72h. |
| T20 | NFC in/out, direction không thuộc enum, nhiều row cùng batch/card/time | In→Vào, out→Ra; giá trị lạ bị flag/drop có nhãn; không dedupe mất row, không dùng batch/card như IDGV. |
| T21 | Trace request NestJS và inspect client boundary/config | Chỉ NestJS có token/gọi host IoT; client không có master token/arbitrary proxy; 401 upstream không biến thành yêu cầu đăng nhập web. |
| T22 | Icon đơn, cụm một thiết bị như ảnh, hai marker chồng nhau | Không cycling type/glyph/ID; không tự mở drawer lọc cụm; click trực tiếp mở popup. Click lặp target ổn định fetch lại đúng target. |
| T23 | Mở danh sách chủ động rồi chọn row của marker bị che | Dùng cùng selection action và fetch đúng row; không còn filter/label “Đang lọc cụm”, không mất thiết bị khi bỏ cluster aggregation. |
| T24 | Response history bị trì hoãn; không có anchor lúc click | Shell loading xuất hiện trước API; header/X hoạt động; popup không đợi data.length/chart/projection. |
| T25 | HTTP200 data=[] | Popup empty **và toast no-data nhìn thấy trên viewer**. Không chỉ assert console hoặc hàm toast được gọi. |
| T26 | HTTP400/401/403/404/429/5xx, network hoặc schema error | Popup error **và toast** đúng tình huống; không swallow lỗi thành 200 empty; message được làm sạch. |
| T27 | Timeout vs abort do chuyển selection/đóng popup | Timeout có toast sau deadline hữu hạn; chủ động cancel không có toast lỗi. |
| T28 | Invalid/offscreen projection, camera pan/zoom, resize | Card chuyển sang vị trí dự phòng, connector ẩn; toast vẫn thấy. Không refetch vì camera/anchor đổi. |
| T29 | Chart container ban đầu 0px, stacking/overflow; chart ném lỗi render | Chart success có size nhìn thấy; render error giữ card fallback + toast; không sập cả viewer/notification host. |
| T30 | Rerender/Strict Mode nếu có, notification retry, response cũ đến muộn | Mỗi active request outcome tối đa một toast; retry lại có phản hồi mới; callback cũ không mở lại selection cũ. |
| T31 | Refresh lần lượt success/empty/error | Success dismiss toast cũ; empty clear số liệu cũ + no-data toast; error giữ dữ liệu cũ có nhãn + error toast, không đổi fetchedAt. |
| T32 | Click mở card rồi bubble tới background; tương tác X/refresh/toast/chart | Card không tự đóng ngay; UI không click-through tới camera/picking; host toast không chặn toàn màn hình. |

### 9.2. Kiểm tra tích hợp và visual

1. Trước hết chạy fixtures/schema và mocked upstream tại NestJS. Với môi trường test đã được chủ dự án cho phép và có cấu hình, dùng ID đã biết từ catalogue để kiểm tra tối thiểu từng type; không dò ID/endpoint hoặc chạy load test. Mở floor tương ứng → click icon → đối chiếu request params và response với hero/chart/list. Không invent floor 4/6 hoặc tự map floor 0 thành G nếu mapping Phase 06 chưa xác nhận.
2. Kiểm tra cả mở trực tiếp URL floor và điều hướng từ Campus; giữ một runtime/canvas và không reload scene vì popup.
3. Pan, zoom, orbit, resize, đổi vị trí marker gần các mép viewer: card/connector vẫn gắn đúng; popup không lấn panel nghiêm trọng.
4. Thử filter loại thiết bị, `Ceiling`/`Interior`/`Wall` và đổi tầng. `Floor` vẫn hiển thị; filter che marker đang chọn thì selection được đóng đúng.
5. Kiểm tra X, Escape, refresh, keyboard focus và pointer trên chart không tác động camera phía sau.
6. Quan sát network qua ít nhất một lần chọn lại cùng thiết bị: upstream được gọi mới, default range/limit đúng. Không chỉ nhìn React rerender để kết luận đã fetch.
7. Kiểm tra code path và request trace không có DB write của feature. Nếu repo có audit/DB instrumentation sẵn thì dùng; không dựng một hệ thống audit mới chỉ để chứng minh.
8. Chạy lint/typecheck/build theo scripts/lockfile thực tế. Chỉ build/test Unity nếu có thay đổi C#/bridge hoặc cần xác minh sự tích hợp; không khẳng định Unity pass khi chưa chạy.

**Minh chứng UI:** ảnh popup `solar`, `avc`, `nfc` khi có contract/data; ít nhất một ảnh loading/empty/error và một ảnh vị trí sát mép viewer. Nếu dùng fixture, ghi rõ trong tên/caption; không giới thiệu fixture là API live.

**Bắt buộc cho bản sửa 1.2.0:** ảnh hoặc clip click → loading → chart/history; ảnh **empty popup cùng no-data floating toast**; ảnh **error popup cùng error floating toast**; evidence popup dùng anchor dự phòng. Network trace phải có **request history của API ứng dụng** và NestJS dispatch tương ứng, không chỉ GET danh sách tầng 200. Dùng mocks để tạo no-data/API error/timeout, không gây lỗi lên hệ thống IoT để thử. Nếu sửa C#/jslib, ghi rõ WebGL build nào đang được browser nạp.

Không chỉ thử một thiết bị dummy không có dữ liệu rồi kết luận success branch hoạt động. Dùng fixtures cho success, empty và error riêng; kiểm tra toast bằng visual/DOM visibility thực tế, không chỉ kiểm tra mock callback đã chạy.

### 9.3. Definition of Done

- [ ] Contract của cả ba type có nguồn; request và field mapping được ghi rõ trong handoff.
- [ ] Click/chọn lại/refresh fetch mới đúng device + type + 72h + default 1.000.
- [ ] Không còn lỗi response cũ sau đổi selection hoặc floor; không fetch theo frame/camera/metric change.
- [ ] Popup có cấu trúc/visual theo ảnh trang 3, gắn marker và có close/refresh.
- [ ] Đã bỏ overlap cycling và click lọc cụm; marker/row đi qua một selection action; không đổi identity/glyph khi click.
- [ ] Popup mở trước fetch, không gate bởi data/chart/cluster/anchor; thiếu anchor có vị trí dự phòng.
- [ ] No-data kể cả HTTP200 data=[] có floating notification; HTTP/network/timeout/schema error có error toast nhìn thấy.
- [ ] Toast host độc lập với chart/popup/anchor; không bị canvas/overflow che, không lặp toast theo rerender.
- [ ] Chủ động cancel không báo lỗi; timeout có toast; response/callback cũ không tạo popup/toast cho selection mới.
- [ ] Mỗi type hiển thị nội dung đúng payload, unit, timestamp và loại numeric/event.
- [ ] Solar dùng current_uA/lux; AVC là đồng hồ nước và metric pending có badge; NFC enum/identity đúng, không dùng batch_id để dedupe/person mapping.
- [ ] Status không bị giả định; connectivity khác condition; số liệu cũ không mang timestamp mới.
- [ ] NestJS là thành phần duy nhất gọi upstream/giữ bearer; type routing dựa metadata phía server; detail không bị dùng như live-health endpoint.
- [ ] Limit và coverage được phản ánh; không lấy capped count làm tổng hoặc gắn nhãn đủ 72h thiếu căn cứ.
- [ ] Không ghi DB, cache bền vững, browser storage hoặc runtime response dumps.
- [ ] Viewer, Addressables, filters và single-runtime không regression.
- [ ] Các check/build đã chạy có kết quả cụ thể; check chưa chạy ghi `NOT_RUN` kèm lý do.
- [ ] Implementation handoff đủ hướng dẫn chạy, môi trường/config cần có và giới hạn còn lại.

Contract cho cả ba type đã được cung cấp. Nếu môi trường/API live chưa truy cập được, vẫn hoàn thành và bàn giao code/UI với mocked integration; ghi riêng “Implementation theo contract hoàn thành; live verification type X chưa chạy”. Không trình bày fixture tests như xác nhận live end-to-end. Các field hardware pending giữ nhãn là hành vi đúng theo plan, không phải blocker ngăn coding hoàn tất.

## 10. Phase 07G — Tài liệu bàn giao sau implementation

Tạo `phase_07_implementation_handoff.md` trong thư mục docs đang được repo sử dụng; không tự khẳng định một path chưa kiểm tra. Nội dung tối thiểu:

1. Branch/commit hoặc working-tree state, ngày chạy, các file sửa và vai trò.
2. Nguồn đã đọc, bản API handover đã dùng, khác biệt với plan hoặc response thực tế.
3. Bảng mỗi type: method/path, ID mapping, time/limit params, envelope/timestamp, metric/event fields, unit và status nguồn.
4. Quyết định UI: hero/selector theo mục 7, chart/list, status labels, pending badges, latest/coverage semantics; ghi rõ nếu có thay đổi được chủ dự án yêu cầu sau plan.
5. Request/response ví dụ đã làm sạch; sample vs live; không kèm token/secret hoặc toàn bộ lịch sử cá nhân.
6. Luồng selection/refresh và chống race; cách no-store/fresh fetch áp dụng trên integration path thực tế.
7. Xác nhận **không lưu database** bằng phạm vi code đã kiểm tra; nếu chưa quan sát runtime DB thì nói rõ giới hạn.
8. Hướng dẫn chạy bằng lệnh thật từ repo và tên env/config thật; không bịa credential, URL, script hoặc Unity entrypoint.
9. Bảng test T01–T32, kết quả visual/live/build, ảnh minh chứng và các mục `NOT_RUN`.
10. Vấn đề còn mở cụ thể theo type/API; cách disable/revert phần popup/adapters qua thay đổi code thông thường, không reset công việc của người dùng.
11. Phần “Sửa lỗi popup — plan v1.2.0”: root cause **đã chứng minh từ code/runtime**, handler/branch overlap đã bỏ, history URL thực tế, mount/anchor/stacking đã sửa, vị trí notification host và deadline áp dụng. Không dùng giả thuyết từ screenshot làm kết luận.

Không cần thay thế toàn bộ `IoTBackend_API_HandOver.md` trong task này. Nếu phát hiện API cập nhật, ghi bằng chứng và đề xuất sửa đúng mục; không ghi đè bằng một bản thiếu endpoint detail còn tồn tại.

## 11. Gói chỉ dẫn ngắn cho coding agent

> Sửa implementation Small Phase 07 theo bản 1.2.0 này và API handover 22/09/2026. Đọc AGENTS.md/source/handoff trước. Bỏ overlap cycling và nhánh click chỉ mở danh sách lọc cụm; mỗi marker/list row chọn một stable device, mở popup loading ngay trước API. Truy vết toàn luồng click → bridge → selection → shell → history → result, sửa render gate/anchor/stacking và lỗi bị nuốt; không dừng sau khi chỉ xóa overlap. No-data kể cả HTTP200 data=[] và HTTP/network/timeout/schema error bắt buộc có floating notification nhìn thấy từ host độc lập, cùng popup empty/error. Thiếu anchor dùng vị trí card dự phòng; chủ động cancel không có lỗi giả, timeout vẫn phải báo. Chỉ NestJS gọi đúng solar/avc/nfc bằng dev_eui=catalogue.device_id, start/stop ISO inclusive rolling 72h, limit1000; fetch mới mỗi chọn/chọn lại/refresh, không DB. Solar dùng current_uA/lux; AVC dùng flow có badge pending; NFC event list có in/out/card ID. Giữ single Unity runtime/filters/Addressables; không làm Design editor hoặc tự dịch tọa độ. Bàn giao root cause có bằng chứng, ảnh popup + toast và network history trace; console không lỗi hoặc GET catalogue200 không phải tiêu chí hoàn tất.

## 12. Lịch sử cập nhật plan

| Phiên bản | Nội dung |
| --- | --- |
| 1.0.0 — 22/09/2026 | Khung triển khai theo yêu cầu và mockup; lúc đó chưa truy cập được API handover. |
| 1.1.0 — 22/09/2026 | Đọc handover vừa đính kèm; thay trực tiếp các mục contract/mapping bằng 5 GET hiện hành, query ISO inclusive, newest-first, limit default/cap; xác định AVC là đồng hồ nước; chốt default UI theo field thực và nhãn pending; sửa NestJS-only, identity, status/coverage, tests. Bản này dùng độc lập và thay bản 1.0.0. |
| 1.2.0 — 22/09/2026 | Theo phản hồi implementation không có popup: bỏ overlap cycling và click lọc cụm; popup mở trước API và có anchor fallback; bắt buộc floating no-data/error notification, deadline/cancel distinction, diagnostics và visual/network acceptance. Đã tích hợp vào các mục hiện hành; file này thay toàn bộ các bản plan trước. |
