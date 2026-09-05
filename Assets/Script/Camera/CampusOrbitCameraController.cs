using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using UITCampus.Core.Signals;

namespace UITCampus.CameraControl
{
    /// <summary>
    /// Oblique perspective orbit map camera controller.
    /// Controls a 3-tier gimbal rig: Focus Root (pan/position) -> YawPivot -> PitchPivot -> Main Camera (distance).
    /// Subscribes to OrbitCameraSignals and smoothly updates rendered transform in LateUpdate.
    /// </summary>
    [DefaultExecutionOrder(100)]
    public class CampusOrbitCameraController : MonoBehaviour
    {
        [Header("Hierarchy References")]
        [Tooltip("Transform that rotates around world Y for yaw.")]
        [SerializeField] private Transform yawPivot;

        [Tooltip("Transform that rotates around local X for pitch.")]
        [SerializeField] private Transform pitchPivot;

        [Tooltip("Child camera at local (0, 0, -distance) with zero local rotation.")]
        [SerializeField] private Camera targetCamera;

        [Tooltip("Scene reference to CampusViewBounds for framing and clamping.")]
        [SerializeField] private CampusViewBounds campusViewBounds;

        [Header("Initial Composition")]
        [SerializeField] private float initialYaw = 45f;
        [SerializeField] private float initialPitch = 45f;
        [SerializeField] private float framingMargin = 1.15f;
        [Tooltip("If enabled, starts at customInitialDistance instead of whole-campus overview distance.")]
        [SerializeField] private bool useCustomInitialDistance = false;
        [Tooltip("Custom initial camera distance in meters when useCustomInitialDistance is enabled.")]
        [SerializeField] private float customInitialDistance = 55f;

        [Header("Orbit Limits & Sensitivity")]
        [SerializeField] private float minPitch = 20f;
        [SerializeField] private float maxPitch = 80f;
        [SerializeField] private float orbitSensitivity = 0.2f;

        [Header("Pan Settings")]
        [SerializeField] private float panSensitivity = 1.0f;
        [SerializeField] private float panBoundsMarginPercent = 0.10f;
        [SerializeField] private bool invertPan = false;

        [Header("Zoom Settings")]
        [SerializeField] private float zoomSensitivity = 0.15f;
        [SerializeField] private float minDistanceMultiplier = 0.05f;
        [SerializeField] private float maxDistanceMultiplier = 3.0f;
        [Tooltip("Hard minimum distance floor in meters to allow close-up inspection.")]
        [SerializeField] private float absoluteMinDistance = 1.0f;

        [Header("Smoothing")]
        [SerializeField] private float dampingTime = 0.15f;

        [Header("UI Interaction")]
        [Tooltip("If enabled, camera orbit/pan/zoom is ignored when pointer is over UI elements.")]
        [SerializeField] private bool ignoreInputOverUI = true;

        private bool _pointerDownOverUI;
        private bool _pointerDownIn3D;

        // Target state (driven by input signals)
        private Vector3 _targetFocusPoint;
        private float _targetYaw;
        private float _targetPitch;
        private float _targetDistance;

        // Current smoothed state (applied to transforms)
        private Vector3 _currentFocusPoint;
        private float _currentYaw;
        private float _currentPitch;
        private float _currentDistance;

        // SmoothDamp velocities
        private Vector3 _focusVelocity;
        private float _yawVelocity;
        private float _pitchVelocity;
        private float _distanceVelocity;

        // Bounds-relative zoom limits
        private float _minDistance = 5f;
        private float _maxDistance = 500f;

        // Home / Overview reset pose
        private Vector3 _overviewFocusPoint;
        private float _overviewYaw;
        private float _overviewPitch;
        private float _overviewDistance;

        // Properties for testing & inspection
        public Vector3 TargetFocusPoint => _targetFocusPoint;
        public float TargetYaw => _targetYaw;
        public float TargetPitch => _targetPitch;
        public float TargetDistance => _targetDistance;
        public Vector3 CurrentFocusPoint => _currentFocusPoint;
        public float CurrentYaw => _currentYaw;
        public float CurrentPitch => _currentPitch;
        public float CurrentDistance => _currentDistance;
        public float MinDistance => _minDistance;
        public float MaxDistance => _maxDistance;
        public Camera TargetCamera => targetCamera;
        public CampusViewBounds CampusViewBounds
        {
            get => campusViewBounds;
            set => campusViewBounds = value;
        }

        public Transform YawPivot
        {
            get => yawPivot;
            set => yawPivot = value;
        }

        public Transform PitchPivot
        {
            get => pitchPivot;
            set => pitchPivot = value;
        }

        private void OnEnable()
        {
            OrbitCameraSignals.OrbitDelta += HandleOrbit;
            OrbitCameraSignals.PanDelta += HandlePan;
            OrbitCameraSignals.ZoomDelta += HandleZoom;
            OrbitCameraSignals.ResetRequested += HandleReset;
        }

        private void OnDisable()
        {
            OrbitCameraSignals.OrbitDelta -= HandleOrbit;
            OrbitCameraSignals.PanDelta -= HandlePan;
            OrbitCameraSignals.ZoomDelta -= HandleZoom;
            OrbitCameraSignals.ResetRequested -= HandleReset;
        }

        private void Awake()
        {
            EnsureEventSystem();
        }

        private void EnsureEventSystem()
        {
            if (EventSystem.current == null && FindAnyObjectByType<EventSystem>() == null)
            {
                var eventSystemGo = new GameObject("EventSystem");
                eventSystemGo.AddComponent<EventSystem>();
#if ENABLE_INPUT_SYSTEM
                eventSystemGo.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
#else
                eventSystemGo.AddComponent<StandaloneInputModule>();
#endif
                Debug.Log("[CampusOrbitCameraController] Automatically initialized missing EventSystem.");
            }
        }

        private void Update()
        {
            UpdatePointerState();
        }

        private void UpdatePointerState()
        {
#if ENABLE_INPUT_SYSTEM
            var mouse = Mouse.current;
            if (mouse == null) return;

            bool anyDown = mouse.leftButton.wasPressedThisFrame || mouse.rightButton.wasPressedThisFrame || mouse.middleButton.wasPressedThisFrame;
            bool anyPressed = mouse.leftButton.isPressed || mouse.rightButton.isPressed || mouse.middleButton.isPressed;
#else
            bool anyDown = Input.GetMouseButtonDown(0) || Input.GetMouseButtonDown(1) || Input.GetMouseButtonDown(2);
            bool anyPressed = Input.GetMouseButton(0) || Input.GetMouseButton(1) || Input.GetMouseButton(2);
#endif

            if (anyDown)
            {
                _pointerDownOverUI = IsPointerOverUI();
                _pointerDownIn3D = !_pointerDownOverUI;
            }
            else if (!anyPressed)
            {
                _pointerDownOverUI = false;
                _pointerDownIn3D = false;
            }
        }

        private void Start()
        {
            if (targetCamera == null)
            {
                targetCamera = GetComponentInChildren<Camera>();
            }

            if (targetCamera != null)
            {
                targetCamera.fieldOfView = 50f;
                targetCamera.nearClipPlane = 0.1f;
                targetCamera.farClipPlane = 1000f;
            }

            if (campusViewBounds == null)
            {
                Debug.LogError("[CampusOrbitCameraController] campusViewBounds reference is missing! Disabling controller.", this);
                enabled = false;
                return;
            }

            if (!campusViewBounds.HasValidBounds)
            {
                campusViewBounds.CalculateBounds();
            }

            if (!campusViewBounds.HasValidBounds)
            {
                Debug.LogError("[CampusOrbitCameraController] Failed to calculate campus bounds! Disabling controller.", this);
                enabled = false;
                return;
            }

            ComputeZoomLimits();
            FitCampusOverview(immediate: true);
        }

        private void ComputeZoomLimits()
        {
            float radius = campusViewBounds.BoundingRadius;
            _minDistance = Mathf.Max(absoluteMinDistance, radius * minDistanceMultiplier);
            _maxDistance = Mathf.Max(_minDistance + 10f, radius * maxDistanceMultiplier);
        }

        public void FitCampusOverview(bool immediate = false)
        {
            Bounds bounds = campusViewBounds.CachedBounds;
            _overviewFocusPoint = bounds.center;
            _overviewYaw = initialYaw;
            _overviewPitch = initialPitch;

            float radius = campusViewBounds.BoundingRadius;
            float vFovRad = (targetCamera != null ? targetCamera.fieldOfView : 50f) * Mathf.Deg2Rad;
            float aspect = (targetCamera != null && targetCamera.pixelWidth > 0 && targetCamera.pixelHeight > 0)
                ? (float)targetCamera.pixelWidth / targetCamera.pixelHeight
                : (Screen.height > 0 ? (float)Screen.width / Screen.height : 16f / 9f);

            float hFovRad = 2f * Mathf.Atan(Mathf.Tan(vFovRad * 0.5f) * aspect);
            float minFovRad = Mathf.Min(vFovRad, hFovRad);

            if (useCustomInitialDistance)
            {
                _overviewDistance = Mathf.Clamp(customInitialDistance, _minDistance, _maxDistance);
            }
            else
            {
                _overviewDistance = (radius * framingMargin) / Mathf.Sin(minFovRad * 0.5f);
                _overviewDistance = Mathf.Clamp(_overviewDistance, _minDistance, _maxDistance);
            }

            _targetFocusPoint = _overviewFocusPoint;
            _targetYaw = _overviewYaw;
            _targetPitch = _overviewPitch;
            _targetDistance = _overviewDistance;

            if (immediate)
            {
                _currentFocusPoint = _targetFocusPoint;
                _currentYaw = _targetYaw;
                _currentPitch = _targetPitch;
                _currentDistance = _targetDistance;
                _focusVelocity = Vector3.zero;
                _yawVelocity = 0f;
                _pitchVelocity = 0f;
                _distanceVelocity = 0f;
                ApplyTransforms();
            }
        }

        private void HandleOrbit(Vector2 delta)
        {
            if (ignoreInputOverUI && (_pointerDownOverUI || (!_pointerDownIn3D && IsPointerOverUI())))
            {
                return;
            }

            _targetYaw += delta.x * orbitSensitivity;
            _targetPitch -= delta.y * orbitSensitivity;
            _targetPitch = Mathf.Clamp(_targetPitch, minPitch, maxPitch);
        }

        private void HandlePan(Vector2 delta)
        {
            if (targetCamera == null) return;
            if (ignoreInputOverUI && (_pointerDownOverUI || (!_pointerDownIn3D && IsPointerOverUI())))
            {
                return;
            }

            // Pan axes projected onto XZ plane
            Vector3 camRight = targetCamera.transform.right;
            Vector3 camFwd = targetCamera.transform.forward;

            Vector3 camRightXZ = Vector3.ProjectOnPlane(camRight, Vector3.up).normalized;
            Vector3 camFwdXZ = Vector3.ProjectOnPlane(camFwd, Vector3.up).normalized;

            // Screen-consistent pan speed factor
            float viewportHeight = Screen.height > 0 ? Screen.height : 1080f;
            float fovRad = targetCamera.fieldOfView * Mathf.Deg2Rad;
            float worldUnitsPerPixel = (2f * _currentDistance * Mathf.Tan(fovRad * 0.5f)) / viewportHeight;
            float step = worldUnitsPerPixel * panSensitivity;

            float sign = invertPan ? 1f : -1f;
            Vector3 offset = (camRightXZ * (delta.x * sign) + camFwdXZ * (delta.y * sign)) * step;

            _targetFocusPoint += offset;

            // Clamp target to campus bounds + margin
            ClampFocusTarget();
        }

        private void ClampFocusTarget()
        {
            if (campusViewBounds == null || !campusViewBounds.HasValidBounds) return;

            Bounds bounds = campusViewBounds.CachedBounds;
            float marginX = bounds.size.x * panBoundsMarginPercent;
            float marginZ = bounds.size.z * panBoundsMarginPercent;

            _targetFocusPoint.x = Mathf.Clamp(_targetFocusPoint.x, bounds.min.x - marginX, bounds.max.x + marginX);
            _targetFocusPoint.z = Mathf.Clamp(_targetFocusPoint.z, bounds.min.z - marginZ, bounds.max.z + marginZ);
            _targetFocusPoint.y = bounds.center.y;
        }

        private void HandleZoom(float delta)
        {
            if (ignoreInputOverUI && IsPointerOverUI())
            {
                return;
            }

            // Multiplicative zoom
            _targetDistance *= Mathf.Exp(-delta * zoomSensitivity);
            _targetDistance = Mathf.Clamp(_targetDistance, _minDistance, _maxDistance);
        }

        /// <summary>
        /// Checks whether the mouse cursor is currently over any active UI element.
        /// </summary>
        public bool IsPointerOverUI()
        {
            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject())
            {
                return true;
            }

            return CheckGraphicRaycast();
        }

        private bool CheckGraphicRaycast()
        {
            Vector2 mousePos = Vector2.zero;
#if ENABLE_INPUT_SYSTEM
            if (Mouse.current != null)
            {
                mousePos = Mouse.current.position.ReadValue();
            }
#else
            mousePos = Input.mousePosition;
#endif

            if (mousePos.x < 0 || mousePos.x > Screen.width || mousePos.y < 0 || mousePos.y > Screen.height)
            {
                return false;
            }

            var eventData = new PointerEventData(EventSystem.current)
            {
                position = mousePos
            };

            var results = new List<RaycastResult>();
            var raycasters = FindObjectsByType<GraphicRaycaster>(FindObjectsSortMode.None);
            for (int i = 0; i < raycasters.Length; i++)
            {
                var gr = raycasters[i];
                if (gr != null && gr.isActiveAndEnabled && gr.gameObject.activeInHierarchy)
                {
                    results.Clear();
                    gr.Raycast(eventData, results);
                    if (results.Count > 0)
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private void HandleReset()
        {
            ResetOverview();
        }

        /// <summary>
        /// Future extension seam: Smoothly frame a specific building or IoT bounds.
        /// </summary>
        public void FocusOnBounds(Bounds targetBounds)
        {
            _targetFocusPoint = targetBounds.center;
            ClampFocusTarget();

            float radius = targetBounds.extents.magnitude;
            float vFovRad = (targetCamera != null ? targetCamera.fieldOfView : 50f) * Mathf.Deg2Rad;
            float aspect = (targetCamera != null && targetCamera.pixelWidth > 0 && targetCamera.pixelHeight > 0)
                ? (float)targetCamera.pixelWidth / targetCamera.pixelHeight
                : (Screen.height > 0 ? (float)Screen.width / Screen.height : 16f / 9f);

            float hFovRad = 2f * Mathf.Atan(Mathf.Tan(vFovRad * 0.5f) * aspect);
            float minFovRad = Mathf.Min(vFovRad, hFovRad);

            float fitDist = (radius * framingMargin) / Mathf.Sin(minFovRad * 0.5f);
            _targetDistance = Mathf.Clamp(fitDist, _minDistance, _maxDistance);
        }

        /// <summary>
        /// Smoothly returns camera to full campus overview.
        /// </summary>
        public void ResetOverview()
        {
            _targetFocusPoint = _overviewFocusPoint;
            _targetYaw = _overviewYaw;
            _targetPitch = _overviewPitch;
            _targetDistance = _overviewDistance;
        }

        private void LateUpdate()
        {
            float dt = Time.unscaledDeltaTime;
            if (dt <= 0f) return;

            _currentFocusPoint = Vector3.SmoothDamp(_currentFocusPoint, _targetFocusPoint, ref _focusVelocity, dampingTime, Mathf.Infinity, dt);
            _currentYaw = Mathf.SmoothDampAngle(_currentYaw, _targetYaw, ref _yawVelocity, dampingTime, Mathf.Infinity, dt);
            _currentPitch = Mathf.SmoothDampAngle(_currentPitch, _targetPitch, ref _pitchVelocity, dampingTime, Mathf.Infinity, dt);
            _currentDistance = Mathf.SmoothDamp(_currentDistance, _targetDistance, ref _distanceVelocity, dampingTime, Mathf.Infinity, dt);

            ApplyTransforms();
        }

        private void ApplyTransforms()
        {
            transform.position = _currentFocusPoint;

            if (yawPivot != null)
            {
                yawPivot.localRotation = Quaternion.Euler(0f, _currentYaw, 0f);
            }

            if (pitchPivot != null)
            {
                pitchPivot.localRotation = Quaternion.Euler(_currentPitch, 0f, 0f);
            }

            if (targetCamera != null)
            {
                targetCamera.transform.localPosition = new Vector3(0f, 0f, -_currentDistance);
                targetCamera.transform.localRotation = Quaternion.identity;
            }
        }

        private void OnValidate()
        {
            minPitch = Mathf.Clamp(minPitch, 5f, 89f);
            maxPitch = Mathf.Clamp(maxPitch, minPitch + 1f, 89f);
            dampingTime = Mathf.Max(0.01f, dampingTime);
            orbitSensitivity = Mathf.Max(0.01f, orbitSensitivity);
            panSensitivity = Mathf.Max(0.01f, panSensitivity);
            zoomSensitivity = Mathf.Max(0.01f, zoomSensitivity);
            absoluteMinDistance = Mathf.Max(0.1f, absoluteMinDistance);
        }
    }
}
