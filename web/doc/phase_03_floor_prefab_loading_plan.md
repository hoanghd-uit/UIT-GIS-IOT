# Small Phase 03 — Load floor prefabs trong FloorDetail

**Trạng thái:** kế hoạch handover, chưa implement trong tài liệu này.  
**Thuộc:** Phase 1 của proposal Digital Twin Building E, UIT.  
**Ưu tiên:** dựng nội dung nhanh trong Unity; tải đúng tầng theo yêu cầu; kiểm soát bộ nhớ trên web.  
**Kế hoạch đang áp dụng:** tài liệu này thay thế hướng triển khai Small Phase 03 trong `phase_03_floor_content_document_loading_plan.md`. Hướng floor document, widget catalog, export JSON, database và runtime editor trong kế hoạch đó được hoãn sang **Phase 2 của proposal**.

**Cập nhật phân công đã được user approve:** user đã đồng ý solution và giao agent thực hiện cả những thao tác Unity trước đây ghi là manual, khi môi trường/tooling cho phép. Agent chủ động chuẩn bị prefab, rename/move cần thiết, gắn component/ID, cấu hình Addressables/registry/scene, build/export và kiểm tra. Không yêu cầu user làm lại hoặc xin approve lại các thao tác kỹ thuật đã nằm trong scope này. Phần user còn cần hỗ trợ là dữ liệu thực tế chưa xác định được từ source hoặc thao tác trên môi trường agent thực sự không truy cập được; áp dụng chi tiết tại mục 9. Lượt cập nhật tài liệu này chỉ sửa plan, chưa thực thi setup/build project.

## 1. Kết quả cần đạt và phạm vi

Sau milestone này:

1. Click tầng ở Campus hoặc chọn tầng ở panel hiện có sẽ hiển thị đúng prefab của tầng trong cùng scene `FloorDetail`.
2. Đổi tầng chỉ thay floor content. Giữ một Unity runtime, một canvas và cơ chế route/scene của Small Phase 02.
3. Nội dung tầng được phân phối bằng Addressables; chỉ tải tầng cần dùng cùng dependency của nó.
4. Nội dung cũ được destroy và release đúng vòng đời; thao tác nhanh không làm hiện nhầm tầng hoặc giữ handle bị bỏ quên.
5. Mỗi prefab có ID và metadata hệ tọa độ đủ để triển khai mapping IoT sau này. Kiểm chứng được phép đổi tọa độ bằng dữ liệu kiểm tra; chưa kết luận chính xác ngoài thực địa khi chưa có số liệu đối chiếu.
6. Có trạng thái đang tải, chưa có nội dung và lỗi/thử lại trên web; canvas không im lặng trống vô hạn.

Chưa triển khai ở milestone này:

- Icon thiết bị, popup, trạng thái cảm biến, filter, socket/polling IoT trong mockup trang 03.
- API IoT, database, xác thực hoặc API ghi nội dung tầng.
- Editor kéo thả Wall/Table/Chair, schema floor document, exporter prefab-to-JSON.
- Tách mỗi tầng thành scene hoặc một Unity build riêng.
- Hệ thống hot update catalog giữa phiên, prefetch toàn bộ tầng, cache nhiều prefab instance trong RAM.

**Đầu vào giả định:** project có các prefab tầng với tên bất kỳ; chưa có metadata/Addressables. Agent khảo sát source, lập mapping và chuẩn bị ít nhất hai prefab đại diện để kiểm chứng đổi tầng. Dùng ID/reference/mapping có căn cứ trong project; nếu chưa xác định được prefab thuộc tầng nào, chỉ hỏi user phần mapping còn thiếu. Không suy đoán tầng từ tên tùy ý hoặc tự bịa dữ liệu vật lý. Thiếu số liệu IoT không chặn việc chuẩn bị wrapper và load model với calibration `Unverified`.

## 2. Căn cứ hiện trạng và quy tắc kế thừa

Nguồn hiện trạng là `phase_02_implementation_handoff.md`, snapshot commit `06439eb6ff4e076c9bf1a02e5a8c35623737b70c`. User xác nhận flow đã chạy thành công. Handoff có các mục audit chưa kiểm chứng; agent phải đối chiếu **HEAD hiện tại**, không coi vấn đề ở snapshot là lỗi chắc chắn còn tồn tại.

| Phần hiện có | Giữ và mở rộng như thế nào |
| --- | --- |
| Git root dùng chung | Unity trong `UnityContent/`, Next.js trong `web/`; không tạo project/git con mới |
| Unity source | Dùng đường dẫn hiện tại `Assets/Script/`, không tự chuyển thành `Assets/Scripts/` |
| `HoverableFloor.OnFloorClick` → `FloorHoverSignals.FloorClicked` | Giữ flow click; component này không trực tiếp load prefab hoặc gọi browser |
| `_InitManager.ApplyViewerRoute(string)` | Vẫn là một điểm nhận lệnh route; controller gọi content loader khi scene sẵn sàng |
| `AppBootstrap` | Là nơi duy nhất gọi `DontDestroyOnLoad`; loader mới không tạo singleton/persistent root khác |
| `Campus` và `FloorDetail` | Tiếp tục có trong Scene List; chuyển scene bằng flow hiện có |
| FloorDetail chứa `_InitManager` để chạy trực tiếp Editor | Giữ hỗ trợ này; chặn duplicate bằng bootstrap **cục bộ** trước khi subscribe/khởi tạo loader |
| Orbit rig theo scene | Tái sử dụng rig của FloorDetail, cập nhật target/bounds sau khi prefab đã load |
| Một `useUnityContext`, một canvas trong `/viewer/layout.tsx` | Không unmount/recreate Unity khi đổi tầng |
| Route | `/viewer/campus`, `/viewer/buildings/E/floors/:floorId` |
| Catalog tầng hiện có | Giữ `12…1,G`; không tự bỏ `G` vì mockup chỉ vẽ 12 tầng |
| Bridge `.jslib` | Mở rộng event qua `DispatchViewerEvent` và `window.dispatchReactUnityEvent` đang dùng |
| WebGL hiện tại | Giữ cơ chế Brotli đang chạy; bản mới phải export đồng bộ code/catalog/content |

Version trong snapshot: Unity `6000.0.75f1`, Next.js `16.3.4`, React `19.2.8`, `react-unity-webgl ^10.2.0`. Đây là thông tin snapshot, không phải yêu cầu upgrade. Kiểm tra package Addressables đã cài; nếu chưa có, chọn bản Package Manager hỗ trợ Unity hiện tại và ghi lại version resolved/lockfile.

Preflight cần rà lại ba mục từ handoff: lỗi lint `set-state-in-effect`, guard dùng nhầm `AppBootstrap.Instance.IsPrimary`, và route sender ghi nhận đã gửi trước acknowledgement nên có thể thiếu retry. Chỉ sửa nếu còn tồn tại và ảnh hưởng scope. Không sửa file layout cá nhân `UnityContent/UserSettings/Layouts/default-6000.dwlt`.

## 3. Quyết định kiến trúc

### 3.1. Tầng vẫn là prefab dựng sẵn

Prefab là nguồn authoring. Unity build biến prefab cùng mesh/material/texture cần thiết thành AssetBundle; trình duyệt tải bundle bằng Addressables. Không serve file `.prefab` YAML để browser tự dựng, không đưa mesh vào React state.

Chọn **remote Addressables**, trước mắt host file tĩnh cùng origin với Next.js. “Remote” ở đây nghĩa là nội dung nằm ngoài phần asset chính của WebGL build, không bắt buộc dùng dịch vụ Unity Cloud/CDN riêng. Hướng này giúp việc thêm prefab tầng không tự làm phình toàn bộ phần dữ liệu phải tải trước khi mở Campus. Không hứa Campus hiện tại sẽ nhẹ đi nếu model Campus chưa được tối ưu. [R1]

### 3.2. Registry nhỏ làm bảng tra cứu

`FloorContentRegistry` là ScriptableObject nhỏ, được reference trực tiếp bởi loader:

| Trường mỗi entry | Kiểu/ý nghĩa |
| --- | --- |
| `buildingId` | String, hiện tại `E` |
| `floorId` | String chuẩn route: `G`, `1`…`12` |
| `isConfigured` | Có nội dung đã được cấu hình và validate hay chưa |
| `prefab` | `AssetReferenceGameObject`, không phải `GameObject` reference trực tiếp |

Lookup bằng cặp `(buildingId, floorId)`. Không parse tên prefab, hierarchy hoặc label để đoán tầng. AssetReference giúp nối asset mà không tải toàn bộ prefab chỉ vì registry được load. [R2]

Registry và web catalog có trách nhiệm khác nhau: web catalog liệt kê tầng/điều hướng; registry Unity ghép tầng với nội dung. Validator đối chiếu ID ở hai phía trong bước nghiệm thu. Không tạo thêm một catalog JSON/endpoint chỉ để tải prefab.

### 3.3. Cách tổ chức asset và output

Đường dẫn dưới đây là đề xuất cho phần mới; giữ asset hiện có ở chỗ cũ nếu di chuyển gây công việc không cần thiết. Agent thực hiện move/rename cần thiết bằng Unity Editor tooling/API, giữ GUID và các reference hiện có.

| Nơi lưu | Nội dung |
| --- | --- |
| `UnityContent/Assets/Content/Floors/E/` | Các wrapper prefab tầng |
| `UnityContent/Assets/Content/Floors/Shared/` | Dependency dùng chung đáng kể, nếu thực tế có |
| `UnityContent/Assets/Content/Config/FloorContentRegistry.asset` | Registry nhỏ |
| `UnityContent/Assets/AddressableAssetsData/` | Settings/group/profile do Addressables tạo; commit cùng `.meta` |
| `UnityContent/Assets/Script/FloorContent/` | Metadata, registry type, loader, coordinate helper, scene host |
| `UnityContent/Assets/Script/Editor/FloorContent/` | Inspector/gizmo/validator chỉ chạy Editor |
| `UnityContent/ServerData/<release>/WebGL/` | Output content build, không phải source authoring |
| `web/public/unity/content/<release>/WebGL/` | Bản copy bundle, remote catalog/hash để serve |
| `web/public/unity/campus/<release>/` | Output player mới gồm `Build/` và `StreamingAssets/`; giữ build Phase 02 cũ theo workflow hiện tại |
| `web/doc/phase_03_floor_prefab_loading_plan.md` | Bản plan đưa vào repository |

Tiếp tục chính sách repository hiện có với binary build; không tự đưa output lớn mới vào Git/LFS hoặc xóa build cũ. Ghi rõ source cần commit và artifact cần cung cấp theo workflow thực tế. Không thêm `.git` dưới `web/`.

## 4. Chuẩn prefab tối thiểu — agent chuẩn bị và cấu hình

### 4.1. Naming, tag và định danh

| Mục | Bắt buộc? | Quy ước và người thực hiện |
| --- | --- | --- |
| Rename prefab/model gốc | Không | Không cần đổi tên để code chạy; agent chỉ rename/move khi giúp tổ chức phần triển khai và giữ reference |
| Tên wrapper | Khuyến nghị | Agent tạo/rename thành `Floor_E_07.prefab`, `Floor_E_08.prefab`, `Floor_E_G.prefab` |
| `buildingId` | Có | Agent gán `E` trên component root và registry theo mapping đã xác định |
| `floorId` | Có | Agent gán `7`, không phải `07` hoặc `Tầng 7`; hỏi user chỉ khi ID của asset còn mơ hồ |
| Root component | Có | Agent viết, gắn `FloorContentMetadata` và điền field/reference |
| Addressable entry | Có | Agent đánh dấu từng wrapper prefab là Addressable |
| Address | Khuyến nghị thống nhất | Agent gán `floors/E/7`, `floors/E/8`, `floors/E/G`; registry vẫn trỏ AssetReference |
| Tag riêng | Không | Không dùng `FindWithTag` để xác định tầng |
| Label Addressables | Không | Có thể dùng `floor-content` để quản lý; không load cả label này |
| Layer IoT | Chưa | Chưa tạo layer/raycast interaction thiết bị ở milestone này |
| ID từng bàn/ghế/tường | Không | Không cần tách widget hoặc gắn ID từng đồ vật |

Số `07` chỉ dùng trong tên file để dễ sắp xếp. Logical ID, address và route dùng `7`. Đổi tên không làm thay đổi logical ID. Rename/move trong Unity để giữ liên kết `.meta`; không tạo GUID mới cho asset đang được reference. Đã có prefab mẫu floor Assets/Prefabs/Floor/Floor_E_04.prefab tại Assets/Prefabs/Floor/. Nếu Prefab floor mẫu không phù hợp, dựng Assets/Prefabs/Floor/Floor_E_10.prefab phù hợp theo plan và nêu rõ lý do không phù hợp

### 4.2. Wrapper hierarchy

Agent tạo một wrapper có root chuẩn; prefab/model hiện có được giữ làm con của `Geometry`. Giữ nested prefab khi có thể, không cần unpack toàn bộ model để thêm metadata.

| Object | Yêu cầu |
| --- | --- |
| Root `Floor_E_07` | Local position `(0,0,0)`, rotation identity, scale `(1,1,1)`; có `FloorContentMetadata` |
| Child `Geometry` | Chứa prefab/model cũ; agent hiệu chỉnh offset/rotation/scale khi có căn cứ từ import, bản vẽ hoặc mốc đã biết |
| Geometry thực tế | Kích thước hợp lý theo mét; chọn một mốc vật lý cố định làm gốc tầng; mặt sàn ở cao độ local đã khai báo |
| Điểm kiểm tra tọa độ | Dữ liệu/gizmo Editor; không phải icon IoT và không hiện trong player |

Trong wrapper không có `_InitManager`, camera, AudioListener, EventSystem hoặc light manager trùng scene. Agent validator phát hiện component dư và agent dọn các thành phần trùng rõ ràng trong wrapper/asset thuộc scope. Chỉnh import/material/collider khi có căn cứ kỹ thuật và kiểm tra visual; không sửa mesh hoặc loại component hàng loạt khi chưa xác định tác dụng của chúng. Ưu tiên chỉnh wrapper để giữ nguồn hình học gốc.

Geometry được đưa về quanh gốc tầng, không giữ một khoảng offset tùy ý từ vị trí của cả campus. Nếu giữ tọa độ building hoặc model import, phải khai báo phép đổi tương ứng ở metadata. Không tự đặt gốc theo `Renderer.bounds.center` mỗi lần load vì bounds có thể thay đổi khi sửa nội thất.

### 4.3. `FloorContentMetadata`

Một component trên wrapper root; agent viết type/Inspector, gắn component và điền dữ liệu đã xác định:

| Trường | Giá trị/quy tắc |
| --- | --- |
| `buildingId`, `floorId` | Khớp entry registry và nội dung thực của prefab |
| `contentVersion` | Số nguyên dương; agent quản lý theo thay đổi nội dung thực, không tăng chỉ vì chạy lại setup không có thay đổi |
| `geometryRoot` | Reference child `Geometry` trong cùng prefab, không phải asset ngoài |
| `coordinateFrame` | Struct metadata theo mục 5 |
| `cameraBoundsOverride` | Tùy chọn nếu bounds của renderers không phù hợp; mặc định tính một lần từ `geometryRoot` |

Validator không dùng việc tên file khác quy ước làm lỗi runtime. Missing component, ID không khớp, root scale không chuẩn hoặc thiếu geometry là lỗi cần sửa. Trạng thái calibration chưa xác nhận được phép load mô hình, nhưng không được báo mapping IoT đã chính xác.

## 5. Metadata tọa độ để gắn IoT sau này

### 5.1. Hợp đồng dữ liệu cần thống nhất

Danh sách `id, type, x,y,z, status` đủ mô tả thiết bị chỉ khi đã biết **tầng nào và tọa độ thuộc hệ nào**. Thông tin đó có thể nằm ở URL/envelope, không nhất thiết lặp trong từng thiết bị.

Ví dụ hợp đồng cho milestone IoT sau này, không tạo endpoint trong Phase 03:

```json
{
  "buildingId": "E",
  "floorId": "7",
  "coordinateFrameId": "E/7/floor-local",
  "coordinateFrameVersion": 1,
  "devices": [
    {
      "id": "demo-temperature-01",
      "type": "temperature",
      "position": { "x": 2.0, "y": 1.5, "z": 3.0 },
      "status": "normal"
    }
  ]
}
```

Đây là ví dụ giả lập về format, không phải vị trí thiết bị thực tế. Frame ID/version xác định đơn vị, hướng trục, mốc và phép đổi. Nếu backend trả tọa độ survey/building thay vì floor-local, phải dùng frame đã đăng ký tương ứng; không gắn nhãn floor-local cho dữ liệu chưa chuyển đổi.

Không suy floor ID từ riêng tọa độ `y`/`z`. Nếu API trả nhiều tầng, từng item phải có context tầng hoặc response phải được nhóm theo tầng. Khi tọa độ từ building-global, cần biết cao độ/mốc của từng tầng; không cộng/trừ cao độ hai lần.

### 5.2. Dữ liệu frame lưu cùng prefab

Chỉ lưu metadata phép đổi nhỏ; không lưu danh sách thiết bị hoặc trạng thái live trong prefab.

| Trường | Ý nghĩa |
| --- | --- |
| `frameId` | ID hệ dữ liệu đầu vào, ví dụ `E/7/floor-local`; không lấy từ tên GameObject |
| `frameVersion` | Tăng khi thay mốc, đơn vị, trục hoặc phép đổi |
| `sourceUnits` | Mô tả đơn vị dữ liệu đầu vào, ví dụ `m` hoặc `cm` |
| `sourceAxesDescription` | Agent ghi hướng dương X/Y/Z và trục đứng theo nguồn số liệu; hỏi user phần thiếu khi cần mapping thực |
| `sourceOrigin` | Điểm mốc trong hệ dữ liệu đầu vào |
| `originInFloorLocal` | Vị trí của điểm mốc đó trong local space của wrapper root, đơn vị mét |
| `basisX`, `basisY`, `basisZ` | Ba vector đổi một đơn vị nguồn trên từng trục sang local mét; đã chứa đổi đơn vị và hướng trục |
| `calibrationStatus` | `Unverified` mặc định; chỉ đổi thành `Verified` sau đối chiếu reference points |
| `calibrationNote` | Nguồn mốc, cách đo/đối chiếu và sai số khi đã biết |

Defaults để authoring mới: floor-local mét, Unity Y-up, basis identity, hai origin bằng zero, `Unverified`. Agent ghi gốc/hướng X/Z theo import hoặc bản vẽ có căn cứ; nếu chưa có thì ghi đây là quy ước local tạm, chưa được đối chiếu thực địa. Không tự coi một model kích thước bất kỳ là đúng mét chỉ vì root scale bằng một; phần đơn vị chưa biết phải được ghi rõ trong calibration note. Default không chứng minh prefab có cùng hệ tọa độ với thiết bị thực tế.

`sourceUnits` mang tính mô tả/validation; **basis đã chứa hệ số đơn vị**, helper không nhân thêm `0.01` lần nữa. Không chỉ dùng một quaternion: đổi thứ tự trục hoặc khác handedness có thể cần đổi dấu/phản chiếu.

### 5.3. Phép mapping

```text
d = devicePosition - sourceOrigin
pLocal = originInFloorLocal + basisX*d.x + basisY*d.y + basisZ*d.z
pWorld = floorInstance.transform.TransformPoint(pLocal)
```

`pLocal` thuộc wrapper root, không thuộc pivot riêng của mesh con. Unity `TransformPoint` chuyển local sang world và tính transform/scale của các parent. [R7]

Ví dụ kiểm tra toán học: giả định nguồn dùng centimet, X nguồn cùng X model, Y nguồn cùng Z model, Z nguồn là chiều cao cùng Y model; hai origin bằng zero:

```text
basisX = (0.01, 0, 0)
basisY = (0, 0, 0.01)
basisZ = (0, 0.01, 0)
(200, 300, 150) nguồn -> (2, 1.5, 3) local mét
```

Ví dụ này không quy định mọi hệ survey đều có hướng như vậy. Agent kiểm tra phép đổi hữu hạn, ba basis không suy biến; không tự reject determinant âm nếu phản chiếu là mapping đã khai báo. Nếu dữ liệu nguồn có tọa độ tuyệt đối rất lớn, giữ double và trừ origin trước khi chuyển sang `Vector3` float. Lat/long hoặc CRS GIS chưa biết cần adapter xác định riêng trong milestone IoT, không đoán bằng ba trục Unity.

### 5.4. Phần làm ngay, phần làm sau

**Làm ngay:** metadata, helper đổi source → local/world, kiểm tra cấu hình, gizmo/reference points Editor, test phép đổi. Giữ origin ổn định khi camera fit hoặc người dùng orbit. Recenter để đẹp phải bằng camera; nếu đổi transform hiển thị thì toàn bộ root bao gồm geometry và marker tương lai phải đi cùng.

**Agent thực hiện:** đọc bản vẽ/số liệu đã có, thiết lập mốc và phép đổi, kiểm tra kích thước biết trước, đối chiếu tối thiểu ba mốc không thẳng hàng trên mặt bằng và một kiểm tra cao độ khi đủ dữ liệu. User chỉ cần cung cấp/giải thích mốc khảo sát hoặc chiều thực tế mà source chưa có; phần điền Inspector và tính toán vẫn do agent làm. Đây là kiểm tra thực dụng cho quy ước trục/scale đang dùng, không tuyên bố ba điểm phẳng suy ra mọi biến đổi 3D. Chưa có dữ liệu thực thì để `Unverified`, tiếp tục milestone load model và ghi calibration còn chờ milestone IoT.

**Sau này:** chỉ nhận device response đúng building/floor/frame/version của content đã `ready`; tạo icon riêng dưới root tầng hoặc project `pWorld` ra screen với camera/canvas đúng. Điểm neo thiết bị là vị trí thật; offset nâng icon để dễ nhìn là thuộc tính hiển thị riêng, không sửa tọa độ lưu. Clear icon và request cũ khi thay tầng. Chưa viết marker manager/UI/API ở Phase 03.

## 6. Addressables: cấu hình cho web

### 6.1. Group và dependency

| Group | Asset | Cấu hình đề xuất |
| --- | --- | --- |
| `FloorPrefabs` | Từng wrapper prefab là một entry riêng | Remote paths; **Pack Separately**; LZ4; bundle name có content hash |
| `FloorShared` | Texture/material/mesh dùng chung đáng kể giữa tầng, nếu có | Remote paths; gom theo tập nhỏ dùng cùng nhau; ban đầu có thể Pack Together nếu tổng nhỏ |

`Pack Separately` đóng một bundle cho mỗi primary asset; **không kéo cả folder Floors thành một entry** rồi kỳ vọng mỗi tầng vẫn tách riêng. Tầng vẫn có dependency ngoài bundle chính; “một tầng một bundle” là quy tắc đóng prefab chính, không cam kết một HTTP request duy nhất. [R3]

Không biến từng material nhỏ thành một bundle mặc định. Agent kiểm tra Build Layout/Analyze để phát hiện dependency nặng bị lặp và chuyển các asset dùng chung đã xác định sang `FloorShared`. Shared group không có nghĩa mọi shared asset luôn ở RAM. [R9]

Kiểm tra direct dependency từ built-in scenes, ScriptableObjects, `Resources/`, preloaded assets: một prefab vừa Addressable vừa bị reference trực tiếp bởi scene có thể phá mục tiêu tách tải. Agent tháo instance proof khỏi scene build hoặc đặt `EditorOnly` đúng cách sau khi xác định đúng object thay thế; giữ source asset để còn tái sử dụng. Không chỉ SetActive(false); object inactive vẫn có thể là dependency build. Model Campus tiếp tục theo baseline; ghi riêng dependency trùng với Campus để quyết định tối ưu dựa trên dung lượng thực.

### 6.2. Profile và release

Các giá trị đã được approve để agent cấu hình qua Unity tooling/API sau khi tạo helper URL:

| Biến/setting | Giá trị |
| --- | --- |
| `ContentRelease` | `p03-r001` cho lần publish đầu; đổi mỗi bộ output phát hành |
| `Remote.BuildPath` | `ServerData/[ContentRelease]/[BuildTarget]` |
| `Remote.LoadPath` | `{UIT.Viewer.FloorContentAddress.Origin}/unity/content/[ContentRelease]/[BuildTarget]` |
| Build target | Web/WebGL, xác nhận output segment thực tế `WebGL` |
| Build Remote Catalog | Bật; catalog và hash dùng cùng release/path với bundle |
| Include in Build | Bật cho group content |
| Bundle compression | LZ4 |
| Use Asset Bundle Cache | Bật nếu package có setting; không coi đây là bằng chứng cache đã hoạt động trên WebGL |
| Web Request Timeout | Hữu hạn, khởi điểm 30 giây; xác nhận hành vi bản package hiện tại |
| Retry Count | Khởi điểm 1; kết hợp nút thử lại thay vì retry vô hạn |

Agent viết `UIT.Viewer.FloorContentAddress.Origin`: trong browser lấy origin HTTP(S) từ `Application.absoluteURL` qua `Uri`, không ghép từ nguyên pathname `/viewer/...`; Editor có fallback cấu hình `http://localhost:3000`. Khởi tạo/đọc helper trước lần `Addressables.InitializeAsync` đầu tiên. Bảo vệ property khỏi stripping bằng reference code và preserve thích hợp. Cú pháp `[]` được evaluate khi build, `{}` khi runtime; tên fully-qualified phải trùng class agent tạo. [R8]

Giả định website chạy tại URL root như hiện tại. Nếu repo có `basePath` hoặc CDN riêng, agent điều chỉnh một chỗ cấu hình content URL và ghi giá trị chính xác trong handoff; không hardcode origin localhost vào release browser. Trong Editor test trên target khác WebGL cần bundle build tương ứng hoặc Use Asset Database; không dùng bundle WebGL như bằng chứng Editor target khác đã pass.

Mỗi release là bộ player/catalog/bundle tương thích, không ghi đè nội dung khác dưới URL immutable cũ. Phase 03 dùng full content build cùng player export; không làm workflow update catalog giữa phiên. Khi thay prefab đã publish, build release mới và kiểm tra lại; không hứa cứ upload một file `.prefab` là website đổi.

### 6.3. HTTP, StreamingAssets và Brotli

Copy **đầy đủ** WebGL output cần runtime, gồm `Build/` và `StreamingAssets/` do Addressables sinh ra. Nếu version đã đóng một phần data vào player, vẫn phải giữ mọi file phụ mà output tham chiếu. Chỉ copy bốn file loader/data/framework/wasm như trước có thể thiếu settings/catalog. Đặt `streamingAssetsUrl` trong config `react-unity-webgl` theo đường dẫn copy, ví dụ `/unity/campus/p03-r001/StreamingAssets`, và xác nhận request thực tế. [R10]

Update các URL player trong `unity-build.ts` sang cùng thư mục release. Version hóa cả `StreamingAssets`, không chỉ filename `.data/.wasm`: tab cũ có thể chưa initialize Addressables khi bản mới được publish. Không để player cũ đọc settings/catalog mới từ một URL dùng chung đã bị ghi đè. Việc đổi path này chỉ ở cấu hình artifact, không đổi route Campus/FloorDetail của ứng dụng.

Copy output `ServerData/<release>/WebGL/` sang `web/public/unity/content/<release>/WebGL/`, giữ nguyên filename, catalog, hash, relative structure. Bundle nằm ở static hosting; không qua API route/server action rồi chuyển buffer sang JavaScript. Next.js serve file trong `public` bằng URL bắt đầu ở `/`; cấu hình cache cần được xác nhận ở response thực. [R11]

| File thực được serve | Header/đối xử |
| --- | --- |
| `.wasm.br` | `Content-Encoding: br`, `Content-Type: application/wasm` như baseline |
| `.framework.js.br` | `Content-Encoding: br`, JavaScript MIME |
| `.data.br` | `Content-Encoding: br`, binary MIME |
| `.bundle` nén nội bộ LZ4 | Binary MIME; **không tự gắn `Content-Encoding: br`** |
| catalog/settings `.json`, `.hash` | Đúng text/JSON MIME; cache revalidate, tránh catalog cũ trỏ bộ file thiếu |
| catalog `.bin` nếu package xuất binary | Binary MIME; không đổi đuôi/parse thành JSON |
| Bundle có hash và release bất biến | Có thể dùng `Cache-Control: public, max-age=31536000, immutable` ở production |

LZ4 là compression bên trong bundle; Brotli là lớp HTTP/response đang dùng với player build. Server có thể nén HTTP thêm cho bundle khi thực sự cấu hình, nhưng baseline này serve output `.bundle` nguyên trạng để giảm sai sót. Không áp rule Brotli wildcard cho cả `/unity/:path*`. Không cần đổi cơ chế Brotli đang chạy để dùng Addressables. [R1, R12]

Bật Data Caching cho Web player, sau đó đo cache qua browser thật. Tài liệu Unity 6 mô tả cache loader cho `.data` và AssetBundle; artifact/loader của project phải được kiểm chứng, không tự thêm cache override theo hướng dẫn Unity cũ. HTTP cache/IndexedDB và RAM là các lớp khác nhau. Cache phụ thuộc browser/quota/eviction; test lại với cache bật và profile sạch. [R6]

## 7. Vòng đời load/unload — hợp đồng cho agent

### 7.1. Ownership

| Thành phần | Trách nhiệm |
| --- | --- |
| `ViewerSceneFlowController` hiện có | Sở hữu desired route; chuyển scene; đợi host FloorDetail sẵn sàng; gọi loader cho cả đổi scene và đổi floorId |
| `FloorContentLoader` mới trên `_InitManager` | Giữ handle, pending selection và tiến trình load/cleanup; sống theo bootstrap hiện có |
| `FloorDetailContentHost` scene-local | Cung cấp `contentRoot` và reference orbit rig; đăng ký khi scene sẵn sàng, hủy đăng ký khi rời scene |
| `FloorContentMetadata` trên instance | Cung cấp ID, contentVersion, coordinate frame, geometry bounds |
| Next runtime hiện có | Gửi route, nhận status, cập nhật loading/error; không sở hữu prefab/mesh |

Loader chỉ hoạt động trên `_InitManager` primary. Nó không nằm trên prefab tầng và không tự gọi `DontDestroyOnLoad`. Persistent ownership giúp xử lý callback download đến muộn sau khi FloorDetail đã unload. `contentRoot` thuộc scene FloorDetail; không đưa model tầng vào DontDestroyOnLoad.

### 7.2. Chọn một cặp API và theo tới cùng

Baseline triển khai:

```csharp
Addressables.LoadAssetAsync<GameObject>(entry.prefab);
// Sau khi completed, validate metadata và desired selection:
UnityEngine.Object.Instantiate(loadedPrefab, contentRoot);
// Khi thôi dùng:
UnityEngine.Object.Destroy(instance);
// Đợi instance đã bị destroy ở cuối frame, rồi:
Addressables.Release(prefabLoadHandle);
```

Đây là skeleton mô tả ownership, không phải code để copy bỏ qua kiểm tra lỗi. Giữ `prefabLoadHandle` trong toàn bộ thời gian instance dùng asset. Vì Instantiate thực hiện thủ công, không gọi `ReleaseInstance` cho instance này. Cặp `InstantiateAsync`/`ReleaseInstance` là một lựa chọn API khác, không trộn hai cách trong loader này. Handle load thất bại hoặc hoàn thành mà không dùng cũng phải release một lần. [R4, R5]

Không release dependency khi instance còn sống. Trên đường cleanup, disable model ngay, destroy, đợi frame cleanup rồi release handle; loader persistent phải tiếp tục cleanup kể cả khi host scene bị destroy. Root application teardown phải có nhánh cleanup idempotent. Dọn event subscription và reference camera/metadata cùng lúc.

### 7.3. Chính sách bộ nhớ ban đầu

**Một tầng active, tối đa một floor load đang chạy.** Khi chuyển tầng, retire nội dung cũ trước khi bắt đầu load tầng mới. Trong lúc chờ, giữ UI/panel và loading overlay; không giữ model cũ dưới breadcrumb tầng mới.

Đây là lựa chọn ưu tiên RAM của WebGL. Lần đầu mở tầng phải đợi mạng và dựng object; không có cam kết chuyển tức thì. Browser cache giúp tránh download lại khi có thể nhưng instance vẫn cần dựng lại. Không preload 13 tầng vào RAM.

Shared dependency được quản lý theo reference count. Tách group không tự ngăn shared asset bị unload rồi load lại; nếu profiling cho thấy chi phí này đáng kể, có thể thêm keep-alive **cho một tập shared nhỏ đã đo**, chỉ trong phiên FloorDetail, release khi về Campus. Đây là tối ưu có điều kiện sau pilot, không gate để bắt đầu load hai tầng. Không giữ handle toàn bộ floor để chữa triệu chứng. [R4]

Không gọi `Resources.UnloadUnusedAssets()`/`GC.Collect()` mỗi click. Không xóa browser cache hoặc gọi `ClearDependencyCacheAsync` sau mỗi unload. Release handle đúng không có nghĩa số RAM trình duyệt lập tức giảm; theo dõi live assets/handle và peak/plateau qua các lượt chuyển thay vì yêu cầu WebAssembly heap co lại ngay.

### 7.4. Trình tự khi nhận một lựa chọn mới

1. Validate logical route/registry và cập nhật desired selection với token mới.
2. Clear trạng thái ready cho nội dung cũ; emit loading/unavailable phù hợp.
3. Nếu active floor đúng selection và nội dung vẫn hợp lệ: dùng lại instance, emit state gắn token hiện tại. Re-send cùng token phải idempotent.
4. Nếu đổi tầng: disable/destroy/release nội dung cũ theo mục 7.2.
5. Nếu một load cũ còn chạy: chỉ lưu **lựa chọn mới nhất**; không tạo một request download mới cho mỗi click.
6. Sau operation cũ completed, kiểm tra token và host. Nếu stale: release handle, không instantiate. Không giả định coroutine cancellation/StopCoroutine đã hủy HTTP request.
7. Với selection mới nhất và host hợp lệ: initialize Addressables một lần nếu cần; tìm entry; start `LoadAssetAsync`.
8. Khi completed: kiểm tra trạng thái, token, ID metadata, root/geometry/frame cấu hình trước khi instantiate. Có thể stage dưới child inactive của host để kiểm tra và tránh flash trước khi activate.
9. Instantiate một lần, đặt root theo quy ước, cập nhật bounds/target của orbit rig. Không thay tọa độ geometry để fit camera.
10. Activate model rồi emit `ready`, kèm ID/version của model thực đã attach.

Operation callbacks dùng coroutine/`Completed` tương thích WebGL. Không dùng `.Task` hoặc `WaitForCompletion` cho đường tải WebGL. Thiết kế bỏ kết quả cũ và release handle, không dựa vào khả năng hủy thật sự một tải Addressables đang chạy. [R5]

Trong A → B → A, token cũ của A không tự được chấp nhận chỉ vì floorId lại trùng A. Cho phép reuse asset đang active theo mục 3; operation đang load bị supersede phải được đánh giá theo token/selection hiện tại rõ ràng. Đơn giản nhất: kết quả stale được release; request cuối load lại từ cache nếu có.

Khi quay Campus: tăng/invalidate token, dọn active floor trước khi chuyển scene nếu còn host; không chờ hết download cũ mới cho người dùng quay Campus. Callback cũ tiếp tục được persistent loader thu dọn khi hoàn thành, không instantiate vào Campus. Khi quay lại FloorDetail trước callback đó: chỉ xử lý desired selection mới nhất sau khi operation cũ kết thúc.

### 7.5. Thiếu content hoặc lỗi

| Tình huống | Hành vi |
| --- | --- |
| Tầng hợp lệ, `isConfigured=false` | Scene/panel vẫn hoạt động; hiện “Tầng này chưa có mô hình”; không dùng prefab của tầng khác |
| Không tìm thấy key, tải 404/timeout/network fail | Release handle; hiện thông báo có nút Thử lại; panel vẫn dùng được |
| Prefab metadata sai ID hoặc thiếu geometry | Không activate; release và báo lỗi cấu hình trong log; UI thông báo không tải được mô hình |
| Frame chưa calibration thực địa | Cho phép xem model; giữ trạng thái `Unverified`; không báo IoT mapping ready |
| Frame data không hữu hạn/suy biến | Validator báo lỗi; không nhận là cấu hình mapping hợp lệ |
| Content load đã ready rồi chọn lại đúng tầng | Không destroy/load lại vô cớ |
| Request lỗi đã stale | Cleanup kỹ thuật; không ghi đè error/loading của route mới |

Thử lại tạo attempt token mới cho route hiện tại; không reload toàn bộ Unity player. Timeout/retry có giới hạn; loading dừng bằng ready/unavailable/error, không spinner vô hạn. `GetDownloadStatus` nếu được dùng là tiến độ download; không coi percent của một handle là thời gian load tổng thể. Progress text đơn giản đủ cho scope này.

## 8. Web/Unity bridge và trạng thái UI

### 8.1. Giữ route contract, thêm correlation

Giữ `schemaVersion: 1`, `FloorClicked` và public method `_InitManager.ApplyViewerRoute`. Thêm `requestId` dạng string vào lệnh route/ack theo hướng additive; parser phải nhận field mới. Unity có thể chấp nhận payload cũ không có requestId cho Editor compatibility, nhưng web Phase 03 phải gửi requestId và chỉ nhận content state trùng token mới nhất.

```json
{
  "schemaVersion": 1,
  "requestId": "viewer-session-1:23",
  "view": "floor-detail",
  "buildingId": "E",
  "floorId": "7"
}
```

Một intent route/attempt có một token. Re-send do chưa nhận ack dùng lại token đó; click retry sau lỗi dùng token mới. Token tồn tại ở runtime/synchronizer đang persistent, không dựa vào floorId làm khóa duy nhất. Có thể dùng session prefix + monotonic counter; không thêm database/request service.

`ViewerStateChanged` tiếp tục báo **scene/route đã apply**, echo requestId nếu có; nó không còn đủ để kết luận nội dung tầng đã tải. `FloorContentStateChanged` là event mới qua bridge hiện có:

```json
{
  "schemaVersion": 1,
  "requestId": "viewer-session-1:23",
  "buildingId": "E",
  "floorId": "7",
  "status": "ready",
  "contentVersion": 1,
  "coordinateFrameId": "E/7/floor-local",
  "coordinateFrameVersion": 1,
  "calibrationStatus": "Unverified"
}
```

Status: `loading`, `ready`, `unavailable`, `error`. `contentVersion`/frame fields chỉ bắt buộc khi `ready`. Error thêm `code`, `message` có kiểm soát; không gửi stack trace sang UI. Campus dùng state route hiện có và clear floor content state. Listener của runtime dùng callback ổn định và cleanup như Phase 02.

### 8.2. Hook vào code hiện có

Agent đối chiếu rồi mở rộng các file thực tế:

- `UnityContent/Assets/Script/Navigation/ViewerSceneFlowController.cs`.
- `UnityContent/Assets/Script/Bridge/WebViewerBridge.cs`.
- `UnityContent/Assets/Plugins/WebGL/ViewerBridge.jslib` nếu cần event mới ngoài dispatch generic.
- `web/src/types/viewer.ts`, `web/src/lib/unity-bridge.ts`.
- `web/src/components/unity/UnityViewerRuntime.client.tsx`.
- `web/src/components/unity/UnityRouteSynchronizer.client.tsx`.
- `web/src/config/unity-build.ts`, `web/next.config.ts`.

Không đổi route URL. Nếu scene controller hiện tại return sớm khi scene đã là FloorDetail, thêm call load content cho floorId mới trước khi kết thúc xử lý. Không đặt logic load chỉ ở `Start()` của scene vì khi đổi tầng `Start()` không chạy lại.

Nếu còn gap chưa nhận ack: synchronizer giữ pending command, dùng re-send giới hạn khi bridge chưa nhận lệnh. Unity dedupe cùng requestId và có thể re-emit ack. Dừng retry route sau scene ack; không timeout theo một ngưỡng ngắn hơn việc load prefab bình thường. Content error có nút retry riêng.

### 8.3. UI

Giữ nền navy/dark, cyan/blue accent, breadcrumb và right panel hiện có theo mockup PDF trang 03. Chỉ thêm loading/error/unavailable ở vùng model. Panel tầng vẫn click được khi content đang tải. Phân biệt Unity player đang boot với đang tải mô hình tầng.

Khi status loading/error, không để overlay chặn nút đổi tầng/quay Campus. Camera input chỉ nhận pointer trong canvas khi model phù hợp. Không thêm sensor filter, popup, số thiết bị giả hoặc legend IoT để lấp chỗ trống. Sơ đồ màu/status sensor trong mockup là scope sau.

## 9. Phân công đã approve — agent thực hiện tối đa

### 9.1. Quy tắc thực thi

**User đã giao lại cho agent các thao tác kỹ thuật trước đây ghi manual.** Thay checklist cũ bằng task T1–T11 bên dưới. Agent tự khảo sát môi trường và thực hiện mọi phần có thể làm bằng source code, Editor script, command line hoặc Unity tool đang có. Không dừng ở việc đưa hướng dẫn thao tác Inspector nếu agent có khả năng áp dụng thay đổi đó.

Phân biệt ba tình huống:

- **Đủ dữ liệu và công cụ:** agent làm, validate và báo kết quả; không xin approve lại thao tác nằm trong plan.
- **Thiếu thông tin:** agent đọc source/metadata/bản vẽ trước, hỏi đúng dữ liệu còn thiếu nếu vẫn không xác định được; không biến việc nhập lại dữ liệu đã có thành manual task của user.
- **Thiếu khả năng thực thi:** chỉ chuyển phần bị chặn sang fallback user sau khi đã kiểm tra blocker thật, ví dụ không có Unity Editor truy cập được, WebGL module hoặc license dùng được. Agent vẫn hoàn thành script/setup đầu vào và phần kiểm tra độc lập; ghi đúng việc chưa chạy.

Approval này không thay thế dữ liệu hiện trường hoặc chứng minh rằng build đã chạy. Metadata/phép đổi chưa có chứng cứ vẫn giữ `Unverified`.

### 9.2. Bảng task thay thế checklist manual

| ID | Công việc | Agent thực hiện | User chỉ cần hỗ trợ khi | Kết quả cần có |
| --- | --- | --- | --- | --- |
| T1 | Chọn hai prefab pilot và xác định tầng | Scan asset/reference/metadata, lập mapping, chọn hai tầng có nội dung | Source không phân biệt được prefab thuộc tầng nào; user cung cấp mapping còn thiếu | Mapping prefab/GUID ↔ logical ID có căn cứ |
| T2 | Chuẩn bị wrapper | Tạo/rename wrapper theo quy ước, thêm `Geometry`, gắn component, giữ liên kết prefab nguồn | Asset nguồn chưa được cung cấp hoặc chỉ ở môi trường agent không truy cập được | Hai wrapper identity root, metadata/reference hợp lệ |
| T3 | Chuẩn bị hệ tọa độ | Đọc số liệu đã có, chỉnh transform/import có căn cứ, điền frame, chạy helper/gizmo kiểm tra | Thiếu đơn vị/mốc/hướng vật lý; user cung cấp số liệu khi có | Frame khai báo rõ, `Unverified` nếu chưa đối chiếu thực địa |
| T4 | Package và settings Addressables | Cài/resolve package phù hợp nếu thiếu, tạo/cập nhật groups/profile/path/compression/cache; lưu settings và lockfile thực | Package/Unity/module/license không thể truy cập hoặc xử lý trong môi trường agent | Package resolved và settings đã được áp dụng, không chỉ có hướng dẫn |
| T5 | Addressable entries | Đánh dấu từng wrapper, gán address theo ID, chuyển group FloorPrefabs | Chỉ khi Unity tooling không thực thi được sau kiểm tra | Entry riêng cho từng prefab, Pack Separately, remote paths, LZ4 |
| T6 | Registry | Tạo/cập nhật asset registry, điền AssetReference, validate ID/GUID và available/unavailable | Mapping đầu vào còn mơ hồ theo T1 | Registry đúng, không cần user kéo thả lại các reference đã biết |
| T7 | Scene và bootstrap wiring | Thay proof instance bằng host/contentRoot; gắn loader/registry vào `_InitManager`; giữ camera/singleton hiện có | Scene chưa được cung cấp hoặc công cụ không truy cập được | Wiring thực đã lưu, không còn direct dependency floor proof trong scene build |
| T8 | Dependency và tối ưu asset | Đọc Build Layout, tách dependency dùng chung; sửa import/material/component có căn cứ và kiểm tra visual | Cần thông tin thiết kế hoặc nguồn asset mà repo không có | Tối ưu có số đo, visual vẫn đúng yêu cầu |
| T9 | Build/export và tích hợp | Chạy content build WebGL, export player, copy đủ output, chạy localhost và kiểm tra | Không chạy được Unity/build/browser trong môi trường hiện có; chỉ chuyển phần thực sự bị chặn | Bộ player/StreamingAssets/ServerData cùng release và bằng chứng chạy thực |
| T10 | Áp dụng các tầng còn lại | Lặp setup có kiểm soát cho prefab đã có và ID đã xác định; validate/smoke từng tầng | Prefab hoặc mapping của một tầng chưa có | Danh sách configured/unavailable đúng với nội dung thực |
| T11 | Đối chiếu tọa độ thực khi có dữ liệu | Tính/điền phép đổi, đối chiếu reference points và sai số, cập nhật frame version khi cần | User cung cấp mốc khảo sát/bản vẽ có kích thước hoặc xác nhận mốc ngoài thực địa | Calibration có chứng cứ; task này không chặn load model Phase 03 |

Các task trước đây M1–M11 tương ứng T1–T11 theo cùng thứ tự. Tiền tố T dùng để chỉ công việc, không đồng nghĩa thao tác tay.

### 9.3. Tooling để agent thực hiện được các thao tác Unity

Ưu tiên workflow/Unity tool có sẵn trong repo và môi trường. Nếu chưa có automation, agent viết utility Editor nhỏ trong `UnityContent/Assets/Script/Editor/FloorContent/`, có menu chạy trong Editor và entrypoint static để có thể gọi qua CLI. Tool này chỉ chuẩn bị asset của Phase 03; không phải runtime floor editor thuộc Phase 2.

Utility cần hỗ trợ:

1. **Inspect:** liệt kê prefab/GUID, mapping có căn cứ, thay đổi dự kiến và trường còn thiếu. Đây là report kỹ thuật, không tạo gate xin approve mới cho phần user đã giao.
2. **Apply:** tạo/cập nhật wrapper, component, metadata, registry, Addressables entry/group/profile và scene wiring trong scope. Resolve package và chờ compile trước khi gọi code phụ thuộc Addressables; tách lượt resolve, setup và build khi cần.
3. **Validate:** xác nhận reference/ID/frame/scene dependencies, serialize thành công và không có duplicate.
4. **Build:** chạy content build rồi player build đúng target/release, chỉ báo thành công khi output và exit/log chứng minh đã hoàn tất.

Dùng Unity Editor API để sửa prefab/asset, ví dụ `PrefabUtility.LoadPrefabContents` → `SaveAsPrefabAsset` → `UnloadPrefabContents`; move/rename bằng AssetDatabase, xử lý scene bằng Editor scene APIs, cấu hình Addressables bằng Editor API phù hợp package đang cài. Những thao tác này không đòi user phải click từng field. `-executeMethod` hỗ trợ gọi static Editor method từ command line khi Unity chạy được. [R14]

**Yêu cầu khi chạy lại setup:** không tạo wrapper/component/registry entry/group trùng, không thay GUID của asset đã tồn tại, không reset calibration đã điền hoặc tăng contentVersion vô cớ. Chỉ ghi field cần thay đổi theo mapping rõ ràng; báo trường xung đột dữ liệu thay vì đoán. Không ghi đè asset không liên quan khi tên đích bị trùng. Giữ source model và sửa wrapper khi đủ đáp ứng yêu cầu; validate diff và reference sau khi lưu.

Chạy utility lần hai trên hai tầng pilot để xác nhận không sinh duplicate hoặc thay đổi ngoài ý muốn. Không cần dựng một framework automation tổng quát.

### 9.4. Phần user có thể còn phải làm

Không còn checklist bắt user rename, gắn component, kéo reference, tạo group hay export build mặc định. Chỉ còn hỗ trợ có điều kiện:

- Cung cấp prefab/mapping tầng khi source chưa đủ để xác định.
- Cung cấp mốc đo, đơn vị/hướng trục hoặc thông tin thiết kế thực tế mà agent không thể suy ra.
- Nếu môi trường agent thực sự không chạy được Unity: thực hiện bước môi trường tối thiểu, hoặc chạy menu/command setup-build mà agent đã chuẩn bị trên máy có Unity.

Trong fallback, agent ghi rõ task T nào bị chặn, capability nào thiếu, script/config đã chuẩn bị, command/menu cụ thể cần chạy và output/log cần trả lại. Hoàn thành phần có thể làm trước khi handover. Không báo asset đã cấu hình, test pass hoặc build thành công chỉ vì đã viết script.

## 10. Chia nhỏ triển khai — không all-in-one

Mỗi checkpoint là một đơn vị review/handover độc lập. Triển khai theo thứ tự phụ thuộc và ghi kết quả mỗi checkpoint. Gate là điều kiện kỹ thuật, không phải yêu cầu xin approve lại. Nếu được giao toàn bộ Phase 03, tiếp tục các checkpoint khi đủ đầu vào; nếu được giao riêng một checkpoint, hoàn thành đúng phạm vi đó. Chỉ chạy gate cần thiết cho phần thay đổi; không chạy lại toàn bộ browser matrix ở mọi bước.

### 03A — Đối chiếu baseline

**Agent**

- Đọc HEAD, `AGENTS.md` nếu có, handoff Phase 02 và package manifests.
- Kiểm tra một runtime/canvas, routes, bridge, `_InitManager`, scene list, camera rig, catalog `G,1…12`.
- Xác nhận/sửa có giới hạn các gap lint, local bootstrap guard, pending route ack nếu còn.
- Ghi version Unity/Addressables/Next đang dùng; không upgrade framework theo plan.
- Kiểm tra khả năng thực thi: source assets, Unity Editor/CLI hoặc Unity tool truy cập được, version/module WebGL/license, package resolve và browser. Ghi blocker thực nếu có; không mặc định mọi thao tác Unity đều phải nhờ user.
- Thực hiện T1; bắt đầu T4 bằng cài/resolve Addressables nếu thiếu trước khi compile code phụ thuộc package. Dùng metadata/reference có căn cứ để chọn pilot; chỉ hỏi phần mapping còn mơ hồ.

**Gate:** baseline/capability rõ; các lỗi cần sửa có evidence; hai prefab pilot đã xác định hoặc chỉ rõ dữ liệu thiếu ở T1. Blocker một phần không ngăn agent làm phần code/test độc lập.

### 03B — Metadata, registry và tự động chuẩn bị prefab

**Agent**

- Tạo `FloorContentMetadata`, `FloorCoordinateFrame`, `FloorContentRegistry` và Inspector/validator cần thiết.
- Validator read-only báo duplicate ID, missing reference, metadata không khớp, geometry/root sai cấu hình, basis không hữu hạn/suy biến.
- Tạo `FloorCoordinateMapper` thuần toán theo mục 5, với test đơn vị/trục/offset/root transform. Thêm gizmo chỉ Editor để đối chiếu mốc.
- Tạo hoặc tái sử dụng utility setup mục 9.3; thực hiện T2–T6 trên hai prefab pilot khi có đủ dữ liệu/tooling. Viết helper URL từ mục 6.2 ngay ở đây nếu profile cần nó, rồi tái sử dụng tại 03D.
- Chạy validate và chạy lại setup để kiểm tra không sinh duplicate, không đổi GUID hoặc reset metadata đã có. Ghi chính xác mapping và các thay đổi asset/settings.

**Hỗ trợ user có điều kiện:** chỉ mapping/asset nguồn còn thiếu theo T1–T3 hoặc blocker thực theo mục 9.4. Không chuyển thao tác tạo wrapper/gắn component/registry về user khi agent chạy được setup.

**Gate:** code compile; hai wrapper thật map đúng ID; registry có thể lookup; các mục chưa calibration ghi Unverified. Chưa yêu cầu browser load bundle ở gate này.

### 03C — Runtime loader và camera

**Agent**

- Tạo `FloorContentLoader` trên bootstrap hiện có và `FloorDetailContentHost` theo mục 7.
- Dùng LoadAssetAsync/Instantiate/Destroy/Release với ownership đầy đủ và xử lý stale callback.
- Hook cả scene-entry lẫn floorId-only change trong scene flow controller.
- Tách scene ready với content ready, cập nhật orbit bounds sau load.
- Implement unavailable/error/retry ở mức Unity contract; các event phải có correlation.
- Test vòng đời bằng backend load kiểm soát được completion hoặc PlayMode harness nhỏ: load thành công, failure, A→B→A, rời scene khi pending, destroy trước release. Chỉ tạo seam test nhỏ, không dựng framework content-provider cho Phase 2.

**Agent thực hiện T7:** áp dụng và lưu wiring scene/bootstrap bằng tooling. Có thể xem pilot bằng Use Asset Database để chỉnh visual; kết quả này không thay thế WebGL bundle acceptance. Khi thiếu môi trường chạy Unity, chuẩn bị phần setup tương ứng và ghi chưa thực thi.

**Gate:** hai prefab khác nhau hiện đúng khi thay selection trong Editor; chỉ một instance active; operation stale được release; camera fit không thay origin metadata.

### 03D — Tích hợp web state và static content

**Agent**

- Mở rộng typed payload/parser/event listeners và synchronizer ở mục 8.
- Loading/ready chỉ chuyển sau event đúng requestId + buildingId + floorId; retry hoạt động cùng URL.
- Hoàn thiện/tái sử dụng helper runtime origin cho Addressables từ 03B và bảo vệ stripping.
- Cấu hình `streamingAssetsUrl`, đường dẫn content release, HTTP headers theo output thực.
- Giữ right panel/menu và pointer behavior; không thêm IoT UI.

**Gate:** TypeScript/lint/build pass; parser rejects stale/invalid payload; error/retry không remount Unity; agent đã áp và validate profile/path với helper thực tế.

### 03E — Build thật và chạy localhost với hai tầng

**Agent thực hiện T9:** dùng workflow build có sẵn hoặc utility đã viết, tự chạy Addressables content build và WebGL player export. Chỉ fallback user cho bước thực sự bị chặn sau kiểm tra môi trường; không coi CLI mới chưa viết hoặc script chưa chạy là build đã hoàn tất.

**Agent**

- Copy đầy đủ output player và remote content đúng release; kiểm tra filename/case/catalog URLs không có đường dẫn ổ đĩa hoặc localhost hardcode ở browser release.
- Chạy Next dev server; thử từ Campus, deep link tầng, floor menu, Back/Forward và quay Campus.
- Kiểm tra Network chứng minh mở Campus không tự tải floor bundles; mở E/7 tải đúng E/7 + dependencies, chưa kéo E/8.
- Chạy production build/start để xác nhận MIME/encoding/cache headers, vì dev server có thể dùng cache policy khác.
- Giả lập một request bundle fail và thử lại; khôi phục hosting trước khi kết thúc kiểm tra.

**Gate:** Unity WebGL thật tải hai model đúng, không missing shader/material, không lỗi Brotli/StreamingAssets/catalog, không có canvas/runtime thứ hai. Ghi release và evidence browser thực; không nhận strings trong build làm bằng chứng đã chạy.

### 03F — Mở rộng content và đo tối ưu

**Agent thực hiện T8 khi có issue cụ thể và T10 cho prefab/ID đã xác định.** Không cần user áp lại setup cho từng tầng. Tầng thiếu nguồn/model/mapping được ghi chưa configured; không bịa nội dung để làm đầy danh sách.

**Agent**

- Đọc Build Layout/Analyze, đối chiếu dependency lớn bị nhân bản và base player data.
- Đo một lượt cold/warm thực trên máy và browser ghi rõ; ghi thời gian tới model ready, byte tải và peak/live resources.
- Chuyển lặp hai tầng 10 lượt rồi về Campus; handle/instance không tăng tích lũy. Nếu phát hiện leak/churn gây chậm thì sửa đúng nguyên nhân.
- Chốt danh sách tầng configured và chưa có content. Với mỗi prefab supplied, smoke visual ít nhất một lần; race/performance matrix dùng hai tầng đại diện.

**Gate:** nội dung supplied map đúng tầng; không giữ floor instance/handle sau cleanup; đạt tiêu chí cấu trúc tại mục 11. Không hứa thời gian dưới 1 giây khi chưa đo asset/mạng thật.

### 03G — Handover hoàn tất

**Agent**

- Viết `web/doc/phase_03_implementation_handoff.md`: commit/release, files/settings thực, commands đã chạy, trạng thái T1–T11, test pass/fail/not-run, baseline performance. Chỉ liệt kê hỗ trợ user còn cần khi nêu được thông tin/capability thực sự thiếu.
- Ghi bảng mapping tầng → prefab → address → content/frame version và tình trạng calibration.
- Ghi cách thêm một tầng bằng utility thực tế: xác định source prefab/ID → agent chạy setup wrapper/metadata/Addressable entry/registry → validate → content build/player export → copy output → smoke. User chỉ bổ sung nguồn/mapping nếu cần.
- Ghi rõ việc IoT sau này cần đúng context/frame/version và calibration thực địa; không đánh dấu icon/API là đã implement.

**Gate:** người tiếp theo đủ thông tin tái hiện build/run và thêm prefab mà không suy ra ID từ filename hoặc đọc lại cả lịch sử chat.

## 11. Acceptance matrix

| Mã | Kiểm tra | Kết quả cần có |
| --- | --- | --- |
| AC01 | Campus lần đầu, cache sạch | Campus chạy như baseline; không download floor bundle ngoài yêu cầu |
| AC02 | Click HoverableFloor có prefab configured | Đúng route, FloorDetail, model đúng ID, content state ready |
| AC03 | FloorDetail E/7 → E/8 | Scene/runtime/canvas giữ nguyên; geometry thay đúng, model cũ được cleanup |
| AC04 | Deep link/hard refresh một tầng | Sau boot và scene load, content đúng tầng xuất hiện |
| AC05 | Back/Forward và quay Campus | State/model theo route; content FloorDetail được cleanup khi rời |
| AC06 | A→B→A và đổi nhanh nhiều lần | Selection cuối thắng; callback cũ không activate/ghi đè UI |
| AC07 | Quay Campus khi download tầng đang pending | Campus vẫn vào được; kết quả đến muộn không hiện trong Campus; handle được release |
| AC08 | Tầng hợp lệ nhưng chưa configured, kể cả G nếu chưa có model | Thông báo chưa có mô hình; panel vẫn dùng; không fallback model sai |
| AC09 | Bundle 404/timeout và nút retry | Error rõ, cleanup đúng; retry thành công sau khôi phục, không reboot player |
| AC10 | Prefab sai metadata/thiếu component | Validator/runtime báo lỗi; không gắn model mang ID khác |
| AC11 | Kiểm tra tọa độ giả lập | Đơn vị, đổi trục, origin offset, parent transform cho kết quả đã tính trước |
| AC12 | Camera orbit/fit/resize canvas | Model không mất, origin không trôi; mapping helper vẫn chỉ vào cùng điểm model |
| AC13 | Đổi lặp 10 lượt rồi thoát FloorDetail | Không tăng dần active instances/owned handles; memory đo được ghi cùng điều kiện |
| AC14 | Headers và file phụ | `.br`/MIME đúng; `.bundle` không bị gắn Brotli sai; StreamingAssets/catalog/bundles đều tìm được |
| AC15 | Quay lại tầng đã xem và reload trang với cache bật | Ghi cold/warm network/cache behavior thực; không yêu cầu cache hit tuyệt đối mọi browser |
| AC16 | Regression UI | Một canvas, panel/nav không bị overlay chặn; không có sensor UI giả |

Performance ban đầu chốt bằng cơ chế và số đo: chưa tải tầng chưa chọn; không giữ mọi prefab trong base player/RAM; bundle per primary floor; xử lý dependency trùng nặng; tải/cleanup không tăng tài nguyên sau lượt lặp. Ghi thêm kích thước bundle, texture lớn nhất và thời gian instantiate nếu nó là nguyên nhân hitch. Asset authoring có nhiều GameObject/material/texture lớn vẫn có thể chậm dù đã dùng Addressables; agent áp dụng tối ưu có căn cứ và kiểm tra lại visual theo T8.

Model cần giữ material/shader tương thích render pipeline WebGL. Baked lightmap phụ thuộc scene, realtime light quá nhiều, collider/Rigidbody không cần thiết hoặc script `Awake` nặng cần được rà trên hai prefab pilot. Không mặc định một prefab sẽ mang theo mọi lighting setup của scene nguồn. Agent xác định lỗi và sửa phần kỹ thuật có thể thực hiện; chỉ hỏi user thông tin thiết kế/asset nguồn còn thiếu.

## 12. Commands cho agent implement

Chạy từ git root thật, không phải folder chứa bản plan tải về. Đọc `package.json` và lockfile trước; các lệnh npm dưới đây dùng khi repo giữ npm như handoff. Không chạy `create-next-app` lại.

```bash
git status --short
rg --files -g AGENTS.md -g package.json -g manifest.json -g packages-lock.json -g ProjectVersion.txt
rg -n "ApplyViewerRoute|ViewerStateChanged|FloorClicked|useUnityContext|streamingAssetsUrl" UnityContent/Assets/Script web/src
npm --prefix web ci
npm --prefix web run lint
npm --prefix web run build
npm --prefix web run dev
```

Production local: dừng dev server chiếm port trước, rồi chạy `npm --prefix web run start` sau build. Không tự restart server của user nếu chưa xác định ownership.

Kiểm tra HTTP bằng URL thật trong output, ví dụ sau khi file đó tồn tại:

```bash
curl -I http://localhost:3000/unity/campus/p03-r001/StreamingAssets/aa/settings.json
```

Nếu output package dùng đường dẫn khác thì dùng đường dẫn thực từ generated config/network; không tạo file giả `settings.json` để làm lệnh pass. Kiểm tra tương tự một bundle/catalog thực và file `.wasm.br` của release mới. Copy output đầy đủ theo mục 6; không rename file hash trong bundle/catalog.

Unity compile/EditMode/PlayMode/setup/build: agent dùng Unity Editor version project hiện có, Unity tool truy cập được hoặc CI entrypoint đã có. Nếu chưa có entrypoint, triển khai utility ở mục 9.3 và tự chạy khi môi trường hỗ trợ. Resolve package/import/compile xong trước khi áp dụng setup phụ thuộc Addressables; build content trước player.

Ví dụ CLI **chỉ sau khi agent đã tạo và compile method tương ứng**; đây không phải lệnh/utility đã tồn tại trong source snapshot:

```bash
"$PHASE03_UNITY_EDITOR" -batchmode -projectPath "$PHASE03_UNITY_PROJECT" -executeMethod UIT.Viewer.Editor.Phase03Setup.ApplyAndValidate -logFile "$PHASE03_SETUP_LOG" -quit
```

Agent xác định và điền các biến `PHASE03_*` bằng đường dẫn thực; `PHASE03_UNITY_PROJECT` trỏ `UnityContent/`. Có thể dùng tên method/menu khác theo convention repo nhưng phải ghi lệnh thực sự đã chạy trong handoff. Nếu utility dùng operation bất đồng bộ, chờ operation/compile hoàn tất trước khi thoát process; không dùng exit sớm rồi báo setup/build thành công.

Menu Unity Addressables Groups → Build → New Build → Default Build Script rồi Web player build là fallback trên máy user khi agent thực sự không thể chạy T9 (tên menu có thể khác theo version). Ưu tiên giao một menu/command đã chuẩn bị thay vì bắt user lặp lại thao tác Inspector. Ghi version, profile, active target và output directory trong handoff. Không ghi “pass” nếu chỉ có script hoặc chưa chạy/nhận output build thật.

## 13. Prompt giao từng checkpoint

```text
Đọc web/doc/phase_03_floor_prefab_loading_plan.md và handoff Phase 02.
Triển khai checkpoint 03B (hoặc checkpoint được giao), bám source HEAD.
Giữ một runtime/canvas và AppBootstrap hiện có.
User đã approve solution và giao agent thực hiện mọi thao tác kỹ thuật
có thể làm trong scope, gồm wrapper/rename, gắn component/ID/reference,
Addressables/registry/scene setup, build/export và kiểm tra.
Đọc source và kiểm tra Unity tooling trước; dùng hoặc viết Editor utility
chạy lại được, rồi tự áp dụng/validate khi môi trường hỗ trợ.
Không xin approve lại các thao tác đã giao. Chỉ hỏi dữ liệu mapping/mốc
thực tế còn thiếu; chỉ fallback user khi có blocker capability đã xác định.
Giữ GUID/reference và metadata đã có; không suy đoán tầng từ tên tùy ý.
Hoàn thành phần trong checkpoint và báo kết quả đã chạy, task T còn chờ,
blocker cụ thể và bước hỗ trợ tối thiểu nếu cần.
Không triển khai floor-document/editor/database/IoT icons ở checkpoint này.
```

## 14. Tài liệu kỹ thuật đối chiếu

Những lựa chọn group, token, ownership và coordinate contract ở trên là đề xuất cho project này. Tài liệu dưới đây xác nhận hành vi công cụ; agent đối chiếu lại API/settings với package version cài trong repo, không upgrade chỉ để trùng trang tài liệu.

- **R1 — Unity 6, Web AssetBundles:** https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-assetbundles.html
- **R2 — Addressables, AssetReference:** https://docs.unity3d.com/Packages/com.unity.addressables@2.3/manual/AssetReferences.html
- **R3 — Addressables, content packing/loading settings:** https://docs.unity3d.com/Packages/com.unity.addressables@2.3/manual/ContentPackingAndLoadingSchema.html
- **R4 — Addressables, memory/reference counts:** https://docs.unity3d.com/Packages/com.unity.addressables@2.3/manual/MemoryManagement.html
- **R5 — Addressables, operation handles và WebGL:** https://docs.unity3d.com/Packages/com.unity.addressables@2.3/manual/AddressableAssetsAsyncOperationHandle.html ; https://docs.unity3d.com/Packages/com.unity.addressables@2.3/manual/SynchronousAddressables.html
- **R6 — Unity 6, Web caching:** https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-caching.html
- **R7 — TransformPoint:** https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Transform.TransformPoint.html
- **R8 — Addressables, runtime profile variables:** https://docs.unity3d.com/Packages/com.unity.addressables@2.3/manual/ProfileVariables.html
- **R9 — Addressables, Build Layout:** https://docs.unity3d.com/Packages/com.unity.addressables@2.3/manual/BuildLayoutReport.html
- **R10 — React Unity WebGL, Streaming Assets:** https://react-unity-webgl.dev/docs/api/streaming-assets
- **R11 — Next.js public folder:** https://nextjs.org/docs/app/api-reference/file-conventions/public-folder
- **R12 — Unity 6, compressed Web deployment:** https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-deploying.html
- **R13 — Addressables, remote distribution/full build:** https://docs.unity3d.com/Packages/com.unity.addressables@2.3/manual/remote-content-enable.html ; https://docs.unity3d.com/Packages/com.unity.addressables@2.3/manual/builds-full-build.html
- **R14 — Unity Editor automation:** https://docs.unity3d.com/6000.0/Documentation/ScriptReference/PrefabUtility.LoadPrefabContents.html ; https://docs.unity3d.com/6000.0/Documentation/ScriptReference/AssetDatabase.MoveAsset.html ; https://docs.unity3d.com/6000.0/Documentation/Manual/EditorCommandLineArguments.html

Nguồn project: `phase_02_implementation_handoff.md`; `EBuilding_UIT_BEIVN(2).pdf` trang 03; ảnh tham khảo floor-detail user gửi. Không có repo source trực tiếp trong đầu vào khi lập tài liệu này; agent implement phải kiểm tra đường dẫn/chữ ký thực tế trước khi sửa.
