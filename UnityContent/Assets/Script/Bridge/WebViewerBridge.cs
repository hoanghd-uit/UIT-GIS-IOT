using System;
using System.Runtime.InteropServices;
using UnityEngine;
using UITCampus.Campus.Buildings;
using UITCampus.Core.Bootstrap;
using UITCampus.Core.Signals;
using UITCampus.FloorContent;

namespace UITCampus.Bridge
{
    [Serializable]
    public class ObjectFiltersDto
    {
        public bool ceilling = true;
        public bool interior = true;
        public bool wall = true;
    }

    [Serializable]
    public class SensorFiltersDto
    {
        public bool waterMeter = true;
        public bool temperatureHumidity = true;
        public bool smartBuilding = true;
        public bool rfUhfReader = true;
        public bool camera = true;
    }

    [Serializable]
    public class ApplyFloorFiltersPayload
    {
        public int schemaVersion = 1;
        public string routeRequestId;
        public string buildingId;
        public string floorId;
        public int filterRevision;
        public ObjectFiltersDto objects;
        public SensorFiltersDto sensors;
    }

    [Serializable]
    public class FloorFiltersAppliedPayload
    {
        public int schemaVersion = 1;
        public string routeRequestId;
        public string buildingId;
        public string floorId;
        public int filterRevision;
        public string status; // "applied" or "rejected"
        public string errorCode;
    }

    /// <summary>
    /// Outbound bridge between Unity and the host web viewer.
    /// Dispatches events via WebGL JavaScript interop in WebGL builds,
    /// or logs to Unity Console as an editor/standalone fallback.
    /// </summary>
    [DisallowMultipleComponent]
    public class WebViewerBridge : MonoBehaviour
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern void DispatchViewerEvent(string eventName, string payloadJson);
#endif

        [Serializable]
        private class FloorClickedPayload
        {
            public int schemaVersion = 1;
            public string buildingId;
            public string floorId;
        }

        [Serializable]
        private class ViewerErrorPayload
        {
            public int schemaVersion = 1;
            public string code;
            public string message;
        }

        private static readonly string[] ValidBuildingEFloors = new string[]
        {
            "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "G"
        };

        private void OnEnable()
        {
            // Do not subscribe on duplicate _InitManager instances slated for destruction
            var bootstrap = GetComponent<AppBootstrap>();
            if (bootstrap != null && !bootstrap.IsPrimary)
            {
                return;
            }

            FloorHoverSignals.FloorClicked += HandleFloorClicked;
        }

        private void OnDisable()
        {
            FloorHoverSignals.FloorClicked -= HandleFloorClicked;
        }

        private void HandleFloorClicked(HoverableFloor floor)
        {
            if (floor == null)
            {
                return;
            }

            string buildingId = floor.BuildingId;
            string floorId = floor.FloorId;

            if (buildingId != "E" || !IsValidFloorId(floorId))
            {
                Debug.LogWarning($"[WebViewerBridge] Ignored floor click with invalid or unsupported metadata: building='{buildingId}', floor='{floorId}' on '{floor.name}'.", floor);
                return;
            }

            var payload = new FloorClickedPayload
            {
                schemaVersion = 1,
                buildingId = buildingId,
                floorId = floorId
            };

            string json = JsonUtility.ToJson(payload);
            DispatchEvent("FloorClicked", json);
        }

        /// <summary>
        /// Sends an event with a JSON payload to the host React application.
        /// </summary>
        public void DispatchEvent(string eventName, string payloadJson)
        {
            if (string.IsNullOrEmpty(eventName) || string.IsNullOrEmpty(payloadJson))
            {
                return;
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                DispatchViewerEvent(eventName, payloadJson);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[WebViewerBridge] Failed to dispatch event '{eventName}': {ex.Message}");
            }
#else
            Debug.Log($"[WebViewerBridge] (Editor fallback) Dispatched event '{eventName}': {payloadJson}");
#endif
        }

        /// <summary>
        /// Emits a ViewerStateChanged event payload.
        /// </summary>
        public void EmitViewerStateChanged(string payloadJson)
        {
            DispatchEvent("ViewerStateChanged", payloadJson);
        }

        /// <summary>
        /// Emits a FloorContentStateChanged event payload.
        /// </summary>
        public void EmitFloorContentStateChanged(string payloadJson)
        {
            DispatchEvent("FloorContentStateChanged", payloadJson);
        }

        /// <summary>
        /// Emits a standardized ViewerError event payload.
        /// </summary>
        public void EmitViewerError(string code, string message)
        {
            var payload = new ViewerErrorPayload
            {
                schemaVersion = 1,
                code = code ?? "UNKNOWN_ERROR",
                message = message ?? string.Empty
            };

            string json = JsonUtility.ToJson(payload);
            DispatchEvent("ViewerError", json);
        }

        /// <summary>
        /// Emits a DeviceMarkerClicked event payload.
        /// </summary>
        public void EmitDeviceMarkerClicked(string payloadJson)
        {
            DispatchEvent("DeviceMarkerClicked", payloadJson);
        }

        /// <summary>
        /// Applies floor markers in Unity WebGL.
        /// Inbound command from React: sendMessage("_InitManager", "ApplyFloorMarkers", json)
        /// </summary>
        public void ApplyFloorMarkers(string payloadJson)
        {
            if (UITCampus.Devices.DeviceMarkerManager.Instance != null)
            {
                UITCampus.Devices.DeviceMarkerManager.Instance.ApplyFloorMarkers(payloadJson);
            }
            else
            {
                var mgr = FindFirstObjectByType<UITCampus.Devices.DeviceMarkerManager>();
                if (mgr != null)
                {
                    mgr.ApplyFloorMarkers(payloadJson);
                }
            }
        }

        /// <summary>
        /// Previews temporary position for selected marker.
        /// Inbound command from React: sendMessage("_InitManager", "PreviewMarkerPosition", json)
        /// </summary>
        public void PreviewMarkerPosition(string payloadJson)
        {
            UITCampus.Devices.DeviceMarkerManager.Instance?.PreviewMarkerPosition(payloadJson);
        }

        /// <summary>
        /// Selects a marker in Unity.
        /// Inbound command from React: sendMessage("_InitManager", "SelectFloorMarker", deviceId)
        /// </summary>
        public void SelectFloorMarker(string deviceId)
        {
            UITCampus.Devices.DeviceMarkerManager.Instance?.SelectMarker(deviceId);
        }

        /// <summary>
        /// Clears all markers from the floor.
        /// Inbound command from React: sendMessage("_InitManager", "ClearFloorMarkers", "")
        /// </summary>
        public void ClearFloorMarkers()
        {
            UITCampus.Devices.DeviceMarkerManager.Instance?.ClearMarkers();
        }

        /// <summary>
        /// Emits a FloorFiltersApplied event payload.
        /// </summary>
        public void EmitFloorFiltersApplied(string payloadJson)
        {
            DispatchEvent("FloorFiltersApplied", payloadJson);
        }

        /// <summary>
        /// Applies floor object and sensor filters in Unity WebGL.
        /// Inbound command from React: sendMessage("_InitManager", "ApplyFloorFilters", json)
        /// </summary>
        public void ApplyFloorFilters(string payloadJson)
        {
            if (string.IsNullOrWhiteSpace(payloadJson))
            {
                Debug.LogWarning("[WebViewerBridge] Received empty floor filters payload.");
                return;
            }

            ApplyFloorFiltersPayload payload;
            try
            {
                payload = JsonUtility.FromJson<ApplyFloorFiltersPayload>(payloadJson);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[WebViewerBridge] Failed to parse floor filters payload: {ex.Message}");
                return;
            }

            if (payload == null || payload.schemaVersion != 1)
            {
                Debug.LogWarning("[WebViewerBridge] Unsupported floor filters schema version.");
                return;
            }

            string status = "applied";
            string errorCode = null;

            // 1. Apply object filters to geometry
            if (payload.objects != null)
            {
                var filterCtrl = UITCampus.FloorContent.FloorObjectFilterController.Current;
                if (filterCtrl != null)
                {
                    if (!filterCtrl.ApplyFilterState(payload.objects.ceilling, payload.objects.interior, payload.objects.wall, out string err))
                    {
                        status = "rejected";
                        errorCode = err;
                    }
                }
            }

            // 2. Apply sensor filters to device markers
            if (payload.sensors != null && UITCampus.Devices.DeviceMarkerManager.Instance != null)
            {
                UITCampus.Devices.DeviceMarkerManager.Instance.ApplySensorFilters(payload.sensors);
            }

            // Emit acknowledgement
            var response = new FloorFiltersAppliedPayload
            {
                schemaVersion = 1,
                routeRequestId = payload.routeRequestId,
                buildingId = payload.buildingId,
                floorId = payload.floorId,
                filterRevision = payload.filterRevision,
                status = status,
                errorCode = errorCode
            };

            EmitFloorFiltersApplied(JsonUtility.ToJson(response));
        }

        public static bool IsValidFloorId(string floorId)
        {
            if (string.IsNullOrEmpty(floorId)) return false;
            for (int i = 0; i < ValidBuildingEFloors.Length; i++)
            {
                if (ValidBuildingEFloors[i] == floorId) return true;
            }
            return false;
        }
    }
}

