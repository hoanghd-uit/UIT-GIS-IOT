using UnityEngine;
using UnityEngine.InputSystem;
using UITCampus.Core.Signals;

namespace UITCampus.Input
{
    /// <summary>
    /// Reads raw hardware input (keyboard & mouse) via Input System and publishes to InputSignals.
    /// Manages cursor locking and application focus changes.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class PlayerInputManager : MonoBehaviour
    {
        [Header("Cursor Settings")]
        [SerializeField] private bool lockCursorOnStart = true;

        private Vector2 _lastMove;
        private Vector2 _lastLook;
        private bool _lastSprint;

        private void Start()
        {
            if (lockCursorOnStart)
            {
                SetCursorLock(true);
            }
        }

        private void Update()
        {
            HandleCursorLockInput();

            if (Cursor.lockState != CursorLockMode.Locked)
            {
                ResetInputState();
                return;
            }

            PollMovement();
            PollLook();
            PollSprint();
        }

        private void HandleCursorLockInput()
        {
            var keyboard = Keyboard.current;
            var mouse = Mouse.current;

            if (keyboard != null && keyboard.escapeKey.wasPressedThisFrame)
            {
                SetCursorLock(false);
            }
            else if (mouse != null && mouse.leftButton.wasPressedThisFrame && Cursor.lockState != CursorLockMode.Locked)
            {
                SetCursorLock(true);
            }
        }

        private void PollMovement()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;

            float x = 0f;
            float y = 0f;

            if (keyboard.wKey.isPressed || keyboard.upArrowKey.isPressed) y += 1f;
            if (keyboard.sKey.isPressed || keyboard.downArrowKey.isPressed) y -= 1f;
            if (keyboard.aKey.isPressed || keyboard.leftArrowKey.isPressed) x -= 1f;
            if (keyboard.dKey.isPressed || keyboard.rightArrowKey.isPressed) x += 1f;

            Vector2 move = new Vector2(x, y);
            if (move.sqrMagnitude > 1f)
            {
                move.Normalize();
            }

            if (move != _lastMove)
            {
                _lastMove = move;
                InputSignals.PublishMove(move);
            }
        }

        private void PollLook()
        {
            var mouse = Mouse.current;
            if (mouse == null) return;

            Vector2 look = mouse.delta.ReadValue();
            if (look != _lastLook)
            {
                _lastLook = look;
                InputSignals.PublishLook(look);
            }
        }

        private void PollSprint()
        {
            var keyboard = Keyboard.current;
            if (keyboard == null) return;

            bool sprint = keyboard.leftShiftKey.isPressed || keyboard.rightShiftKey.isPressed;
            if (sprint != _lastSprint)
            {
                _lastSprint = sprint;
                InputSignals.PublishSprint(sprint);
            }
        }

        private void SetCursorLock(bool locked)
        {
            Cursor.lockState = locked ? CursorLockMode.Locked : CursorLockMode.None;
            Cursor.visible = !locked;
            InputSignals.PublishCursorLock(locked);

            if (!locked)
            {
                ResetInputState();
            }
        }

        private void ResetInputState()
        {
            if (_lastMove != Vector2.zero)
            {
                _lastMove = Vector2.zero;
                InputSignals.PublishMove(Vector2.zero);
            }

            if (_lastLook != Vector2.zero)
            {
                _lastLook = Vector2.zero;
                InputSignals.PublishLook(Vector2.zero);
            }

            if (_lastSprint)
            {
                _lastSprint = false;
                InputSignals.PublishSprint(false);
            }
        }

        private void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                SetCursorLock(false);
            }
        }

        private void OnDisable()
        {
            ResetInputState();
        }
    }
}

