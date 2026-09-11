using System;
using UnityEngine;

namespace UITCampus.FloorContent
{
    /// <summary>
    /// Pure mathematical helper mapping external coordinate systems (survey/IoT) to floor local and Unity world space.
    /// Follows Section 5 of phase_03_floor_prefab_loading_plan.md.
    /// </summary>
    public static class FloorCoordinateMapper
    {
        /// <summary>
        /// Checks if all vector components are finite (not NaN or Infinity).
        /// </summary>
        public static bool IsFinite(Vector3 v)
        {
            return !float.IsNaN(v.x) && !float.IsInfinity(v.x) &&
                   !float.IsNaN(v.y) && !float.IsInfinity(v.y) &&
                   !float.IsNaN(v.z) && !float.IsInfinity(v.z);
        }

        /// <summary>
        /// Validates that basis vectors and origins are finite and form a non-degenerate 3D coordinate system.
        /// </summary>
        public static bool IsFrameValid(in FloorCoordinateFrame frame)
        {
            if (!IsFinite(frame.sourceOrigin) ||
                !IsFinite(frame.originInFloorLocal) ||
                !IsFinite(frame.basisX) ||
                !IsFinite(frame.basisY) ||
                !IsFinite(frame.basisZ))
            {
                return false;
            }

            // Basis determinant (scalar triple product) must be non-zero
            float det = Vector3.Dot(frame.basisX, Vector3.Cross(frame.basisY, frame.basisZ));
            if (Mathf.Abs(det) < 1e-7f)
            {
                return false;
            }

            return true;
        }

        /// <summary>
        /// Converts a position in source frame coordinates to floor local space (meters).
        /// Formula:
        ///   d = sourcePosition - sourceOrigin
        ///   pLocal = originInFloorLocal + basisX*d.x + basisY*d.y + basisZ*d.z
        /// </summary>
        public static Vector3 SourceToFloorLocal(Vector3 sourcePosition, in FloorCoordinateFrame frame)
        {
            Vector3 d = sourcePosition - frame.sourceOrigin;
            return frame.originInFloorLocal +
                   (frame.basisX * d.x) +
                   (frame.basisY * d.y) +
                   (frame.basisZ * d.z);
        }

        /// <summary>
        /// Converts a position in source frame coordinates to Unity world space through the floor instance transform.
        /// </summary>
        public static Vector3 SourceToWorld(Vector3 sourcePosition, in FloorCoordinateFrame frame, Transform floorInstanceTransform)
        {
            Vector3 local = SourceToFloorLocal(sourcePosition, frame);
            return floorInstanceTransform != null ? floorInstanceTransform.TransformPoint(local) : local;
        }
    }
}

