using System;

namespace UITCampus.Campus.Buildings
{
    /// <summary>
    /// Pure utility for parsing buildingId and floorId from GameObject names.
    /// Expected format: {buildingId}_floor_{floorId} (e.g., "E_floor_G", "E_floor_1").
    /// </summary>
    public static class FloorNameParser
    {
        private const string Delimiter = "_floor_";

        /// <summary>
        /// Attempts to parse buildingId and floorId from a GameObject name.
        /// Requires exact delimiter '_floor_' to occur exactly once.
        /// Both sides must have non-empty, non-whitespace content.
        /// </summary>
        public static bool TryParse(
            string objectName,
            out string buildingId,
            out string floorId)
        {
            buildingId = string.Empty;
            floorId = string.Empty;

            if (string.IsNullOrWhiteSpace(objectName))
            {
                return false;
            }

            int firstIndex = objectName.IndexOf(Delimiter, StringComparison.Ordinal);
            if (firstIndex < 0)
            {
                return false;
            }

            int lastIndex = objectName.LastIndexOf(Delimiter, StringComparison.Ordinal);
            if (firstIndex != lastIndex)
            {
                // Delimiter occurs more than once
                return false;
            }

            string rawBuilding = objectName.Substring(0, firstIndex).Trim();
            string rawFloor = objectName.Substring(firstIndex + Delimiter.Length).Trim();

            if (string.IsNullOrEmpty(rawBuilding) || string.IsNullOrEmpty(rawFloor))
            {
                return false;
            }

            buildingId = rawBuilding;
            floorId = rawFloor;
            return true;
        }
    }
}

