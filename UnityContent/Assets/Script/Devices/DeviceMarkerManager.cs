using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UITCampus.Bridge;
using UITCampus.FloorContent;

namespace UITCampus.Devices
{
    [Serializable]
    public class DeviceMarkerClusterClickedPayload
    {
        public int schemaVersion = 1;
        public string buildingId;
        public string floorId;
        public int count;
        public string[] deviceIds;
    }

    /// <summary>
    /// Manages IoT floor device markers as a Screen Space UI annotation layer over 3D floor geometry.
    /// Follows Section 4 and 5 of web/doc/phase_06_updating.md.
    /// </summary>
    [DisallowMultipleComponent]
    public class DeviceMarkerManager : MonoBehaviour
    {
        public static DeviceMarkerManager Instance { get; private set; }

        [Header("References")]
        [SerializeField] private WebViewerBridge bridge;

        private readonly Dictionary<string, DeviceMarkerItem> _singleMarkers = new Dictionary<string, DeviceMarkerItem>();
        private readonly List<DeviceMarkerItem> _groupMarkers = new List<DeviceMarkerItem>();
        private readonly Dictionary<string, FloorDeviceItemDto> _deviceRecords = new Dictionary<string, FloorDeviceItemDto>();

        // Filter state: category -> isVisible
        private readonly Dictionary<string, bool> _categoryVisibility = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase)
        {
            { "water_meter", true },
            { "temperature_humidity", true },
            { "smart_building", true },
            { "rf_uhf_reader", true },
            { "uhf_reader", true },
            { "camera", true },
            { "solar", true },
            { "avc", true },
            { "nfc", true },
            { "unknown", true },
            { "group", true }
        };

        private Canvas _overlayCanvas;
        private RectTransform _overlayCanvasRect;
        private RectTransform _markerContainer;

        private string _activeBuildingId;
        private string _activeFloorId;
        private int _currentLoadGeneration;
        private string _selectedDeviceId;

        public static DeviceMarkerManager EnsureInstance()
        {
            if (Instance != null) return Instance;

            var existing = FindFirstObjectByType<DeviceMarkerManager>();
            if (existing != null)
            {
                Instance = existing;
                return Instance;
            }

            // Prefer attaching to FloorDetailContentHost if present in scene
            GameObject targetGo;
            if (FloorDetailContentHost.Instance != null)
            {
                targetGo = FloorDetailContentHost.Instance.gameObject;
            }
            else
            {
                targetGo = new GameObject("DeviceMarkerManager");
            }

            Instance = targetGo.AddComponent<DeviceMarkerManager>();
            return Instance;
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            if (bridge == null)
            {
                bridge = FindFirstObjectByType<WebViewerBridge>();
            }

            EnsureCanvas();
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
            }
        }

        private void EnsureCanvas()
        {
            if (_overlayCanvas != null && _markerContainer != null) return;

            // Find existing or create dedicated Screen Space Overlay canvas
            var existingCanvas = transform.Find("DeviceMarkerOverlayCanvas");
            GameObject canvasGo;
            if (existingCanvas != null)
            {
                canvasGo = existingCanvas.gameObject;
            }
            else
            {
                canvasGo = new GameObject("DeviceMarkerOverlayCanvas");
                canvasGo.transform.SetParent(transform, false);
            }

            _overlayCanvas = canvasGo.GetComponent<Canvas>();
            if (_overlayCanvas == null) _overlayCanvas = canvasGo.AddComponent<Canvas>();
            _overlayCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _overlayCanvas.sortingOrder = 50; // Draw on top of scene

            var scaler = canvasGo.GetComponent<CanvasScaler>();
            if (scaler == null) scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920f, 1080f);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            var raycaster = canvasGo.GetComponent<GraphicRaycaster>();
            if (raycaster == null) canvasGo.AddComponent<GraphicRaycaster>();

            _overlayCanvasRect = canvasGo.GetComponent<RectTransform>();

            // Create container for markers
            var containerTransform = canvasGo.transform.Find("MarkerContainer");
            GameObject containerGo;
            if (containerTransform != null)
            {
                containerGo = containerTransform.gameObject;
            }
            else
            {
                containerGo = new GameObject("MarkerContainer");
                containerGo.transform.SetParent(canvasGo.transform, false);
            }

            _markerContainer = containerGo.GetComponent<RectTransform>();
            if (_markerContainer == null) _markerContainer = containerGo.AddComponent<RectTransform>();
            _markerContainer.anchorMin = Vector2.zero;
            _markerContainer.anchorMax = Vector2.one;
            _markerContainer.offsetMin = Vector2.zero;
            _markerContainer.offsetMax = Vector2.zero;
            _markerContainer.pivot = new Vector2(0.5f, 0.5f);
        }

        /// <summary>
        /// Applies Phase 06 IoT devices with TEST_LAYOUT_PREVIEW_V1 anchors and UI Screen Space badges.
        /// </summary>
        public void ApplyFloorDeviceMarkers(string payloadJson)
        {
            if (string.IsNullOrWhiteSpace(payloadJson))
            {
                Debug.LogWarning("[DeviceMarkerManager] Received empty IoT markers payload.");
                return;
            }

            ApplyFloorDeviceMarkersPayload payload;
            try
            {
                payload = JsonUtility.FromJson<ApplyFloorDeviceMarkersPayload>(payloadJson);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[DeviceMarkerManager] Failed to parse IoT markers payload: {ex.Message}");
                return;
            }

            if (payload == null || payload.schemaVersion != 1)
            {
                Debug.LogWarning("[DeviceMarkerManager] Unsupported IoT markers schema version.");
                return;
            }

            EnsureCanvas();
            ClearMarkers();

            _activeBuildingId = payload.buildingId;
            _activeFloorId = payload.floorId;
            _currentLoadGeneration = payload.loadGeneration;

            if (payload.devices == null || payload.devices.Length == 0)
            {
                EmitApplied(payload, 0);
                return;
            }

            int totalApplied = 0;
            foreach (var d in payload.devices)
            {
                if (d == null || string.IsNullOrEmpty(d.deviceId)) continue;
                _deviceRecords[d.deviceId] = d;

                float srcX = d.sourceLocation != null ? d.sourceLocation.x : 0f;
                float srcY = d.sourceLocation != null ? d.sourceLocation.y : 0f;
                int srcLevel = d.sourceLocation != null ? Mathf.RoundToInt(d.sourceLocation.floorLevel) : 0;

                // Render IoT device icon as its exact position from API response,
                // considering z = 0 and (x, y, z) = (0, 0, 0) is the center of prefab.
                Vector3 anchorLocal = new Vector3(srcX, srcY, 0f);

                var markerGo = new GameObject($"Marker_{d.category}_{d.deviceId}");
                markerGo.transform.SetParent(_markerContainer, false);

                var item = markerGo.AddComponent<DeviceMarkerItem>();
                item.InitializeSingle(
                    d.deviceId,
                    d.sourceDeviceType,
                    d.category,
                    payload.buildingId,
                    payload.floorId,
                    anchorLocal,
                    isTest: false,
                    OnMarkerClicked
                );

                _singleMarkers[d.deviceId] = item;
                totalApplied++;
            }

            Debug.Log($"[DeviceMarkerManager] Applied {totalApplied} IoT device markers on Floor {_activeBuildingId}/{_activeFloorId} (Gen: {_currentLoadGeneration})");
            EmitApplied(payload, totalApplied);
        }

        private void EmitApplied(ApplyFloorDeviceMarkersPayload payload, int count)
        {
            var ack = new FloorDeviceMarkersAppliedPayload
            {
                schemaVersion = 1,
                routeRequestId = payload.routeRequestId,
                loadGeneration = payload.loadGeneration,
                buildingId = payload.buildingId,
                floorId = payload.floorId,
                appliedCount = count,
                status = "applied",
                errorCode = null,
            };

            if (bridge == null) bridge = FindFirstObjectByType<WebViewerBridge>();
            bridge?.EmitFloorDeviceMarkersApplied(JsonUtility.ToJson(ack));
        }

        /// <summary>
        /// Backwards-compatible overload for Phase 04 ApplyFloorMarkers.
        /// </summary>
        public void ApplyFloorMarkers(string payloadJson)
        {
            if (string.IsNullOrWhiteSpace(payloadJson)) return;

            ApplyFloorMarkersPayload payload;
            try
            {
                payload = JsonUtility.FromJson<ApplyFloorMarkersPayload>(payloadJson);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[DeviceMarkerManager] Failed to parse Phase 04 markers payload: {ex.Message}");
                return;
            }

            if (payload == null || payload.schemaVersion != 1) return;

            EnsureCanvas();
            ClearMarkers();

            _activeBuildingId = payload.buildingId;
            _activeFloorId = payload.floorId;

            if (payload.markers == null) return;

            foreach (var m in payload.markers)
            {
                if (m == null || string.IsNullOrEmpty(m.id)) continue;

                Vector3 pos = m.position != null ? m.position.ToVector3() : Vector3.zero;
                var markerGo = new GameObject($"Marker_{m.kind}_{m.externalId}");
                markerGo.transform.SetParent(_markerContainer, false);

                var item = markerGo.AddComponent<DeviceMarkerItem>();
                item.InitializeSingle(
                    m.id,
                    m.kind,
                    m.kind,
                    payload.buildingId,
                    payload.floorId,
                    pos,
                    isTest: false,
                    OnMarkerClicked
                );
                _singleMarkers[m.id] = item;
            }
        }

        /// <summary>
        /// Previews temporary position for selected marker (Phase 04).
        /// </summary>
        public void PreviewMarkerPosition(string payloadJson)
        {
            if (string.IsNullOrWhiteSpace(payloadJson)) return;
            try
            {
                var payload = JsonUtility.FromJson<PreviewMarkerPositionPayload>(payloadJson);
                if (payload == null || string.IsNullOrEmpty(payload.deviceId) || payload.position == null) return;

                if (_singleMarkers.TryGetValue(payload.deviceId, out var item) && item != null)
                {
                    item.DisplayAnchorLocal = payload.position.ToVector3();
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[DeviceMarkerManager] Preview failed: {ex.Message}");
            }
        }

        private void OnMarkerClicked(DeviceMarkerItem item)
        {
            if (item == null) return;

            // When markers overlay each other, repeated clicks cycle through the stack
            DeviceMarkerItem targetItem = item;
            var colocated = new List<DeviceMarkerItem>();
            foreach (var kvp in _singleMarkers.Values)
            {
                if (kvp != null && Vector3.Distance(kvp.DisplayAnchorLocal, item.DisplayAnchorLocal) < 0.05f)
                {
                    colocated.Add(kvp);
                }
            }

            if (colocated.Count > 1 && _selectedDeviceId == item.DeviceId)
            {
                int currentIndex = colocated.FindIndex(m => m.DeviceId == item.DeviceId);
                int nextIndex = (currentIndex + 1) % colocated.Count;
                targetItem = colocated[nextIndex];
            }

            SelectMarker(targetItem.DeviceId);

            if (bridge == null) bridge = FindFirstObjectByType<WebViewerBridge>();

            // 1. Emit single-device clicked event
            var clickedPayload = new DeviceMarkerClickedPayload
            {
                schemaVersion = 1,
                buildingId = targetItem.BuildingId,
                floorId = targetItem.FloorId,
                deviceId = targetItem.DeviceId,
                category = targetItem.Category,
                sourceDeviceType = targetItem.SourceDeviceType,
                isTestAnchor = targetItem.IsTestAnchor,
            };
            bridge?.EmitDeviceMarkerClicked(JsonUtility.ToJson(clickedPayload));

            // 2. Also emit group clicked event for backwards compatibility
            var groupPayload = new DeviceMarkerClusterClickedPayload
            {
                schemaVersion = 1,
                buildingId = targetItem.BuildingId,
                floorId = targetItem.FloorId,
                count = 1,
                deviceIds = new string[] { targetItem.DeviceId }
            };
            bridge?.EmitDeviceMarkerGroupClicked(JsonUtility.ToJson(groupPayload));
        }

        public void SelectMarker(string deviceId)
        {
            _selectedDeviceId = deviceId;
            foreach (var kvp in _singleMarkers)
            {
                bool isTarget = string.Equals(kvp.Key, deviceId, StringComparison.OrdinalIgnoreCase);
                kvp.Value.SetSelected(isTarget);
                if (isTarget)
                {
                    kvp.Value.transform.SetAsLastSibling();
                }
            }
        }

        public void ClearFloorDeviceMarkers(string payloadJson)
        {
            if (!string.IsNullOrWhiteSpace(payloadJson))
            {
                try
                {
                    var p = JsonUtility.FromJson<ClearFloorDeviceMarkersPayload>(payloadJson);
                    if (p != null && p.loadGeneration > 0 && p.loadGeneration < _currentLoadGeneration)
                    {
                        return; // Stale clear ignored
                    }
                }
                catch { }
            }
            ClearMarkers();
        }

        public void ClearMarkers()
        {
            foreach (var kvp in _singleMarkers)
            {
                if (kvp.Value != null) Destroy(kvp.Value.gameObject);
            }
            _singleMarkers.Clear();

            foreach (var g in _groupMarkers)
            {
                if (g != null) Destroy(g.gameObject);
            }
            _groupMarkers.Clear();

            _deviceRecords.Clear();
            _selectedDeviceId = null;
        }

        /// <summary>
        /// Updates category filter visibility from React FloorFilterSidebar.
        /// </summary>
        public void ApplySensorFilters(SensorFiltersDto sensors)
        {
            if (sensors == null) return;
            _categoryVisibility["water_meter"] = sensors.waterMeter;
            _categoryVisibility["temperature_humidity"] = sensors.temperatureHumidity;
            _categoryVisibility["smart_building"] = sensors.smartBuilding;
            _categoryVisibility["rf_uhf_reader"] = sensors.rfUhfReader;
            _categoryVisibility["uhf_reader"] = sensors.rfUhfReader;
            _categoryVisibility["camera"] = sensors.camera;
            _categoryVisibility["solar"] = sensors.solar;
            _categoryVisibility["avc"] = sensors.avc;
            _categoryVisibility["nfc"] = sensors.nfc;
            _categoryVisibility["unknown"] = sensors.unknown;
            _categoryVisibility["group"] = true;
        }

        private void LateUpdate()
        {
            if (_singleMarkers.Count == 0 && _groupMarkers.Count == 0) return;
            EnsureCanvas();

            // Resolve active camera
            Camera activeCam = null;
            if (FloorDetailContentHost.Instance != null &&
                FloorDetailContentHost.Instance.OrbitCameraController != null &&
                FloorDetailContentHost.Instance.OrbitCameraController.TargetCamera != null)
            {
                activeCam = FloorDetailContentHost.Instance.OrbitCameraController.TargetCamera;
            }

            if (activeCam == null)
            {
                activeCam = Camera.main;
            }

            if (activeCam == null) return;

            // Resolve floor root transform
            Transform floorRoot = null;
            if (FloorDetailContentHost.Instance != null && FloorDetailContentHost.Instance.ContentRoot != null)
            {
                if (FloorDetailContentHost.Instance.ContentRoot.childCount > 0)
                {
                    floorRoot = FloorDetailContentHost.Instance.ContentRoot.GetChild(0);
                }
                else
                {
                    floorRoot = FloorDetailContentHost.Instance.ContentRoot;
                }
            }

            if (floorRoot == null) return;

            // Project each marker from floor local 3D point to Screen Space UI position
            Vector3 camForward = activeCam.transform.forward;
            Vector3 camPos = activeCam.transform.position;

            foreach (var kvp in _singleMarkers)
            {
                var item = kvp.Value;
                if (item == null) continue;

                // Check category filter
                if (!_categoryVisibility.TryGetValue(item.Category ?? "unknown", out bool isCatVisible) || !isCatVisible)
                {
                    if (item.gameObject.activeSelf) item.gameObject.SetActive(false);
                    continue;
                }

                // Floor-local to World Space
                Vector3 worldAnchor = floorRoot.TransformPoint(item.DisplayAnchorLocal);

                // Frustum facing check: discard points behind the camera
                Vector3 dir = worldAnchor - camPos;
                if (Vector3.Dot(camForward, dir) <= 0.05f)
                {
                    if (item.gameObject.activeSelf) item.gameObject.SetActive(false);
                    continue;
                }

                // World to Screen pixel point
                Vector3 screenPoint = activeCam.WorldToScreenPoint(worldAnchor);
                if (screenPoint.z <= 0.1f)
                {
                    if (item.gameObject.activeSelf) item.gameObject.SetActive(false);
                    continue;
                }

                // Check screen bounds (with slight padding so icons don't abruptly pop at edges)
                if (screenPoint.x < -40f || screenPoint.x > Screen.width + 40f ||
                    screenPoint.y < -40f || screenPoint.y > Screen.height + 40f)
                {
                    if (item.gameObject.activeSelf) item.gameObject.SetActive(false);
                    continue;
                }

                // Convert screen point to canvas local point
                if (RectTransformUtility.ScreenPointToLocalPointInRectangle(
                    _overlayCanvasRect,
                    screenPoint,
                    null, // null for ScreenSpaceOverlay
                    out Vector2 localPoint))
                {
                    item.SetScreenPosition(localPoint);
                    if (!item.gameObject.activeSelf) item.gameObject.SetActive(true);
                }
            }
        }
    }
}
