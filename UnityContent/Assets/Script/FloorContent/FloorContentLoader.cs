using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using UITCampus.Bridge;
using UITCampus.Core.Bootstrap;

namespace UITCampus.FloorContent
{
    /// <summary>
    /// Persistent loader on _InitManager responsible for loading, instantiating, and releasing
    /// floor prefabs via Addressables according to Section 7 of phase_03_floor_prefab_loading_plan.md.
    /// </summary>
    [DisallowMultipleComponent]
    public class FloorContentLoader : MonoBehaviour
    {
        public static FloorContentLoader Instance { get; private set; }

        [Serializable]
        public class FloorContentStatePayload
        {
            public int schemaVersion = 1;
            public string requestId;
            public string buildingId;
            public string floorId;
            public string status; // "loading", "ready", "unavailable", "error"
            public int contentVersion;
            public string coordinateFrameId;
            public int coordinateFrameVersion;
            public string calibrationStatus;
            public string errorCode;
            public string errorMessage;
        }

        [Header("Configuration")]
        [SerializeField] private FloorContentRegistry registry;

        private WebViewerBridge _bridge;
        private FloorDetailContentHost _host;

        // Active content state
        private GameObject _activeFloorInstance;
        private string _activeBuildingId;
        private string _activeFloorId;
        private AsyncOperationHandle<GameObject> _activeHandle;

        // Request & generation tracking
        private int _desiredGeneration = 0;
        private string _desiredBuildingId;
        private string _desiredFloorId;
        private string _desiredRequestId;
        private bool _isLoading = false;

        private string _lastRequestId;
        private string _pendingBuildingId;
        private string _pendingFloorId;
        private string _pendingRequestId;

        public FloorContentRegistry Registry
        {
            get => registry;
            set => registry = value;
        }

        public string ActiveBuildingId => _activeBuildingId;
        public string ActiveFloorId => _activeFloorId;
        public GameObject ActiveFloorInstance => _activeFloorInstance;

        private void Awake()
        {
            var bootstrap = GetComponent<AppBootstrap>();
            if (bootstrap != null && !bootstrap.IsPrimary)
            {
                return;
            }

            Instance = this;
            _bridge = GetComponent<WebViewerBridge>();

            if (registry == null)
            {
                registry = Resources.Load<FloorContentRegistry>("FloorContentRegistry");
            }
        }

        private void Start()
        {
            if (_host == null)
            {
                var host = FindAnyObjectByType<FloorDetailContentHost>();
                if (host != null)
                {
                    RegisterHost(host);
                }
            }
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
            }
            CleanupActiveContentImmediate();
        }

        public static void RegisterHost(FloorDetailContentHost host)
        {
            if (Instance != null)
            {
                Instance._host = host;
                if (!string.IsNullOrEmpty(Instance._pendingFloorId))
                {
                    string bId = Instance._pendingBuildingId;
                    string fId = Instance._pendingFloorId;
                    string reqId = Instance._pendingRequestId;
                    Instance._pendingBuildingId = null;
                    Instance._pendingFloorId = null;
                    Instance._pendingRequestId = null;
                    Instance.LoadFloor(bId, fId, reqId);
                }
                else if (!string.IsNullOrEmpty(Instance._desiredFloorId) && Instance._activeFloorInstance == null && !Instance._isLoading)
                {
                    Instance.LoadFloor(Instance._desiredBuildingId, Instance._desiredFloorId, Instance._desiredRequestId);
                }
            }
        }

        public static void UnregisterHost(FloorDetailContentHost host)
        {
            if (Instance != null && Instance._host == host)
            {
                Instance._host = null;
                Instance.UnloadCurrentContent();
            }
        }

        /// <summary>
        /// Request to load a specific floor model.
        /// Bumps desired generation, clears old content, and launches worker.
        /// </summary>
        public void LoadFloor(string buildingId, string floorId, string requestId)
        {
            var bootstrap = GetComponent<AppBootstrap>();
            if (bootstrap != null && !bootstrap.IsPrimary)
            {
                return;
            }

            _desiredGeneration++;
            _desiredBuildingId = buildingId;
            _desiredFloorId = floorId;
            _desiredRequestId = requestId;
            _lastRequestId = requestId;

            // If host is not yet active (e.g. scene transition still running), remember pending request
            if (_host == null)
            {
                _pendingBuildingId = buildingId;
                _pendingFloorId = floorId;
                _pendingRequestId = requestId;
                return;
            }

            // If already loaded and active for this exact building and floor, reuse idempotently
            if (_activeFloorInstance != null && _activeBuildingId == buildingId && _activeFloorId == floorId)
            {
                var meta = _activeFloorInstance.GetComponent<FloorContentMetadata>();
                if (_host.TryBindContent(meta, out string bindErr))
                {
                    EmitStateReady(buildingId, floorId, requestId, meta);
                }
                else
                {
                    EmitStateError(buildingId, floorId, requestId, bindErr ?? "FLOOR_CAMERA_INIT_FAILED", "Failed to rebind floor camera.");
                }
                return;
            }

            // Clean up old active floor without invalidating this generation
            RetireActiveContent();
            _host.ClearContent();

            // Check if registry has configured entry
            if (registry == null || !registry.TryGetEntry(buildingId, floorId, out var entry) || !entry.isConfigured || entry.prefab == null)
            {
                EmitState("unavailable", buildingId, floorId, requestId);
                return;
            }

            EmitState("loading", buildingId, floorId, requestId);

            if (!_isLoading)
            {
                StartCoroutine(LoadingWorker());
            }
        }

        private IEnumerator LoadingWorker()
        {
            _isLoading = true;

            while (true)
            {
                int gen = _desiredGeneration;
                string bId = _desiredBuildingId;
                string fId = _desiredFloorId;
                string reqId = _desiredRequestId;

                if (_host == null || string.IsNullOrEmpty(bId) || string.IsNullOrEmpty(fId))
                {
                    break;
                }

                if (registry == null || !registry.TryGetEntry(bId, fId, out var entry) || !entry.isConfigured || entry.prefab == null)
                {
                    EmitState("unavailable", bId, fId, reqId);
                    break;
                }

                AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>(entry.prefab);

                float timer = 0f;
                const float timeoutSeconds = 60f;
                while (!handle.IsDone && timer < timeoutSeconds)
                {
                    timer += Time.unscaledDeltaTime;
                    yield return null;
                }

                if (!handle.IsDone)
                {
                    Debug.LogError($"[FloorContentLoader] Addressables load timed out for {bId}/{fId}.");
                    if (gen == _desiredGeneration)
                    {
                        EmitStateError(bId, fId, reqId, "TIMEOUT", "Floor model loading timed out.");
                    }
                    StartCoroutine(ReleaseLateHandle(handle));
                    break;
                }

                // Check if superseded by a newer request or if host was unloaded while loading
                if (gen != _desiredGeneration || _host == null)
                {
                    Debug.Log($"[FloorContentLoader] Discarding superseded load for {bId}/{fId} (gen={gen}, current={_desiredGeneration}).");
                    if (handle.IsValid())
                    {
                        Addressables.Release(handle);
                    }

                    if (_desiredGeneration != gen && !string.IsNullOrEmpty(_desiredFloorId))
                    {
                        continue;
                    }
                    break;
                }

                if (handle.Status != AsyncOperationStatus.Succeeded || handle.Result == null)
                {
                    Debug.LogError($"[FloorContentLoader] Addressables failed to load asset for {bId}/{fId}.");
                    if (handle.IsValid())
                    {
                        Addressables.Release(handle);
                    }
                    EmitStateError(bId, fId, reqId, "BUNDLE_LOAD_FAILED", "Failed to load floor model asset.");
                    break;
                }

                GameObject prefab = handle.Result;
                var prefabMetadata = prefab.GetComponent<FloorContentMetadata>();
                if (prefabMetadata == null || prefabMetadata.BuildingId != bId || prefabMetadata.FloorId != fId)
                {
                    Debug.LogError($"[FloorContentLoader] Prefab metadata mismatch for {bId}/{fId}.");
                    if (handle.IsValid())
                    {
                        Addressables.Release(handle);
                    }
                    EmitStateError(bId, fId, reqId, "INVALID_METADATA", "Loaded prefab metadata does not match requested floor.");
                    break;
                }

                // Instantiate under host contentRoot
                GameObject instance = Instantiate(prefab, _host.ContentRoot);
                instance.name = $"Floor_{bId}_{fId}";
                instance.transform.localPosition = Vector3.zero;
                instance.transform.localRotation = Quaternion.identity;
                instance.transform.localScale = Vector3.one;

                var instanceMetadata = instance.GetComponent<FloorContentMetadata>();
                if (instanceMetadata == null)
                {
                    Destroy(instance);
                    if (handle.IsValid()) Addressables.Release(handle);
                    EmitStateError(bId, fId, reqId, "INVALID_METADATA", "Instance missing FloorContentMetadata component.");
                    break;
                }

                // Bind instance to camera rig
                if (!_host.TryBindContent(instanceMetadata, out string bindError))
                {
                    Destroy(instance);
                    if (handle.IsValid()) Addressables.Release(handle);
                    EmitStateError(bId, fId, reqId, bindError ?? "FLOOR_CAMERA_INIT_FAILED", "Failed to bind camera to floor geometry.");
                    break;
                }

                _activeFloorInstance = instance;
                _activeBuildingId = bId;
                _activeFloorId = fId;
                _activeHandle = handle;

                // Phase 05: Initialize FloorObjectFilterController on instance
                var filterCtrl = instance.GetComponent<FloorObjectFilterController>();
                if (filterCtrl == null)
                {
                    filterCtrl = instance.AddComponent<FloorObjectFilterController>();
                }
                filterCtrl.InitializeTargets(instance.transform, out _);

                EmitStateReady(bId, fId, reqId, instanceMetadata);
                break;
            }

            _isLoading = false;
        }

        private IEnumerator ReleaseLateHandle(AsyncOperationHandle<GameObject> handle)
        {
            while (!handle.IsDone)
            {
                yield return null;
            }
            if (handle.IsValid())
            {
                Addressables.Release(handle);
            }
        }

        /// <summary>
        /// Deactivates and destroys the active floor model and releases its handle next frame.
        /// Does NOT bump desired generation.
        /// </summary>
        private void RetireActiveContent()
        {
            if (_activeFloorInstance != null)
            {
                _activeFloorInstance.SetActive(false);
                Destroy(_activeFloorInstance);
                _activeFloorInstance = null;
            }

            _activeBuildingId = null;
            _activeFloorId = null;

            if (_activeHandle.IsValid())
            {
                var handleToRelease = _activeHandle;
                _activeHandle = default;
                StartCoroutine(ReleaseHandleNextFrame(handleToRelease));
            }
        }

        /// <summary>
        /// Fully unloads content and cancels any pending/in-flight generation.
        /// Called when leaving floor detail or unregistering host.
        /// </summary>
        public void UnloadCurrentContent()
        {
            _desiredGeneration++;
            _desiredBuildingId = null;
            _desiredFloorId = null;
            _desiredRequestId = null;

            _pendingBuildingId = null;
            _pendingFloorId = null;
            _pendingRequestId = null;

            RetireActiveContent();

            if (_host != null)
            {
                _host.ClearContent();
            }
        }

        private IEnumerator ReleaseHandleNextFrame(AsyncOperationHandle<GameObject> handle)
        {
            yield return null; // Wait for Destroy to complete at end of frame
            if (handle.IsValid())
            {
                Addressables.Release(handle);
            }
        }

        private void CleanupActiveContentImmediate()
        {
            _desiredGeneration++;
            if (_activeFloorInstance != null)
            {
                DestroyImmediate(_activeFloorInstance);
                _activeFloorInstance = null;
            }
            if (_activeHandle.IsValid())
            {
                Addressables.Release(_activeHandle);
                _activeHandle = default;
            }
        }

        private void EmitState(string status, string buildingId, string floorId, string requestId)
        {
            var payload = new FloorContentStatePayload
            {
                schemaVersion = 1,
                requestId = requestId,
                buildingId = buildingId,
                floorId = floorId,
                status = status
            };
            _bridge?.EmitFloorContentStateChanged(JsonUtility.ToJson(payload));
        }

        private void EmitStateReady(string buildingId, string floorId, string requestId, FloorContentMetadata metadata)
        {
            var frame = metadata != null ? metadata.CoordinateFrame : FloorCoordinateFrame.CreateDefault($"{buildingId}/{floorId}/floor-local");
            var payload = new FloorContentStatePayload
            {
                schemaVersion = 1,
                requestId = requestId,
                buildingId = buildingId,
                floorId = floorId,
                status = "ready",
                contentVersion = metadata != null ? metadata.ContentVersion : 1,
                coordinateFrameId = frame.frameId,
                coordinateFrameVersion = frame.frameVersion,
                calibrationStatus = frame.calibrationStatus.ToString()
            };
            _bridge?.EmitFloorContentStateChanged(JsonUtility.ToJson(payload));
        }

        private void EmitStateError(string buildingId, string floorId, string requestId, string code, string message)
        {
            var payload = new FloorContentStatePayload
            {
                schemaVersion = 1,
                requestId = requestId,
                buildingId = buildingId,
                floorId = floorId,
                status = "error",
                errorCode = code,
                errorMessage = message
            };
            _bridge?.EmitFloorContentStateChanged(JsonUtility.ToJson(payload));
        }
    }
}

