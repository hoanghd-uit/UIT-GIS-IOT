using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.UI;
using UITCampus.Core.Signals;

namespace UITCampus.Input
{
    /// <summary>
    /// Reads mouse and keyboard inputs via Unity Input System and publishes orbit, pan, zoom, and reset signals.
    /// Handles drag-vs-click thresholds, UI gating, and focus loss protection.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class OrbitCameraInputManager : MonoBehaviour
    {
        [Header("Drag Detection")]
        [Tooltip("Minimum pointer movement in pixels required before a left-drag is recognized as an orbit gesture.")]
        [SerializeField] private float dragThresholdPixels = 5f;

        private Vector2 _leftDownPos;
        private bool _leftDownOverUI;
        private bool _isOrbitDragging;

        private Vector2 _panDownPos;
        private bool _panDownOverUI;
        private bool _isPanDragging;

        private void Start()
        {
            // Invariant: Do not lock or hide cursor on orbit branch
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }

        private void Update()
        {
            PollReset();
            PollOrbit();
            PollPan();
            PollZoom();
        }

        private void PollReset()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;

            if (keyboard.homeKey.wasPressedThisFrame)
            {
                OrbitCameraSignals.PublishReset();
            }
        }

        private void PollOrbit()
        {
            var mouse = Mouse.current;
            if (mouse == null) return;

            if (mouse.leftButton.wasPressedThisFrame)
            {
                _leftDownPos = mouse.position.ReadValue();
                _leftDownOverUI = IsPointerOverUI();
                _isOrbitDragging = false;
            }
            else if (mouse.leftButton.isPressed && !_leftDownOverUI)
            {
                if (!_isOrbitDragging)
                {
                    Vector2 currentPos = mouse.position.ReadValue();
                    if ((currentPos - _leftDownPos).sqrMagnitude >= dragThresholdPixels * dragThresholdPixels)
                    {
                        _isOrbitDragging = true;
                    }
                }

                if (_isOrbitDragging)
                {
                    Vector2 delta = mouse.delta.ReadValue();
                    if (delta.sqrMagnitude > 0f)
                    {
                        OrbitCameraSignals.PublishOrbit(delta);
                    }
                }
            }
            else if (mouse.leftButton.wasReleasedThisFrame)
            {
                _isOrbitDragging = false;
                _leftDownOverUI = false;
            }
        }

        private void PollPan()
        {
            var mouse = Mouse.current;
            if (mouse == null) return;

            bool rightPressed = mouse.rightButton.isPressed;
            bool middlePressed = mouse.middleButton.isPressed;
            bool anyPanPressed = rightPressed || middlePressed;

            bool rightDown = mouse.rightButton.wasPressedThisFrame;
            bool middleDown = mouse.middleButton.wasPressedThisFrame;
            bool anyPanDown = rightDown || middleDown;

            bool rightUp = mouse.rightButton.wasReleasedThisFrame;
            bool middleUp = mouse.middleButton.wasReleasedThisFrame;

            if (anyPanDown)
            {
                _panDownPos = mouse.position.ReadValue();
                _panDownOverUI = IsPointerOverUI();
                _isPanDragging = false;
            }
            else if (anyPanPressed && !_panDownOverUI)
            {
                if (!_isPanDragging)
                {
                    Vector2 currentPos = mouse.position.ReadValue();
                    if ((currentPos - _panDownPos).sqrMagnitude >= dragThresholdPixels * dragThresholdPixels)
                    {
                        _isPanDragging = true;
                    }
                }

                if (_isPanDragging)
                {
                    Vector2 delta = mouse.delta.ReadValue();
                    if (delta.sqrMagnitude > 0f)
                    {
                        OrbitCameraSignals.PublishPan(delta);
                    }
                }
            }
            else if (rightUp || middleUp || !anyPanPressed)
            {
                _isPanDragging = false;
                _panDownOverUI = false;
            }
        }

        private void PollZoom()
        {
            var mouse = Mouse.current;
            if (mouse == null) return;

            Vector2 scroll = mouse.scroll.ReadValue();
            if (Mathf.Abs(scroll.y) > 0.0001f)
            {
                if (!IsPointerOverUI())
                {
                    // Normalize scroll notch (wheel delta is typically +/- 120 per notch)
                    float delta = scroll.y;
                    if (Mathf.Abs(delta) >= 120f)
                    {
                        delta /= 120f;
                    }
                    OrbitCameraSignals.PublishZoom(delta);
                }
            }
        }

        private static readonly List<RaycastResult> s_RaycastResults = new List<RaycastResult>();

        private bool IsPointerOverUI()
        {
            var mouse = Mouse.current;
            if (mouse == null) return false;

            Vector2 mousePos = mouse.position.ReadValue();
            if (mousePos.x < 0 || mousePos.x > Screen.width || mousePos.y < 0 || mousePos.y > Screen.height)
            {
                return false;
            }

            var eventData = new PointerEventData(EventSystem.current)
            {
                position = mousePos
            };

            if (EventSystem.current != null)
            {
                s_RaycastResults.Clear();
                EventSystem.current.RaycastAll(eventData, s_RaycastResults);
                for (int i = 0; i < s_RaycastResults.Count; i++)
                {
                    var res = s_RaycastResults[i];
                    if (res.module is GraphicRaycaster || (res.gameObject != null && res.gameObject.layer == 5))
                    {
                        return true;
                    }
                }
                return false;
            }

            var raycasters = FindObjectsByType<GraphicRaycaster>(FindObjectsSortMode.None);
            for (int i = 0; i < raycasters.Length; i++)
            {
                var gr = raycasters[i];
                if (gr != null && gr.isActiveAndEnabled && gr.gameObject.activeInHierarchy)
                {
                    s_RaycastResults.Clear();
                    gr.Raycast(eventData, s_RaycastResults);
                    if (s_RaycastResults.Count > 0)
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private void ResetDragState()
        {
            _isOrbitDragging = false;
            _leftDownOverUI = false;
            _isPanDragging = false;
            _panDownOverUI = false;
        }

        private void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                ResetDragState();
            }
        }

        private void OnDisable()
        {
            ResetDragState();
        }
    }
}
