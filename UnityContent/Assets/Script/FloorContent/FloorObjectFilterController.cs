using System;
using System.Collections.Generic;
using UnityEngine;

namespace UITCampus.FloorContent
{
    /// <summary>
    /// Instance-bound controller responsible for filtering floor geometry objects (Ceilling, Interior, Wall).
    /// Discovers targets within the floor model hierarchy including inactive objects,
    /// validates hierarchy constraints, and ensures the Floor object is never disabled.
    /// Follows GIS-UIT-SMALL-PHASE-05-PLAN.
    /// </summary>
    [DisallowMultipleComponent]
    public class FloorObjectFilterController : MonoBehaviour
    {
        public static FloorObjectFilterController Current { get; private set; }

        public const string TagCeilling = "Ceilling";
        public const string TagInterior = "Interior";
        public const string TagWall = "Wall";
        public const string TagFloor = "Floor";

        [Header("Hierarchy Targets")]
        [SerializeField] private List<Transform> ceilingTargets = new List<Transform>();
        [SerializeField] private List<Transform> interiorTargets = new List<Transform>();
        [SerializeField] private List<Transform> wallTargets = new List<Transform>();
        [SerializeField] private List<Transform> floorObjects = new List<Transform>();

        public int CeilingTargetCount => ceilingTargets.Count;
        public int InteriorTargetCount => interiorTargets.Count;
        public int WallTargetCount => wallTargets.Count;
        public int FloorObjectCount => floorObjects.Count;

        public bool CurrentCeilingState { get; private set; } = true;
        public bool CurrentInteriorState { get; private set; } = true;
        public bool CurrentWallState { get; private set; } = true;

        private bool _isInitialized;

        private void OnEnable()
        {
            Current = this;
        }

        private void OnDisable()
        {
            if (Current == this)
            {
                Current = null;
            }
            ClearCache();
        }

        /// <summary>
        /// Scans and validates the floor hierarchy under the given root.
        /// </summary>
        public bool InitializeTargets(Transform root, out string validationError)
        {
            validationError = null;
            ClearCache();

            if (root == null)
            {
                validationError = "ROOT_NULL";
                return false;
            }

            var allTransforms = root.GetComponentsInChildren<Transform>(includeInactive: true);
            var floorSet = new HashSet<Transform>();

            // First pass: locate Floor objects and system roots to protect them
            foreach (var t in allTransforms)
            {
                if (t == null || t == root) continue;

                // Skip marker roots or system objects
                if (t.name.StartsWith("DeviceMarkersRoot") || t.name.StartsWith("Marker_"))
                {
                    continue;
                }

                if (t.CompareTag(TagFloor))
                {
                    floorObjects.Add(t);
                    floorSet.Add(t);
                    // Ensure floor is active
                    if (!t.gameObject.activeSelf)
                    {
                        t.gameObject.SetActive(true);
                    }
                }
            }

            // Second pass: gather target objects for Ceilling, Interior, Wall
            foreach (var t in allTransforms)
            {
                if (t == null || t == root) continue;

                if (t.name.StartsWith("DeviceMarkersRoot") || t.name.StartsWith("Marker_"))
                {
                    continue;
                }

                // Never target Floor objects
                if (floorSet.Contains(t))
                {
                    continue;
                }

                // Check if target is an ancestor of a Floor object (hierarchy conflict)
                bool isAncestorOfFloor = false;
                foreach (var flr in floorSet)
                {
                    if (flr.IsChildOf(t))
                    {
                        isAncestorOfFloor = true;
                        break;
                    }
                }

                if (isAncestorOfFloor)
                {
                    Debug.LogWarning($"[FloorObjectFilterController] Skipping object '{t.name}' because it contains the Floor geometry.");
                    continue;
                }

                if (t.CompareTag(TagCeilling))
                {
                    ceilingTargets.Add(t);
                }
                else if (t.CompareTag(TagInterior))
                {
                    interiorTargets.Add(t);
                }
                else if (t.CompareTag(TagWall))
                {
                    wallTargets.Add(t);
                }
            }

            _isInitialized = true;
            Debug.Log($"[FloorObjectFilterController] Initialized for '{root.name}': " +
                      $"Ceilling={ceilingTargets.Count}, Interior={interiorTargets.Count}, " +
                      $"Wall={wallTargets.Count}, Floor={floorObjects.Count}");

            return true;
        }

        /// <summary>
        /// Applies absolute boolean visibility states for Ceilling, Interior, and Wall.
        /// Guaranteed not to disable Floor objects.
        /// </summary>
        public bool ApplyFilterState(bool ceilling, bool interior, bool wall, out string errorCode)
        {
            errorCode = null;

            if (!_isInitialized)
            {
                errorCode = "CONTROLLER_NOT_INITIALIZED";
                return false;
            }

            CurrentCeilingState = ceilling;
            CurrentInteriorState = interior;
            CurrentWallState = wall;

            ApplyBucket(ceilingTargets, ceilling);
            ApplyBucket(interiorTargets, interior);
            ApplyBucket(wallTargets, wall);

            // Invariant: Floor objects must ALWAYS remain active
            foreach (var flr in floorObjects)
            {
                if (flr != null && !flr.gameObject.activeSelf)
                {
                    flr.gameObject.SetActive(true);
                }
            }

            return true;
        }

        private static void ApplyBucket(List<Transform> targets, bool active)
        {
            if (targets == null) return;
            for (int i = 0; i < targets.Count; i++)
            {
                var t = targets[i];
                if (t != null && t.gameObject.activeSelf != active)
                {
                    t.gameObject.SetActive(active);
                }
            }
        }

        public void ClearCache()
        {
            ceilingTargets.Clear();
            interiorTargets.Clear();
            wallTargets.Clear();
            floorObjects.Clear();
            _isInitialized = false;
        }
    }
}

