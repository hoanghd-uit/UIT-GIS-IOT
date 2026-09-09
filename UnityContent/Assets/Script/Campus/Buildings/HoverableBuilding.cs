using System;
using System.Collections.Generic;
using UnityEngine;
using UITCampus.Core.Signals;

namespace UITCampus.Campus.Buildings
{
    /// <summary>
    /// Aggregate root component attached to a building (e.g., Building_E).
    /// Listens to FloorHoverSignals, validates ownership, and coordinates single-floor highlighting.
    /// </summary>
    [DisallowMultipleComponent]
    public class HoverableBuilding : MonoBehaviour
    {
        private const string BuildingPrefix = "Building_";

        [SerializeField] private string buildingId = string.Empty;
        [SerializeField] private Color hoverTint = new Color(1f, 0.949f, 0.651f, 1f); // Light yellow #FFF2A6
        [SerializeField, Range(0f, 1f)] private float hoverBlendStrength = 0.4f;
        [SerializeField] private HoverableFloor[] floors;

        private HashSet<HoverableFloor> floorSet;
        private HoverableFloor currentHoveredFloor;

        public string BuildingId => buildingId;
        public Color HoverTint => hoverTint;
        public float HoverBlendStrength => hoverBlendStrength;
        public HoverableFloor CurrentHoveredFloor => currentHoveredFloor;
        public IReadOnlyList<HoverableFloor> Floors => floors;

        private void Reset()
        {
            buildingId = string.Empty;
            if (gameObject.name.StartsWith(BuildingPrefix, StringComparison.Ordinal))
            {
                buildingId = gameObject.name.Substring(BuildingPrefix.Length);
            }

            RefreshFloorRegistry();
        }

        [ContextMenu("Refresh Floor Registry")]
        public void RefreshFloorRegistry()
        {
            floors = GetComponentsInChildren<HoverableFloor>(true);
            RebuildFloorSet();
        }

        private void Awake()
        {
            RebuildFloorSet();
        }

        private void OnEnable()
        {
            RebuildFloorSet();
            FloorHoverSignals.PointerEntered += HandlePointerEntered;
            FloorHoverSignals.PointerExited += HandlePointerExited;
        }

        private void OnDisable()
        {
            FloorHoverSignals.PointerEntered -= HandlePointerEntered;
            FloorHoverSignals.PointerExited -= HandlePointerExited;

            if (currentHoveredFloor != null)
            {
                currentHoveredFloor.ClearHighlight();
                currentHoveredFloor = null;
            }
        }

        private void HandlePointerEntered(HoverableFloor floor)
        {
            if (floor == null || !IsOwned(floor))
            {
                return;
            }

            if (floor == currentHoveredFloor)
            {
                return;
            }

            if (currentHoveredFloor != null)
            {
                currentHoveredFloor.ClearHighlight();
            }

            currentHoveredFloor = floor;
            currentHoveredFloor.ApplyHighlight(hoverTint, hoverBlendStrength);
        }

        private void HandlePointerExited(HoverableFloor floor)
        {
            if (floor == null || !IsOwned(floor))
            {
                return;
            }

            if (floor == currentHoveredFloor)
            {
                currentHoveredFloor.ClearHighlight();
                currentHoveredFloor = null;
            }
        }

        private bool IsOwned(HoverableFloor floor)
        {
            if (floorSet == null)
            {
                RebuildFloorSet();
            }

            return floorSet != null && floorSet.Contains(floor);
        }

        private void RebuildFloorSet()
        {
            if (floors == null || floors.Length == 0)
            {
                floors = GetComponentsInChildren<HoverableFloor>(true);
            }

            floorSet = new HashSet<HoverableFloor>(floors ?? Array.Empty<HoverableFloor>());

            if (floorSet.Count == 0)
            {
                Debug.LogWarning($"[HoverableBuilding] '{gameObject.name}' has 0 registered floors.", this);
                return;
            }

            if (!string.IsNullOrEmpty(buildingId))
            {
                foreach (var floor in floorSet)
                {
                    if (floor != null && !string.IsNullOrEmpty(floor.BuildingId) && !string.Equals(floor.BuildingId, buildingId, StringComparison.OrdinalIgnoreCase))
                    {
                        Debug.LogWarning($"[HoverableBuilding] Floor '{floor.name}' has buildingId '{floor.BuildingId}' which differs from building '{buildingId}'.", floor);
                    }
                }
            }
        }
    }
}

