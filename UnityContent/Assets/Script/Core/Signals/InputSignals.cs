using System;
using UnityEngine;

namespace UITCampus.Core.Signals
{
    /// <summary>
    /// Static signal hub for player input.
    /// Decouples input producers (PlayerInputManager) from consumers (PlayerInputState).
    /// </summary>
    public static class InputSignals
    {
        public static event Action<Vector2> MoveChanged;
        public static event Action<Vector2> LookChanged;
        public static event Action<bool> SprintChanged;
        public static event Action<bool> CursorLockChanged;

        public static void PublishMove(Vector2 move) => MoveChanged?.Invoke(move);
        public static void PublishLook(Vector2 look) => LookChanged?.Invoke(look);
        public static void PublishSprint(bool sprint) => SprintChanged?.Invoke(sprint);
        public static void PublishCursorLock(bool locked) => CursorLockChanged?.Invoke(locked);

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        public static void ResetSignals()
        {
            MoveChanged = null;
            LookChanged = null;
            SprintChanged = null;
            CursorLockChanged = null;
        }
    }
}

