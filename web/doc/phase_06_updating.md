---
document_id: GIS-UIT-PHASE-06-UPDATING
version: "1.0.0"
created_on: "2026-09-21"
project: "GIS — UIT Building E Digital Twin"
status: "Corrective implementation plan; repository chưa được kiểm tra trực tiếp"
based_on: "phase_06_implementation_handoff.md và phản hồi hình ảnh của chủ dự án"
target_repository_path: "web/doc/phase_06_updating.md"
---

# Phase 06 Updating — Hiển thị icon IoT trực tiếp trên mặt bằng 3D

## 0. Đọc trước khi sửa

**Kết quả cần đạt:** mở trang chi tiết tầng 4/6 là nhìn thấy các icon thiết bị ngay trên mô hình tầng, như mockup trang 3 của `EBuilding_UIT_BEIVN.pdf` và ảnh tham chiếu số 2. Icon giữ liên kết với vị trí trên mặt bằng khi orbit/pan/zoom. Người dùng chọn icon trên mô hình để xem thông tin; danh sách thiết bị chỉ là công cụ phụ.

Plan Phase 06 trước đã quy định fetch/list và xử lý trùng tọa độ, nhưng cho phép dùng một cluster ở tâm cùng danh sách lớn làm kết quả tối thiểu. Tiêu chí đó **không đủ đáp ứng giao diện người dùng mong muốn**. Bản cập nhật này sửa rõ thứ tự ưu tiên: marker trên mặt bằng là đầu ra chính; fetch thành công, danh sách 10/10 và unit test backend/web chưa chứng minh feature hiển thị đã hoàn thành.

Đây là kế hoạch sửa **phần hiển thị và tích hợp renderer đang có**. Giữ luồng API đã làm; tìm nguyên nhân thực tế trong repository trước khi kết luận hoặc sửa. Không khẳng định mất icon chắc chắn do shader, camera hay tọa độ chỉ từ ảnh.

## 1. Bằng chứng đã đọc và kết luận có giới hạn

| Nguồn | Đã đọc/xem | Điều xác định được | Giới hạn |
| --- | --- | --- | --- |
| Ảnh 1 `46115fbb-dbae-4fa7-99f8-34f02ab51de3.png` | Có, trực tiếp | E/6 đã có model; panel danh sách 10/10 và các tọa độ `(0,0)`; có tab tọa độ thủ công; phần trên viewport trống lớn, model nằm thấp; không thấy rõ marker IoT trên mặt bằng. | Không chứng minh marker chưa instantiate hay nguyên nhân renderer lỗi. Một ảnh không chứng minh camera mặc định đã bị cấu hình sai. |
| Ảnh 2 `3d2e6e59-fc89-41df-b584-6bbbebfa1c0f.png` | Có, trực tiếp | Nhiều icon tròn với glyph rõ, đặt tại các vị trí khác nhau trên mô hình; floor là vùng quan sát chính. | Mockup không cung cấp tọa độ lắp đặt thật hoặc mapping `device_type`. |
| `EBuilding_UIT_BEIVN.pdf`, trang 3 | Có, xem ảnh trang đầy đủ | Layout: filter trái, floor trung tâm, điều hướng tầng phải, popup nhỏ theo selection. | Không sao chép số đo, tên phòng, CO₂/khói, trạng thái online hay chart giả từ mockup. |
| `phase_06_implementation_handoff.md` | Có, toàn bộ | Báo có `DeviceMarkerManager`, `DeviceMarkerItem`, PNG `Resources/Icons/`, clustering, bridge và panel web; liệt kê các path ở mục 8. | Là báo cáo của coding agent; chưa đối chiếu source. Danh sách verification chỉ có backend/web, chưa thấy Unity build log hoặc bằng chứng WebGL render. |
| `phase_06_iot_floor_icons_plan.md` | Có, nội dung liên quan trong plan đã tạo | Cluster mặc định ở tọa độ trùng, projection `(x,0,y)`, category fallback và phạm vi fetch-only. | Một số quyết định hiển thị được thay bởi bản này, xem mục 2. |
| Repository, Unity scene/prefab, WebGL artifact đang serve | Chưa được cung cấp trực tiếp | Chưa có kết luận về code/runtime. | Coding agent phải kiểm tra trước khi sửa và bổ sung bằng chứng sau khi chạy. |

Người dùng đã xác nhận fetch và danh sách thiết bị hoạt động. Handoff có tiêu đề “IMPLEMENTED & VERIFIED” nhưng cũng ghi “Ready for Live Upstream Testing with Token”; vì vậy không dùng tiêu đề đó làm bằng chứng toàn bộ luồng live/WebGL đã được kiểm thử.

### 1.1. Các nhánh chẩn đoán cần kiểm tra

| Khả năng | Cách xác minh trong repository/runtime |
| --- | --- |
| Browser đang dùng WebGL build trước khi thêm marker | So sánh build/release ID, URL loader/data/wasm, thời điểm build; kiểm tra bridge handler trong player thật. Build Next.js không biên dịch lại C# Unity. |
| Web có list nhưng Unity chưa nhận/apply payload | Theo dõi generation, handler được gọi, accepted count và số marker view thực tạo. Badge `FloorDetail ready` chưa đủ. |
| Cluster tại `(0,0)` bị chìm trong model/che khuất | Xem anchor local/world, root transform, active camera, projected position, layer/depth; dùng diagnostic tạm trong Editor. |
| Sprite không load hoặc quá nhỏ | Kiểm tra path `Resources.Load<Sprite>()`, importer Sprite, `.meta`, alpha, kích thước và renderer thực tế trong WebGL. |
| Manager gắn sai scene/root hoặc bị clear bởi UI mode khác | Kiểm tra vòng đời manager, generation, tab IoT/thủ công, object filter và message clear cũ. |
| Camera/frame hiển thị không dành đủ chỗ cho floor | Kiểm tra ở lần vào tầng mới và Home/reset, viewport thật sau khi đóng panel lớn. Không suy từ một ảnh đang pan rằng camera controller cần viết lại. |

Các mục này là giả thuyết kiểm tra, không phải lỗi đã được chứng minh. Sửa renderer theo yêu cầu dưới đây đồng thời ghi lại root cause đã tìm thấy.

## 2. Những quyết định được sửa và những ràng buộc còn hiệu lực

| Chủ đề | Yêu cầu cập nhật |
| --- | --- |
| Giao diện chính | Icon đặt trên mặt bằng 3D, nhìn thấy ngay sau load; drawer/list mặc định đóng. |
| Cluster mặc định | Không dùng duy nhất badge “10” + list để thay toàn bộ icon trong cảnh demo tham chiếu. |
| Tọa độ upstream toàn 0 | Bổ sung **bố trí hiển thị TEST có cấu hình riêng** cho snapshot chưa có vị trí, để trình diễn nhiều icon trên floor. Không sửa dữ liệu nguồn. |
| Vị trí có dữ liệu sử dụng được | Vẫn dùng `(install_x, 0, install_y)` trong floor-local với pivot `Vector3.zero`. |
| Renderer | Ưu tiên icon UI được chiếu từ anchor 3D trong Unity, rõ nét và ổn định về kích thước. Xem mục 5. |
| Chọn thiết bị | Click marker trên mô hình → highlight + thông tin gọn; list không phải điều kiện để marker xuất hiện. |
| Camera/layout | Floor nằm vừa vùng trung tâm ở initial view/Home; giữ Orbit Map Camera hiện hữu. |
| Manual coordinates tab | Không mở trong luồng IoT mặc định; không để gọi persistence hoặc clear/ghi đè marker IoT. |

Giữ nguyên các ràng buộc gốc:

- Chỉ NestJS gọi upstream `GET /api/v1/devices`; token server-side; không gọi mutation hoặc detail fan-out.
- Fetch mới mỗi lượt load tầng; không lưu dữ liệu IoT/tọa độ/override/fetchedAt vào database.
- Tầng TEST vẫn `E/4`, `E/6` theo `TEST_CURRENT_FLOOR_4_6_V1`; không gán `floor_level=0` thành G.
- `is_active` không điều khiển visibility, màu trạng thái, opacity hoặc kết luận online/offline/hỏng.
- Năm category nghiệp vụ + fallback vẫn được giữ. `solar`, `avc`, `nfc` chưa được tự gán thành năm category đó.
- Một Unity WebGL player, một `useUnityContext`, một HTML canvas; `AppBootstrap` giữ ownership hiện hữu; không thêm runtime/camera/scene điều hướng song song.
- Source và marker lifecycle vẫn phải chống request/payload cũ rơi vào tầng mới.

Bản cập nhật này thay yêu cầu cluster tối thiểu ở mục 5.2 và phần UX/acceptance tương ứng của plan trước. Việc cho phép bố trí TEST là **đề xuất sửa presentation cụ thể của plan này**, không phải quyết định của team IoT về tọa độ lắp đặt.

## 3. Giao diện đích và cách đọc mockup

### 3.1. Trạng thái mặc định sau load

1. Sidebar filter bên trái và điều hướng tầng bên phải giữ vai trò hiện có.
2. Floor chiếm vùng trung tâm khả dụng, không bị drawer inventory che thường trực.
3. Các icon tròn xuất hiện tại anchor hiển thị trên mặt bằng; glyph luôn dễ đọc.
4. Chỉ có một status strip gọn: số thiết bị, refresh/retry, nhãn TEST và nút “Danh sách”.
5. Chưa chọn thiết bị thì không mở popup. Click một icon mới mở card nhỏ chứa metadata đã có.

Đóng drawer không unmount data owner, không abort request đang cần và không clear markers. Tách vòng đời fetch/bridge khỏi trạng thái mở/đóng panel; giữ `FloorDetailDeviceSection.client.tsx` hoặc owner tương đương luôn hoạt động trong route.

### 3.2. Thiết kế icon

- Icon dạng badge tròn, nền màu theo category, glyph trắng/sáng, viền tương phản mảnh; có shadow nhẹ để đọc được trên sàn sáng/tối.
- Mục tiêu khởi điểm ở desktop: đường kính nhìn thấy khoảng **28–36 CSS px**, hit area khoảng **40–44 CSS px**. Đây là thông số thiết kế đề xuất, phải đo trong browser chứ không lấy số Unity units tương ứng.
- Kích thước không phóng to/thu nhỏ mạnh theo khoảng cách camera. Selected có vòng viền rõ; hover có nhãn gọn, không biến thành status sức khỏe.
- Không dùng emoji hoặc ảnh icon trong list làm bằng chứng marker trên floor đã render đúng.
- Không gắn toàn bộ ID dài bên cạnh mọi icon ở trạng thái idle; chỉ hiện khi hover/select/list.

Giữ hình dạng/category trong báo cáo họp: đồng hồ nước, nhiệt độ/độ ẩm, Smart Building, RF UHF, camera. Bộ mockup có CO₂/khói và nhiều màu nhưng chưa phải taxonomy/data contract của phase này. **Live snapshot hiện tại có thể gồm toàn icon fallback**, vẫn phải đạt bố cục marker trên mô hình. Preview đủ năm icon nghiệp vụ được kiểm tra bằng fixture riêng, có nhãn rõ.

### 3.3. Popup và panel phụ

- Click marker: highlight đúng `deviceId`, mở card gọn ở vùng không che nhiều mô hình, hiện ID, raw type/category và nhãn nguồn vị trí TEST/API.
- Chỉ một popup tại một thời điểm; đóng popup không xóa marker; đổi tầng xóa selection.
- Dùng cơ chế event selection đang có. Nếu hiện chỉ có `DeviceMarkerGroupClicked`, bổ sung single-device selection hoặc dùng payload group một phần tử với contract rõ, không tạo hai nguồn selected state cạnh tranh.
- “Danh sách” là drawer đóng mặc định, mở theo nhu cầu. Click dòng trong list chọn/highlight marker tương ứng, nhưng fetch/render không phụ thuộc drawer.
- Không hiển thị chart, nhiệt độ mẫu, tên phòng bịa hoặc các chỉ số “Bình thường/Cảnh báo/Mất kết nối”.

## 4. Tách tọa độ nguồn và bố trí hiển thị TEST

### 4.1. Vì sao cần tách

Nếu mười thiết bị đều có nguồn `(0,0)`, mười icon theo tọa độ API sẽ chồng ở pivot. Chỉ sửa shader/kích thước không tạo ra bố cục nhiều vị trí như ảnh 2. Phải phân biệt:

| Khái niệm | Nguồn | Có sửa dữ liệu IoT không? |
| --- | --- | --- |
| `sourceLocation` | JSON upstream nguyên bản | Không. |
| `sourceAnchorLocal` | Mapper `(x,0,y)` từ pivot prefab | Không; là phép chuyển tọa độ nguồn. |
| `displayAnchorLocal` | `sourceAnchorLocal` hoặc cấu hình TEST riêng | Chỉ phục vụ hiển thị. |
| `screenPosition` | Chiếu display anchor bằng active camera | Chỉ phục vụ vẽ icon. |

### 4.2. Hai chế độ vị trí hiển thị

| Chế độ | Hành vi |
| --- | --- |
| `SOURCE_ANCHORS` | Dùng source anchor đúng quy ước đang có. Zero vẫn là tọa độ hợp lệ; không tự kết luận là thiếu. |
| `TEST_LAYOUT_PREVIEW_V1` | Dùng danh sách anchor TEST được author trên prefab thật cho các record snapshot đã xác định chưa có vị trí. Nhãn UI: **“TEST — Vị trí minh họa”**. |

**Mặc định cho lượt demo sửa giao diện:** bật `TEST_LAYOUT_PREVIEW_V1` trên E/4 và E/6 cho các thiết bị snapshot đã biết toàn 0. Dữ liệu device vẫn lấy từ API; chỉ display anchor lấy từ config minh họa. Ghi rõ trong handoff: `device source = IoT API`, `floor mapping = TEST`, `display layout = TEST`. Không gọi toàn bộ đó là vị trí live thật.

Agent phải author anchor bằng prefab thật trong repository: chọn các điểm trên vùng sàn, gần phòng/hành lang hoặc vị trí nhìn rõ giống tinh thần mockup. Chưa có prefab tại phiên lập plan nên tài liệu này **không cung cấp các bộ tọa độ giả như thể đã đo trên model**.

Quy tắc author:

- Cấu hình riêng cho E/4 và E/6, đặt tại module/config presentation của Unity; không đổi mapper NestJS hoặc JSON API.
- Key ổn định bằng `(buildingId, floorId, deviceId)`, không gán theo thứ tự response. Reorder API không làm các icon đổi chỗ.
- Với 10 thiết bị hiện tại, chuẩn bị 10 display anchor riêng cho mỗi prefab có sẵn. Không random mỗi lần mở, không đặt theo pixel viewport, không tự gán tên phòng hoặc loại cảm biến.
- Mỗi entry ghi expected source snapshot `(x=0,y=0,floorLevel=0)` để tránh override một vị trí mới đã thay đổi. Khi source tuple không còn khớp, bỏ entry TEST cho record đó và dùng source mapper, đồng thời ghi diagnostic. Floor/coordinate mapping vẫn giữ TEST đến khi contract chính thức được chốt.
- Config có `layoutVersion`, source note và nhãn TEST; chỉ nhận record thực có trong response hiện tại. Xóa device khỏi API thì marker tương ứng cũng biến mất.
- Thiết bị mới không có entry: dùng source anchor; nếu bị trùng, dùng cách tách trên màn hình bên dưới. Không tạo fake device hoặc tự chia category.
- Author điểm nằm trên sàn thực, giữ origin và root transform. `displayAnchorLocal.y` có thể dùng cao độ mặt sàn hiển thị đã kiểm tra; đó là presentation data, không elevation upstream.

Config author trong repo là tài nguyên trình diễn; response IoT và state runtime vẫn chỉ ở RAM. Không dùng bảng override Phase 04, LocalStorage hoặc API save tọa độ để thực hiện bố trí này. Khi API ổn định, tắt một chế độ để quay về `SOURCE_ANCHORS`, không sửa renderer.

### 4.3. Cùng tọa độ và cùng vị trí trên màn hình

Trong `SOURCE_ANCHORS`, thiết bị cùng anchor vẫn phải có cách chọn riêng. Với tập nhỏ như 10 devices, dùng fan/spiderfy gọn quanh điểm chiếu, có leader line về anchor; mở tự động cho group trùng trong demo hoặc khi người dùng chọn group. Offset chỉ tính trên màn hình, không sửa source/display anchor.

Ở `TEST_LAYOUT_PREVIEW_V1`, initial view phải nhìn thấy từng icon trên các anchor đã author; **không collapse 10 record thành một badge ngay khi load**. Nếu sau khi orbit/zoom các điểm chiếu đè nhau, giải quyết overlap cục bộ mà vẫn cho truy cập từng ID. Không tạo thuật toán clustering diện rộng hoặc hệ thống quản lý vị trí mới cho scope nhỏ này.

## 5. Render icon như annotation của mô hình

### 5.1. Hướng triển khai ưu tiên

Giữ `DeviceMarkerManager` làm owner dữ liệu, selection và filter. Dùng **Unity UI overlay được chiếu từ anchor 3D** làm view của từng marker: marker gắn với world point của floor nhưng được vẽ bằng `Image` trên UI Canvas trong Unity, để có diện mạo tròn/rõ và không bị sàn che như một sprite đặt ở cao độ 0.

Đây là Unity UI Canvas bên trong player hiện hữu, **không phải tạo thêm HTML canvas hoặc Unity runtime**. Ưu tiên tái sử dụng Canvas UI phù hợp nếu đã có; nếu thêm, Canvas thuộc lifetime scene FloorDetail, root UI không bị scale cùng floor prefab, không thêm `DontDestroyOnLoad` owner. Vẫn giữ tham chiếu floor instance để tính anchor.

Có thể giữ renderer billboard đang có nếu agent chứng minh bằng WebGL rằng nó đạt đầy đủ kích thước, visibility, interaction và tracking bên dưới với thay đổi ít hơn. Chọn một renderer thực sự hoạt động, không render SpriteRenderer và UI marker trùng nhau. Không chỉ tăng `sortingOrder` rồi kết luận đã sửa mọi lỗi depth/layer.

Unity mô tả Screen Space Overlay là UI vẽ trên scene; các render mode và đặc điểm của Canvas có trong [Unity UI Canvas](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/UICanvas.html). Kiểm tra package UI thực tế trong repository, không upgrade chỉ để khớp phiên bản tài liệu tham khảo.

### 5.2. Projection và thứ tự cập nhật

```csharp
// Pseudocode: dùng các tham chiếu và lifetime thực tế của repository.
Vector3 anchorWorld = floorRoot.TransformPoint(displayAnchorLocal);
Vector3 screenPoint = floorCamera.WorldToScreenPoint(anchorWorld);

// Kiểm tra depth, camera viewport và vùng viewer trước khi hiển thị.
// Không clamp một marker sau camera thành icon ở mép màn hình.
bool visible = IsInsideUsableView(screenPoint, floorCamera);
if (visible && RectTransformUtility.ScreenPointToLocalPointInRectangle(
        markerLayerRect, screenPoint, null, out Vector2 pointInLayer))
{
    // marker RectTransform dùng anchors/pivot phù hợp với local space của layer.
    markerRect.anchoredPosition = pointInLayer + presentationOffset;
}
```

`WorldToScreenPoint` chuyển world point sang pixel screen và trả depth so với camera; không gán thẳng local X/Z vào UI position. Xem [Unity Camera.WorldToScreenPoint](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Camera.WorldToScreenPoint.html).

Với Canvas Screen Space Overlay, `ScreenPointToLocalPointInRectangle` dùng camera argument `null`; kết quả `true` chỉ cho biết phép chiếu lên mặt phẳng RectTransform thành công, không chứng minh điểm nằm trong hình chữ nhật. Phải kiểm tra clipping riêng. Xem [Unity RectTransformUtility](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransformUtility.ScreenPointToLocalPointInRectangle.html).

Yêu cầu triển khai:

- Bind active FloorDetail camera rõ ràng từ scene/controller; không giữ `Camera.main` của Campus sau scene transition.
- Cập nhật projection sau khi orbit camera cập nhật transform; kiểm tra script update order để tránh marker trễ/jitter một frame.
- Marker UI layer có transform/anchors/pivot thống nhất; chuyển qua RectTransformUtility để xử lý CanvasScaler, không đoán công thức từ `Screen.width/2`.
- Kiểm tra trước/sau camera, near/far range, camera pixelRect và viewport khả dụng. Icon ngoài view bị ẩn; không nhân bản ở cạnh màn hình.
- Tính một lần phép transform root: không vừa parent world anchor dưới scaled floor vừa apply `TransformPoint` thêm lần nữa.
- HTML canvas trên Mac Retina có thể khác kích thước CSS; kiểm tra ở DPR 1 và 2. Scale marker theo kích thước nhìn thấy mong muốn, không nhân DPR thêm nếu CanvasScaler/pipeline đã xử lý.
- Bridge chỉ mang danh sách/config/selection và thay đổi viewport nếu cần. Không gửi tọa độ mọi icon qua JS mỗi frame khi Unity đã có camera và anchor.
- Icon là annotation hiển thị trên geometry, không cast shadow/không bị ánh sáng làm biến màu. Việc nhìn xuyên tường trong viewer tầng là lựa chọn presentation của phase này; không tuyên bố line-of-sight vật lý.

### 5.3. Input và vòng đời

- Reuse EventSystem hiện hữu. Root overlay không có graphic toàn màn hình chặn pointer; chỉ icon/popup cần tương tác có raycast target.
- Background vẫn orbit/pan/zoom bình thường. Pointer bắt đầu trên icon không đồng thời khởi động camera drag; tooltip/popup không làm wheel zoom ngoài ý muốn.
- Giữ generation, building/floor và content instance khi apply/clear. Apply cùng payload không tạo thêm marker; camera/viewport thay đổi chỉ cập nhật vị trí UI, không refetch API.
- Bật/tắt `Ceilling`/`Ceiling`, `Interior`, `Wall` không deactivate marker layer hoặc làm origin thay đổi. Sensor filters chỉ đổi visible state và count của marker.
- Sang Campus hoặc unload floor: destroy/release view và bỏ subscription; không để overlay còn lại trên scene mới.

## 6. Sửa bố cục và framing vừa đủ

Ảnh hiện tại có một inventory drawer lớn cạnh filter; model nằm thấp với nhiều khoảng trống phía trên. Phải kiểm tra và sửa initial composition để mô hình và marker là trọng tâm.

- Đưa drawer list về đóng mặc định; bỏ cụm tab “IoT API / Tọa độ thủ công” khỏi presentation mặc định. Giữ manual tool cũ sau developer feature flag nếu cần, không xóa chức năng ngoài scope và không để mode đó chạy song song.
- Khi vào tầng lần đầu hoặc nhấn Home/reset, dùng floor content bounds đã có để fit model vào vùng khả dụng giữa hai sidebar, có padding cho icon. Camera fit được phép dùng bounds; **coordinate origin không đổi theo bounds**.
- Nếu sidebar đè trên canvas, truyền occupied insets/usable viewport rect theo layout đã đo, chỉ khi layout thay đổi. Không hardcode offset tương ứng ảnh 1.
- Giữ perspective/orbit camera hiện tại. Không đổi sang first-person, thêm camera render floor thứ hai, re-author model hoặc chỉnh pivot để làm bố cục.
- Không auto recenter mỗi fetch, selection hay filter toggle. Resize cần giữ trải nghiệm có kiểm soát; user đã pan/orbit thì không giật camera lại giữa thao tác.
- Mục tiêu kiểm bằng hình: ở initial/Home view, toàn bộ floor nằm trong vùng quan sát còn lại, không bị cắt đáy hoặc che bởi drawer, và các icon TEST nhìn thấy rõ. Không buộc tỷ lệ sàn giống hệt model phòng khác trong proposal.
- Giữ theme ứng dụng hiện hữu; không cần thay toàn bộ materials, bóng đổ hoặc màu sàn để đạt marker đúng.

## 7. Các tín hiệu dùng để xác minh renderer

Bổ sung diagnostic phát triển hoặc reuse event có sẵn để phân biệt:

| Số liệu | Ý nghĩa |
| --- | --- |
| `receivedDeviceCount` | Số records từ API được projection chấp nhận. |
| `markerViewCount` | Số marker view đã tạo và bind ID trong Unity. |
| `visibleMarkerCount` | Số marker đang nằm trong view, không bị filter. |
| `missingIconCount` | Số asset chưa load được; renderer phải có fallback và diagnostic. |
| Generation + building/floor + Unity build ID | Xác nhận dữ liệu và player đang kiểm tra đúng phiên bản. |

Diagnostics nằm trong dev logs/panel debug, không làm UI người dùng thành bảng technical. Count apply không thay thế kiểm tra screenshot: 10 GameObjects ở ngoài camera vẫn chưa đạt yêu cầu hiển thị.

## 8. Bản đồ file cần kiểm tra

Các path sau lấy từ handoff, **chưa xác minh tồn tại/đọc code trong phiên lập plan**. Giữ tên và conventions hiện có khi phù hợp.

| File/component được handoff ghi | Thay đổi trọng tâm |
| --- | --- |
| `UnityContent/Assets/Script/Devices/DeviceMarkerManager.cs` | Tách source/display anchor; mỗi device có marker view; bỏ cluster-only mặc định; quản lý filter/selection/lifetime. |
| `UnityContent/Assets/Script/Devices/DeviceMarkerItem.cs` | Projection/view tròn, kích thước màn hình, input và highlight; hoặc thay phần renderer theo mục 5. |
| `UnityContent/Assets/Script/Bridge/WebViewerBridge.cs` | Kiểm tra handler thực trong build; single-device click/ack nếu cần; giữ generation. |
| `UnityContent/Assets/Resources/Icons/` | Kiểm tra Sprite import/path/alpha/build inclusion; reuse icon đã làm. |
| FloorDetail scene, content host, Orbit camera | Bind camera và root đúng; UI marker layer; initial fit vùng viewport. |
| `web/src/components/devices/FloorDetailDeviceSection.client.tsx` | Data owner sống độc lập drawer; ngăn manual tab điều khiển/clear markers IoT. |
| `web/src/components/devices/FloorIotDevicePanel.tsx` | Drawer đóng mặc định, popup/selection gọn, không thay marker bằng list. |
| `web/src/components/floor/FloorFilterSidebar.tsx` | Filter tác động trực tiếp marker, giữ unknown và các object filter. |
| `web/src/components/icons/DeviceCategoryIcon.tsx`, `web/public/icons/` | Đồng bộ glyph/màu với marker Unity. |
| `web/src/types/iot-devices.ts`, `web/src/lib/iot-api.ts` | Giữ API contract; chỉ bổ sung presentation/selection type cần thiết, không đổi source coordinates. |
| `backend/src/iot/` và devices delegation | Kiểm tra regression fetch/no-store/no-persistence; không làm lại service đã hoạt động chỉ vì lỗi hiển thị. |
| TEST display-layout config mới | Tên/path theo conventions repo; floor-local anchor theo ID, layout version và expected source tuple. |

## 9. Trình tự thực hiện

### 06U-A — Tái hiện và xác định nguyên nhân

- [ ] Đọc `AGENTS.md`, handoff hiện tại và bản cập nhật này.
- [ ] Mở E/6 như ảnh 1; lưu screenshot baseline, ghi đang dùng live hay fixture.
- [ ] Xác minh Unity build đang serve; trace fetch → bridge → manager → marker view → camera.
- [ ] Kiểm tra các nhánh mục 1.1; ghi nguyên nhân đã xác minh, không chỉ liệt kê giả thuyết.

### 06U-B — Làm một marker xuất hiện đúng trên mô hình

- [ ] Dùng một anchor kiểm thử đã biết trên prefab thật để tách vấn đề render khỏi data toàn 0.
- [ ] Kiểm tra asset, camera, projection, screen size, depth và click.
- [ ] Orbit/pan/zoom: marker bám cùng anchor, glyph rõ, không mất do sàn hoặc đổi camera.
- [ ] Sau khi một marker đạt, nối toàn bộ danh sách qua manager hiện có. Diagnostic marker không được còn trong live build.

### 06U-C — Bố trí TEST và xử lý trùng

- [ ] Author display anchor E/4, E/6 theo ID thực có trong snapshot; giữ dữ liệu nguồn nguyên vẹn.
- [ ] Bật `TEST_LAYOUT_PREVIEW_V1` cho demo này, nhãn “TEST — Vị trí minh họa”.
- [ ] Kiểm tra reorder/remove/new ID và source tuple thay đổi.
- [ ] Có cách quay về `SOURCE_ANCHORS` và chọn từng thiết bị ở anchor trùng; không persist override.

### 06U-D — Tinh gọn trang chi tiết tầng

- [ ] Inventory đóng mặc định, status strip gọn, click marker mở thông tin.
- [ ] Manual position UI tách khỏi normal IoT mode; đóng drawer không ngừng fetch/render.
- [ ] Kiểm tra initial/Home framing, sidebar insets, resize và pointer routing.
- [ ] Kiểm tra sensor/object filter, selection và cleanup khi đổi tầng.

### 06U-E — Build player và kiểm tra browser thật

- [ ] Compile Unity C# và chạy Editor để kiểm tra camera/UI/asset.
- [ ] Build lại Unity WebGL chứa thay đổi C#/scene/icon; chỉ rebuild Addressables nếu content/dependency thực sự thay đổi.
- [ ] Đưa artifact mới vào pipeline hiện hữu; xác minh URL/release ID/hash để browser tải đúng player, tránh tiếp tục xem build cũ.
- [ ] Chạy Next.js + NestJS với cấu hình hiện có; thử bằng browser ở route E/4 và E/6.
- [ ] Chụp before/after và ghi kết quả acceptance bên dưới. Build web thành công không thay thế gate Unity/WebGL.

### 06U-F — Cập nhật handoff

- [ ] Ghi root cause đã tìm ra, file thay đổi, renderer đã chọn, Unity/WebGL build ID, config TEST và cách tắt.
- [ ] Phân biệt dữ liệu API thật với vị trí hiển thị minh họa; ghi không có persistence/upstream mutation.
- [ ] Sửa trạng thái verification cũ cho chính xác; mỗi test phải có môi trường, kết quả và evidence.
- [ ] Nếu không có Unity hoặc không build/chạy browser được, ghi `Unity/WebGL visual verification pending`; không đánh dấu toàn bộ fix complete.

## 10. Acceptance bắt buộc

| ID | Kiểm tra | Điều kiện đạt |
| --- | --- | --- |
| U01 | Vào E/6 mới, drawer đóng | Thấy floor và từng icon từ danh sách hiện tại trên mô hình ngay sau load; không cần mở list. |
| U02 | Snapshot 10 records toàn 0 + TEST layout | 10 icon được bố trí riêng trên sàn ở initial view; ID khớp API, nhãn vị trí minh họa hiện rõ; source vẫn toàn 0. |
| U03 | E/4 | Dùng layout/prefab E/4, không reuse world points của E/6; không dùng model tầng khác. |
| U04 | Orbit, pan, zoom, Home | Marker bám anchor, giữ kích thước dễ đọc, không giật/flip/ngả theo mặt sàn; Home fit model đủ trong viewport. |
| U05 | Resize, DPR 1/2, canvas có CSS offset | Icon vẫn trùng điểm chiếu, không lệch do browser header/sidebar hoặc CanvasScaler. |
| U06 | Đóng/mở inventory, chọn icon | Marker vẫn hiện; selection đúng ID, popup gọn, không cần API detail; không refetch vì chỉ đóng/mở panel. |
| U07 | Toggle sensor/object | Sensor category chỉ ẩn/hiện marker tương ứng; Wall/Interior/Ceilling không tắt marker root; Floor luôn hiện. |
| U08 | Rapid E/4→E/6→Campus | Không marker/selection cũ, không overlay trên Campus, không stale clear hoặc apply. |
| U09 | Reorder/remove API records | ID vẫn giữ display anchor; device bị remove không còn marker; không tạo fake ID để lấp slot TEST. |
| U10 | Tắt TEST layout, source zero và nonzero | Marker dùng mapper gốc từ pivot; zero không bị coi là invalid; nhóm trùng vẫn chọn được từng ID. |
| U11 | Source tuple của entry TEST thay đổi | Entry không override dữ liệu mới; dùng source anchor và ghi diagnostic; không tự xác nhận calibration. |
| U12 | `is_active` đổi true/false | Không đổi icon visibility, sức khỏe, opacity hoặc category. |
| U13 | Unknown type và asset lỗi | Unknown dùng fallback; missing asset không làm thiết bị mất âm thầm. Preview 5 category tách khỏi live data. |
| U14 | API error/empty | Không dựng fake marker hoặc fallback tự động sang fixture; floor còn dùng được, trạng thái đúng. |
| U15 | Camera interaction/occlusion | Click icon không đồng thời drag camera; khoảng trống vẫn drag được; icon không chìm trong geometry; marker sau camera không hiện ở mép. |
| U16 | Network/persistence regression | Fetch mới mỗi floor load; không DB write, không upstream mutation/detail fan-out, không lộ token. |
| U17 | Browser đang tải đúng Unity build | Có build ID/URL bằng chứng và screenshot marker từ WebGL thật; unit test/backend build không đủ. |

Không cần viết test mới cho mọi pixel. Giữ các test backend/web hữu ích, thêm test trọng điểm cho source/display separation và state lifecycle nếu sửa. Phần render phải kiểm tra trực quan và tương tác thực trên WebGL.

### 10.1. Evidence phải bàn giao

1. Screenshot E/6 ở initial/Home view, drawer đóng, các marker và badge TEST rõ.
2. Screenshot E/4 với bố trí đúng prefab của tầng đó.
3. Screenshot đã chọn một marker, popup đúng ID, không dữ liệu cảm biến giả.
4. Clip ngắn orbit/pan/zoom hoặc chuỗi ảnh có anchor xác định, cho thấy marker bám mô hình.
5. Screenshot debug hoặc log gọn xác nhận số received/created/visible và Unity build ID; không chứa credential.
6. Kết quả build Unity/WebGL, các test liên quan và bảng những gate chưa chạy.

**Definition of Done:** người dùng có thể nhìn thấy và chọn thiết bị trên mặt bằng như ngôn ngữ thị giác của ảnh 2; list chỉ hỗ trợ tra cứu. Một panel liệt kê đủ thiết bị, một cluster count ở tâm hoặc các test TypeScript pass đều không thay thế bằng chứng này.

## 11. Các phần không mở rộng trong bản sửa

Không dựng dashboard telemetry, video camera, trạng thái sức khỏe, room database hoặc room labels giả; không sửa toàn bộ lighting/shadow; không refactor NestJS/data schema; không triển khai persistent custom positions. Icon chuẩn bị đầy đủ không có nghĩa live source đã xác nhận mapping category. Mục tiêu là sửa hiển thị trên mô hình, giữ dữ liệu trung thực và làm rõ presentation TEST để thay được sau.

Tài liệu được lập từ ảnh, proposal và implementation handoff. Chưa có thay đổi code hoặc thao tác với IoT backend trong phiên lập bản cập nhật này.
