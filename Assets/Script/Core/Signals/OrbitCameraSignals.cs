using System;
using UnityEngine;

namespace UITCampus.Core.Signals
{
    /// <summary>
    /// Static signal hub for Orbit Map Camera inputs.
    /// Decouples input producers (OrbitCameraInputManager) from camera consumers (CampusOrbitCameraController).
    /// </summary>
    public static class OrbitCameraSignals
    {
        public static event Action<Vector2> OrbitDelta;
        public static event Action<Vector2> PanDelta;
        public static event Action<float> ZoomDelta;
        public static event Action ResetRequested;

        public static void PublishOrbit(Vector2 delta) => OrbitDelta?.Invoke(delta);
        public static void PublishPan(Vector2 delta) => PanDelta?.Invoke(delta);
        public static void PublishZoom(float delta) => ZoomDelta?.Invoke(delta);
        public static void PublishReset() => ResetRequested?.Invoke();

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        public static void ResetSignals()
        {
            OrbitDelta = null;
            PanDelta = null;
            ZoomDelta = null;
            ResetRequested = null;
        }
    }
}
