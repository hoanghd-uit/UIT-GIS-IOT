using System;
using UnityEngine;
using UnityEngine.Scripting;

namespace UIT.Viewer
{
    /// <summary>
    /// Dynamically resolved by Addressables runtime profile paths:
    /// {UIT.Viewer.FloorContentAddress.Origin}/unity/content/[ContentRelease]/[BuildTarget]
    /// Follows Section 6.2 of phase_03_floor_prefab_loading_plan.md.
    /// </summary>
    [Preserve]
    public static class FloorContentAddress
    {
        private const string DefaultEditorOrigin = "http://localhost:3000";

        /// <summary>
        /// Returns the origin (scheme://host:port) of the hosting page in WebGL builds,
        /// or http://localhost:3000 in Editor/standalone.
        /// </summary>
        [Preserve]
        public static string Origin
        {
            [Preserve]
            get
            {
#if UNITY_WEBGL && !UNITY_EDITOR
                try
                {
                    string absUrl = Application.absoluteURL;
                    if (!string.IsNullOrEmpty(absUrl))
                    {
                        var uri = new Uri(absUrl);
                        return uri.GetLeftPart(UriPartial.Authority);
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[FloorContentAddress] Failed to parse Application.absoluteURL ('{Application.absoluteURL}'): {ex.Message}");
                }
                return string.Empty;
#else
                return DefaultEditorOrigin;
#endif
            }
        }
    }
}

