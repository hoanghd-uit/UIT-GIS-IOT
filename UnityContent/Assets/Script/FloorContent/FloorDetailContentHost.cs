using UnityEngine;
using UITCampus.CameraControl;

namespace UITCampus.FloorContent
{
    /// <summary>
    /// Scene-local host in FloorDetail.unity.
    /// Provides contentRoot for floor prefab instantiation and references to the scene's orbit camera rig.
    /// Follows Section 7.1 of phase_03_floor_prefab_loading_plan.md.
    /// </summary>
    [DisallowMultipleComponent]
    public class FloorDetailContentHost : MonoBehaviour
    {
        public static FloorDetailContentHost Instance { get; private set; }

        [Header("Hierarchy")]
        [Tooltip("Parent transform where floor prefab instances are attached.")]
        [SerializeField] private Transform contentRoot;

        [Header("Camera Rig References")]
        [SerializeField] private CampusViewBounds campusViewBounds;
        [SerializeField] private CampusOrbitCameraController orbitCameraController;

        public Transform ContentRoot => contentRoot != null ? contentRoot : transform;
        public CampusViewBounds CampusViewBounds => campusViewBounds;
        public CampusOrbitCameraController OrbitCameraController => orbitCameraController;

        private void OnEnable()
        {
            Instance = this;
            EnsureHierarchyReferences();
            FloorContentLoader.RegisterHost(this);
        }

        private void Start()
        {
            // Idempotent re-registration in case loader initialized in Awake after host OnEnable
            FloorContentLoader.RegisterHost(this);
        }

        private void OnDisable()
        {
            if (Instance == this)
            {
                Instance = null;
            }
            FloorContentLoader.UnregisterHost(this);
        }

        private void EnsureHierarchyReferences()
        {
            if (contentRoot == null)
            {
                Transform existing = transform.Find("ContentRoot");
                if (existing != null)
                {
                    contentRoot = existing;
                }
                else
                {
                    var go = new GameObject("ContentRoot");
                    go.transform.SetParent(transform, false);
                    contentRoot = go.transform;
                }
            }

            if (campusViewBounds == null)
            {
                foreach (var cvb in FindObjectsByType<CampusViewBounds>(FindObjectsSortMode.None))
                {
                    if (cvb.gameObject.scene == gameObject.scene)
                    {
                        campusViewBounds = cvb;
                        break;
                    }
                }
            }

            if (orbitCameraController == null)
            {
                foreach (var occ in FindObjectsByType<CampusOrbitCameraController>(FindObjectsSortMode.None))
                {
                    if (occ.gameObject.scene == gameObject.scene)
                    {
                        orbitCameraController = occ;
                        break;
                    }
                }
            }
        }

        /// <summary>
        /// Binds the instantiated floor geometry to the scene camera rig and computes framing.
        /// Returns true on success; sets errorCode if geometry or camera initialization fails.
        /// </summary>
        public bool TryBindContent(FloorContentMetadata instanceMetadata, out string errorCode)
        {
            EnsureHierarchyReferences();

            if (instanceMetadata == null)
            {
                errorCode = "FLOOR_GEOMETRY_INVALID";
                return false;
            }

            if (instanceMetadata.gameObject.scene != gameObject.scene)
            {
                errorCode = "FLOOR_HOST_INVALID";
                return false;
            }

            if (!instanceMetadata.transform.IsChildOf(ContentRoot))
            {
                errorCode = "FLOOR_HOST_INVALID";
                return false;
            }

            Transform targetRoot = (instanceMetadata.GeometryRoot != null)
                ? instanceMetadata.GeometryRoot
                : instanceMetadata.transform;

            var renderers = targetRoot.GetComponentsInChildren<Renderer>(true);
            if (renderers == null || renderers.Length == 0)
            {
                errorCode = "FLOOR_GEOMETRY_INVALID";
                return false;
            }

            if (campusViewBounds == null || orbitCameraController == null)
            {
                errorCode = "FLOOR_CAMERA_INIT_FAILED";
                return false;
            }

            campusViewBounds.InvalidateBounds();
            campusViewBounds.CampusVisualRoot = targetRoot;

            if (!campusViewBounds.CalculateBounds() || !campusViewBounds.HasValidBounds)
            {
                errorCode = "FLOOR_GEOMETRY_INVALID";
                return false;
            }

            if (!orbitCameraController.TryInitializeFromBounds(immediate: true))
            {
                errorCode = "FLOOR_CAMERA_INIT_FAILED";
                return false;
            }

            errorCode = null;
            return true;
        }

        /// <summary>
        /// Clears active content references and suspends camera controller.
        /// </summary>
        public void ClearContent()
        {
            EnsureHierarchyReferences();

            if (campusViewBounds != null)
            {
                campusViewBounds.InvalidateBounds();
                campusViewBounds.CampusVisualRoot = null;
            }

            if (orbitCameraController != null)
            {
                orbitCameraController.SuspendUntilContentReady();
            }
        }

        /// <summary>
        /// Backwards-compatible overload for camera bounds update.
        /// </summary>
        public void UpdateCameraBounds(FloorContentMetadata metadata)
        {
            TryBindContent(metadata, out _);
        }
    }
}

