---
document_id: GIS-UIT-SMALL-PHASE-05-PLAN
version: "1.0.0"
created_on: "2026-09-19"
language: vi
project: GIS - UIT Building E Digital Twin
phase: Small Phase 05
title: Make Filter for object in Unity and display through web
status: ready_for_implementation_handoff
implementation_performed_in_this_document: false
repository_inspected_for_this_plan: false
database_changes: none
---

# Small Phase 05 — Bộ lọc tầng và sơ đồ vị trí tầng

## 1. Mục tiêu và chỉ dẫn bắt đầu

Triển khai panel bên trái trang **Detailed Floor** để người dùng bật/tắt độc lập các nhóm object `Ceilling`, `Interior`, `Wall` trong prefab tầng đang xem. Web điều khiển Unity qua bridge hiện hữu; Unity gọi `GameObject.SetActive(true/false)` trên object có tag tương ứng. Sàn luôn được giữ hiển thị khi mô hình tầng đang hoạt động.

Panel có thêm dropdown chọn nhiều loại cảm biến và hình khối isometric chia lớp để chỉ vị trí tầng hiện tại trong tòa nhà. Phần dropdown **Lớp hiển thị** chỉ để comment `//dropdownfilter visual layer` trong source, chưa triển khai giao diện hoặc logic.

Agent nhận bàn giao bắt đầu từ **05A**, kiểm tra repository hiện tại rồi làm lần lượt các phần chưa có. Được sửa `web/`, `UnityContent/` và backend khi thật sự cần. **Không thay schema, migration, seed hoặc dữ liệu PostgreSQL cho phase này.** Mặc định triển khai chỉ cần web và Unity; không tạo backend endpoint để lưu toggle.

Đây là **phạm vi Small Phase 05 mới do chủ dự án giao**, thay cho mục tiêu tích hợp IoT từng được đề xuất rồi hoãn vì chưa có API/sample/schema. Việc hoãn tích hợp IoT thật vẫn giữ nguyên; không dùng nó để chặn phần filter và floor locator.

## 2. Nguồn và mức độ kiểm chứng

| Nguồn | Phiên bản/ngày | Đã đọc được? | Vai trò | Giới hạn |
| --- | --- | --- | --- | --- |
| Yêu cầu trực tiếp trong phiên này | 19/09/2026 | Có, toàn bộ | Phạm vi Small Phase 05 và quyền sửa module | Là yêu cầu; chưa chứng minh trạng thái code hoặc tag trong prefab |
| Ảnh mockup đính kèm, vùng sidebar được khoanh đỏ | Phiên hiện tại | Có, xem trực tiếp | Vị trí filter và khối isometric | Không lấy số liệu, nhóm cảm biến hoặc chức năng cũ trong ảnh làm yêu cầu mới |
| `Project_KnowledgeBase(1).md` | v1.0.0, tổng hợp 16/09/2026 | Có, các mục liên quan 0, 2, 3, 6, 10–12 và danh mục mục | Kiến trúc viewer, route, prefab, nguồn dữ liệu và giới hạn | Source map/implementation trong KB chưa được đối chiếu repo; trạng thái trước Phase 04 có thể đã cũ |
| `EBuilding_UIT_BEIVN.pdf` | Proposal, 8 trang | Đã xem trực tiếp trang 3; trích được text timeline trang 8 | Tham chiếu bố cục Detailed Floor | Không coi toàn bộ PDF đã được thẩm định; “12 tầng” không thay canonical floor IDs |
| `Bao_cao_nhanh_Digital_Twin_Toa_E_2026-09-08.docx` | Cuộc họp 08/09/2026 | Có, nội dung đoạn văn và bảng | Unity + Next.js, tầng trọng điểm 4/6, ranh giới công việc | Báo cáo lịch sử, không phải nghiệm thu code hiện tại |
| `GIS_UIT_Bao_cao_ket_qua_hop_IoT_v2(1).docx` | Bản v2, không tự suy ngày họp | Có, nội dung đoạn văn và bảng | Đúng 5 nhóm thiết bị; PostgreSQL; capability IoT | Không có contract API/payload thật |
| Trao đổi dự án về Small Phase 04 | 17/09/2026 | Có, ngữ cảnh lịch sử được truy xuất | Chủ dự án đã báo hoàn thành Phase 04; tiếp tục từ baseline đó | Chưa trực tiếp đọc output/walkthrough hoặc chạy lại test; không tái sử dụng kết quả PASS cũ |
| `phase_04_backend_postgresql_device_positions_plan.md` và walkthrough Phase 04 | Được nhắc trong lịch sử | Chưa có file gốc trong phiên lập plan | Agent phải tìm và đối chiếu baseline backend/vị trí thiết bị | Tên walkthrough và source code thực tế chưa xác minh |
| `AGENTS.md`, `GIS_NEW_AGENT_HANDOFF.md`, `GIS_PROJECT_SOURCE.md`, `phase_03_floor_prefab_loading_plan.md` | Các bản repo hiện hành cần tìm | Chưa đọc file gốc trong phiên này | Hướng dẫn triển khai và ràng buộc repo | Một số nội dung chỉ được KB dẫn lại |
| Repository, scene, prefab `Floor_E_6`, WebGL build, DB/API đang chạy | Chưa được cung cấp | Chưa kiểm tra | Bằng chứng bắt buộc khi triển khai/nghiệm thu | Không được ghi đã compile, load prefab hay test browser từ bản kế hoạch này |

Ưu tiên yêu cầu mới nhất của chủ dự án cho cùng chủ đề. Code dùng để xác định hiện trạng và nơi sửa; code cũ không tự thay đổi yêu cầu. Trong báo cáo triển khai, phân biệt `PASS`, `FAIL`, `NOT RUN`, `BLOCKED` và `DEFERRED`.

## 3. Phạm vi chức năng

### 3.1. Những phần phải có

| ID | Kết quả cần triển khai | Quy tắc |
| --- | --- | --- |
| R05-01 | Panel bên trái Detailed Floor | Bám bố cục trang 3; giữ canvas 3D, breadcrumb và điều hướng tầng hiện hữu |
| R05-02 | Dropdown **Loại cảm biến** | Chọn nhiều mục bằng checkbox/switch; đúng 5 nhóm tại mục 4.2 |
| R05-03 | Dropdown **Object trong tầng** | Ba toggle `Ceilling`, `Interior`, `Wall`, hoạt động độc lập |
| R05-04 | Object thay đổi thực trong Unity | Áp dụng `SetActive` lên object có tag, trong đúng instance tầng đang xem |
| R05-05 | Sàn luôn hiển thị | Không có toggle `Floor`; không tắt sàn qua object cha |
| R05-06 | Chừa chỗ trong source cho visual layer | Chỉ comment `//dropdownfilter visual layer`, không render dropdown |
| R05-07 | Visual **Vị trí tầng trong tòa nhà** | Khối isometric chia N lớp theo catalog tầng, highlight tầng trong URL |
| R05-08 | Đồng bộ lifecycle | Toggle nhanh, load/retry/chuyển tầng, Back/Forward không áp state vào content cũ |
| R05-09 | Hoạt động khi chưa có API IoT thật | Object filter và locator độc lập API; sensor filter có logic, adapter và kiểm chứng bằng fixture nếu cần |

### 3.2. Ngoài phạm vi

- Không sửa khối PostgreSQL, tạo bảng preference, migration, seed, hoặc ghi toggle vào DB.
- Không tích hợp mới API IoT live, webhook, stream camera, báo cáo cảm biến, cảnh báo hoặc dashboard.
- Không triển khai dropdown visual layer như “Cảm biến”, “HVAC”, “Cửa ra vào”, “Đèn chiếu sáng” trong mockup.
- Không triển khai runtime floor editor, thay kiến trúc prefab bằng document/JSON hoặc tạo pipeline geometry mới.
- Không thêm Unity runtime/canvas cho khối isometric; không nâng phiên bản framework hoặc cài thư viện 3D chỉ để làm hình này.
- Không làm mới toàn bộ giao diện Detailed Floor, camera controller hoặc thiết kế điều hướng.
- Không công bố deployment hoặc thay môi trường production chỉ để nghiệm thu local.

## 4. Quyết định hành vi để agent triển khai

Các lựa chọn như mặc định bật, giữ state theo tòa trong phiên và dùng SVG là **quyết định thiết kế của kế hoạch** để lấp các chi tiết chưa được người dùng chỉ định. Đây không phải mô tả implementation đã tồn tại. Agent có thể dùng abstraction tương đương của repo nhưng phải giữ hành vi dưới đây.

### 4.1. Ba toggle object

| Nhãn UI | Khóa state nội bộ đề xuất | Unity tag chính xác | Mặc định |
| --- | --- | --- | --- |
| Ceilling | `ceilling` | `Ceilling` | `true` |
| Interior | `interior` | `Interior` | `true` |
| Wall | `wall` | `Wall` | `true` |

**Giữ nguyên cách viết `Ceilling`.** Không tự đổi thành `Ceiling`, lowercase tag, hoặc rename hàng loạt asset. Nếu repo thực tế dùng tên khác, ghi rõ khác biệt, giữ khóa nghiệp vụ và thêm mapping tập trung hoặc sửa gán tag đúng phạm vi. Không suy tag theo tên object hoặc material.

- Dropdown là vùng mở/thu gọn chứa ba lựa chọn độc lập, không dùng select một lựa chọn/radio.
- Tắt một loại chỉ ảnh hưởng loại đó. Bật lại khôi phục các target của loại đó kể cả khi chúng đang inactive.
- `true/false` là trạng thái tuyệt đối; không dùng lệnh “đảo trạng thái” vì gửi lại lệnh sẽ gây sai lệch.
- Không thêm `floor` vào schema bộ lọc. Với mô hình tầng đã load và đang hiển thị, sàn phải giữ active dù cả ba toggle tắt.
- Object không thuộc ba tag không bị chỉnh `activeSelf`. Child trong một nhóm thuần loại có thể ẩn theo parent của nhóm; nhóm đó không được chứa sàn, marker hoặc loại khác.
- Loại không có object ở tầng hiện tại vẫn giữ giá trị chọn; thao tác là no-op hợp lệ. Chỉ hiển thị số lượng 0 nếu đã thực sự kiểm kê; không suy từ lỗi tải model.

### 4.2. Dropdown loại cảm biến

| Nhãn hiển thị | Khóa nội bộ đề xuất | Ý nghĩa |
| --- | --- | --- |
| Đồng hồ nước | `waterMeter` | Nhóm đồng hồ nước |
| Cảm biến nhiệt độ/độ ẩm | `temperatureHumidity` | Nhóm cảm biến nhiệt độ/độ ẩm độc lập |
| Smart Building (VOC, nhiệt độ/độ ẩm, áp suất không khí) | `smartBuilding` | Giữ nguyên một nhóm theo yêu cầu |
| RF UHF đọc thẻ | `rfUhfReader` | Nhóm thiết bị đọc thẻ |
| Camera | `camera` | Thiết bị camera; không phải camera điều khiển Unity |

Đây là **khóa UI nội bộ**, không phải enum đã thống nhất với team IoT. Tái sử dụng enum hiện hữu nếu có và phù hợp; mapping phải nằm ở một adapter rõ ràng.

- Mặc định cả năm mục bật; có thể bật nhiều mục hoặc tắt tất cả. Không tách riêng nhiệt độ, độ ẩm, VOC hay áp suất thành filter mới.
- Lọc theo **nhóm thiết bị**, không theo trạng thái online/offline hoặc metric đang trả về. Smart Building có nhiệt độ vẫn thuộc `smartBuilding`, không tự đổi sang nhóm nhiệt độ/độ ẩm.
- Áp cùng predicate vào marker và danh sách thiết bị đang có trên trang, nếu cả hai được render. Chỉ tác động lớp hiển thị; không xóa binding, tọa độ gốc hoặc custom position.
- Dùng cơ chế marker hiện hữu. Nếu marker render trong Unity, chuyển state qua bridge; nếu marker là overlay web, áp predicate tại renderer web. Không tạo thêm hệ thống marker song song.
- Marker bị lọc phải mất hit target/raycast. Nếu popup của marker đó đang mở, đóng popup theo cơ chế hiện tại để không còn thông tin của một lựa chọn đã bị ẩn.
- Tắt `Wall`/`Interior`/`Ceilling` không tắt marker cảm biến. Tắt filter cảm biến không ảnh hưởng geometry cùng loại hoặc camera Unity.
- Không gọi lại API chỉ vì click filter; lọc trên dữ liệu đã tải. Thiết bị được nạp/refresh sau đó phải nhận state hiện hành ngay.
- Chưa có dữ liệu: vẫn render dropdown và ghi “Chưa có dữ liệu thiết bị”; không dựng marker hoặc telemetry giả trong chế độ bình thường.
- Chưa có renderer/nguồn thiết bị: hoàn thành state, predicate và điểm nối vào lifecycle; dùng fixture test/dev tách biệt để chứng minh lọc. Ghi rõ live integration chưa kiểm chứng, không biến dropdown thành UI không có logic.
- Loại chưa mapping: không đoán từ tên hiển thị. Quy tắc tối thiểu: hiển thị khi cả năm filter đều bật; ẩn khi người dùng đã chọn một tập con hoặc tắt tất cả. Ghi diagnostic cho developer; chưa thêm mục thứ sáu trên UI.

### 4.3. State và vòng đời phiên

| Tình huống | Hành vi |
| --- | --- |
| Lần đầu mở viewer | 3 object filter và 5 sensor filter đều bật |
| Chuyển tầng trong cùng tòa | Giữ lựa chọn; áp lại lên instance/marker của tầng mới |
| Về Campus rồi mở lại tầng cùng tòa trong cùng phiên viewer | Giữ lựa chọn nếu provider viewer còn sống; không áp filter lên Campus |
| Back/Forward giữa tầng | Lấy tầng từ URL; giữ preference trong phiên, không phục hồi lịch sử toggle riêng từng URL |
| Chuyển sang tòa khác | State riêng theo `buildingId`; tòa chưa có state dùng mặc định |
| Reload tab/mở phiên viewer mới | Reset về mặc định; không cần localStorage hoặc DB |
| Content đang loading | Cho thay đổi lựa chọn, chỉ lưu ý định mới nhất; không tác động mô hình cũ |
| Content ready | Gửi snapshot mới nhất đúng request/content; nhận kết quả áp dụng |
| Unavailable/error | Giữ lựa chọn; hiển thị trạng thái content theo viewer hiện tại; không giả báo đã áp lên model |
| Retry | Sau ready của lần retry, áp lại snapshot dù floorId không đổi |

Web là nguồn chuẩn của **lựa chọn filter**. Unity sở hữu **việc áp dụng trên object**. URL vẫn là nguồn chuẩn của **tòa/tầng**, không đưa filter vào query string trong phase này.

### 4.4. Bố cục sidebar và visual layer

Thứ tự từ trên xuống: **Loại cảm biến → Object trong tầng → vị trí comment visual layer → Vị trí tầng trong tòa nhà**. Hai dropdown đầu dùng cùng pattern mở/thu gọn, mặc định mở để dễ thấy các lựa chọn. Giữ style navy/chữ sáng/active xanh theo UI thực tế.

Tại vị trí visual layer trong TSX, có thể dùng:

```tsx
{/* //dropdownfilter visual layer */}
```

Không hiển thị dòng code này cho người dùng. Không render tiêu đề, dropdown rỗng, nút disabled hoặc xử lý visual layer ở Unity/backend.

Sidebar cần cuộn khi thấp; label Smart Building được wrap; tab focus và keyboard toggle hoạt động. Dùng native checkbox hoặc component accessible hiện hữu. `aria-expanded` phản ánh trạng thái dropdown. Click/drag/wheel trong sidebar không truyền sang camera Unity; vùng 3D còn lại vẫn nhận input bình thường. Ở viewport hẹp, dùng pattern thu gọn của website, không che hết model hoặc nút điều hướng tầng.

## 5. Kiến trúc và các ràng buộc phải giữ

### 5.1. Baseline dự án

- Một outer repository; `UnityContent/`, `web/`, backend theo cấu trúc Phase 04 hiện có.
- C# đặt trong `UnityContent/Assets/Script/` số ít; không tạo cây `Assets/Scripts/` cạnh tranh.
- Một Unity runtime, một `useUnityContext`, một canvas; giữ `Campus`, `FloorDetail`, Orbit Map Camera.
- `AppBootstrap` vẫn là owner `DontDestroyOnLoad` duy nhất; filter controller không tự thêm singleton persistent mới.
- Route canonical theo KB: `/viewer/campus`, `/viewer/buildings/E/floors/:floorId`; floor IDs chuỗi `G`, `1`…`12`.
- Tiếp tục loader prepared prefab/remote Addressables; giữ GUID, `.meta`, frame tọa độ và lifetime handle.
- Phân biệt route/scene đã nhận với prefab đã sẵn sàng. Theo KB, `ViewerStateChanged` không thay cho `FloorContentStateChanged(status="ready")`; kiểm tra contract thật trước khi nối.
- Giữ cơ chế original/custom device position của Phase 04; visibility không ghi tọa độ hoặc đổi coordinate frame.

### 5.2. Trách nhiệm từng module

| Module | Trách nhiệm trong phase |
| --- | --- |
| Web | Sidebar, state trong phiên, kiểm tra payload, bridge sender/listener, sensor predicate cho phần web, SVG floor locator |
| Unity | Kiểm kê tag trong floor instance, validate hierarchy, áp SetActive, cleanup references, lọc marker Unity nếu đang có |
| Backend NestJS | Mặc định không đổi; chỉ điều chỉnh adapter/DTO nếu code hiện hữu cần để phơi bày trường loại thiết bị đã có |
| PostgreSQL | Không đổi schema/migration/seed/data; không lưu filter preference |
| IoT backend của team khác | Không sửa hoặc giả lập thành contract thật |

Nếu thiếu loại thiết bị và không thể suy từ nguồn được xác nhận, dùng adapter nullable và fixture; không tạo cột DB để hoàn thành filter. Mọi thay đổi backend phải nêu rõ lý do và giữ API tương thích.

## 6. Thiết kế Unity

### 6.1. Kiểm kê theo instance tầng

Tên component dưới đây là đề xuất; tái sử dụng component phù hợp trong source nếu đã có.

1. Khi loader đã instantiate đúng prefab và xác minh identity, bind một `FloorObjectFilterController` vào instance đó. Đặt controller ngoài các nhánh bị toggle.
2. Duyệt descendants thuộc model/geometry của instance, **bao gồm inactive**; bỏ chính wrapper root và các subtree hệ thống/marker đã nhận diện.
3. Đưa object có tag chính xác vào ba bucket, mỗi target xuất hiện một lần. Dùng reference cache; không tìm toàn scene hoặc quét mỗi frame/mỗi toggle.
4. Kiểm tra cấu trúc theo mục 6.2 trước khi nhận state là áp dụng thành công.
5. Khi ready, áp state mới nhất và xác nhận qua bridge. Những lần toggle sau chỉ duyệt bucket cần cập nhật; tránh gọi `SetActive` nếu `activeSelf` đã đúng.
6. Khi unload/replace, clear cache và event subscription của instance cũ; không giữ references sang prefab đã release/destroy.

Có thể dùng `GetComponentsInChildren<Transform>(includeInactive: true)` trên root đã được giới hạn. API này cho phép đưa child inactive vào kết quả; vì vậy target đã bị tắt vẫn có thể được tìm và bật lại. [Unity GetComponentsInChildren](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Component.GetComponentsInChildren.html)

Không dùng `FindGameObjectsWithTag` toàn scene làm cơ chế chính. Không dùng `Renderer.enabled`, alpha material hoặc camera culling mask để thay yêu cầu `SetActive`.

### 6.2. Bảo đảm ba loại độc lập và giữ sàn

`SetActive` thay `activeSelf`; object con vẫn không active trong hierarchy nếu parent inactive. Nó còn vô hiệu hóa component và coroutine trên object bị tắt. Vì vậy chỉ set child thành `true` không đủ để sửa một hierarchy lẫn nhóm. [Unity SetActive](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/GameObject.SetActive.html)

**Validator cần phát hiện:**

- Target `Wall` chứa descendant `Interior` hoặc `Ceilling`, và mọi tổ hợp khác loại tương tự.
- Target nằm dưới ancestor inactive không thuộc quyền điều khiển của filter, khiến ON vẫn không hiển thị.
- Target là wrapper/content/geometry root chứa cả sàn, hoặc ancestor của sàn.
- Target chứa marker cảm biến, bridge, camera, manager, metadata/lifecycle controller hoặc logic cần luôn chạy.
- Một mesh gộp cả sàn và tường nhưng được tag `Wall`; không thể giữ sàn nếu tắt toàn GameObject.
- Tag thiếu, khác chữ hoa/thường, `Ceiling` khác `Ceilling`, hoặc mapping prefab không đúng floorId.

Sàn được xác định qua metadata/reference/hierarchy prefab đã kiểm tra, không giả định chỉ cần bỏ tag `Floor` khỏi vòng lặp là an toàn. Các ancestor cần thiết của sàn cũng phải luôn hoạt động.

**Cách xử lý:** ưu tiên gán tag đúng target thuần một loại; nếu cần, chỉnh hierarchy nhỏ trong prefab bằng Unity Editor/asset API, giữ world transform, reference và GUID. Không tự reparent hàng loạt lúc runtime. Trường hợp geometry gộp không tách an toàn, báo chính xác asset bị block và phần cần artist xử lý; tiếp tục phần không bị block, không báo filter độc lập đã PASS.

Runtime cần từ chối disable target không an toàn và trả lỗi có kiểm soát. Không cố chữa bằng việc ép toàn bộ descendant hoặc parent active vì sẽ bật nhóm khác/đối tượng không liên quan. Object sàn không bị filter thay đổi; baseline prefab phải có sàn active.

Việc `FloorDetail` bị unload khi về Campus là vòng đời bình thường, không vi phạm “Floor không bao giờ bị bật/tắt”: yêu cầu đó áp dụng cho **bộ lọc trong tầng đang xem**, không buộc giữ model mọi tầng mãi trong bộ nhớ.

### 6.3. Loader, camera và marker

- Bind sau instantiate đúng instance; không chỉ làm trong `Start()` của scene vì đổi tầng có thể không reload scene.
- Tái dùng quy tắc request mới nhất và cleanup handle của loader; không thêm load prefab khi click filter.
- Không thay transform, frameId, origin, basis, calibration hoặc bounds chuẩn của floor để lọc.
- Camera không tự fit/nhảy lại mỗi lần tắt trần/tường. Dùng bounds/frame ổn định hiện có cho floor.
- Marker root không nằm dưới geometry group bị tắt. Nếu đang nằm dưới đó, tách ownership bằng thay đổi nhỏ, bảo toàn tọa độ world/local theo frame hiện tại và kiểm tra lại vị trí.
- Visibility của marker là kết hợp filter loại với điều kiện sẵn có như thuộc tầng hiện tại, còn tồn tại, chưa bị ẩn bởi lifecycle. Bật filter không được “hồi sinh” marker của tầng cũ hoặc thiết bị đã bị loại bỏ.
- Nếu có pooling, marker mới/reused nhận filter trước khi hiển thị. Không lưu visibility vào asset prefab.

## 7. Hợp đồng web và Unity

### 7.1. Nguyên tắc tích hợp

Đọc contract TypeScript/C#/jslib hiện tại trước khi thêm command. Dùng bridge/runtime sẵn có; không tạo event bus hay transport thứ hai. Tên dưới đây là **đề xuất mới**, không phải tên đã có trong repo.

Đề xuất command `ApplyFloorFilters` nhận JSON snapshot và event `FloorFiltersApplied` trả kết quả. Gửi tới bridge receiver hiện hữu; chỉ dùng `_InitManager` nếu đúng receiver trong source. Dùng DTO dễ serialize trong Unity hiện tại, ưu tiên field cố định cho các boolean; không mặc định serializer hỗ trợ dictionary.

Ví dụ snapshot dành cho tầng 6:

```json
{
  "schemaVersion": 1,
  "routeRequestId": "viewer-session-1:23",
  "buildingId": "E",
  "floorId": "6",
  "filterRevision": 4,
  "objects": {
    "ceilling": false,
    "interior": true,
    "wall": false
  },
  "sensors": {
    "waterMeter": true,
    "temperatureHumidity": true,
    "smartBuilding": false,
    "rfUhfReader": true,
    "camera": true
  }
}
```

`schemaVersion: 1` là version của message mới trong ví dụ, không phải chỉ thị reset global bridge version. `routeRequestId` dùng đúng token tương ứng ready của content hiện tại. Nếu repo đã có tên/generation token khác, tái sử dụng tương đương và ghi mapping trong handoff.

| Trường/quy tắc | Mục đích |
| --- | --- |
| `buildingId`, `floorId` | Không áp vào sai tầng; giữ canonical ID, không đổi `6` thành `06` |
| `routeRequestId` | Phân biệt các lần load/retry/A→B→A dù cùng floorId |
| `filterRevision` | Số tăng trong phiên viewer; phân biệt snapshot mới/cũ trong cùng content request |
| Full snapshot | Tất cả boolean luôn có mặt; thao tác gửi lại idempotent |
| Validation | Kiểm tra JSON, version, required keys, boolean, identity, revision trước mutation; từ chối payload sai thay vì coercion |
| Không có field `floor` | Không cho điều khiển sàn qua payload |

Event kết quả cần echo identity/token/revision, `status` tối thiểu `applied` hoặc `rejected`, cùng `errorCode` khi bị từ chối. Có thể dùng error channel hiện hữu thay event rejected riêng. Count target/capability marker là diagnostic tùy nhu cầu, không tự tạo số đếm cho UI.

Nếu marker nằm hoàn toàn trên web, Unity chỉ thực thi `objects`; ghi rõ phần `sensors` do web chịu trách nhiệm. Nếu marker Unity chưa có, không trả kết quả khiến web hiểu là đã kiểm chứng sensor renderer. Handoff phải ghi capability thực tế và nơi áp predicate.

### 7.2. Đồng bộ và chống state cũ

1. Provider viewer giữ desired state theo tòa, tách khỏi lifecycle của page tầng. Toggle cập nhật state và tăng revision; không cần round trip backend.
2. Trong khi chưa có ready khớp route, chỉ giữ snapshot mới nhất ở web. Không gửi lên floor cũ; không tích lũy hàng đợi các click.
3. Khi nhận ready hợp lệ, gửi snapshot đầy đủ tới content instance đó. Scene ack đơn thuần không đủ.
4. Unity chỉ nhận snapshot khớp active content request. Revision nhỏ hơn bản đã áp trong cùng request bị bỏ; bản lặp lại cùng revision/payload trả ack mà không đảo state.
5. Mỗi instance/request mới reset mốc revision phía Unity, kể cả cùng floorId. Nếu token hiện tại không phân biệt instance/retry, bổ sung generation tại boundary loader và bridge trước khi dùng.
6. Web chỉ nhận ack khớp token và revision mới nhất. Ack muộn không được kéo checkbox về state cũ hoặc đánh dấu snapshot mới đã áp.
7. Khi content ready lại, runtime khôi phục hoặc explicit retry, gửi lại snapshot mới nhất. Dùng retry bounded của bridge hiện hữu nếu cần; không resend vô hạn.
8. Khi rời tầng/Campus, invalidate pending command của request đó; clear listener/controller khi unmount/unload theo owner hiện tại.

Khi gửi nhưng chưa có ack, UI có thể thể hiện “Đang áp dụng bộ lọc”. Lỗi bridge chỉ ảnh hưởng phần tương ứng và có hướng thử lại; không reboot Unity hoặc reset toàn bộ lựa chọn.

## 8. Sơ đồ vị trí tầng trong tòa nhà

### 8.1. Dữ liệu và thứ tự ưu tiên

1. **Ưu tiên catalog tòa/tầng của web đang phục vụ điều hướng.** Theo KB, kiểm tra ứng viên `web/src/config/buildings.ts`; không giả định file này còn nguyên.
2. Nếu catalog chuẩn chỉ nằm ở Unity, dùng metadata/registry hoặc bridge metadata hiện hữu để đưa danh sách nhẹ sang web. Không đưa geometry qua bridge.
3. Không thêm query DB hoặc endpoint mới chỉ để biết số tầng. Nếu repo có nguồn metadata khác, ghi rõ nguồn cuối cùng và tránh tạo danh sách song song không đồng bộ.

Input tối thiểu: `buildingId`, danh sách `{floorId, label, order}` và `selectedFloorId` từ route. Phân biệt **tầng tồn tại trong catalog** với **tầng đã có prefab**; N là số tầng của tòa trong catalog, không phải số prefab đang có.

Theo baseline KB, E có `G`, `1`…`12`: nếu repo vẫn dùng danh sách đó, sơ đồ phải có **13 lớp**, với `G` dưới cùng và `12` trên cùng. Không hardcode 12 lớp từ tiêu đề proposal; cũng không hardcode 13 nếu catalog đã được cập nhật có căn cứ. Không sort floor ID dạng chuỗi khiến `10` nằm dưới `2`.

### 8.2. Cách vẽ đề xuất

- Dùng component SVG nhẹ trong web để vẽ khối hộp/cube isometric, có mặt trên và hai mặt bên, chia N lớp bằng nhau theo chiều cao. Không cần đúng kích thước hình học thực tế.
- Nét grid xanh xám mờ, mặt nền tối; layer đang xem được tô xanh/cyan xuyên hai mặt bên và có nhãn “Tầng 6”, “Tầng G”… theo route.
- Vẽ theo thứ tự lớp phù hợp để mặt che khuất không phủ mất highlight. ViewBox co giãn trong sidebar; không cần shader, texture, animation hay thư viện 3D.
- Chức năng phase này là **chỉ báo vị trí**, không tạo bộ điều hướng click mới. Giữ panel điều hướng tầng hiện có.
- URL đổi thì highlight đổi theo URL, kể cả tầng chưa có prefab; trạng thái “Chưa có mô hình” vẫn được viewer trình bày riêng.
- Catalog rỗng: hiện trạng thái thiếu danh sách tầng, không chia cho 0 hoặc dựng số tầng tùy ý. ID không thuộc catalog: xử lý route invalid theo hệ thống và không highlight tầng gần nhất.
- Có text/accessible label cho tầng hiện tại; không chỉ dựa vào màu.

## 9. Kế hoạch triển khai 05A–05G

### 05A — Kiểm tra baseline và điểm tích hợp

**Đầu vào:** repository hiện tại, local instructions và các handoff có thể tìm được.

- [ ] Đọc `AGENTS.md` đúng phạm vi; ghi branch, HEAD và working tree, bảo toàn thay đổi có sẵn.
- [ ] Tìm plan/walkthrough Small Phase 04 và bản mới nhất của loader/bridge; không dùng trạng thái “chưa có DB” của KB 16/09 để dựng lại Phase 04.
- [ ] Xác định Detailed Floor sidebar/shell, state provider, runtime, route synchronizer, event validator, catalog tầng.
- [ ] Xác định loader, content ready/unload, content/geometry root, marker renderer và nơi map loại thiết bị.
- [ ] Mở prefab thực, bắt đầu với `Floor_E_6` nếu tồn tại; kiểm kê tag và hierarchy, kiểm tra thêm tầng 4 nếu có content.
- [ ] Kiểm tra `TagManager.asset`, floor registry/identity, target counts và sàn/marker có bị nằm dưới nhóm toggle không.
- [ ] Chạy baseline check phù hợp theo scripts repo; ghi lỗi có sẵn và hạn chế môi trường.

Lệnh dò tìm tham khảo, chạy tại root repo thực; điều chỉnh path theo source:

```bash
git status --short
git rev-parse --show-toplevel
git rev-parse HEAD
rg --files -g AGENTS.md -g '*phase_04*' -g '*handoff*' -g '*walkthrough*'
rg --files -g package.json -g '*lock*' -g ProjectVersion.txt -g manifest.json
rg -n 'ApplyViewerRoute|FloorContentStateChanged|ViewerStateChanged|requestId' web/src UnityContent/Assets/Script
rg -n 'FloorContentLoader|FloorContentRegistry|FloorContentMetadata' UnityContent/Assets/Script
rg -n 'Ceilling|Ceiling|Interior|Wall' UnityContent/ProjectSettings/TagManager.asset
rg --files UnityContent/Assets -g '*Floor*6*.prefab' -g '*Floor*4*.prefab'
rg -n 'deviceType|sensorType|device_bindings|device_display_overrides' web
```

Các path/tên trong lệnh là hướng tìm từ handoff, không phải file đã được xác nhận. YAML/tag search chỉ hỗ trợ kiểm kê; chưa thay thế mở prefab/instance thật để kiểm tra hierarchy và active state.

**Điều kiện xong:** có bảng đường dẫn thực tế, contract đang dùng, catalog tầng và rủi ro prefab. Thiếu API IoT không block các phần không phụ thuộc API. Không cần xin xác nhận lại các quyết định đã rõ trong plan.

### 05B — Unity object filter và kiểm tra prefab

- [ ] Tạo/reuse controller, mapping tập trung ba tag, registry target gồm inactive.
- [ ] Validator phát hiện các xung đột mục 6.2; sửa authoring nhỏ nếu làm an toàn.
- [ ] Bind/unbind theo instance lifetime; bảo vệ sàn và subtree hệ thống/marker.
- [ ] Áp full snapshot boolean bằng SetActive; không mutate prefab asset ở runtime.
- [ ] Kiểm tra cả tám tổ hợp, OFF→ON lặp lại và một tag vắng mặt.
- [ ] Chứng minh floor transform/frame/camera không đổi do filter.

**Điều kiện xong:** filter hoạt động trên prefab thật ở Unity; không chỉ pass trên ba cube mẫu. Fixture được dùng để kiểm tra lỗi/hierarchy đặc biệt khi asset thật không có tình huống đó.

### 05C — Bridge và lifecycle state

- [ ] Bổ sung type/DTO/validator cùng contract mới theo mục 7.
- [ ] Sender gửi snapshot khi content ready và khi toggle sau ready; pending chỉ giữ bản mới nhất.
- [ ] Correlate route request/generation và filter revision ở cả hai phía.
- [ ] Ack/reject phản ánh đúng kết quả; không phá các event cũ.
- [ ] Kiểm tra toggle nhanh, stale ack, đổi tầng A→B→A, retry cùng floor và quay Campus lúc load.

**Điều kiện xong:** thao tác từ web làm thay đổi đúng instance Unity và không có state cũ ghi đè.

### 05D — Sidebar và filter cảm biến

- [ ] Gắn sidebar tại Detailed Floor; hai dropdown multi-select với đúng nhãn.
- [ ] State mặc định/persistence trong phiên theo mục 4.3; không ghi DB.
- [ ] Dropdown object gọi flow 05C, không chỉ cập nhật UI.
- [ ] Sensor predicate + mapping adapter; nối vào renderer/data flow đang có.
- [ ] Tạo fixture test/dev cho năm loại khi chưa có dữ liệu; fixture không chạy mặc định hoặc seed vào DB.
- [ ] Marker mới nhận state hiện hành; hidden marker không click được; popup được xử lý.
- [ ] Thêm đúng comment visual layer; không có implementation tương ứng.
- [ ] Keyboard, focus, label dài, cuộn sidebar và chặn input sang camera hoạt động.

**Điều kiện xong:** hai dropdown có logic thực; status chưa có dữ liệu rõ ràng; không có số liệu IoT giả trong giao diện bình thường.

### 05E — SVG floor locator

- [ ] Dùng cùng nguồn catalog với điều hướng; giữ canonical IDs và thứ tự tầng.
- [ ] Vẽ N lớp và highlight theo route; có label tầng hiện tại.
- [ ] Kiểm tra tầng thấp nhất/cao nhất, tầng giữa, tầng chưa có model, catalog rỗng.
- [ ] Layout bám vùng dưới sidebar của mockup và co giãn ổn định.

**Điều kiện xong:** số lớp và highlight đúng catalog thật; không cần DB, Unity scene/camera hoặc canvas bổ sung.

### 05F — Build và nghiệm thu tích hợp

- [ ] Chạy typecheck/lint/build của module đã sửa theo package scripts thực tế; không tự ghi lệnh không có trong repo là đã PASS.
- [ ] Chạy Unity compile và test có ý nghĩa cho hierarchy/lifecycle; xác minh tag serialization.
- [ ] Build WebGL player mới cho thay đổi C#/jslib. Nếu prefab/Addressables thay đổi, build content tương thích và cập nhật release/catalog theo pipeline hiện hữu.
- [ ] Không chỉ sửa source C# rồi dùng player cũ để chứng minh feature chạy trên web.
- [ ] Smoke test trang thật ở browser với artifact mới, deep link, chuyển tầng và cả tám tổ hợp object.
- [ ] Kiểm tra asset URLs/headers/release tương thích nếu build output thay đổi; không ghi đè nội dung mới vào release immutable đã công bố.
- [ ] Kiểm tra regression Phase 04 liên quan marker/custom position nếu subsystem đó có sẵn; không mở rộng sang toàn bộ IoT live.
- [ ] Điền matrix mục 11 bằng kết quả thực và bằng chứng.

**Điều kiện xong:** có bằng chứng end-to-end web→Unity trên bản build mới. Nếu không có Unity Editor/WebGL module/browser phù hợp, ghi `NOT RUN`/`BLOCKED`; không nghiệm thu trọn phase chỉ từ code review.

### 05G — Bàn giao implementation

- [ ] Tạo `phase_05_implementation_handoff.md` trong thư mục tài liệu đúng quy ước repo.
- [ ] Ghi files changed, contract cuối cùng, nơi giữ state, catalog source và cách map sensor type.
- [ ] Ghi tag/hierarchy đã kiểm tra, asset đã sửa, model thực dùng để nghiệm thu và release build.
- [ ] Ghi hướng chạy/test trên macOS theo tool/version thực tế của repo; không yêu cầu dựng lại DB cho object filter.
- [ ] Ghi PASS/FAIL/NOT RUN/BLOCKED, ảnh/clip UI và bằng chứng SetActive của object thật.
- [ ] Cập nhật KB/handoff entry point đúng phần mới; giữ các cảnh báo IoT còn thiếu contract.
- [ ] Kiểm tra diff không có DB schema/migration/seed, secrets, reset thay đổi người dùng hoặc generated files không cần thiết.

**Điều kiện xong:** một agent khác có thể tiếp tục từ handoff, phân biệt phần hoàn thành với live IoT đang chờ đầu vào.

## 10. Source map để agent tìm và đặt code

Tất cả path dưới đây lấy từ KB hoặc là đề xuất. Sau 05A phải thay bằng path thật trong báo cáo, không tạo file trùng chức năng chỉ để khớp tên.

| Vị trí ứng viên | Hành động |
| --- | --- |
| `web/src/app/viewer/buildings/[buildingId]/floors/[floorId]/page.tsx` | Mount sidebar đúng view, dùng route params đã validate |
| `web/src/components/layout/ViewerShell.tsx` | Bố trí sidebar và vùng canvas nếu cần |
| `web/src/components/floor/` | Đặt/reuse filter panel và SVG locator |
| `web/src/components/unity/UnityViewerRuntime.client.tsx` | Tích hợp state/session và event trong owner hiện hữu |
| `web/src/components/unity/UnityRouteSynchronizer.client.tsx` | Đọc correlation/ready; không trộn filter với route mutation |
| `web/src/types/viewer.ts`, `web/src/lib/unity-bridge.ts` | Type và validation message |
| `web/src/config/buildings.ts` | Tái sử dụng danh sách tầng nếu đây là nguồn chuẩn |
| `UnityContent/Assets/Script/FloorContent/` | Controller, validation/bind theo instance |
| `UnityContent/Assets/Script/Bridge/WebViewerBridge.cs` | Receiver/event mới hoặc extension tương đương |
| `UnityContent/Assets/Plugins/WebGL/ViewerBridge.jslib` | Chỉ sửa nếu dispatcher hiện tại chưa hỗ trợ |
| Loader, `FloorDetailContentHost`, marker subsystem thực tế | Hook bind/cleanup và filter marker |
| `UnityContent/ProjectSettings/TagManager.asset`, prefab tầng | Kiểm tra tag/hierarchy; chỉ sửa phần thiếu/sai |
| Backend path xác định ở 05A | Chỉ sửa adapter/DTO nếu thật sự cần, không thêm persistence |
| `web/doc/` hoặc thư mục tài liệu chuẩn của repo | Lưu plan/handoff và kết quả nghiệm thu |

## 11. Kiểm chứng và tiêu chí nghiệm thu

### 11.1. Ma trận tám tổ hợp object bắt buộc

`1` = active/hiển thị, `0` = inactive/ẩn. Kỳ vọng áp dụng cho các target hợp lệ trong model đang hoạt động; cột Floor luôn bằng 1. Marker không bị ba toggle này đổi visibility.

| Ca | Ceilling | Interior | Wall | Floor |
| --- | --- | --- | --- | --- |
| O1 | 1 | 1 | 1 | 1 |
| O2 | 0 | 1 | 1 | 1 |
| O3 | 1 | 0 | 1 | 1 |
| O4 | 1 | 1 | 0 | 1 |
| O5 | 0 | 0 | 1 | 1 |
| O6 | 0 | 1 | 0 | 1 |
| O7 | 1 | 0 | 0 | 1 |
| O8 | 0 | 0 | 0 | 1 |

Kiểm tra `activeSelf` **và hiệu quả hiển thị/activeInHierarchy** của target, sàn và nhóm còn bật. Screenshot một checkbox đổi màu không đủ chứng minh Unity filter chạy.

### 11.2. Acceptance matrix

Agent điền cột kết quả khi triển khai; trạng thái ban đầu của toàn bộ ca dưới đây là **NOT RUN**.

| ID | Tình huống | Kỳ vọng |
| --- | --- | --- |
| T05-01 | Mở Detailed Floor có prefab thật, ví dụ E/6 | Sidebar đúng vị trí; mặc định 3 + 5 mục ON; locator đúng tầng |
| T05-02 | Thực hiện O1–O8 từ web | Đúng nhóm Unity ẩn/hiện; sàn luôn giữ hiển thị |
| T05-03 | OFF→ON nhiều lần, target ban đầu inactive | Bật lại được; cache không mất target; state tuyệt đối |
| T05-04 | Prefab thiếu một trong ba loại | Không exception; nhóm còn lại vẫn chạy; không báo false error |
| T05-05 | Parent tag khác child tag; sàn/marker nằm dưới target | Validator phát hiện; sửa hierarchy hoặc từ chối có kiểm soát; không che lỗi bằng PASS |
| T05-06 | Toggle khi đang tải lần đầu | Chỉ state cuối được áp sau ready, không mất lựa chọn |
| T05-07 | Chuyển hai tầng có model và A→B→A nhanh | State giữ đúng; command/ack cũ không tác động instance mới |
| T05-08 | Về Campus trong lúc tải hoặc đang filter | Không áp filter lên Campus; không tăng runtime/canvas/listener |
| T05-09 | Back/Forward, deep link, reload tab | Route/locator đúng; preference theo chính sách phiên tại mục 4.3 |
| T05-10 | Tầng chưa có model, load error rồi retry cùng tầng | UI trạng thái đúng; ready mới nhận snapshot; không dùng model tầng khác |
| T05-11 | JSON sai, thiếu boolean, sai version/ID, stale revision, message lặp | Không mutate nhầm; không coercion; message lặp không đảo state |
| T05-12 | Geometry filter khi backend/IoT unavailable | Object filter và locator vẫn hoạt động với content/cấu hình đang có |
| T05-13 | Bật/tắt từng nhóm trong năm loại sensor | Marker/list đúng nhóm; camera filter không tắt camera Unity |
| T05-14 | Sensor chọn nhiều mục, tắt tất cả, bật lại tất cả | Các tập kết quả đúng; model tầng không đổi |
| T05-15 | Smart Building và temperature/humidity có metric trùng | Giữ đúng nhóm nguồn; không suy loại từ metric |
| T05-16 | Sensor type chưa mapping hoặc chưa có dữ liệu | Theo policy mục 4.2; empty state đúng; không tạo telemetry giả |
| T05-17 | Sensor hidden đang có popup, marker mới hoặc reused | Popup/interaction được xử lý; marker mới nhận state hiện tại |
| T05-18 | Tắt cả ba object filter khi sensor đang ON và ngược lại | Hai bộ lọc độc lập; sàn/marker phù hợp state riêng |
| T05-19 | Catalog E = G + 1…12; chọn G, 6, 12 | 13 lớp, đúng thứ tự và đúng highlight; không sort lexicographic |
| T05-20 | Catalog đổi số tầng, rỗng; ID không hợp lệ | N theo data; không hardcode, chia cho 0 hoặc highlight nhầm |
| T05-21 | Tầng hợp lệ chưa có prefab | Locator vẫn chỉ đúng tầng; thông báo content riêng |
| T05-22 | Click/scroll/keyboard trong sidebar, viewport hẹp | UI dùng được; camera không nhận nhầm input; label không bị cắt |
| T05-23 | Tìm visual layer trong source và UI | Có comment chính xác; không có dropdown/chức năng visual layer |
| T05-24 | Filter và kiểm tra camera/frame/custom position | Không auto-fit mỗi toggle, không đổi tọa độ/frame/binding hoặc ghi DB |
| T05-25 | Lặp vòng đổi tầng/toggle/unload | Không nhân listener, không giữ instance/handle cũ do feature mới |
| T05-26 | Build web + Unity + WebGL mới, browser chạy artifact đó | Không dùng output cũ; end-to-end chứng minh SetActive từ web |
| T05-27 | Review diff và network khi click filter | Không schema/migration/seed/ghi DB; không refetch thiết bị vì toggle |

### 11.3. Mức kiểm thử vừa đủ

- **Logic web:** test predicate năm nhóm, unknown type, default state, latest snapshot/correlation và floor ordering nếu chưa được test bởi phần hiện hữu.
- **Unity:** test target cache inactive, bảo vệ sàn/hierarchy, snapshot idempotent và cleanup/bind instance. Dùng test harness hiện có, không thêm framework lớn.
- **Browser + prefab thật:** manual/smoke test O1–O8, đổi tầng và retry, click sensor marker nếu có, so sánh sidebar/locator với mockup.
- Không viết snapshot test cho từng label/static JSX hoặc unit test chỉ lặp lại constant mapping. Không chạy lại toàn bộ suite không liên quan nếu không có concrete regression risk hoặc gate bắt buộc.
- Khi chỉ có một prefab thật, test được phần một tầng và dùng fixture cho logic race; ghi phần chuyển hai prefab thật `NOT RUN`/`BLOCKED`, không giả đổi tên cùng model thành hai tầng để PASS.
- Kết quả sensor fixture chứng minh logic lọc, **không chứng minh API IoT thật hoạt động**. Phân biệt rõ hai mức này.

## 12. Hoàn thành và báo cáo cuối phase

Small Phase 05 được nghiệm thu khi toàn bộ yêu cầu trong phạm vi có code, kiểm chứng tương ứng và handoff; mọi phần không chạy được phải ghi rõ thay vì cộng vào kết quả hoàn thành.

Deliverable triển khai gồm:

1. Thay đổi web + Unity, backend chỉ khi có lý do cụ thể; không có thay đổi DB.
2. Player WebGL mới và Addressables content tương thích nếu content đã sửa, theo quy ước artifact của repo.
3. Handoff `phase_05_implementation_handoff.md` với danh sách file, contract, source catalog, state policy, tag audit, lệnh đã chạy, kết quả test và hạn chế.
4. Ảnh/clip ngắn chứng minh sidebar, ít nhất một tổ hợp tắt object, sàn vẫn hiện và locator highlight đúng; kèm kiểm chứng đầy đủ O1–O8 trong bảng test.
5. Cập nhật nguồn chỉ dẫn cho agent tiếp theo, ghi rõ `Ceilling` là tên tag chủ ý và visual layer còn deferred.

Mẫu mở đầu báo cáo triển khai:

```text
Small Phase 05: COMPLETE / PARTIAL / BLOCKED
Branch và commit kiểm tra:
Các module đã sửa:
Prefab thật đã dùng:
Nguồn danh sách tầng và số lớp:
Nơi áp sensor filter; dữ liệu thật hay fixture:
Contract bridge cuối cùng:
WebGL/content release đã kiểm thử:
PASS / FAIL / NOT RUN / BLOCKED:
Thay đổi DB: none (hoặc ghi rõ vi phạm cần khắc phục)
Phần còn chờ: IoT live contract/data; giới hạn khác nếu có
```

Không tự mở tiếp phase tích hợp IoT hoặc chức năng visual layer. Sau handoff, bước tiếp theo do chủ dự án giao trên baseline mới.
