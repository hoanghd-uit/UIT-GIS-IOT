using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using UITCampus.Bridge;
using UITCampus.Core.Bootstrap;

namespace UITCampus.Navigation
{
    /// <summary>
    /// Persistent controller managing scene switching and selection state between Campus and FloorDetail.
    /// Attached directly to the _InitManager root GameObject.
    /// Receives ApplyViewerRoute commands from the host React application.
    /// </summary>
    [DisallowMultipleComponent]
    [RequireComponent(typeof(WebViewerBridge))]
    public class ViewerSceneFlowController : MonoBehaviour
    {
        private const string CampusSceneName = "Campus";
        private const string FloorDetailSceneName = "FloorDetail";

        [Serializable]
        public class ViewerRouteRequest
        {
            public int schemaVersion;
            public string view;
            public string buildingId;
            public string floorId;
        }

        [Serializable]
        private class CampusAckPayload
        {
            public int schemaVersion = 1;
            public string view = "campus";
            public string sceneName = CampusSceneName;
        }

        [Serializable]
        private class FloorDetailAckPayload
        {
            public int schemaVersion = 1;
            public string view = "floor-detail";
            public string sceneName = FloorDetailSceneName;
            public string buildingId = "E";
            public string floorId;
        }

        private WebViewerBridge _bridge;
        private bool _isLoadingScene;
        private ViewerRouteRequest _pendingRequest;
        private string _currentBuildingId;
        private string _currentFloorId;

        public bool IsLoadingScene => _isLoadingScene;
        public string CurrentBuildingId => _currentBuildingId;
        public string CurrentFloorId => _currentFloorId;

        private void Awake()
        {
            _bridge = GetComponent<WebViewerBridge>();
        }

        /// <summary>
        /// Public entrypoint invoked by React Unity WebGL SendMessage.
        /// Signature: ApplyViewerRoute(string payloadJson)
        /// </summary>
        public void ApplyViewerRoute(string payloadJson)
        {
            if (AppBootstrap.Instance != null && !AppBootstrap.Instance.IsPrimary)
            {
                // Ignore commands directed to duplicate instance scheduled for destruction
                return;
            }

            if (string.IsNullOrWhiteSpace(payloadJson))
            {
                Debug.LogWarning("[ViewerSceneFlowController] Received empty or null route payload.");
                _bridge?.EmitViewerError("EMPTY_PAYLOAD", "Received empty route payload");
                return;
            }

            ViewerRouteRequest request;
            try
            {
                request = JsonUtility.FromJson<ViewerRouteRequest>(payloadJson);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[ViewerSceneFlowController] Failed to parse JSON route payload: {ex.Message}");
                _bridge?.EmitViewerError("MALFORMED_JSON", "Failed to parse route JSON payload");
                return;
            }

            if (request == null || request.schemaVersion != 1)
            {
                Debug.LogWarning($"[ViewerSceneFlowController] Unsupported or missing schemaVersion in payload: {payloadJson}");
                _bridge?.EmitViewerError("UNSUPPORTED_SCHEMA", "Schema version must equal 1");
                return;
            }

            if (request.view == "campus")
            {
                ApplyValidatedRoute(request);
            }
            else if (request.view == "floor-detail")
            {
                if (request.buildingId != "E" || !WebViewerBridge.IsValidFloorId(request.floorId))
                {
                    Debug.LogWarning($"[ViewerSceneFlowController] Invalid buildingId ('{request.buildingId}') or floorId ('{request.floorId}') in payload: {payloadJson}");
                    _bridge?.EmitViewerError("INVALID_ROUTE_PARAMS", $"Unsupported buildingId '{request.buildingId}' or floorId '{request.floorId}'");
                    return;
                }

                ApplyValidatedRoute(request);
            }
            else
            {
                Debug.LogWarning($"[ViewerSceneFlowController] Unknown view '{request.view}' in payload: {payloadJson}");
                _bridge?.EmitViewerError("UNKNOWN_VIEW", $"Unknown view '{request.view}'");
            }
        }

        private void ApplyValidatedRoute(ViewerRouteRequest request)
        {
            string targetScene = request.view == "campus" ? CampusSceneName : FloorDetailSceneName;

            // If a scene transition is already in flight, queue this newest request (latest-request-wins)
            if (_isLoadingScene)
            {
                _pendingRequest = request;
                return;
            }

            string activeScene = SceneManager.GetActiveScene().name;

            if (activeScene == targetScene)
            {
                // Scene is already loaded and active
                if (targetScene == CampusSceneName)
                {
                    _currentBuildingId = null;
                    _currentFloorId = null;
                    AcknowledgeCampusState();
                }
                else
                {
                    // Floor-only transition: update selection without reloading FloorDetail scene
                    _currentBuildingId = request.buildingId;
                    _currentFloorId = request.floorId;
                    AcknowledgeFloorDetailState(_currentBuildingId, _currentFloorId);
                }
                return;
            }

            // Target scene needs to be loaded
            if (!Application.CanStreamedLevelBeLoaded(targetScene))
            {
                Debug.LogError($"[ViewerSceneFlowController] Target scene '{targetScene}' cannot be loaded. Check Build Settings scene list.");
                _bridge?.EmitViewerError("SCENE_NOT_IN_BUILD", $"Target scene '{targetScene}' is not in the build scene list");
                return;
            }

            StartCoroutine(LoadSceneRoutine(request, targetScene));
        }

        private IEnumerator LoadSceneRoutine(ViewerRouteRequest request, string targetScene)
        {
            _isLoadingScene = true;
            _pendingRequest = null;

            AsyncOperation asyncOp = SceneManager.LoadSceneAsync(targetScene, LoadSceneMode.Single);
            if (asyncOp == null)
            {
                _isLoadingScene = false;
                Debug.LogError($"[ViewerSceneFlowController] LoadSceneAsync returned null for scene '{targetScene}'.");
                _bridge?.EmitViewerError("SCENE_LOAD_FAILED", $"Failed to start asynchronous load for '{targetScene}'");
                yield break;
            }

            while (!asyncOp.isDone)
            {
                yield return null;
            }

            _isLoadingScene = false;

            // If a newer request arrived while the scene was loading, prioritize it
            if (_pendingRequest != null)
            {
                ViewerRouteRequest nextRequest = _pendingRequest;
                _pendingRequest = null;
                ApplyValidatedRoute(nextRequest);
                yield break;
            }

            if (targetScene == CampusSceneName)
            {
                _currentBuildingId = null;
                _currentFloorId = null;
                AcknowledgeCampusState();
            }
            else
            {
                _currentBuildingId = request.buildingId;
                _currentFloorId = request.floorId;
                AcknowledgeFloorDetailState(_currentBuildingId, _currentFloorId);
            }
        }

        private void AcknowledgeCampusState()
        {
            var ack = new CampusAckPayload();
            string json = JsonUtility.ToJson(ack);
            _bridge?.EmitViewerStateChanged(json);
        }

        private void AcknowledgeFloorDetailState(string buildingId, string floorId)
        {
            var ack = new FloorDetailAckPayload
            {
                buildingId = buildingId,
                floorId = floorId
            };
            string json = JsonUtility.ToJson(ack);
            _bridge?.EmitViewerStateChanged(json);
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetState()
        {
            // Reset any domain-reload sensitive fields if necessary
        }
    }
}

