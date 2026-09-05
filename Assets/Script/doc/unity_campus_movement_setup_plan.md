# UIT Smart Campus — Simple Movement Setup Plan

## 1. Mục tiêu tài liệu

Tài liệu này hướng dẫn coding agent triển khai một vertical slice di chuyển first-person đơn giản trong khuôn viên UIT bằng Unity `6000.0.75f1`, trên scene hiện tại có model campus đã được import.

Kết quả cần đạt:

- Khi chạy trực tiếp scene hiện tại, người dùng có thể đi bộ quanh khuôn viên bằng bàn phím và xoay góc nhìn bằng chuột.
- Movement hoạt động ổn định trong Unity Editor Play Mode.
- Player khởi tạo tại `StartPosition_GateA` và camera nhìn theo hướng đi từ cổng A vào khuôn viên.
- Player không rơi xuyên mặt đất và không đi xuyên qua các khối công trình chính đã được đánh dấu collision.
- Cấu trúc code và prefab đủ sạch để mở rộng sang chọn tòa nhà, chuyển tầng/phòng và IoT hotspot ở các phase sau.

Đây chỉ là movement spike chạy trong Editor. Không triển khai indoor navigation, IoT interaction, loading scene, Addressables hoặc bất kỳ platform build nào trong task này.

---

## 2. Project brief cần giữ đúng

Ứng dụng là bản demo GIS/IoT cho khuôn viên UIT:

- Render mô hình 3D của khuôn viên và các tòa nhà UIT.
- Cho phép người dùng di chuyển bằng keyboard giữa các địa điểm.
- Tương lai sẽ mở rộng vào từng tòa nhà, tầng và phòng.
- Tại từng địa điểm, tương lai có thể highlight và hiển thị thông tin thiết bị IoT qua GUI/HUD.
- Realtime IoT data là nice-to-have, không thuộc movement spike.

Hiện trạng quan sát từ project:

- Scene đang mở: `TestScene`.
- Scene hierarchy đã được chuẩn hóa thủ công:

```text
TestScene
├── Directional Light
├── CampusRoot
│   ├── CampusVisualRoot
│   │   └── Map_Base
│   ├── GameplayAnchors
│   │   ├── StartPosition_GateA
│   │   └── ScaleReference_Player
│   └── CampusCollision
└── Main Camera
```

- `Map_Base` đã render đúng chiều đứng. Scene view từ hướng `Left` cho thấy world `Y` hướng lên và ground chạy trên mặt phẳng `XZ`; bước normalize up-axis được xem là đã hoàn thành.
- `StartPosition_GateA` đã nằm dưới `GameplayAnchors`, tách khỏi transform correction của visual model.
- `CampusCollision` đã được tạo làm container nhưng chưa cần có collider đầy đủ trước Phase D.
- `ScaleReference_Player` là capsule hiệu chuẩn tạm thời. Giá trị quan sát: Position `(-76.55, 0.9, 4.960001)`, Rotation `(0, 0, 0)`, Scale `(0.6, 0.9, 0.6)`, tương ứng chiều cao tham chiếu khoảng `1.8` unit khi parent scale bằng `1`.
- Tỷ lệ capsule so với công trình nhìn hợp lý cho movement spike. Agent không tự ý đổi scale model nếu chưa có measurement mới chứng minh cần thiết.
- Capsule đang xuất hiện trước camera trong Game view vì vẫn enabled; phải disable sau khi dùng làm scale/spawn reference và trước gameplay validation.
- Inspector của `CampusVisualRoot` và `StartPosition_GateA` không hiển thị trong screenshot mới. Agent phải ghi nhận transform thực tế trong scene; không khôi phục hoặc hard-code các tọa độ từ screenshot cũ.
- Project đã có folder `Assets/Script/`.
- Cần tạo folder `Assets/Prefabs/` nếu chưa tồn tại.

Agent phải xác nhận đường dẫn thực tế của `TestScene` trước khi chỉnh sửa. Screenshot cho thấy scene nằm trong `Assets/Scene/`; không tự ý chuyển scene sang folder khác.

---

## 3. Ràng buộc bắt buộc

### 3.1. Vị trí file

- Mọi file C# phải nằm dưới `Assets/Script/`.
- Mọi prefab mới phải nằm dưới `Assets/Prefabs/`.
- Không đặt script rải rác trong `Assets/Model/`, `Assets/Plugins/`, `Assets/Scene/` hoặc cạnh model import.
- Nếu cần Editor automation, file đó phải nằm trong `Assets/Script/Editor/`.

### 3.2. Asset loading

- Không cài đặt hoặc sử dụng Addressables trong task này.
- Movement spike không cần runtime-load bất kỳ prefab nào; ưu tiên đặt prefab instance trực tiếp trong `TestScene`.
- Chỉ khi thật sự cần runtime loading mới được dùng `Resources.LoadAsync`; không dùng synchronous `Resources.Load` trên gameplay path nếu có lựa chọn khác.
- Không tạo `Resources` folder nếu task hiện tại không cần.

### 3.3. Scene bootstrap

- Hiện chưa có Loading Scene; Play Mode phải khởi động trực tiếp từ `TestScene`.
- Các manager về sau cần được khởi tạo trước gameplay phải nằm chung trong prefab root `Assets/Prefabs/System/_InitManager.prefab`.
- Đặt đúng một instance `_InitManager` trong `TestScene`.
- `_InitManager` phải có thể được chuyển nguyên vẹn sang Loading Scene trong tương lai mà không cần sửa player code.
- Chỉ root `_InitManager` được gọi `DontDestroyOnLoad`.
- Phải có duplicate guard để không tồn tại hai `_InitManager` khi đổi/reload scene.

### 3.4. Giao tiếp giữa hệ thống

- Không sử dụng `GameObject.Find`, `FindObjectOfType`, `FindFirstObjectByType`, `FindAnyObjectByType` hoặc các biến thể scene-wide search.
- Không gọi `Camera.main` mỗi frame.
- Giao tiếp giữa manager và gameplay object phải thông qua static callback/event.
- Trong cùng một prefab, serialized reference hoặc `GetComponent` trên chính GameObject/child trực tiếp được phép và nên được ưu tiên.
- Continuous input được manager publish qua static signal; player chỉ cache state nhận được và sử dụng state đó trong vòng lặp movement.
- Mọi subscriber phải subscribe trong `OnEnable` và unsubscribe trong `OnDisable`.
- Static event phải có cơ chế reset khi domain reload bị tắt để tránh giữ delegate cũ.

### 3.5. Chất lượng code

- Tuân thủ SOLID, Clean Code và composition-over-inheritance.
- Mỗi component chỉ có một trách nhiệm rõ ràng.
- Tất cả dependency cấu hình được phải là `[SerializeField] private`; không để field mutable public.
- Không dùng magic number trong logic; các giá trị tuning phải nằm trong serialized settings.
- Không tạo `Manager` hoặc abstraction rỗng chỉ để “chuẩn bị tương lai”.
- Không tạo singleton cho player/camera.
- Không dùng LINQ hoặc cấp phát collection mới trong `Update`/`LateUpdate`.
- Không hand-edit YAML của `.unity` hoặc `.prefab` nếu có thể thao tác bằng Unity Editor hoặc một Editor setup tool idempotent.

---

## 4. Quyết định kỹ thuật

### 4.1. Loại điều khiển

Sử dụng first-person walking controller:

| Input | Hành vi |
| --- | --- |
| `WASD` | Di chuyển tiến/lùi/trái/phải theo hướng nhìn ngang |
| Arrow keys | Hỗ trợ tương đương WASD nếu không làm phức tạp code |
| Mouse | Xoay yaw và pitch |
| Left Shift | Sprint |
| Left click | Capture/lock cursor khi Game view đã focus |
| Escape | Release/unlock cursor |

Không triển khai jump, crouch, fly mode, gamepad hay mobile joystick trong scope này.

### 4.2. Coordinate system, spawn và initial camera

Coordinate system đã được chuẩn hóa trước khi bắt đầu implementation. Không lặp lại thao tác xoay/scale model trừ khi bước inspect phát hiện scene không còn thỏa các invariant bên dưới.

Scene invariants bắt buộc:

- Gameplay world dùng `Y-up`: ground nằm trên mặt phẳng `XZ`, gravity theo `-Y`, `CharacterController` đứng dọc trục `Y`.
- `CampusRoot` là gameplay coordinate root và phải giữ Position `(0, 0, 0)`, Rotation `(0, 0, 0)`, Scale `(1, 1, 1)` nếu scene hiện tại đã được setup đúng như ảnh.
- `CampusVisualRoot` là nơi duy nhất giữ axis/scale correction của imported model. `Map_Base` nằm dưới root này; không sửa mesh/material hoặc transform con generated từ GLB.
- `GameplayAnchors` và `CampusCollision` dùng cùng gameplay coordinate space với `CampusRoot`, không nằm dưới `CampusVisualRoot`.
- Transform của `CampusVisualRoot` được xem là frozen baseline. Agent phải ghi lại giá trị thực tế, nhưng không reset về identity và không áp lại rotation `±90°` một lần nữa.
- `CampusVisualRoot` chỉ được dùng uniform scale. Không dùng non-uniform scale và không scale `PlayerRig` để bù cho model.
- Capsule `ScaleReference_Player` cao khoảng `1.8` unit đang cho tỷ lệ thị giác hợp lý với công trình; dùng nó làm sanity check trước khi tạo player.

Quy ước spawn/camera:

- `StartPosition_GateA` là nguồn position và yaw ban đầu cho `PlayerRig`; marker biểu diễn vị trí chân/root player, không phải vị trí mắt camera.
- Giữ marker là scene object có thể chỉnh bằng gizmo; không copy/hard-code tọa độ vào C#.
- Nếu `ScaleReference_Player` đang đứng đúng vị trí spawn mong muốn, marker phải có cùng `X/Z` với capsule, tức khoảng `X = -76.55`, `Z = 4.96`; marker `Y` nằm tại mặt đường hoặc cao hơn khoảng `0.05` unit. Đây là giá trị setup để agent đối chiếu trong Editor, không phải constant trong code.
- Capsule có center `Y = 0.9`; không copy nguyên `Y = 0.9` sang marker vì marker biểu diễn vị trí chân.
- `PlayerRig` nhận marker qua serialized scene reference. Khi khởi tạo, copy world position và chỉ lấy yaw quanh world `Y`; reset pitch và roll về `0`.
- `CameraPivot` đặt local position theo eye height, khởi đầu local rotation `(0, 0, 0)`.
- Hướng `PlayerRig.forward` phải đi từ cổng A vào campus. Screenshot mới chưa hiển thị local axis hoặc Inspector của marker, vì vậy agent phải xác nhận bằng blue `+Z` forward arrow trong Local mode; chỉ chỉnh Rotation Y của marker.
- `Main Camera` hiện tại chỉ là preview. Không lấy transform camera cũ làm nguồn spawn và không giữ camera này enabled sau khi camera trong `PlayerRig` hoạt động.

Thêm `PlayerSpawnInitializer` trên `PlayerRig`:

- `[SerializeField] private Transform startPosition;`
- `[SerializeField] private Transform cameraPivot;`
- `[SerializeField] private float spawnClearance;` với giá trị mặc định nhỏ và editable trong Inspector.
- Trong `Awake`, đặt player root theo marker trước frame movement đầu tiên; xử lý `CharacterController.enabled` khi teleport nếu Unity yêu cầu.
- Đặt root rotation thành yaw-only từ marker và reset `cameraPivot.localRotation` về identity. Có thể dùng `[DefaultExecutionOrder(-200)]` để bảo đảm bước này chạy trước input/movement.
- Nếu thiếu reference, log một error rõ ràng và disable movement thay vì âm thầm spawn tại `(0, 0, 0)`.
- Không tìm marker bằng name, tag, `GameObject.Find` hoặc API scene search.

### 4.3. Physics movement

Sử dụng Unity `CharacterController`, không sử dụng Rigidbody-based controller.

Lý do:

- Phù hợp movement first-person đơn giản.
- Không cần xử lý rigidbody rotation hoặc lực vật lý ngoài ý muốn.
- Có `Slope Limit` và `Step Offset` phù hợp lối đi trong campus.
- Dễ kiểm soát và ổn định trong Editor Play Mode.

Movement phải:

- Normalize vector input để đi chéo không nhanh hơn đi thẳng.
- Chỉ dùng yaw của player root để xác định hướng đi; pitch của camera không làm player bay lên/xuống.
- Áp dụng gravity riêng và một downward ground-stick velocity nhỏ khi grounded.
- Dùng `Time.deltaTime`.
- Xóa input state khi app mất focus để tránh player tiếp tục chạy.

### 4.4. Input backend

Ưu tiên Unity Input System package. Agent phải kiểm tra package trước khi thêm dependency mới.

- Nếu `com.unity.inputsystem` đã có: dùng `Keyboard.current` và `Mouse.current`.
- Nếu chưa có: cài package qua Package Manager/manifest theo cách chuẩn và để Unity cập nhật package lock.
- Không cần tạo `.inputactions` asset cho spike này; đọc keyboard/mouse trong một input manager duy nhất để giảm setup và tránh generated code không cần thiết.
- Project `Active Input Handling` phải tương thích với Input System.

---

## 5. Kiến trúc đề xuất

```text
_InitManager (persistent prefab)
└── PlayerInputManager
        │
        └── publishes static InputSignals
                        │
                        ▼
PlayerRig prefab
├── CharacterController
├── PlayerSpawnInitializer  (uses serialized StartPosition_GateA)
├── PlayerInputState       (subscribes/caches input)
├── PlayerMotor            (translation + gravity)
└── CameraPivot
    ├── PlayerLook         (yaw + pitch)
    └── Main Camera
```

Phân tách trách nhiệm:

| Component | Trách nhiệm duy nhất |
| --- | --- |
| `AppBootstrap` | Giữ `_InitManager` persistent và ngăn duplicate |
| `PlayerInputManager` | Đọc keyboard/mouse, xử lý focus/cursor và publish signal |
| `InputSignals` | Static event hub cho input; không chứa gameplay logic |
| `PlayerSpawnInitializer` | Đặt player root tại serialized spawn marker trước khi movement bắt đầu |
| `PlayerInputState` | Subscribe signal và lưu trạng thái input hiện tại |
| `PlayerMotor` | Di chuyển `CharacterController`, gravity và grounded state |
| `PlayerLook` | Xoay player yaw và camera pitch |

Không gộp input, movement, camera và bootstrap vào một `PlayerController` lớn.

### Static callback contract

`InputSignals` tối thiểu cần cung cấp:

```csharp
event Action<Vector2> MoveChanged;
event Action<Vector2> LookChanged;
event Action<bool> SprintChanged;
event Action<bool> CursorLockChanged;
```

Có thể điều chỉnh tên theo convention của project, nhưng không thay đổi ý nghĩa.

Yêu cầu implementation:

- Chỉ `PlayerInputManager` publish các event này.
- `PlayerInputState` subscribe và cache `Move`, `Look`, `IsSprinting`.
- Khi cursor chưa lock hoặc application mất focus, publish/reset movement và look về zero.
- Dùng `[RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]` để reset static events/state khi bắt đầu Play Mode, đặc biệt khi Editor tắt Domain Reload.
- Nếu cần bảo đảm input được publish trước movement, có thể dùng `[DefaultExecutionOrder(-100)]` trên `PlayerInputManager`; không phụ thuộc thứ tự ngẫu nhiên của `Update`.

---

## 6. Cấu trúc folder và deliverable

Agent cần tạo đúng cấu trúc sau, bỏ qua file không thực sự cần nhưng không được đổi folder root:

```text
Assets/
├── Script/
│   ├── Core/
│   │   ├── Bootstrap/
│   │   │   └── AppBootstrap.cs
│   │   └── Signals/
│   │       └── InputSignals.cs
│   ├── Input/
│   │   └── PlayerInputManager.cs
│   └── Player/
│       ├── PlayerSpawnInitializer.cs
│       ├── PlayerInputState.cs
│       ├── PlayerMotor.cs
│       └── PlayerLook.cs
└── Prefabs/
    ├── System/
    │   └── _InitManager.prefab
    ├── Player/
    │   └── PlayerRig.prefab
    └── World/
        └── CampusCollisionProxy.prefab   # Chỉ tạo nếu collision proxy được prefab hóa
```

Nếu agent cần automation để tạo prefab/scene object, thêm:

```text
Assets/Script/Editor/CampusMovementSetupEditor.cs
```

Editor tool phải idempotent: chạy lại không tạo thêm manager, player, camera, AudioListener hoặc collider trùng.

---

## 7. Prefab specification

### 7.1. `_InitManager.prefab`

Hierarchy đề xuất:

```text
_InitManager
└── InputManager
```

Components:

- `_InitManager`
  - `AppBootstrap`
- `InputManager`
  - `PlayerInputManager`

`AppBootstrap` requirements:

- Gọi `DontDestroyOnLoad(gameObject)` cho root.
- Có static duplicate guard nhưng không expose gameplay API kiểu singleton.
- Nếu instance thứ hai xuất hiện, chỉ destroy duplicate root.
- Không dùng scene search để tìm instance hiện tại.
- Không tự động load scene hoặc prefab trong task này.

### 7.2. `PlayerRig.prefab`

Hierarchy đề xuất:

```text
PlayerRig
└── CameraPivot
    └── Main Camera
```

Root `PlayerRig`:

- `CharacterController`
- `PlayerSpawnInitializer`
- `PlayerInputState`
- `PlayerMotor`

`CameraPivot`:

- Local position khởi đầu `(0, 1.65, 0)` sau khi world scale đã được chuẩn hóa; cho phép tune eye height trong khoảng `1.6–1.7 m`.
- Initial local rotation `(0, 0, 0)`; runtime pitch bắt đầu từ `0`.
- `PlayerLook` với serialized reference đến player root, pivot và input state.

`Main Camera`:

- Local position và local rotation đều `(0, 0, 0)` dưới `CameraPivot`.
- Tag `MainCamera`.
- Chỉ có một `AudioListener` trong scene.
- Near clipping plane đủ nhỏ để không cắt geometry gần người chơi, nhưng không đặt cực nhỏ nếu không cần.

Baseline tuning values sau khi xác nhận `1 Unity unit ≈ 1 m`; tất cả phải editable trong Inspector:

| Setting | Giá trị khởi đầu |
| --- | ---: |
| Character height | `1.8` m |
| Character radius | `0.3` m |
| Character center Y | `0.9` m |
| Step offset | `0.3` m |
| Slope limit | `45` degrees |
| Walk speed | `4.0` m/s |
| Sprint speed | `7.0` m/s |
| Gravity | `-20.0` m/s² |
| Ground-stick velocity | khoảng `-2.0` m/s |
| Pitch clamp | `-80` đến `80` degrees |

Mouse sensitivity phụ thuộc Input System delta và resolution; expose trong Inspector và tune trong Editor. Không hard-code theo độ phân giải 4K đang hiển thị trong Game view.

### 7.3. Campus collision

Không tự động thêm `MeshCollider` vào mọi child của `Map_Base`.

Thực hiện theo thứ tự:

1. Kiểm tra model đã có collider hay chưa.
2. Xác nhận lại `Y-up` bằng Scene gizmo; nếu đúng như screenshot mới thì không thay đổi transform hierarchy đã chuẩn hóa.
3. Dùng `ScaleReference_Player` để xác nhận một player cao `1.8` unit có tỷ lệ hợp lý so với cửa/tầng của tòa nhà.
4. Tạo một ground collision proxy bằng `BoxCollider` mỏng hoặc một số collider đơn giản dưới `CampusCollision`, phủ các vùng người chơi được phép đi.
5. Thêm `BoxCollider`/compound collider đơn giản quanh các khối công trình chính để player không đi xuyên tòa nhà.
6. Chỉ dùng `MeshCollider` cho ground nếu mesh ground thực sự đơn giản và đã được kiểm tra; không dùng convex collider cho toàn campus.

Collider proxy có thể nằm trực tiếp trong scene. Nếu tái sử dụng hoặc có nhiều collider con, tạo `CampusCollisionProxy.prefab` dưới `Assets/Prefabs/World/`.

Không sửa mesh/material generated bên trong imported GLB prefab. Đặt collider và metadata trong wrapper/proxy riêng để model có thể reimport an toàn.

---

## 8. Scene setup

Sau khi triển khai, `TestScene` phải có hierarchy ở mức cao như sau:

```text
TestScene
├── Directional Light
├── CampusRoot
│   ├── CampusVisualRoot
│   │   └── Map_Base
│   ├── GameplayAnchors
│   │   ├── StartPosition_GateA
│   │   └── ScaleReference_Player    # inactive sau calibration
│   └── CampusCollision
│       ├── GroundProxy
│       └── BuildingBlockers
├── _InitManager
└── PlayerRig
```

Scene changes:

1. Lưu backup/commit trước khi sửa scene.
2. Xác nhận `CampusRoot`, `GameplayAnchors` và `CampusCollision` dùng identity transform; không reset `CampusVisualRoot`.
3. Ghi lại Position/Rotation/Scale thực tế của `CampusVisualRoot` vào báo cáo trước khi triển khai để có baseline reimport/debug.
4. So sánh `StartPosition_GateA` với capsule reference: cùng `X/Z` nếu capsule đang đánh dấu đúng spawn, marker nằm ở chân trên mặt đường và chỉ có yaw quanh `Y`.
5. Chuyển Scene tool sang Local và xác nhận blue `+Z` của marker chỉ từ Gate A vào campus.
6. Disable `ScaleReference_Player`; có thể giữ object inactive để hiệu chuẩn về sau nhưng không để MeshRenderer/Collider của nó tham gia gameplay test.
7. Đặt một instance `_InitManager.prefab` trong root scene.
8. Đặt một instance `PlayerRig.prefab` trong scene và gán `StartPosition_GateA` vào field `startPosition` của `PlayerSpawnInitializer` trên instance đó.
9. Nếu marker đang sát mặt collider, dùng serialized spawn clearance nhỏ hoặc nâng marker vừa đủ để `CharacterController` settle; không cộng offset ẩn bằng magic number.
10. Đặt `CameraPivot` tại eye height `1.65 m`, pitch/roll ban đầu bằng `0`, rồi kiểm tra góc nhìn thực tế từ cổng.
11. Xóa hoặc disable `Main Camera` cũ sau khi camera trong `PlayerRig` hoạt động.
12. Xác nhận scene chỉ có một enabled Camera và một enabled AudioListener.
13. Không đổi startup sang scene khác. `TestScene` vẫn chạy trực tiếp.

---

## 9. Trình tự implementation cho agent

### Phase A — Inspect, không thay đổi behavior

1. Xác nhận Unity version và render pipeline.
2. Xác nhận exact path của `TestScene`.
3. Kiểm tra Input System package và Active Input Handling.
4. Xác nhận hierarchy `CampusRoot/CampusVisualRoot/GameplayAnchors/CampusCollision` đúng như scene baseline.
5. Ghi lại transform thực tế của `CampusVisualRoot`; xác nhận model `Y-up`, uniform scale và tuyệt đối không normalize lần hai.
6. Xác nhận `CampusRoot`, `GameplayAnchors`, `CampusCollision` là identity transform.
7. Kiểm tra capsule reference có Position `(-76.55, 0.9, 4.960001)`, Rotation `(0, 0, 0)`, Scale `(0.6, 0.9, 0.6)` hoặc ghi nhận chênh lệch nếu team đã tune thêm.
8. Kiểm tra `StartPosition_GateA` nằm tại chân capsule trên mặt đường và blue `+Z` hướng vào campus.
9. Kiểm tra scene có script lỗi hoặc warning trước khi bắt đầu.

### Phase B — Code foundation

1. Tạo folder code dưới `Assets/Script/`.
2. Implement `InputSignals` và static reset.
3. Implement `AppBootstrap` duplicate guard.
4. Implement `PlayerInputManager` cho keyboard, mouse, focus và cursor lock.
5. Implement `PlayerSpawnInitializer` nhận serialized marker và khởi tạo position/yaw an toàn.
6. Implement `PlayerInputState` subscriber.
7. Implement `PlayerMotor` và `PlayerLook` tách biệt.
8. Đợi Unity compile; sửa toàn bộ error trước khi tạo prefab.

### Phase C — Prefabs

1. Tạo `_InitManager.prefab` đúng hierarchy.
2. Tạo `PlayerRig.prefab` với CharacterController và camera pivot.
3. Assign các serialized reference nội bộ trong prefab; không tìm reference lúc runtime bằng scene search.
4. Để field `startPosition` trống trên prefab asset vì đây là scene reference; field này bắt buộc được gán trên scene instance ở Phase D.
5. Kiểm tra prefab độc lập không có missing script hoặc missing internal reference.

### Phase D — World collision và scene wiring

1. Giữ nguyên transform đã chuẩn hóa của `CampusVisualRoot`.
2. Tạo ground proxy và building blocker dưới `CampusCollision`.
3. Add hai prefab instance vào `TestScene`.
4. Gán `StartPosition_GateA` cho scene instance của `PlayerSpawnInitializer`.
5. Giữ camera pitch/roll khởi đầu bằng `0`; yaw lấy từ marker đã xác nhận ở Phase A.
6. Disable `ScaleReference_Player` để mesh và CapsuleCollider hiệu chuẩn không xuất hiện/tham gia gameplay.
7. Xử lý camera/audio listener cũ.
8. Lưu scene.

### Phase E — Validation

1. Test Play Mode trong Editor.
2. Test mất focus, Escape và click-to-lock.
3. Test spawn chính xác tại `StartPosition_GateA`, camera ở eye height và hướng nhìn ban đầu đi vào campus.
4. Kiểm tra movement nằm trên ground `XZ`; nhấn W không làm player đi lên/xuống do sai trục.
5. Xác nhận `ScaleReference_Player` không render, không block camera và collider của nó không tương tác với player.
6. Kiểm tra Console không có exception hoặc warning lặp mỗi frame.
7. Kiểm tra Profiler không có GC allocation đáng kể từ movement/input mỗi frame.

---

## 10. Acceptance criteria

Task chỉ được đánh dấu hoàn thành khi đáp ứng tất cả điều kiện sau:

### Functional

- Play trực tiếp `TestScene` hoạt động, không cần Loading Scene.
- Player root spawn theo world position và yaw của `StartPosition_GateA`; không hard-code tọa độ trong script.
- Camera bắt đầu tại eye height, pitch/roll bằng `0` và nhìn từ cổng A vào khuôn viên.
- World gameplay đã được xác nhận `Y-up`; W/S di chuyển trên ground `XZ`, gravity chạy theo `-Y`.
- WASD di chuyển tương đối theo yaw của camera/player.
- Diagonal movement không nhanh hơn straight movement.
- Mouse yaw/pitch mượt; pitch clamp và không có camera roll.
- Shift chuyển đúng giữa walk và sprint speed.
- Gravity hoạt động; player không rơi xuyên ground proxy.
- Player không đi xuyên các building chính đã có blocker collider.
- Click capture cursor; Escape release cursor.
- Khi Editor/Game view mất focus, input reset và player không tiếp tục chạy.

### Architecture

- Tất cả `.cs` nằm trong `Assets/Script/`.
- Tất cả prefab nằm trong `Assets/Prefabs/`.
- Giữ hierarchy `CampusRoot > CampusVisualRoot/GameplayAnchors/CampusCollision`; không đưa gameplay anchor hoặc collider vào visual correction root.
- `_InitManager.prefab` chứa manager cần bootstrap và có đúng một instance trong scene.
- `PlayerRig.prefab` không phụ thuộc scene-wide search; scene instance nhận `StartPosition_GateA` qua serialized reference.
- Không có Addressables.
- Không có Resources loading nếu không thật sự cần.
- Không có `GameObject.Find` hoặc `Find*ObjectByType`.
- Cross-system communication dùng static callbacks và unsubscribe đúng lifecycle.
- Không tồn tại god class gom input, movement, camera và bootstrap.

### Project health

- Không có compile error.
- `CampusRoot`, `GameplayAnchors` và `CampusCollision` giữ identity transform.
- `CampusVisualRoot` giữ transform baseline đã chuẩn hóa và chỉ dùng uniform scale.
- Không có missing MonoBehaviour hoặc missing internal reference trong prefab.
- Scene instance của `PlayerSpawnInitializer.startPosition` đã tham chiếu đúng `StartPosition_GateA`.
- `ScaleReference_Player` inactive; MeshRenderer và CapsuleCollider hiệu chuẩn không tham gia runtime test.
- Chỉ có một active Camera và một AudioListener.
- Không có duplicate `_InitManager` khi reload/đổi scene trong test.
- Reimport `map.glb` không làm mất player setup hoặc collision proxy.
- Scene và prefab changes được lưu đầy đủ cùng `.meta` files.

---

## 11. Manual test checklist

| Test | Expected result |
| --- | --- |
| Inspect hierarchy trước Play | `CampusRoot`, visual, anchors và collision container đúng baseline; không có normalize lặp |
| Inspect `ScaleReference_Player` | Capsule giữ tỷ lệ tham chiếu `1.8` unit nhưng đang inactive |
| Start `TestScene` | Player root xuất hiện tại `StartPosition_GateA`, không nhảy về world origin |
| Kiểm tra góc nhìn đầu tiên | Camera ở eye height, không roll và nhìn từ cổng A vào campus |
| Quan sát Game view | Không còn capsule hiệu chuẩn che chính giữa camera |
| Kiểm tra Scene gizmo | Campus/ground dùng `Y-up`; model không bị dựng đứng hoặc lật |
| Nhấn W rồi thả | Player tiến rồi dừng ngay |
| Nhấn W tại spawn | Player đi vào campus trên mặt đất, không dịch chuyển theo trục đứng |
| Nhấn W+D | Speed tổng không vượt walk/sprint setting |
| Xoay mouse ngang | Player root quay yaw |
| Xoay mouse dọc | Chỉ camera pivot quay pitch |
| Nhìn thẳng lên/xuống | Pitch dừng ở clamp, camera không lật |
| Giữ Shift | Player sprint, thả Shift trở lại walk |
| Đi qua campus | Không rơi xuyên đất hoặc rung liên tục |
| Đi vào building blocker | CharacterController bị chặn hợp lý |
| Nhấn Escape | Cursor unlock, camera ngừng nhận mouse look |
| Click lại Game view | Cursor lock và camera tiếp tục hoạt động |
| Alt-tab/mất focus khi đang giữ W | Player dừng, không bị sticky input |
| Reimport GLB | Scene wrapper, collider và player vẫn còn nguyên |

---

## 12. Những việc không làm trong task này

- Không triển khai lựa chọn/highlight tòa nhà.
- Không tạo dữ liệu Building/Floor/Room.
- Không triển khai IoT device HUD hoặc realtime API.
- Không triển khai NavMesh, pathfinding hoặc minimap.
- Không triển khai teleport/chuyển scene/chuyển tầng.
- Không tạo Loading Scene.
- Không tạo hoặc kiểm thử platform build; scope hiện tại chỉ là Editor Play Mode.
- Không cài Addressables.
- Không tối ưu mesh, material hoặc texture nếu chưa có số đo chứng minh cần thiết.
- Không thêm mobile control hoặc gamepad.
- Không thêm jump chỉ vì controller mẫu có sẵn.

---

## 13. Extension seam cho phase sau

Implementation hiện tại phải để lại các điểm mở rộng sau mà không xây dựng trước:

- `_InitManager` có thể được chuyển sang Loading Scene và vẫn publish input giống hiện tại.
- `PlayerRig` có thể nhận static callback tương lai để teleport đến building/floor spawn point.
- Collision proxy và visual `Map_Base` tách nhau, cho phép thay/reimport model.
- Building metadata/hotspot có thể được thêm bằng component riêng, không sửa `PlayerMotor` hoặc `PlayerLook`.
- Input backend có thể đổi sang action map/mobile input mà không thay movement logic, miễn vẫn publish cùng `InputSignals` contract.

Agent không được implement trước các extension này trong movement spike.

---

## 14. Báo cáo bàn giao bắt buộc từ agent

Khi hoàn thành, agent phải báo cáo ngắn gọn:

1. Danh sách file đã tạo hoặc chỉnh sửa.
2. Exact scene path đã chỉnh sửa.
3. Prefab hierarchy cuối cùng.
4. Input package/version được sử dụng.
5. Position/Rotation/Scale baseline thực tế của `CampusVisualRoot` và xác nhận uniform scale.
6. Collider strategy thực tế dưới `CampusCollision`.
7. Position/Rotation cuối cùng của `StartPosition_GateA` và xác nhận blue `+Z` hướng vào campus.
8. Eye height cùng các giá trị movement tuning cuối cùng.
9. Kết quả Editor Play Mode test, bao gồm xác nhận capsule reference không tham gia runtime.
10. Bất kỳ limitation nào còn lại, đặc biệt là khu vực campus chưa có blocker collider.
