using System;
using System.Collections.Generic;
using UnityEngine;
using UITCampus.Bridge;
using UITCampus.FloorContent;

namespace UITCampus.Devices
{
    [DisallowMultipleComponent]
    public class DeviceMarkerManager : MonoBehaviour
    {
        public static DeviceMarkerManager Instance { get; private set; }

        [Header("References")]
        [SerializeField] private WebViewerBridge bridge;

        private readonly Dictionary<string, DeviceMarkerItem> _markers = new Dictionary<string, DeviceMarkerItem>();
        private Transform _markersRoot;
        private string _activeBuildingId;
        private string _activeFloorId;
        private string _selectedDeviceId;

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
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
            }
        }

        private Transform GetOrCreateMarkersRoot()
        {
            if (_markersRoot != null) return _markersRoot;

            // Anchor under FloorDetailContentHost.ContentRoot if available
            Transform parent = transform;
            if (FloorDetailContentHost.Instance != null && FloorDetailContentHost.Instance.ContentRoot != null)
            {
                parent = FloorDetailContentHost.Instance.ContentRoot;
            }

            var rootGo = new GameObject("DeviceMarkersRoot");
            rootGo.transform.SetParent(parent, false);
            _markersRoot = rootGo.transform;
            return _markersRoot;
        }

        /// <summary>
        /// Applies the current set of device markers for the floor.
        /// Invoked via bridge or directly.
        /// </summary>
        public void ApplyFloorMarkers(string payloadJson)
        {
            if (string.IsNullOrWhiteSpace(payloadJson))
            {
                Debug.LogWarning("[DeviceMarkerManager] Received empty markers payload.");
                return;
            }

            ApplyFloorMarkersPayload payload;
            try
            {
                payload = JsonUtility.FromJson<ApplyFloorMarkersPayload>(payloadJson);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[DeviceMarkerManager] Failed to parse markers payload: {ex.Message}");
                return;
            }

            if (payload == null || payload.schemaVersion != 1)
            {
                Debug.LogWarning("[DeviceMarkerManager] Unsupported markers schema version.");
                return;
            }

            ClearMarkers();

            _activeBuildingId = payload.buildingId;
            _activeFloorId = payload.floorId;

            Transform root = GetOrCreateMarkersRoot();

            if (payload.markers == null) return;

            foreach (var m in payload.markers)
            {
                if (m == null || string.IsNullOrEmpty(m.id)) continue;

                var markerGo = new GameObject($"Marker_{m.kind}_{m.externalId}");
                markerGo.transform.SetParent(root, false);
                markerGo.transform.localPosition = m.position != null ? m.position.ToVector3() : Vector3.zero;

                var item = markerGo.AddComponent<DeviceMarkerItem>();
                item.Initialize(
                    m.id,
                    m.externalId,
                    m.name,
                    m.kind,
                    payload.buildingId,
                    payload.floorId,
                    OnMarkerClicked
                );

                _markers[m.id] = item;
            }

            Debug.Log($"[DeviceMarkerManager] Applied {_markers.Count} markers for Floor {_activeBuildingId}/{_activeFloorId}");
        }

        /// <summary>
        /// Updates the temporary preview position of a selected marker without persisting.
        /// </summary>
        public void PreviewMarkerPosition(string payloadJson)
        {
            if (string.IsNullOrWhiteSpace(payloadJson)) return;

            PreviewMarkerPositionPayload payload;
            try
            {
                payload = JsonUtility.FromJson<PreviewMarkerPositionPayload>(payloadJson);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[DeviceMarkerManager] Failed to parse preview payload: {ex.Message}");
                return;
            }

            if (payload == null || string.IsNullOrEmpty(payload.deviceId) || payload.position == null)
            {
                return;
            }

            if (_markers.TryGetValue(payload.deviceId, out var marker))
            {
                marker.SetFloorLocalPosition(payload.position.ToVector3());
            }
        }

        /// <summary>
        /// Selects or highlights a marker by deviceId.
        /// </summary>
        public void SelectMarker(string deviceId)
        {
            _selectedDeviceId = deviceId;
            foreach (var kvp in _markers)
            {
                kvp.Value.SetSelected(kvp.Key == deviceId);
            }
        }

        /// <summary>
        /// Destroys all current markers and cleans up references.
        /// </summary>
        public void ClearMarkers()
        {
            _selectedDeviceId = null;
            _markers.Clear();

            if (_markersRoot != null)
            {
                Destroy(_markersRoot.gameObject);
                _markersRoot = null;
            }
        }

        /// <summary>
        /// Applies sensor type filters to marker instances.
        /// </summary>
        public void ApplySensorFilters(SensorFiltersDto filters)
        {
            if (filters == null) return;

            bool deselectCurrent = false;

            foreach (var kvp in _markers)
            {
                var item = kvp.Value;
                if (item == null) continue;

                bool visible = true;
                switch (item.Kind?.ToLowerInvariant())
                {
                    case "temperature_humidity":
                        visible = filters.temperatureHumidity;
                        break;
                    case "smart_building":
                        visible = filters.smartBuilding;
                        break;
                    case "water_meter":
                        visible = filters.waterMeter;
                        break;
                    case "uhf_reader":
                        visible = filters.rfUhfReader;
                        break;
                    case "camera":
                        visible = filters.camera;
                        break;
                    default:
                        // If all are on, show; otherwise hide
                        visible = filters.temperatureHumidity && filters.smartBuilding &&
                                  filters.waterMeter && filters.rfUhfReader && filters.camera;
                        break;
                }

                if (item.gameObject.activeSelf != visible)
                {
                    item.gameObject.SetActive(visible);
                }

                if (!visible && kvp.Key == _selectedDeviceId)
                {
                    deselectCurrent = true;
                }
            }

            if (deselectCurrent)
            {
                SelectMarker(null);
            }
        }

        private void OnMarkerClicked(DeviceMarkerItem item)
        {
            if (item == null) return;

            SelectMarker(item.DeviceId);

            var payload = new DeviceMarkerClickedPayload
            {
                schemaVersion = 1,
                buildingId = item.BuildingId,
                floorId = item.FloorId,
                deviceId = item.DeviceId,
                externalId = item.ExternalId,
            };

            string json = JsonUtility.ToJson(payload);

            if (bridge == null)
            {
                bridge = FindFirstObjectByType<WebViewerBridge>();
            }

            bridge?.EmitDeviceMarkerClicked(json);
        }
    }
}

