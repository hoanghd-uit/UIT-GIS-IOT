using System;
using System.Runtime.InteropServices;
using UnityEngine;
using UITCampus.Campus.Buildings;
using UITCampus.Core.Bootstrap;
using UITCampus.Core.Signals;

namespace UITCampus.Bridge
{
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

