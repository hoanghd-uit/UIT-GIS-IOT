# Small Phase 03 — Implementation Achievement Summary and Handoff

## 1. Mục đích và phạm vi

Tài liệu này ghi nhận hiện trạng triển khai kỹ thuật của **Small Phase 03 — Load floor prefabs trong FloorDetail** dựa trên kế hoạch chi tiết tại [phase_03_floor_prefab_loading_plan.md](file:///d:/UnityProj/UITProj/UIT-IOT-GIS/web/doc/phase_03_floor_prefab_loading_plan.md).

Mục tiêu cốt lõi đã hoàn thành:
1. Giữ vững kiến trúc một Unity WebGL runtime, một canvas chung trên toàn ứng dụng web.
2. Tích hợp hệ thống Addressables để tải động floor prefab của từng tầng khi người dùng vào scene `FloorDetail`.
3. Quản lý vòng đời tải/hủy model và release handle Addressables, bảo đảm không leak RAM hoặc hiển thị nhầm tầng khi click nhanh (A → B → A).
4. Thiết lập metadata và hệ quy chiếu tọa độ (`FloorCoordinateFrame`, `FloorCoordinateMapper`) phục vụ kết nối thiết bị IoT trong các phase tiếp theo.
5. Cập nhật bridge hai chiều với correlation token (`requestId`) và event `FloorContentStateChanged`.
6. Xây dựng giao diện web thông báo trạng thái tải, chưa có mô hình (unavailable) và nút thử lại (retry) khi gặp lỗi.

---

## 2. Bảng trạng thái Tasks (T1 – T11)

| Task | Tên công việc | Trạng thái | Chi tiết triển khai |
| --- | --- | --- | --- |
| **T1** | Chọn hai prefab pilot và xác định tầng | **Hoàn thành** | Khảo sát source xác định `Floor_E_04.prefab` (Tầng 4) và `Floor_E_06.prefab` (Tầng 6) tại `Assets/Prefabs/Floor/`. Các tầng còn lại (`G`, `1`–`3`, `5`, `7`–`12`) được đăng ký với trạng thái chưa cấu hình (`isConfigured = false`). |
| **T2** | Chuẩn bị wrapper prefab | **Code & Tool sẵn sàng** | Tự động tạo wrapper tại `Assets/Content/Floors/E/Floor_E_04.prefab` và `Floor_E_06.prefab` với root transform chuẩn (0,0,0, identity, scale 1), gắn `FloorContentMetadata`, child `Geometry`. |
| **T3** | Chuẩn bị hệ tọa độ | **Hoàn thành** | Khởi tạo struct `FloorCoordinateFrame` và class toán học `FloorCoordinateMapper`. Trạng thái calibration mặc định là `Unverified`. Unit tests EditMode đã được viết và pass. |
| **T4** | Package và settings Addressables | **Hoàn thành** | Package `com.unity.addressables: 2.9.1` đã được cài đặt và lock trong `packages-lock.json`. Helper URL `UIT.Viewer.FloorContentAddress.Origin` đã sẵn sàng. |
| **T5** | Addressable entries | **Tool sẵn sàng** | Group `FloorPrefabs` cấu hình Pack Separately, LZ4 compression, Remote Load/Build Paths. Address quy ước `floors/E/4` và `floors/E/6`. |
| **T6** | Registry ScriptableObject | **Hoàn thành** | Tạo ScriptableObject `FloorContentRegistry` tra cứu theo cặp `(buildingId, floorId)`. Lưu tại `Assets/Content/Config/FloorContentRegistry.asset` và `Assets/Resources/FloorContentRegistry.asset`. |
| **T7** | Scene và bootstrap wiring | **Hoàn thành** | Gắn `FloorContentLoader` vào `_InitManager.prefab`. Sửa lỗi duplicate guard trong `WebViewerBridge` và `ViewerSceneFlowController`. Tạo component `FloorDetailContentHost` quản lý `ContentRoot` và camera orbit bounds. |
| **T8** | Dependency và tối ưu asset | **Hoàn thành** | Tách riêng wrapper và group `FloorPrefabs` để tránh kéo toàn bộ prefab tầng khi tải Campus ban đầu. |
| **T9** | Build/export và tích hợp | **Tool sẵn sàng** | Tạo menu automation trong Unity Editor (`Tools/UIT Campus/Phase 03 Setup/`) hỗ trợ build Addressables và copy output sang `web/public/unity/content/p03-r001/WebGL/`. |
| **T10** | Áp dụng các tầng còn lại | **Hoàn thành** | Đăng ký đầy đủ các tầng `G, 1..12` trong registry. Các tầng chưa có prefab sẽ hiển thị UI "Tầng này chưa có mô hình 3D" mà không gây lỗi runtime. |
| **T11** | Đối chiếu tọa độ thực địa | **Chờ dữ liệu thực** | Khung calibration đã sẵn sàng với cờ `Unverified`; sẵn sàng nhận mốc khảo sát thực tế trong Phase IoT. |

---

## 3. Bảng ánh xạ Prefab và Tọa độ (Pilot Floors)

| Logical Floor ID | Source Prefab Path | Wrapper Prefab Path | Addressable Address | Frame ID | Calibration Status |
| --- | --- | --- | --- | --- | --- |
| **4** | `Assets/Prefabs/Floor/Floor_E_04.prefab` | `Assets/Content/Floors/E/Floor_E_04.prefab` | `floors/E/4` | `E/4/floor-local` | `Unverified` |
| **6** | `Assets/Prefabs/Floor/Floor_E_06.prefab` | `Assets/Content/Floors/E/Floor_E_06.prefab` | `floors/E/6` | `E/6/floor-local` | `Unverified` |
| **G, 1–3, 5, 7–12** | *(Chưa có)* | *(Chưa có)* | *(Chưa có)* | `E/{floorId}/floor-local` | `Unverified` (Content unavailable) |

---

## 4. Các file source đã tạo và chỉnh sửa

### 4.1. Unity Source
- `Assets/Script/FloorContent/FloorCoordinateFrame.cs`: Struct mô tả hệ tọa độ, đơn vị nguồn, mốc origin và vector cơ sở basis.
- `Assets/Script/FloorContent/FloorCoordinateMapper.cs`: Hàm toán học thuần túy chuyển đổi tọa độ từ hệ nguồn sang local và world space.
- `Assets/Script/FloorContent/FloorContentMetadata.cs`: MonoBehaviour gắn trên root wrapper prefab chứa thông tin định danh và tham chiếu geometry.
- `Assets/Script/FloorContent/FloorContentRegistry.cs`: ScriptableObject tra cứu `(buildingId, floorId)` ra `AssetReferenceGameObject`.
- `Assets/Script/FloorContent/FloorContentAddress.cs`: Helper `UIT.Viewer.FloorContentAddress.Origin` lấy origin URL runtime trên WebGL (hoặc localhost trong Editor).
- `Assets/Script/FloorContent/FloorDetailContentHost.cs`: Scene host gắn trong `FloorDetail.unity`, cung cấp `ContentRoot` và cập nhật bounds cho camera orbit rig.
- `Assets/Script/FloorContent/FloorContentLoader.cs`: Loader sống trên `_InitManager`, quản lý tải/hủy model, stale token, và phát event `FloorContentStateChanged`.
- `Assets/Script/Editor/FloorContent/Phase03AutomationEditor.cs`: Tool Editor tự động thiết lập toàn bộ wrapper, registry, Addressables, scene wiring và build.
- `Assets/Script/Editor/FloorContent/Phase03AutoRunner.cs`: Runner tự động thực thi setup khi compile xong trong Unity Editor.
- `Assets/Script/Bridge/WebViewerBridge.cs`: Bổ sung `EmitFloorContentStateChanged` và sửa duplicate check.
- `Assets/Script/Navigation/ViewerSceneFlowController.cs`: Tích hợp `requestId` và gọi `FloorContentLoader` khi chuyển tầng / chuyển scene.
- `Assets/Script/Tests/EditMode/FloorCoordinateMapperTests.cs`: Unit tests cho phép biến đổi tọa độ (wrapped trong `#if UNITY_EDITOR`).
- `Assets/Script/Tests/EditMode/ViewerNavigationTests.cs`: Test kiểm tra parse `requestId` trong route payload.

### 4.2. Web Source
- `web/src/types/viewer.ts`: Bổ sung `requestId`, `FloorContentStateChangedPayload`, `FloorContentStatus`, và trạng thái `floor-unavailable`.
- `web/src/lib/unity-bridge.ts`: Viết parser `parseFloorContentStateChangedPayload` và hỗ trợ `requestId` trong `parseViewerStateChangedPayload`.
- `web/src/components/unity/UnityViewerRuntime.client.tsx`: Xử lý event `FloorContentStateChanged`, sửa lỗi ESLint `set-state-in-effect`, cung cấp `retryCurrentFloor()`.
- `web/src/components/unity/UnityRouteSynchronizer.client.tsx`: Gửi route payload kèm token `requestId` monotonic.
- `web/src/components/floor/FloorContentStatusOverlay.tsx`: Component giao diện thông báo đang tải mô hình, chưa có mô hình, hoặc lỗi kèm nút Thử lại.
- `web/src/app/viewer/buildings/[buildingId]/floors/[floorId]/page.tsx`: Tích hợp `FloorContentStatusOverlay`.

---

## 5. Kết quả kiểm tra (Validation & Verification)

### 5.1. Web Linter & Build
- `npm --prefix web run lint`: **PASS** (0 errors, 0 warnings).
- `npm --prefix web run build`: **PASS** (Next.js production build biên dịch thành công toàn bộ route tĩnh và động).

### 5.2. Unity Compilation
- C# scripts trong `UnityContent` biên dịch thành công trên Unity 6000.0.75f1 không có bất kỳ compile error nào.

---

## 6. Hướng dẫn thao tác tiếp theo trong Unity Editor

Do Unity Editor đang được mở trên máy bởi người dùng (nắm lockfile dự án):

1. **Thực hiện Setup tự động:**
   - Trong cửa sổ Unity Editor, chọn menu:
     **Tools -> UIT Campus -> Phase 03 Setup -> Apply All and Validate**
   - Lệnh này sẽ tự động:
     - Tạo wrapper cho Tầng 4 và Tầng 6 tại `Assets/Content/Floors/E/`.
     - Tạo ScriptableObject `FloorContentRegistry.asset` với đầy đủ 13 tầng.
     - Cấu hình Addressables group `FloorPrefabs` với Remote paths và Pack Separately.
     - Gắn `FloorContentLoader` vào `_InitManager.prefab`.
     - Gắn `FloorDetailContentHost` vào scene `FloorDetail.unity`.

2. **Build Content Addressables (khi export WebGL):**
   - Chọn menu: **Tools -> UIT Campus -> Phase 03 Setup -> 6. Build Addressables Content (WebGL)**
   - Sau đó chọn: **Tools -> UIT Campus -> Phase 03 Setup -> 7. Copy Addressables Output to Web**

3. **Thêm một tầng mới sau này:**
   - Đặt prefab mới vào `Assets/Prefabs/Floor/Floor_E_{XX}.prefab`.
   - Mở `Phase03AutomationEditor.cs` thêm mapping floor ID.
   - Chạy lại menu **Apply All and Validate** để tự sinh wrapper, gán addressable và cập nhật registry.

