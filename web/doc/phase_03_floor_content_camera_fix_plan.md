# Phase 03 — Sửa vòng đời tải floor content và khởi tạo camera

Ngày khảo sát: **2026-09-11**. Trạng thái: **Investigation hoàn thành ở mức source/serialized assets; kế hoạch chờ implement**.

Yêu cầu: điều tra lỗi `CampusViewBounds` / `CampusOrbitCameraController` sau Phase 03, đề xuất giải pháp và handover cho agent sửa. Lượt viết tài liệu này không sửa C#, scene, prefab, cấu hình web hoặc build output; chưa chạy Play Mode hay tái hiện trên trình duyệt.

## 1. Kết luận và phạm vi bản sửa

Nguyên nhân trực tiếp nằm ở **FloorDetail chuyển từ model tĩnh sang prefab tải bất đồng bộ, nhưng bounds/camera vẫn khởi tạo theo giả định model có sẵn khi scene mở**. Scene hiện lưu `campusVisualRoot = null`; `CampusViewBounds.Awake()` tính bounds ngay và báo lỗi. Controller thử lại trong `Start()`, vẫn thất bại rồi tự disable. Tool Phase 03 tìm được các component nhưng chưa thực sự serialize reference vào host.

Có thêm ba lỗi liên quan phải sửa cùng để tầng có prefab hoạt động sau khi hết lỗi khởi tạo:

1. Loader lấy token trước khi gọi hàm unload tăng token lần nữa: **mọi lượt load mới đi qua nhánh này đều tự trở thành stale**, dù không có request mới.
2. Sau instantiate, loader truyền metadata của **prefab asset** cho camera thay vì metadata của **instance đã gắn vào scene**.
3. Host bật lại controller và gọi fit, nhưng không tính lại zoom limits; `Start()` đã chạy sẽ không tự chạy lại. Đổi floor cũng cần tính lại các giới hạn theo geometry mới.

Route trong log là `E/3`. Registry hiện chỉ cấu hình prefab cho **E/4 và E/6**; **E/3 có `isConfigured: 0`**. Kết quả đúng của E/3 là UI “Tầng 3 chưa có mô hình 3D”, camera ở trạng thái chờ yên ổn, không phải tự tạo/gán model tầng khác.

Giải pháp được đề xuất: giữ kiến trúc hiện có, thêm khởi tạo camera có thể hoãn và thực hiện lại khi content sẵn sàng, sửa quyền sở hữu token/handle của loader, bind camera bằng instance thực, và sửa tool setup để scene lưu đủ reference. Sau sửa source, cần xuất player WebGL mới để trình duyệt chạy code mới.

## 2. Baseline và bằng chứng

### 2.1. Nguồn được đối chiếu

- HEAD lúc khảo sát: `06439eb6ff4e076c9bf1a02e5a8c35623737b70c` — `Implement navigate to floor detail feature`.
- Phase 03 chủ yếu đang ở working tree: có nhiều file modified/untracked, kể cả scene, scripts, Addressables và public player. **Không dùng HEAD riêng lẻ làm baseline sửa và không reset các thay đổi đó.**
- Unity `6000.0.75f1`; Addressables `2.9.1`; Unity Test Framework `1.6.0` theo project/manifest hiện tại.
- Kế hoạch gần nhất: [phase_03_floor_prefab_loading_plan.md](D:/UnityProj/UITProj/UIT-IOT-GIS/web/doc/phase_03_floor_prefab_loading_plan.md).
- Handoff gần nhất: [phase_03_implementation_handoff.md](D:/UnityProj/UITProj/UIT-IOT-GIS/web/doc/phase_03_implementation_handoff.md). Các khẳng định “hoàn thành/PASS” trong handoff cũ không thay thế kiểm chứng source và runtime của bản sửa này.
- Scene List trên đĩa vẫn đúng: `Assets/Scene/Campus.unity` trước, `Assets/Scene/FloorDetail.unity` sau, cả hai enabled. Chưa xác minh override của active Build Profile trong Editor.

Các link source dưới đây dùng dòng tại thời điểm khảo sát; agent tìm lại theo tên method/property nếu file đã đổi.

### 2.2. Findings đã xác nhận

| ID | Bằng chứng | Hệ quả |
| --- | --- | --- |
| F1 — trực tiếp | [FloorDetail.unity:1374](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Scene/FloorDetail.unity:1374): `CampusViewBounds` trên `FloorDetailCameraContext` lưu `campusVisualRoot: {fileID: 0}`. Ở HEAD cũ, cùng component `1048108370` trỏ `1560320219`, transform của `MainOffice`; root cũ không còn trong scene hiện tại. | Bounds không có geometry để đo lúc scene mở. Việc bỏ model tĩnh phù hợp Phase 03, nhưng phần khởi tạo camera chưa được chuyển theo. |
| F2 — trực tiếp | [CampusViewBounds.cs:25](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Script/Camera/CampusViewBounds.cs:25) luôn `CalculateBounds()` trong `Awake`; [CampusOrbitCameraController.cs:194](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Script/Camera/CampusOrbitCameraController.cs:194) thử tính lại và disable khi không có bounds. | Giải thích hai thông báo người dùng gửi; root có thể bị log lỗi cả trong Awake và Start. |
| F3 — setup thiếu wiring | [FloorDetail.unity:2055](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Scene/FloorDetail.unity:2055): cả `contentRoot`, `campusViewBounds`, `orbitCameraController` của host đều null. [Phase03AutomationEditor.cs:385](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Script/Editor/FloorContent/Phase03AutomationEditor.cs:385) tạo child, tìm `bounds`/`orbit` nhưng không assign vào host. | Host dựa vào `transform.Find`/`FindAnyObjectByType` khi chạy. `ValidateSetup()` chỉ kiểm wrappers/registry/group nên vẫn có thể báo PASSED với scene wiring hỏng. |
| F4 — chặn mọi load mới | [FloorContentLoader.cs:149](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Script/FloorContent/FloorContentLoader.cs:149) lấy `currentToken = ++_loadTokenCounter`, rồi gọi unload; [dòng 231](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Script/FloorContent/FloorContentLoader.cs:231) tăng counter nữa. | Lúc completion, `token != _loadTokenCounter` luôn đúng cho lượt đó. Handle bị release, không instantiate, không emit ready/error; UI có thể đứng ở loading. Đây là lỗi độc lập với tốc độ mạng. |
| F5 — target sai object | [FloorContentLoader.cs:199](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Script/FloorContent/FloorContentLoader.cs:199) lấy metadata từ `handle.Result`; sau instantiate vẫn gọi `UpdateCameraBounds(metadata)` ở dòng 224. | Camera đo prefab asset thay vì world-space geometry của instance. Lỗi này bị F4 che khuất; chưa đo biểu hiện cụ thể trong runtime. |
| F6 — rebind chưa đầy đủ | [FloorDetailContentHost.cs:75](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Script/FloorContent/FloorDetailContentHost.cs:75) bật controller rồi gọi `FitCampusOverview`; `ComputeZoomLimits()` hiện chỉ nằm trong controller Start. | Nếu Start đã thất bại, giới hạn còn mặc định `5..500`; nếu chuyển tầng, giới hạn có thể thuộc tầng trước. Re-enable không bảo đảm tái khởi tạo. |
| F7 — dữ liệu mong đợi | [FloorContentRegistry.asset:98](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Content/Config/FloorContentRegistry.asset:98) lưu E/3 unconfigured; E/4 và E/6 configured. `_InitManager` tham chiếu chính registry này, không phải chỉ bản Resources. | E/3 phải đi tới unavailable; không dùng E/3 làm tiêu chí “phải thấy model” của bản sửa. |

Ở Campus, [Campus.unity:708](D:/UnityProj/UITProj/UIT-IOT-GIS/UnityContent/Assets/Scene/Campus.unity:708) vẫn có `campusVisualRoot: {fileID: 1285647964}`. Orbit rig của FloorDetail cũng vẫn trỏ component bounds `1048108370` qua scene override. Thiếu target của bounds khác với thiếu component bounds.

### 2.3. Trace tối thiểu của F4

```text
counter = n
LoadFloor: currentToken = ++counter     => currentToken = n+1
UnloadCurrentContent: counter++        => counter = n+2
Addressables completion:
    currentToken != counter            => true
    release handle; yield break        => không ready/error
```

Đã chạy 8 kiểm tra tĩnh trên source/scene/registry, tất cả khớp F1, F3, F4, F5, F7, và mô phỏng số học cho trace trên. Đây không phải Unity test hay bằng chứng Addressables tải thành công.

### 2.4. Rủi ro liên quan cần kiểm thử trong cùng luồng

- `LoadFloor()` tạo một coroutine cho mỗi request, chưa giới hạn một load đang chạy như mục 7.3 của plan Phase 03.
- Pending request của loader không được clear trong `UnloadCurrentContent()`. Host đăng ký trong `OnEnable`, loader tạo Instance trong `Awake`, cả hai không có thứ tự riêng: mở thẳng FloorDetail trong Editor cần kiểm thử trường hợp host có trước loader.
- `UpdateCameraBounds()` trả `void`, loader vẫn emit ready dù camera/bounds thất bại; nhánh reuse còn emit ready trước khi gọi host.
- Khi unload, host chưa xóa target/bounds của model cũ; `HasValidBounds` có thể còn true sau khi instance bị destroy.
- Web hiện chấp nhận content payload thiếu `requestId` vì chỉ so sánh khi field tồn tại. Đây là khoảng trống correlation của Phase 03, không phải nguyên nhân log camera.
- Chưa có timeout rõ ràng trong vòng chờ load; giữ loading vô hạn không đạt yêu cầu Phase 03.

`GET ... 200` chỉ cho biết route web trả thành công. Stack `_JS_Log_Dump` thuộc đường ghi log Unity; riêng log này không chứng minh lỗi Brotli, WASM hoặc HTTP tải bundle. Chưa xác nhận binary đang serve tương ứng chính xác với working tree nào; nguyên nhân source ở trên phù hợp log, nhưng browser phải được kiểm tra lại với build mới.

## 3. Quyết định triển khai

### 3.1. Giữ phạm vi

- Một Unity runtime/canvas, một `_InitManager` primary; `AppBootstrap` tiếp tục là nơi sở hữu persistence.
- Orbit rig, camera bounds, host và content instance thuộc scene; không chuyển chúng sang DontDestroyOnLoad.
- Giữ `CampusOrbitCameraController` dùng chung; Campus tiếp tục tự frame model tĩnh, FloorDetail dùng chế độ chờ content.
- Giữ `LoadAssetAsync<GameObject>` + instantiate thủ công + destroy instance + release load handle. Không trộn với `ReleaseInstance`.
- Giữ catalog tầng `G,1..12`, metadata calibration và transform geometry hiện có. Không tự author model E/3, upgrade package, sửa shader hoặc thêm IoT.
- Không dùng `WaitForSeconds` cố định hay tăng Script Execution Order để giả định download đã xong. Không quét toàn scene hoặc dùng bounds giả chỉ để che lỗi cấu hình.

### 3.2. Camera có trạng thái sẵn sàng rõ ràng

Thêm policy serialize với mặc định bảo toàn Campus, ví dụ:

| Component | Campus | FloorDetail |
| --- | --- | --- |
| `CampusViewBounds.calculateOnAwake` | `true` | `false` qua scene override |
| `CampusOrbitCameraController.initializeOnStart` | `true` | `false` qua scene override |
| `CampusOrbitCameraController.IsInitialized` | true sau khi đo thành công | false tới khi host bind content thành công |

Tên API có thể theo convention hiện tại nhưng cần cùng ngữ nghĩa:

```csharp
// Chữ ký đề xuất, chưa phải code implementation.
void CampusViewBounds.InvalidateBounds();
bool CampusOrbitCameraController.TryInitializeFromBounds(bool immediate = true);
void CampusOrbitCameraController.SuspendUntilContentReady();
bool FloorDetailContentHost.TryBindContent(FloorContentMetadata instanceMetadata,
                                         out string errorCode);
void FloorDetailContentHost.ClearContent();
```

Yêu cầu hành vi:

1. `Awake`/`Start` trong chế độ dynamic không tính bounds khi chưa có geometry và không log error cho trạng thái chờ hợp lệ. Thiếu reference cấu hình thật vẫn phải được validator/runtime báo rõ.
2. Tách resolve/validate camera, yaw/pitch và thiết lập camera ra hàm có thể gọi an toàn trước hoặc sau Start. Không phụ thuộc Start đã chạy khi host gọi API.
3. `TryInitializeFromBounds()` validate reference + bounds, tính lại min/max distance, tính overview, reset vận tốc smoothing, apply pose rồi mới đặt initialized. Mỗi content mới phải chạy đủ chuỗi này.
4. `Start()` không ghi đè pose nếu host đã initialize trước đó. Re-enable controller không phải cơ chế refresh chính.
5. Khi chưa initialized, mọi handler orbit/pan/zoom/reset, Update/LateUpdate và entrypoint focus/fit phải guard; không apply pose từ state mặc định và không xử lý input với bounds cũ.
6. Clear/unload đặt initialized=false, xóa target geometry và cache (`HasValidBounds`, bounds, radius), reset trạng thái drag/velocity. Camera component vẫn có thể render nền trong lúc UI loading/unavailable.
7. Đổi `CampusVisualRoot` phải invalidate cache trước khi đo lại. Reject bounds không hữu hạn hoặc geometry không có Renderer; không sử dụng bounds của lần trước nếu đo thất bại.
8. Re-send/reuse đúng content active không cần reset góc nhìn đang thao tác. Chỉ refresh nếu chưa initialized hoặc content thực thay đổi.

`Start()` chỉ chạy một lần trong đời component; vì vậy chuỗi refresh phải có API riêng. [Unity 6: MonoBehaviour.Start](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/MonoBehaviour.Start.html)

### 3.3. Bind instance và commit ready

Sau `LoadAssetAsync`, có thể validate ID cơ bản trên prefab asset trước. Sau instantiate phải lấy **`instance.GetComponent<FloorContentMetadata>()`** và sử dụng component đó cho bounds, state và active references.

`TryBindContent` phải kiểm tra instance thuộc đúng host scene và nằm dưới `ContentRoot`; target GeometryRoot phải thuộc instance. Getter `GeometryRoot` hiện fallback về transform: nếu schema cho phép fallback wrapper root thì phải kiểm renderer thật và vẫn giới hạn trong instance; không coi getter non-null là bằng chứng field đã được author đúng.

Trình tự commit:

```text
completion hợp lệ theo token + host + desired route
→ validate prefab
→ instantiate dưới host, đặt local transform đúng quy ước
→ lấy/validate metadata của instance
→ tính bounds từ instance, initialize camera
→ xác nhận content active và camera sẵn sàng
→ emit FloorContentStateChanged(ready, requestId hiện tại)
```

Không yield/render frame giữa instantiate chưa kiểm xong và commit. Có thể dùng staging inactive nếu phù hợp, nhưng phải xác minh renderer world bounds khi inactive; không sửa tọa độ model để làm camera fit. Nếu dùng `CameraBoundsOverride`, xác định rõ local/world space và biến đổi theo instance; nếu không có asset dùng override thì không mở rộng chức năng đó trong bản sửa.

Bind thất bại: dọn instance/handle đúng một lần, camera về pending, emit error có correlation; không emit ready. Mã đề xuất: `FLOOR_HOST_INVALID`, `FLOOR_GEOMETRY_INVALID`, `FLOOR_CAMERA_INIT_FAILED`. Dùng fields đang có `errorCode`/`errorMessage`, không tạo contract song song `code/message` cho content event.

### 3.4. Loader quản lý request và cleanup riêng biệt

Tách hai việc hiện đang gộp trong `UnloadCurrentContent()`:

- Invalidate desired request/in-flight generation: xảy ra khi có intent mới, rời floor, host mất hoặc teardown.
- Retire active instance/handle: dọn content cũ, **không âm thầm tăng token của request vừa tạo**.

Có thể sửa thứ tự `UnloadCurrentContent(); token = ++counter;` để chứng minh F4 hết, nhưng bản hoàn chỉnh cần một đường tăng generation rõ ràng, tránh caller tiếp tục gây lỗi này. Giữ public unload nếu scene-flow đang dùng; hàm public đó gọi cancel + cleanup với semantics được ghi rõ.

Worker tối thiểu:

1. Lưu desired selection gồm building, floor, requestId và generation; tối đa một Addressables floor operation đang chạy.
2. Request mới thay desired selection. Clear/suspend camera và retire content cũ khi chuyển floor. Nếu operation cũ chưa xong thì giữ ownership tới lúc completion; không mở thêm load cho mỗi click.
3. Completion chụp generation và host identity của attempt, kiểm host còn đúng scene/active. Stale result chỉ cleanup, không instantiate/ready/error cho route cũ.
4. Sau cleanup attempt cũ, worker đọc desired mới nhất và tiếp tục. A→B→A không nhận A cũ chỉ vì floorId trùng.
5. `isConfigured=false`: terminal unavailable cho request mới nhất, không cần tải bundle. Registry thiếu hoặc entry configured nhưng key sai là lỗi cấu hình, không giả thành tầng chưa có model.
6. Re-send cùng requestId/route không tạo operation hoặc handle thứ hai. Retry sau lỗi dùng requestId mới. Reuse active instance trả lại đúng terminal state mà không tải/fit lại vô cớ.
7. Rời floor clear pending selection và invalidate attempt ngay khi scene-flow nhận intent phù hợp, không chờ download. Late callback không attach vào Campus hoặc host FloorDetail của lượt khác.
8. Host đến trước loader và loader đến trước host đều đăng ký được. Có thể bắt lại host cùng active scene trong loader Start và đăng ký lại idempotent trong host Start; không chỉ dựa vào một lần OnEnable. Host không xuất hiện phải có lỗi hữu hạn, không pending vô hạn.
9. Handle ownership rõ cho in-flight, active và retired; mỗi handle acquired được release một lần. Giữ handle asset tới khi instance đã destroy. Cleanup tiếp tục trên loader persistent khi host unload; teardown không bỏ quên in-flight/retired handles.
10. Thiết lập timeout hữu hạn, mặc định đề xuất 60 giây và configurable theo môi trường. Timeout phải kết thúc trạng thái UI hiện tại bằng error, invalidate attempt, giữ cleanup cho completion đến muộn. Không tuyên bố coroutine stop đã hủy download. Giới hạn provider/network timeout cần được kiểm tra trong Addressables version hiện dùng để retry không bị chờ operation treo mãi.

Scene-flow vẫn ack `ViewerStateChanged` cho scene/route; chỉ content event quyết định floor-ready. Lỗi camera không được làm web hiểu scene ack là model ready.

Giữ cân bằng acquire/release của Addressables và quyền sở hữu instance là yêu cầu riêng với state UI. [Addressables: memory management](https://docs.unity3d.com/Packages/com.unity.addressables@2.9/manual/memory-assets.html)

## 4. Các bước implement theo thứ tự

### T0 — Chốt baseline an toàn

- Đọc lại source và diff liên quan; giữ toàn bộ thay đổi Phase 03 đang tồn tại. Không sửa `UserSettings/Layouts/default-6000.dwlt`.
- Nếu Git báo dubious ownership như phiên khảo sát, dùng cấu hình một lệnh: `git -c safe.directory=D:/UnityProj/UITProj/UIT-IOT-GIS status --short`; không cần thay global config.
- Kiểm tra Editor đang mở/scene chưa save trước khi chạy automation. Không mở Unity batchmode thứ hai vào project đang lock; không kill Editor hay overwrite scene chưa lưu.
- Trước sửa Next.js đọc `web/AGENTS.md` và tài liệu liên quan trong `web/node_modules/next/dist/docs/`.
- Ghi rõ cách chạy test/discovery thực tế. Hiện có NUnit files trong `Assets/Script/Tests/EditMode` bọc `UNITY_EDITOR`, chưa thấy `.asmdef` trong Assets; không mặc định chúng đã được Test Runner discover.

### T1 — Sửa bounds/controller theo mục 3.2

Files chính: `UnityContent/Assets/Script/Camera/CampusViewBounds.cs`, `CampusOrbitCameraController.cs`.

Giữ giá trị mặc định tự initialize cho Campus. Dynamic mode chỉ serialize ở FloorDetail. Tái sử dụng một hàm init cho cả Start và host; kiểm viewport/FOV, zoom limits và overview bằng dữ liệu hiện tại. Không rename hoặc rebuild toàn bộ camera rig.

Hoàn thành khi: scene dynamic rỗng không log lỗi, input không đổi pose; bind geometry sau nhiều frame khởi tạo được; Campus vẫn frame ngay và báo lỗi nếu static root cấu hình hỏng.

### T2 — Sửa host và loader theo mục 3.3–3.4

Files chính: `UnityContent/Assets/Script/FloorContent/FloorDetailContentHost.cs`, `FloorContentLoader.cs`; điều chỉnh nhỏ `Navigation/ViewerSceneFlowController.cs` nếu cần cancel/handshake.

- Ưu tiên serialized scene references. Nếu giữ fallback cho Editor, chỉ tìm trong `gameObject.scene` và reject nhiều ứng viên; không bắt nhầm rig của scene khác.
- Chuyển camera update sang API trả kết quả; sửa cả nhánh load mới và reuse.
- Clear host/camera references trước khi destroy content. Static `Instance` reset và duplicate bootstrap guard phải idempotent khi enter Play Mode lại.
- Thực hiện regression cho F4 ngay sau sửa generation, rồi kiểm single operation/latest desired/late callbacks.

Hoàn thành khi: E/4, E/6 không tự stale; E/3 unavailable; ready luôn dùng instance metadata và camera đã init; rời scene không có late attach.

### T3 — Sửa automation và scene đã lưu

File chính: `UnityContent/Assets/Script/Editor/FloorContent/Phase03AutomationEditor.cs`.

1. Khi tạo ContentRoot, cập nhật biến local với transform mới.
2. Gán đủ host `contentRoot`, `campusViewBounds`, `orbitCameraController` bằng `SerializedObject`/`ApplyModifiedProperties` hoặc API cấu hình Editor rõ ràng.
3. Scene FloorDetail: bounds target có thể trỏ `ContentRoot` ổn định khi idle, `calculateOnAwake=false`; controller giữ bounds scene-local, `initializeOnStart=false`. Khi content load, host đổi target sang GeometryRoot của instance; khi clear trả về target rỗng đã invalidate.
4. Không apply dynamic policy lên shared `CampusOrbitRig.prefab` cho cả Campus. Ghi scene override đúng cách (`PrefabUtility.RecordPrefabInstancePropertyModifications` nếu cần).
5. Mark dirty/save đúng scene rồi reopen để xác nhận persistence. Chạy setup lần hai không sinh thêm host, ContentRoot, rig, camera hoặc EventSystem.
6. Tách thao tác scene wiring khỏi menu tạo lại wrapper/registry. Không chạy `Apply All` chỉ để sửa reference nếu nó ghi đè asset người dùng đang author.
7. `ValidateSetup()` phải thực sự mở/đọc FloorDetail, kiểm số lượng component và reference đã serialize, policy static/dynamic, ContentRoot thuộc host, camera/rig cùng scene; không chỉ kiểm đang mở scene nào. Validator chỉ đọc, không sửa và không bắt scene dynamic rỗng phải có bounds hợp lệ.
8. Rà menu legacy `FloorDetailOrbitSetupEditor`: hiện giả định `MainOffice`, có validator bắt target đúng tên đó. Nếu menu còn dùng được cho scene mới, thêm nhánh nhận diện dynamic host và hướng dẫn setup Phase 03 hoặc validate theo host; không để tool cũ restore giả định gây lỗi trở lại.

State mong đợi trong `UnityContent/Assets/Scene/FloorDetail.unity` sau reopen:

```text
FloorDetailContentHost
  contentRoot            → child ContentRoot (hiện fileID 1048882947)
  campusViewBounds       → FloorDetailCameraContext.CampusViewBounds
  orbitCameraController  → CampusOrbitRig.CampusOrbitCameraController
FloorDetailCameraContext
  campusVisualRoot       → ContentRoot rỗng khi chưa load
  calculateOnAwake       → false
CampusOrbitRig (scene override)
  campusViewBounds       → FloorDetailCameraContext.CampusViewBounds
  initializeOnStart      → false
```

FileID chỉ là bằng chứng snapshot, không hardcode vào C# hoặc tự tạo reference tới asset ngoài scene. Campus giữ policy static và root hiện có.

### T4 — Đồng bộ trạng thái web trong phạm vi nhỏ

File chính nếu cần: `web/src/components/unity/UnityViewerRuntime.client.tsx`; parser/types chỉ sửa khi contract yêu cầu.

- Khi đã có active requestId, content event phải có đúng requestId và đúng building/floor mới được nhận; event thiếu ID không được ghi đè trạng thái phiên web Phase 03. C# vẫn có thể nhận payload không ID cho harness Editor.
- Request mới/loading/unavailable phải clear error/metadata cũ phù hợp. Floor-ready chỉ đến từ ready sau camera bind; không đổi về ready theo scene ack.
- Giữ nút retry gửi attempt mới qua đường hiện có. Chỉ sửa synchronizer resend nếu kiểm thử chứng minh lệnh đầu mất; không tạo Unity runtime/canvas thứ hai.
- E/3 vẫn sử dụng UI unavailable đang có. Không đổi thành error và không giả model để che camera lỗi.

### T5 — Kiểm chứng source và runtime

Thực hiện ma trận mục 5. Sửa lỗi tìm được rồi chạy lại case bị ảnh hưởng. Không ghi “PASS” cho compile, Play Mode hoặc browser nếu chưa có kết quả thực tế.

### T6 — Xuất bản build để kiểm chứng local

Bước này dành cho lượt implement được giao tiếp theo; **không chạy trong lượt investigation này**. Agent thực hiện build/export local khi tooling cho phép; nếu môi trường chặn một bước, vẫn hoàn thành phần source có thể làm và ghi chính xác bước chưa kiểm chứng. Không triển khai ra dịch vụ bên ngoài chỉ vì tài liệu có checklist build.

1. Xác nhận effective Web Build Profile có Campus/FloorDetail theo đúng thứ tự và đang ở target WebGL.
2. Chọn release mới, ghi tên thực tế; build Addressables và player tương thích vào staging. Sau thay C# hoặc scene, chỉ build Addressables hay restart Next.js không cập nhật code trong player.
3. Copy đầy đủ `Build/`, `StreamingAssets/` và remote content của cùng release vào web local. Version hóa player lẫn StreamingAssets theo mục 6.3 plan Phase 03 để client cũ không đọc catalog mới dưới URL dùng chung.
4. Cấu hình hiện tại: player `/unity/campus/Build/UIT-GIS-0910_1.*`; StreamingAssets `/unity/campus/StreamingAssets`; remote content `p03-r001`; Next có rewrite `ContentRelease → p03-r001`. Đối chiếu URL trong settings/catalog thực tế trước khi thay; không coi rewrite hiện tại là nguyên nhân F1–F6.
5. Chỉ cập nhật `web/src/config/unity-build.ts` và Brotli headers ở `web/next.config.ts` sau khi tên/path output thực tồn tại. Giữ `Content-Encoding: br` đúng các player file `.br`, không áp cho bundle LZ4.
6. Kiểm browser với cache trống và cache bật. Ghi URL/release và hash hoặc thời gian build đủ để biết đang test bản mới. Không xóa toàn bộ cache/dữ liệu người dùng.

## 5. Ma trận kiểm thử bắt buộc

### 5.1. Test hồi quy tự động có giá trị

Sử dụng Unity Test Framework hiện có; bổ sung test/harness nhỏ cho lifecycle và điều khiển completion order. Không chỉ viết test parse JSON hoặc kiểm chuỗi source. Nếu phải thêm test assembly, giới hạn thay đổi và bảo đảm không kéo NUnit vào player.

| Case | Cách kiểm | Kết quả cần có |
| --- | --- | --- |
| A1 — static Campus | Root chứa renderer, init bình thường | Initialized, bounds/zoom đúng; root static null vẫn được phát hiện |
| A2 — dynamic empty | Bật scene/rig rồi chờ nhiều frame chưa bind | Không error do chờ content; không pose drift/input; bounds invalid |
| A3 — bind trước/sau Start | Hai thứ tự lifecycle, có cả enable lại | Init thành công, không bị Start overwrite và không cần gọi Start thủ công |
| A4 — world-space instance | Instance dịch/rotate/scale host trong fixture, asset gốc không đổi | Bounds/center bằng renderer của instance; camera nhìn instance, không dùng prefab asset |
| A5 — đổi kích thước | Bind hai geometry có radius khác rõ, rồi clear | Min/max, overview, reset dùng geometry mới; clear xóa cache cũ |
| A6 — token đơn | Một request, provider completion thành công, không request xen vào | Một instance, một ready; không bị stale do cleanup của chính request |
| A7 — A→B→A và same-request | Điều khiển operation chậm; resend cùng request | Tối đa một load; chỉ desired cuối ready; không duplicate handle/instance |
| A8 — rời/đổi host | Load chậm, về Campus, quay FloorDetail trước completion cũ | Callback cũ chỉ release; không attach vào host mới, pending cũ không sống lại |
| A9 — unavailable/error | E/3; key sai; metadata/geometry/camera thiếu; timeout | Đúng terminal state có correlation, không false ready; không camera error spam cho E/3 |
| A10 — registration | Host trước loader và ngược lại; duplicate bootstrap; Play Mode lại | Đúng một primary loader, host được bind, không treo pending vì thứ tự khởi tạo |
| A11 — ownership | Load fail, stale, swap, exit/teardown | Acquired/released cân bằng, không double release; asset còn được giữ khi instance sống |

A4 không được kiểm bằng phép tính lại chính implementation; dùng union `Renderer.bounds` của instance fixture làm đối chiếu. A6/A7 phải chạy state machine thực với controlled provider/completion, không chỉ kiểm counter riêng lẻ.

### 5.2. Play Mode bằng scene thật

- Reopen scene đã save; validator pass và reference không null, policy đúng mỗi scene.
- Campus → E/3: unavailable, không log hai lỗi được báo; Campus orbit/hover trước đó vẫn chạy.
- Campus → E/4 → E/6: có model đúng tầng, orbit/pan/zoom/reset hoạt động và không re-load FloorDetail khi chỉ đổi floorId.
- E/4 → E/3 → E/6: model cũ biến mất, unavailable yên ổn, camera phục hồi khi có model mới.
- Mở trực tiếp FloorDetail trong Editor: chờ khi chưa có route; dùng harness ApplyViewerRoute để chọn E/4. Không gắn tạm prefab để bypass loader.
- Mô phỏng download chậm/fail, A→B→A, về Campus trong lúc load, retry sau phục hồi.
- Sau chuyển scene chỉ có một `_InitManager` primary, một orbit input publisher, một scene rig/camera/AudioListener đúng thiết kế.

Với Editor, dùng Addressables Use Asset Database hoặc bundle đúng target hiện tại. Không coi bundle WebGL chạy trong Editor target khác là test hợp lệ.

### 5.3. Web sau rebuild

| Thao tác | Tiêu chí |
| --- | --- |
| Hard refresh `/viewer/buildings/E/floors/3` | Kết thúc unavailable; không camera error; vẫn chọn được tầng khác |
| Hard refresh E/4 và E/6 | Kết thúc ready khi model đúng tầng và camera đã frame |
| Click floor, browser Back/Forward, đổi nhanh 4→6→4 | Một canvas/runtime, không ready sai tầng, không spinner do stale chính request |
| Chặn request bundle rồi khôi phục và Retry | Error hữu hạn; attempt mới thành công; không reload player |
| Về Campus khi tải, rồi mở lại floor | Không model/callback cũ tác động scene mới |
| Đổi tầng sau ready | Pan/zoom/reset dùng bounds tầng mới, không flash model cũ |
| Event cũ hoặc thiếu requestId | Không ghi đè state của attempt hiện tại |
| Cache trống và cache bật | Cùng behavior, URLs/catalog/bundles thuộc release đang kiểm |

Chạy `npm --prefix web run lint` và `npm --prefix web run build` nếu sửa web. Hai lệnh này không thay thế kiểm chứng Unity/WebGL.

## 6. Phạm vi file dự kiến

| Nhóm | File | Mức thay đổi |
| --- | --- | --- |
| Camera | `UnityContent/Assets/Script/Camera/CampusViewBounds.cs` | Bắt buộc: deferred init, invalidate |
| Camera | `UnityContent/Assets/Script/Camera/CampusOrbitCameraController.cs` | Bắt buộc: init/refresh API, readiness guards |
| Runtime content | `UnityContent/Assets/Script/FloorContent/FloorDetailContentHost.cs` | Bắt buộc: bind instance, clear, kết quả lỗi, registration |
| Runtime content | `UnityContent/Assets/Script/FloorContent/FloorContentLoader.cs` | Bắt buộc: generation/worker/ownership, instance metadata, ready gate |
| Scene flow | `UnityContent/Assets/Script/Navigation/ViewerSceneFlowController.cs` | Theo nhu cầu: cancel desired/host handshake, giữ route contract |
| Automation | `UnityContent/Assets/Script/Editor/FloorContent/Phase03AutomationEditor.cs` | Bắt buộc: serialize wiring, validate scene, chạy lại không nhân bản |
| Legacy setup | `UnityContent/Assets/Script/Editor/FloorDetailOrbitSetupEditor.cs` | Nếu menu còn áp dụng: tránh tái tạo giả định MainOffice |
| Scene | `UnityContent/Assets/Scene/FloorDetail.unity` | Bắt buộc: references và dynamic policy |
| Tests | `UnityContent/Assets/Script/Tests/` + `.meta` | Regression lifecycle, worker và scene wiring; xác minh discovery |
| Web | `web/src/components/unity/UnityViewerRuntime.client.tsx` | Nhỏ: correlation và clear state |
| Packaging | `unity-build.ts`, `next.config.ts`, public release output | Sau khi có build mới thực tế |

Chỉ chỉnh `_InitManager.prefab`, registry, wrapper hoặc Addressables settings nếu cần cho wiring/build đã xác định; không tạo lại hàng loạt asset chỉ vì setup có menu đó. Giữ `.meta`/GUID và geometry người dùng. Không coi nullable bounds reference trong shared rig prefab là lỗi nếu scene override hợp lệ.

## 7. Definition of Done và báo cáo handover

- [ ] Dynamic FloorDetail mở rỗng hợp lệ, không hai error trong báo cáo ban đầu.
- [ ] Reference host/camera được serialize, reopen vẫn đúng; validator bắt được wiring lỗi.
- [ ] Một request hợp lệ không tự stale; load tối đa một operation, desired mới nhất thắng.
- [ ] E/4 và E/6 thực sự load/hiển thị; E/3 unavailable đúng thiết kế.
- [ ] Bounds/metadata lấy từ instance; camera frame/zoom/reset đúng sau đổi tầng.
- [ ] Ready chỉ phát khi bind hoàn tất; failure có terminal state và retry.
- [ ] Unload/late completion không giữ stale bounds, instance hay pending selection.
- [ ] Handle ownership qua fail/stale/teardown đã kiểm; không nhân bản bootstrap/input/camera.
- [ ] Campus không hồi quy; setup chạy lại không sinh object hoặc đổi policy Campus.
- [ ] Có kết quả compile/test discovery/test execution cụ thể; các kiểm tra chưa chạy được ghi riêng.
- [ ] Player/catalog/content mới được đóng gói đồng bộ; kiểm WebGL theo release thực tế nếu môi trường cho phép.

Báo cáo cuối của agent implement gồm: file đã đổi; cách giải quyết F1–F7; kết quả từng nhóm test; release/path output thực; case chưa kiểm được và lý do cụ thể. Nếu mới hoàn thành source/Editor, ghi **“source đã sửa, WebGL chưa xác minh”**, không kết luận lỗi trên browser đã hết.

Ưu tiên thực hiện: **camera lifecycle + lỗi token + instance bind + scene wiring** trước; sau đó đóng các nhánh race/cleanup trong cùng loader và kiểm rebuild. Không dừng ở việc đổi log Error thành Warning, gán ContentRoot rỗng hoặc bật lại controller: các cách đó không giải quyết chuỗi lỗi đã xác nhận.
