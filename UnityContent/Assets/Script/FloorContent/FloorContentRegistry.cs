using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AddressableAssets;

namespace UITCampus.FloorContent
{
    /// <summary>
    /// ScriptableObject table matching buildingId and floorId to Addressable prefab AssetReferences.
    /// Follows Section 3.2 of phase_03_floor_prefab_loading_plan.md.
    /// </summary>
    [CreateAssetMenu(fileName = "FloorContentRegistry", menuName = "UIT Campus/Floor Content Registry")]
    public class FloorContentRegistry : ScriptableObject
    {
        [Serializable]
        public class Entry
        {
            [Tooltip("Building identifier, e.g. 'E'.")]
            public string buildingId = "E";

            [Tooltip("Canonical route floor identifier: 'G', '1'..'12'.")]
            public string floorId;

            [Tooltip("Whether 3D content has been authored, configured, and validated.")]
            public bool isConfigured;

            [Tooltip("Addressable AssetReference to the wrapper prefab.")]
            public AssetReferenceGameObject prefab;
        }

        [SerializeField] private List<Entry> entries = new List<Entry>();

        public IReadOnlyList<Entry> Entries => entries;

        /// <summary>
        /// Attempts to find a registered entry for the specified building and floor.
        /// </summary>
        public bool TryGetEntry(string buildingId, string floorId, out Entry foundEntry)
        {
            if (entries != null)
            {
                for (int i = 0; i < entries.Count; i++)
                {
                    var e = entries[i];
                    if (e != null && e.buildingId == buildingId && e.floorId == floorId)
                    {
                        foundEntry = e;
                        return true;
                    }
                }
            }

            foundEntry = null;
            return false;
        }

        /// <summary>
        /// Updates the list of entries (used by Editor setup automation).
        /// </summary>
        public void SetEntries(List<Entry> newEntries)
        {
            entries = newEntries ?? new List<Entry>();
        }
    }
}

