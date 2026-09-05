using UnityEngine;
using UITCampus.Core.Signals;

namespace UITCampus.Player
{
    /// <summary>
    /// Caches player input values from InputSignals.
    /// Acts as a local state provider for PlayerMotor and PlayerLook.
    /// </summary>
    [DisallowMultipleComponent]
    public class PlayerInputState : MonoBehaviour
    {
        public Vector2 Move { get; private set; }
        public Vector2 Look { get; private set; }
        public bool IsSprinting { get; private set; }

        private void OnEnable()
        {
            InputSignals.MoveChanged += OnMoveChanged;
            InputSignals.LookChanged += OnLookChanged;
            InputSignals.SprintChanged += OnSprintChanged;
        }

        private void OnDisable()
        {
            InputSignals.MoveChanged -= OnMoveChanged;
            InputSignals.LookChanged -= OnLookChanged;
            InputSignals.SprintChanged -= OnSprintChanged;

            Move = Vector2.zero;
            Look = Vector2.zero;
            IsSprinting = false;
        }

        private void OnMoveChanged(Vector2 move)
        {
            Move = move;
        }

        private void OnLookChanged(Vector2 look)
        {
            Look = look;
        }

        private void OnSprintChanged(bool isSprinting)
        {
            IsSprinting = isSprinting;
        }
    }
}

