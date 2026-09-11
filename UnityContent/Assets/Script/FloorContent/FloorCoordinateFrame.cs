using System;
using UnityEngine;

namespace UITCampus.FloorContent
{
    public enum FloorCalibrationStatus
    {
        Unverified = 0,
        Verified = 1
    }

    /// <summary>
    /// Contract and calibration metadata for mapping external/survey coordinates to floor local space.
    /// Does not store live device telemetry; describes the transformation frame.
    /// </summary>
    [Serializable]
    public struct FloorCoordinateFrame
    {
        [Tooltip("Identifier of the input coordinate frame, e.g. 'E/4/floor-local'.")]
        public string frameId;

        [Tooltip("Version incremented whenever origin, basis, or convention changes.")]
        public int frameVersion;

        [Tooltip("Descriptive units of source data, e.g. 'm' or 'cm'.")]
        public string sourceUnits;

        [Tooltip("Human-readable axis orientation description.")]
        public string sourceAxesDescription;

        [Tooltip("Origin/benchmark point in source coordinates.")]
        public Vector3 sourceOrigin;

        [Tooltip("Position of sourceOrigin in floor wrapper root local space in meters.")]
        public Vector3 originInFloorLocal;

        [Tooltip("Unit vector in floor local meters corresponding to +1 source X unit.")]
        public Vector3 basisX;

        [Tooltip("Unit vector in floor local meters corresponding to +1 source Y unit.")]
        public Vector3 basisY;

        [Tooltip("Unit vector in floor local meters corresponding to +1 source Z unit.")]
        public Vector3 basisZ;

        [Tooltip("Calibration status against physical survey benchmarks.")]
        public FloorCalibrationStatus calibrationStatus;

        [Tooltip("Notes on survey source, error bounds, and calibration status.")]
        public string calibrationNote;

        /// <summary>
        /// Creates a sensible default identity frame in local meters.
        /// </summary>
        public static FloorCoordinateFrame CreateDefault(string frameId)
        {
            return new FloorCoordinateFrame
            {
                frameId = frameId,
                frameVersion = 1,
                sourceUnits = "m",
                sourceAxesDescription = "Unity local space: X=Right, Y=Up, Z=Forward (meters)",
                sourceOrigin = Vector3.zero,
                originInFloorLocal = Vector3.zero,
                basisX = Vector3.right,
                basisY = Vector3.up,
                basisZ = Vector3.forward,
                calibrationStatus = FloorCalibrationStatus.Unverified,
                calibrationNote = "Default convention; unverified against physical survey data."
            };
        }
    }
}

