---
document_id: GIS-UIT-SMALL-PHASE-06-PLAN
version: "1.0.0"
created_on: "2026-09-21"
project: "GIS — UIT Building E Digital Twin"
status: "Implementation handover plan; chưa triển khai hoặc kiểm thử repository"
language: vi
upstream_scope: "GET /api/v1/devices only"
persistence: "None for IoT data in Small Phase 06"
floor_mapping_mode: "TEST_CURRENT_FLOOR_4_6_V1"
coordinate_mapping_mode: "TEST_PREFAB_CENTER_XZ_V1"
---

# Small Phase 06 — Hiển thị icon IoT trên tầng từ API

## 0. Mục tiêu và chỉ thị cho coding agent

Triển khai luồng **mở tầng → fetch danh sách thiết bị qua NestJS → hiển thị icon trên prefab tầng trong Unity**. Mỗi lần tải hoặc vào lại tầng 4/6 phải lấy dữ liệu mới từ `GET /api/v1/devices`. Small Phase 06 chỉ giữ dữ liệu trong bộ nhớ phục vụ lượt xem hiện tại, **không lưu dữ liệu IoT vào PostgreSQL**.

API đang phát triển. Mapping tầng và tọa độ trong phase này là **TEST**, chưa phải vị trí lắp đặt đã xác minh. Chuẩn bị bộ icon theo năm nhóm thiết bị trong báo cáo họp, đồng thời hiển thị được các loại upstream chưa có mapping như `solar`, `avc`, `nfc`. **Không dùng `is_active` để quyết định hiển thị hay suy luận tình trạng thiết bị.**

Agent cần thực hiện các phần 06A–06G, kiểm tra source trước khi sửa, và bàn giao bằng chứng chạy thực tế. Tên class, endpoint ứng dụng và payload mới trong tài liệu này là thiết kế đề xuất; tái sử dụng implementation tương đương nếu repository đã có. Không tuyên bố đã kiểm tra source, prefab hoặc WebGL chỉ từ kế hoạch này.

## 1. Nguồn và thứ tự ưu tiên

| Nguồn | Phiên bản/ngày | Đã đọc được? | Vai trò và giới hạn |
| --- | --- | --- | --- |
| Yêu cầu trực tiếp Small Phase 06 | 21/09/2026 | Có | Ưu tiên cao nhất: fetch mỗi lần load tầng, không persistence, TEST mapping, bỏ qua ý nghĩa `is_active`. |
| `IoTBackend_API.md` | Snapshot response 21/09/2026 | Có, toàn bộ | Nguồn endpoint, schema và response mẫu. Không phải lần gọi live trong phiên lập plan. |
| `IoTBackend_API_HandOver.md` | 21/09/2026 | Có, toàn bộ | Bearer token chỉ ở NestJS, bridge chỉ đọc, giới hạn contract. Các phần persistence và detail API được thu hẹp bởi yêu cầu phase này. |
| `GIS_UIT_Bao_cao_ket_qua_hop_IoT_v2(1).docx` | Bản v2; không gán ngày họp từ tên upload | Có, toàn bộ nội dung chữ | Năm nhóm thiết bị; gốc tọa độ từ trung tâm mặt bằng; định hướng lưu vị trí về sau. |
| `Project_KnowledgeBase(1).md` | v1.0.0, 16/09/2026 | Có, các mục liên quan | Kiến trúc, canonical routes, bridge, lifecycle và coordinate frame. Bản KB không chứng minh trạng thái repository hiện tại. |
| `EBuilding_UIT_BEIVN.pdf` | Không xác định ngày từ file | Có, đã xem mockup trang 3 và đọc timeline | Tham chiếu bố cục trang tầng/icon. Không lấy số đo, loại cảm biến bổ sung hoặc trạng thái trong mockup làm dữ liệu thực. |
| `Bao_cao_nhanh_Digital_Twin_Toa_E_2026-09-08.docx` | 08/09/2026 | Có, toàn bộ nội dung chữ | Bối cảnh demo tầng 4/6 và Unity + Next.js. Roadmap lịch sử không mở rộng phase này. |
| Các handoff/plan Small Phase 03, 04, 05 và `AGENTS.md` trong repo | Cần agent kiểm tra bản hiện hành | Chưa đọc trực tiếp trong phiên này | Bắt buộc đọc khi triển khai; không suy luận class/event đã tồn tại từ tên được nhắc trong KB. |
| Repository, scene, prefab, deployment, live IoT | Chưa được cung cấp/kiểm tra tại phiên lập plan | Chưa | Không có kết luận về build hoặc trạng thái triển khai. |

### 1.1. Những phần tài liệu cũ được hoãn hoặc thay tạm

| Nội dung cũ | Quy tắc Small Phase 06 |
| --- | --- |
| Đồng bộ device metadata, tọa độ, `lasttime fetch` vào PostgreSQL | **Hoãn**. Không insert/upsert/update device data, không thêm migration cho feature này. |
| Đọc vị trí override đã lưu hoặc kéo icon và lưu DB | **Hoãn**, kể cả khi bảng/schema đã tồn tại. |
| API handover gồm list và detail | Chỉ tích hợp list cho luồng này. Không gọi detail một lần cho từng thiết bị. |
| Chưa được dùng tọa độ toàn 0 làm vị trí vật lý | Cho phép hiển thị `(0,0)` ở pivot **trong chế độ TEST**, không xác nhận vị trí thật. |
| Chưa biết `floor_level=0` nghĩa gì | Không map thành `G`; dùng chính sách demo tầng 4/6 ở mục 4. |
| Handover có normalized field `active` | Không đưa vào logic UI/marker/filter. Không suy diễn online/offline/hỏng/ngừng dùng. |

Đây là giới hạn tạm của một small phase, không hủy yêu cầu persistence trong roadmap dài hạn.

## 2. Phạm vi triển khai

### Trong phạm vi

- NestJS gọi đúng upstream `GET /api/v1/devices`, Bearer token chỉ nằm ở server.
- Validate response, giữ ID/type/tọa độ gốc và chuyển thành DTO cho viewer.
- Tách adapter mapping tầng TEST và mapping tọa độ TEST để thay độc lập về sau.
- Fetch mới ở mỗi lượt mở/load tầng được hỗ trợ, xử lý lỗi và chống response cũ đè tầng mới.
- Render marker IoT trong Unity FloorDetail sau khi đúng prefab đã ready.
- Bộ icon cho 5 nhóm thiết bị đã thống nhất, cộng icon fallback cho loại chưa xác định.
- Nhãn TEST, trạng thái loading/empty/error/partial và xử lý marker cùng tọa độ.
- Nối sensor filter hiện có nếu Small Phase 05 đã có nền tảng tương ứng; bảo toàn filter object.

### Ngoài phạm vi

- Mọi ghi dữ liệu IoT vào database, bảng mới, migration, job sync, webhook, cache bền vững.
- LocalStorage/IndexedDB/service-worker cache để dùng lại response IoT giữa các lượt load.
- Kéo thả, sửa, lưu/reset tọa độ custom; sửa vị trí upstream.
- API chi tiết thiết bị, telemetry, charts, cảnh báo, lịch sử ra/vào, video camera.
- Đánh giá `is_active`, online/offline hoặc sức khỏe thiết bị.
- Tự đăng ký thiết bị, POST/PUT/PATCH/DELETE vào IoT backend hoặc sửa backend của team IoT.
- Làm lại runtime Unity, camera, route, toàn bộ UI, authentication hoặc backend bootstrap.

## 3. Contract upstream dùng trong phase này

### 3.1. Request và response đã có nguồn

```http
GET https://api.ttlab.manhthao.uk/api/v1/devices
Authorization: Bearer <IOT_API_MASTER_TOKEN>
Accept: application/json
```

Endpoint hiện được tài liệu hóa là **không có parameters**. Không tự thêm `floor`, `building`, `active`, `page`, `limit` hoặc giả định có pagination. Lọc/mapping tầng là trách nhiệm ứng dụng.

```ts
// Schema mô tả nguồn; không phải enum business của ứng dụng.
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
  is_active: boolean; // Có trong nguồn; không dùng trong logic phase này.
}

interface IoTUpstreamDeviceListResponse {
  data: IoTUpstreamDevice[];
  meta: {
    count?: number;
    truncated?: boolean;
    [key: string]: unknown;
  };
}
```

Snapshot ngày 21/09 có **10 records: 5 `solar`, 2 `avc`, 3 `nfc`**. Tất cả `install_x`, `install_y`, `install_floor_level` đều bằng 0. Đây chỉ là fixture có nguồn, không hardcode số thiết bị vào UI hoặc ràng buộc API chỉ được có 10 thiết bị.

ID là chuỗi opaque: giữ nguyên hoa/thường; chấp nhận cả ID như `dummy01801182ed2814`; không ép kiểu số, UUID hoặc hex. `device_type` là chuỗi mở, không loại bỏ một record chỉ vì chưa biết loại.

### 3.2. Validation cho nhu cầu hiển thị

- Envelope phải có `data` dạng array; sai envelope là lỗi integration, không trả danh sách rỗng giả.
- Record hiển thị cần ID không rỗng, `install_location` với x/y/floor là số hữu hạn. Số `0` hợp lệ; `null`, chuỗi rỗng, NaN hoặc Infinity không được ép thành 0.
- Thiếu tọa độ hoặc ID: bỏ qua marker record đó, báo số record bị bỏ qua; giữ những record hợp lệ. Nếu nhận dữ liệu nhưng không record nào hợp lệ, hiển thị lỗi dữ liệu thay vì “không có thiết bị”.
- Type lạ dùng fallback. Type thiếu/sai kiểu có thể dùng fallback kèm diagnostic; không bịa category chính thức.
- Timestamps và `is_active` không quyết định khả năng render marker. Nếu thay đổi schema ở các trường không dùng, ghi diagnostic có kiểm soát, không ẩn thiết bị chỉ do chúng. Giữ nguyên schema nguồn trong tài liệu, phân biệt với projection tolerant của viewer.
- `meta.count` và `meta.truncated` không bắt buộc. `truncated=true`: vẫn render phần nhận được nhưng ghi “Danh sách có thể chưa đầy đủ”; không đoán cách tải phần còn lại. Không dùng `meta.count` thay số records thực nhận/hiển thị.
- ID trùng trong một response: chỉ có một marker cho mỗi ID; giữ record hợp lệ đầu tiên theo thứ tự response, báo duplicate count. Không gộp ID bằng cách lowercase.
- `fetchedAt` là thời điểm NestJS nhận/validate response thành công, chỉ giữ trong RAM; không lấy từ `last_updated_timestamp`.

## 4. Quy ước tầng TEST có thể thay thế

### 4.1. Chính sách cụ thể để triển khai

**User chốt:** tạm hiển thị thiết bị ở tầng 4 và tầng 6 khi `install_floor_level` còn đang phát triển.

**Lựa chọn triển khai của plan để xử lý việc chưa có bảng chia thiết bị:** dùng **cùng danh sách upstream** làm danh sách demo của tầng hiện đang mở nếu tầng đó là `E/4` hoặc `E/6`. Không tự chia một nửa thiết bị theo index, ID hoặc loại. Khi mở tầng 4, danh sách được chiếu lên tầng 4; khi chuyển tầng 6, fetch mới và chiếu danh sách mới lên tầng 6. Đây không phải khẳng định thiết bị vật lý thuộc cả hai tầng.

| Điều kiện | Kết quả ở `TEST_CURRENT_FLOOR_4_6_V1` |
| --- | --- |
| Mở `E/4` | Hiển thị mọi record hợp lệ vừa fetch với `displayFloorId="4"`. |
| Mở `E/6` | Hiển thị mọi record hợp lệ vừa fetch với `displayFloorId="6"`. |
| Tầng khác hoặc Campus | Không gắn danh sách TEST vào tầng đó; không phát request IoT cho phạm vi chưa hỗ trợ. |
| `install_floor_level=0` hoặc giá trị số khác | Giữ nguyên trong `sourceLocation.floorLevel`; không dùng phân tầng trong chế độ này. |
| Reload cùng tầng hoặc rời rồi quay lại | Tạo lượt load mới, fetch mới. |

Nếu upstream bắt đầu trả floor level khác 0, hiện diagnostic để nhắc xem lại convention; **không tự chuyển sang mapping thật theo một response**. Không hardcode `0 → 4` ở backend và `0 → 6` ở Unity.

Tập trung logic trong một adapter, ví dụ `IotFloorAssignmentPolicy`. Cấu hình đề xuất:

```ts
const floorMapping = {
  mode: "TEST_CURRENT_FLOOR_4_6_V1",
  supportedBuildingId: "E",
  supportedFloorIds: ["4", "6"],
};
```

Khi có quy ước chính thức, thay adapter bằng bảng ánh xạ upstream → canonical floor ID (`G`, `1`…`12`), không sửa marker renderer. Không tự triển khai trước một mapping thật chưa có contract. Tắt TEST mà chưa có mapper thật phải báo mapping chưa được cấu hình, không âm thầm fallback TEST.

### 4.2. Nhãn bắt buộc

Hiển thị một badge rõ trên panel IoT: **“TEST — Tầng và vị trí thiết bị đang dùng quy ước tạm”**. Tooltip/ghi chú ngắn giải thích danh sách hiện được dùng thử trên tầng 4/6. Nhãn này độc lập với chế độ fixture/live: dữ liệu fetch thật vẫn mang mapping TEST.

## 5. Quy ước tọa độ TEST

### 5.1. Origin và phép chiếu

**User chốt:** `install_location.install_x` và `.install_y` tạm tính từ tâm/pivot của prefab tầng, tức **`Vector3.zero` trong không gian local của prefab tầng**. Đây không phải `Vector3.zero` của world scene.

**Default kỹ thuật của plan, cần ghi TEST:** coi cặp upstream `(x,y)` là mặt bằng Unity XZ; `install_x → local X`, `install_y → local Z`, hệ số 1 đơn vị nguồn = 1 Unity local unit. Chưa khẳng định đơn vị là mét, hướng Bắc hay trục vật lý đã đúng.

```csharp
// TEST_PREFAB_CENTER_XZ_V1 — chưa hiệu chuẩn thực địa.
Vector3 anchorLocal = new Vector3(installX, 0f, installY);
Vector3 anchorWorld = floorInstance.transform.TransformPoint(anchorLocal);
```

- Với `(0,0)`, anchor nằm đúng pivot của floor instance. Không cộng độ cao tầng 4/6, không dùng floor level làm trục Y.
- Nếu có wrapper/coordinate frame hiện hữu, xác định chính xác transform nào là root theo quy ước prefab. Dùng root đó nhất quán; không apply scale/rotation hai lần.
- Không tính lại origin bằng `Renderer.bounds.center`, camera target hoặc bounds sau khi tắt Wall/Interior/Ceilling. Không dịch model để ép pivot thành tâm hình học trong phase này.
- Nếu pivot asset chưa trùng tâm hình học, ghi vào walkthrough; vẫn dùng pivot local zero theo quy ước TEST. Việc hiệu chuẩn/re-author asset là công việc riêng.
- `CoordinateMapper`/frame config phải tách khỏi renderer; giữ calibration là `TEST`/`Unverified`, không ghi `Verified`.
- Có thể nâng phần đồ họa icon một độ cao nhỏ có cấu hình hoặc render overlay để dễ nhìn. Đây là visual offset, không sửa anchor/source coordinate.

### 5.2. Nhiều thiết bị cùng vị trí

Snapshot hiện tại khiến cả 10 anchor nằm tại tâm. Không tự sinh random tọa độ hoặc rải icon thành phòng giả để làm đẹp demo.

Yêu cầu tối thiểu: marker group có badge số lượng tại anchor trùng nhau; khi chọn/mở group, hiển thị từng thiết bị với icon, `deviceId` và raw type trong danh sách nhỏ. Mỗi record vẫn phải truy cập được. Nếu renderer hiện hữu đã hỗ trợ tách icon trên màn hình, có thể tái sử dụng với leader line và offset chỉ phục vụ hiển thị; không thay tọa độ nguồn hoặc coi offset là vị trí lắp đặt.

Để kiểm thử các vị trí phân tán, dùng fixture riêng ghi rõ **synthetic coordinate test**; không trộn vào response live hoặc tự fallback sang fixture khi API lỗi.

## 6. Bộ icon và phân loại thiết bị

### 6.1. Bộ icon bắt buộc chuẩn bị

Danh mục lấy từ báo cáo họp IoT v2, không lấy `solar/avc/nfc` làm toàn bộ taxonomy sản phẩm.

| Category key ứng dụng | Nhãn hiển thị | Hình gợi ý | Ghi chú |
| --- | --- | --- | --- |
| `water_meter` | Đồng hồ nước | Đồng hồ đo + giọt nước | Một loại thiết bị, không ngầm thêm API số đo. |
| `temperature_humidity` | Cảm biến nhiệt độ/độ ẩm | Nhiệt kế + giọt nước | Một marker cho thiết bị đa đại lượng. |
| `smart_building` | Smart Building | Tòa nhà/cụm cảm biến | Bao gồm VOC, nhiệt độ/độ ẩm, áp suất; không tách thành nhiều thiết bị giả. |
| `rf_uhf_reader` | RF UHF đọc thẻ | Đầu đọc/thẻ + sóng | Không mặc định NFC tương đương RF UHF. |
| `camera` | Camera | Camera giám sát | Icon vị trí, không video stream. |
| `unknown` | Chưa phân loại | Thiết bị trung tính | Bắt buộc để nhận type mới/chưa xác minh. |

Chuẩn bị asset thực trong lúc coding: nguồn vector/editable theo hệ icon sẵn có; export sprite/texture phù hợp Unity nếu cần; dùng cùng hình cho legend/filter phía web. Tối thiểu có 5 icon nghiệp vụ + 1 fallback, nền trong suốt, silhouette phân biệt ở cỡ marker, viền tương phản trên nền floor sáng/tối. Không cần thêm thư viện icon nặng hoặc package Unity chỉ cho mục này nếu pipeline hiện hữu đủ dùng.

Giữ GUID và `.meta` cho asset Unity. Ghi nguồn/license nếu dùng bộ icon bên ngoài. Preview/fixture nội bộ phải chứng minh cả 5 icon render đúng dù live data chưa có các category tương ứng.

### 6.2. Mapping raw type tách biệt

| Giá trị hiện quan sát | Mapping mặc định phase này | Cách hiển thị |
| --- | --- | --- |
| `solar` | `unknown` | Fallback + raw type `solar`. |
| `avc` | `unknown` | Fallback + raw type `avc`; không đoán ý nghĩa viết tắt. |
| `nfc` | `unknown` | Fallback + raw type `nfc`; không tự gán RF UHF. |
| Giá trị mới chưa có mapping | `unknown` | Giữ raw type và render fallback. |

Tập trung mapping trong `DeviceTypeIconRegistry` hoặc module tương đương. Chỉ thêm alias sang category nghiệp vụ khi có xác nhận. Không round-robin 10 record vào 5 nhóm để demo icon.

Mặc định mọi category, kể cả `unknown`, đều hiển thị. Nối vào dropdown sensor filter hiện hữu, bổ sung “Chưa phân loại” để record hiện tại không bị mất do chỉ có 5 lựa chọn. Toggle filter không gọi lại API; chỉ ẩn/hiện marker đã nạp, cập nhật group count theo số record đang visible. Category chưa có thiết bị vẫn có thể thấy trong legend/preview, không tạo device giả trong live view.

Không dùng màu đỏ/xanh/xám, opacity, badge hay tooltip để diễn giải `is_active`. Màu chỉ nhận diện loại/chọn/hover; không thể hiện sức khỏe thiết bị.

## 7. Kiến trúc và contract nội bộ

### 7.1. Ranh giới trách nhiệm

1. Next.js quản lý route, load generation, trạng thái UI và request tới NestJS.
2. NestJS đọc token server-side, gọi list upstream, validate và áp dụng mapping TEST tầng/type.
3. Next.js gửi payload có correlation tới Unity qua bridge hiện hữu.
4. Unity chỉ render khi đúng floor instance ready, chuyển x/y thành anchor local/world và quản lý marker.

Không gọi IoT host từ browser hoặc Unity. Không dùng PostgreSQL làm nguồn danh sách hoặc fallback cho luồng này. Không tạo cache dùng lại kết quả cho lượt mở tầng tiếp theo. Có thể giữ response trong RAM của lượt load và chia sẻ request đang chạy của chính lượt đó để tránh render/effect tạo request trùng.

### 7.2. API phía ứng dụng đề xuất

```http
GET /api/buildings/E/floors/4/devices
Cache-Control: no-store
```

Đây là **route NestJS đề xuất**, không phải upstream endpoint. Agent phải theo prefix/convention hiện có; không nhân đôi `/api`. Mỗi lần gọi cho tầng hỗ trợ phải gọi upstream list mới. Không forward `floorId` làm query chưa được upstream hỗ trợ. Route ngoài E/4, E/6 trả trạng thái mapping chưa hỗ trợ; phân biệt với danh sách rỗng của tầng được hỗ trợ.

DTO đề xuất dưới đây là contract ứng dụng, không thay đổi JSON của team IoT:

```ts
type DeviceCategory =
  | "water_meter" | "temperature_humidity" | "smart_building"
  | "rf_uhf_reader" | "camera" | "unknown";

interface FloorDeviceView {
  deviceId: string;
  sourceDeviceType: string;
  category: DeviceCategory;
  sourceLocation: { x: number; y: number; floorLevel: number };
  displayFloorId: string;
}

interface FloorDeviceResponse {
  schemaVersion: 1;
  buildingId: "E";
  floorId: "4" | "6";
  fetchedAt: string;
  mapping: {
    floorMode: "TEST_CURRENT_FLOOR_4_6_V1";
    coordinateMode: "TEST_PREFAB_CENTER_XZ_V1";
  };
  devices: FloorDeviceView[];
  summary: {
    receivedCount: number;
    acceptedCount: number;
    skippedCount: number;
    duplicateCount: number;
    truncated: boolean | null; // null nếu upstream không cung cấp
  };
}
```

Không cần đưa `is_active` vào DTO viewer. Giữ nó trong response/raw memory nếu module nguồn đã có, nhưng không để downstream hiểu `active` là online. `receivedCount = acceptedCount + skippedCount + duplicateCount` theo cách đếm từng record loại bỏ; count visible thuộc filter UI, không thay accepted count.

### 7.3. Bridge web–Unity và lifecycle

Tái sử dụng bridge/dispatcher hiện hữu; không thêm `useUnityContext`, canvas hay owner `DontDestroyOnLoad`. Message đề xuất `ApplyFloorDeviceMarkers` mang `schemaVersion`, `loadGeneration`, building/floor, mapping modes và danh sách DTO. Message `ClearFloorDeviceMarkers` cũng cần generation để clear cũ không xóa marker mới. Tên thực tế phải được ghi lại trong implementation handoff.

Mỗi lượt load có **generation riêng**, kể cả mở lại cùng floor ID. Nếu loader đã có request/content instance token, liên kết hoặc dùng lại thay vì dựng hai hệ correlation không liên quan.

1. Route vào tầng hoặc explicit reload tạo generation mới; hủy request cũ, clear selection/marker/state cũ ngay. Không giữ marker tầng trước trong lúc đợi API.
2. Với tầng được hỗ trợ, bắt đầu một request mới tới NestJS; tải prefab theo lifecycle có sẵn. Hai thao tác có thể chạy song song.
3. Chỉ apply khi **cả response và đúng prefab instance đều ready**. `ViewerStateChanged`/scene-ready đơn thuần chưa chứng minh floor content đã ready.
4. Kiểm tra đồng thời generation + buildingId + floorId + content instance còn hiện hành trước khi gửi/nhận/apply. Abort request không thay thế kiểm tra này.
5. Nếu response về trước prefab, chỉ giữ payload mới nhất của generation hiện hành. Nếu prefab về trước, floor vẫn xem được trong lúc tải IoT.
6. Áp dụng danh sách theo kiểu replace/upsert idempotent, không append tạo marker trùng khi bridge gửi lại.
7. Khi sang Campus/tầng khác hoặc unload content: dispose marker, group UI, selection, listener tương ứng; không giữ reference đến Addressable instance đã release.
8. Nếu bridge/player vừa ready, chỉ replay payload của generation hiện hành. Unity cần báo số marker được áp dụng hoặc dùng cơ chế ack sẵn có để web không báo hoàn tất trước khi render thành công.

`Fetch every floor load` bao gồm deep link, refresh trang, A→B→A, Back/Forward vào tầng và reload floor thật sự. Orbit/pan/zoom, mở tooltip, toggle filter, React re-render hoặc event ready lặp của cùng lượt load **không** tạo fetch mới. Explicit retry IoT tạo request attempt mới; late response của attempt cũ cũng phải bị loại.

## 8. Unity và UX

- Marker nằm dưới root do FloorDetail quản lý, gắn đúng transform của floor instance. Không đặt marker dưới object `Wall`, `Interior` hoặc `Ceilling` có thể bị deactivate.
- Bảo toàn ba toggle object độc lập của Small Phase 05 và Floor luôn visible. Kiểm tra tag thực tế `Ceilling`/`Ceiling` trong repo; không đổi tên tag hoặc sửa prefab hàng loạt trong phase này.
- Ưu tiên billboard/world-space marker có độ lớn dễ đọc theo camera, render được trên mặt bằng ở góc orbit hiện có. Chính sách overlay/occlusion phải nhất quán và được kiểm tra trên hai prefab thật; không di chuyển camera để che lỗi marker.
- Click/tap marker hoặc group chỉ mở metadata tối thiểu có sẵn: ID, raw type/category, nhãn TEST. Không gọi detail API, không hiển thị số đo giả hoặc “hoạt động bình thường”.
- Tương tác marker/UI không kích hoạt orbit/pan ngoài ý muốn; giữ thao tác drag camera và floor navigation.

| Trạng thái | Hành vi |
| --- | --- |
| Prefab loading / IoT loading | Giữ UI loading riêng; không dựng marker lên prefab cũ. |
| Thành công | Render marker/group, số thiết bị nhận được và badge TEST. |
| `data=[]` | “Chưa có thiết bị từ API”; floor vẫn hoạt động. |
| Filter ẩn hết | “Không có thiết bị phù hợp bộ lọc”; không nhầm thành API rỗng. |
| Một phần record lỗi hoặc `truncated=true` | Render phần hợp lệ, thông báo danh sách chưa đầy đủ. |
| Sai schema toàn bộ / network / timeout / upstream auth | Không giả danh sách rỗng hoặc fixtures; thông báo lỗi, nút thử lại. |
| Prefab không sẵn sàng | Giữ trạng thái thiếu model có sẵn; không dùng model tầng khác để đặt icon. |
| Tầng ngoài TEST scope | Nêu tích hợp IoT TEST hiện hỗ trợ tầng 4 và 6; không báo “0 thiết bị thực tế”. |

Timeout khởi điểm đề xuất 10 giây, cấu hình được, không phải SLA upstream. Mặc định không retry nền/polling; nút thử lại phát một request có kiểm soát. Chặn double-click khi đang thử lại. Upstream `401` là lỗi cấu hình tích hợp; trả lỗi đã sanitize, không lộ token hoặc chuyển thành thông báo user đăng nhập sai.

## 9. Cấu hình và an toàn tích hợp

```env
# Backend only; dùng cơ chế env thực tế của repository.
IOT_API_BASE_URL=https://api.ttlab.manhthao.uk
IOT_API_MASTER_TOKEN=<set-locally-do-not-commit>
IOT_API_TIMEOUT_MS=10000
IOT_FLOOR_MAPPING_MODE=TEST_CURRENT_FLOOR_4_6_V1
IOT_COORDINATE_MAPPING_MODE=TEST_PREFAB_CENTER_XZ_V1
```

Tên mới là đề xuất; ưu tiên config đã có nếu tương đương. `.env.example` chỉ chứa placeholder. “Master” không chứng minh quyền, thời hạn hoặc loại token; chỉ dùng như bearer secret do chủ dự án cung cấp.

- Token không nằm trong `NEXT_PUBLIC_*`, Unity assets, URL, Git, logs, response, screenshot hoặc PostgreSQL.
- Client server-side chỉ expose thao tác list cần thiết; không mở generic proxy nhận arbitrary URL/method.
- Không có token trong môi trường agent: hoàn tất implementation + fixture tests; ghi live test chưa chạy, không yêu cầu gửi token vào chat.
- Khi triển khai feature đã được giao và có credential cấu hình đúng, chỉ thực hiện lượng GET tối thiểu cần kiểm tra. Không probe endpoint, load test hoặc mutation upstream.
- Giữ auth/CORS/access controls hiện hữu của API ứng dụng; không mở CORS `*` hay bỏ guard để demo.
- Cache response IoT ở mọi tầng ứng dụng phải tắt cho luồng này. Không nhầm với cache Addressables đang phục vụ model: không tắt cache asset model.

## 10. Trình tự công việc 06A–06G

### 06A — Kiểm tra repository và chốt integration points

- [ ] Đọc `AGENTS.md`, handoff mới nhất, plan prefab Small Phase 03, handoff Small Phase 04 và Small Phase 05.
- [ ] Không thực hiện plan lỗi thời `phase_03_floor_content_document_loading_plan.md`.
- [ ] Xác định NestJS app/prefix/env/client sẵn có; DTO/schema dùng thư viện gì; không thêm framework song song.
- [ ] Xác định route owner, bridge, load generation, event prefab-ready, content-root transform và marker/filter hiện có.
- [ ] Xem trực tiếp prefab tầng 4/6: root/pivot/scale, frame metadata, floor availability; giữ model và camera hiện hữu.
- [ ] Ghi bảng integration points với path/class/event thực tế. Nêu rõ thiếu asset hoặc thiếu source nào ảnh hưởng live verification.

**Hoàn thành khi:** biết nơi nối fetch/ready/clear và không tạo runtime/bridge cạnh tranh.

### 06B — List API qua NestJS, không persistence

- [ ] Triển khai/tái sử dụng readonly client cho list, config bearer, timeout và lỗi sanitize.
- [ ] Projection/validation theo mục 3; floor policy TEST theo mục 4.
- [ ] Thêm route ứng dụng và DTO đáp ứng viewer; `no-store`, không repository/ORM writes.
- [ ] Test mock cho envelope, record lỗi, unknown type, `is_active`, duplicate, `truncated`, auth/timeout.

**Hoàn thành khi:** route trả normalized list lấy từ một upstream list request mỗi lượt gọi; không cần detail request hay DB sync.

### 06C — Icon assets và registry

- [ ] Chuẩn bị 5 icon nghiệp vụ + fallback; import vào Unity, nối legend web theo pipeline đang có.
- [ ] Registry category→asset và raw-type→category tách riêng; raw hiện tại mặc định unknown.
- [ ] Preview fixture cho toàn bộ icon, nền sáng/tối và kích thước marker thực.

**Hoàn thành khi:** không cần giả mapping live để chứng minh 5 icon đã sẵn sàng.

### 06D — Marker renderer và coordinate adapter

- [ ] Tạo/tái sử dụng marker root lifecycle; mapper `(x,y) → (x,0,y)` từ pivot local zero.
- [ ] Render đủ records; group vị trí trùng và mở danh sách ID/type.
- [ ] Nối filter category và giữ marker độc lập object toggles.
- [ ] Kiểm tra transform root khác world origin, rotation/scale để không apply sai không gian.

**Hoàn thành khi:** các fixture vị trí có kết quả dự kiến; snapshot toàn 0 vẫn truy cập được đủ 10 record.

### 06E — Điều phối Web–Unity

- [ ] Mỗi lượt load tầng có generation, fetch mới, cancel/ignore stale, clear sớm.
- [ ] Gating response + prefab-ready, payload idempotent, ack/lỗi có correlation.
- [ ] Xử lý deep link, Back/Forward, cùng tầng reload, bridge ready muộn và Campus.

**Hoàn thành khi:** dữ liệu không thể rơi sang floor instance khác ngay cả khi response đảo thứ tự.

### 06F — UX, tích hợp và xác minh

- [ ] Badge TEST, trạng thái error/empty/partial/unsupported rõ ràng; không status từ `is_active`.
- [ ] Chạy các acceptance case ở mục 11 trên stack hiện hữu.
- [ ] Chạy build/lint/test liên quan bằng lệnh thực tế trong repo; ghi kết quả, không tự tạo tên lệnh giả.
- [ ] Nếu môi trường hỗ trợ, build/run WebGL và kiểm tra tầng 4/6 thật; phân biệt Editor test và browser test.

**Hoàn thành khi:** các gate kiểm được đều pass; phần chưa chạy có lý do và hướng dẫn tái hiện cụ thể.

### 06G — Bàn giao

- [ ] Tạo `web/doc/phase_06_implementation_handoff.md` theo convention repo.
- [ ] Ghi file thay đổi, contract thực tế, config placeholder, asset/icon registry và cách tắt/thay TEST mapping.
- [ ] Ghi cách chạy local trên macOS dựa trên setup hiện hữu; không dựng lại Docker/database chỉ cho feature này.
- [ ] Cập nhật Project Knowledge Base trong repo nếu đó là quy trình dự án: phase này fetch-only, mapping TEST, persistence deferred, `is_active` ignored.
- [ ] Ghi screenshots/test results, live vs fixture, limitation và các việc chưa chạy; không claim calibrated positions.

## 11. Acceptance và kiểm thử trọng điểm

Ưu tiên unit/integration test cho mapping, no-persistence và race condition; dùng kiểm tra trực quan cho icon/camera. Không cần test tự động phản chiếu từng dòng cấu hình hoặc snapshot ảnh hàng loạt.

| ID | Tình huống | Kết quả bắt buộc |
| --- | --- | --- |
| AC01 | Mở E/4 từ deep link | Một lượt list fetch qua NestJS; marker chỉ xuất hiện trên prefab E/4 ready; badge TEST. |
| AC02 | Chuyển E/4→E/6→E/4 | Mỗi lượt có fetch mới, không dùng response cache cũ; không nhân đôi marker. |
| AC03 | Reload cùng tầng, đổi dữ liệu mock giữa hai lượt | Lượt sau hiển thị dữ liệu mới, kể cả devices đã bị loại khỏi response. |
| AC04 | Response E/4 chậm hơn E/6 hoặc attempt cũ về sau retry | Response/clear/ack cũ không sửa marker hoặc UI của lượt mới. |
| AC05 | API nhanh/prefab chậm và ngược lại | Chỉ apply khi đúng cả hai; không dùng scene-ready thay content-ready. |
| AC06 | Sang Campus hoặc tầng ngoài phạm vi | Cleanup đầy đủ; không gắn danh sách TEST vào tầng khác, không fetch ngoài scope. |
| AC07 | Snapshot nguồn 10 devices toàn tọa độ 0 | Cùng anchor pivot, group count 10 và truy cập đủ 10 ID; không rải tọa độ giả. |
| AC08 | Root ở world khác 0, có rotation/scale | Anchor là `TransformPoint(x,0,y)` đúng root; không tính bounds center hay scale hai lần. |
| AC09 | Fixture (0,0), x/y âm/dương, null/sai kiểu | Zero và số âm hợp lệ; null/sai kiểu không biến thành 0; invalid được báo rõ. |
| AC10 | `is_active` true/false/missing/sai kiểu, các field cần render giống nhau | Marker/category/opacity/status/filter không thay đổi do field này; không ẩn record. |
| AC11 | `solar`, `avc`, `nfc`, type mới và ID dummy | Tất cả render fallback với raw type/ID nguyên bản; không ép EUI hoặc đoán business category. |
| AC12 | Icon preview đủ 5 category + fallback | Dễ phân biệt và đọc được; fixture preview tách khỏi live list. |
| AC13 | Toggle object và sensor filter | Floor vẫn hiện; object filter không deactivate marker root; sensor filter không refetch; unknown không bị mất mặc định. |
| AC14 | `data=[]`, filter ẩn hết, payload lỗi, partial records | Hiển thị bốn trạng thái khác nhau; không báo empty giả khi lỗi. |
| AC15 | Upstream 401, timeout, mất mạng | Lỗi sanitize + retry có kiểm soát; floor viewer vẫn hoạt động; không auto fixtures. |
| AC16 | `meta={}`, thiếu count/truncated, `truncated=true` | Không reject chỉ vì thiếu meta fields; true có cảnh báo danh sách chưa đầy đủ. |
| AC17 | Trùng deviceId, bridge apply lặp | Một marker/record theo ID, diagnostic duplicate và apply idempotent. |
| AC18 | Theo dõi calls của feature | Chỉ GET list upstream; không detail fan-out, không mutation, polling hoặc fetch theo camera/filter. |
| AC19 | Kiểm tra persistence và credential | Không gọi device repository write hoặc lưu source/override/fetchedAt; token vắng khỏi browser bundle/payload/logs. |
| AC20 | Thay floor/coordinate/type adapter trong fixture test | Renderer không cần đổi; tắt TEST khi chưa có mapper thật phải báo chưa cấu hình. |

AC19 nên kiểm bằng code path review và spy trên repository/write boundary nếu có sẵn. Nếu chạy DB integration, chỉ quan sát bảng liên quan trước/sau trên môi trường test; không reset/truncate DB. Việc DB tồn tại hoặc backend dùng DB cho module khác không phải vi phạm; **feature này không persistence IoT**.

## 12. Định nghĩa hoàn tất và bước tiếp theo

Small Phase 06 hoàn tất khi luồng live list đã được nối vào viewer, bộ icon sẵn sàng, tầng 4/6 hiển thị theo quy ước TEST đã ghi, mỗi lượt load fetch mới, lỗi không phá viewer, không persistence, không suy diễn `is_active`, và có handoff đủ để agent tiếp theo thay mapping.

Nếu thiếu credential hoặc Unity/WebGL runtime để chạy một gate, có thể bàn giao code và test phần đã thực hiện, nhưng phải ghi **live integration/WebGL verification pending**. Không ghi “hoàn tất end-to-end” chỉ dựa trên mock tests.

Khi team IoT chốt contract mới, agent tiếp theo cần:

1. Ghi nhận schema/sample và quy ước `install_floor_level`, đơn vị/trục/gốc tọa độ.
2. Thay hai adapter TEST bằng mapping có nguồn; kiểm tra điểm tham chiếu trên prefab thật.
3. Bổ sung raw-type aliases đã xác nhận; gỡ badge TEST chỉ cho phần đã xác minh.
4. Giữ source coordinates tách display projection; chỉ triển khai persistence/override khi được giao phase tương ứng.
5. Chỉ thêm logic trạng thái sau khi xác minh ý nghĩa `is_active` hoặc có trường trạng thái phù hợp khác.

**Handover note:** chưa có thao tác gọi hoặc thay đổi IoT backend trong phiên lập kế hoạch này. Tài liệu này giao công việc triển khai; không phải báo cáo công việc đã làm.
