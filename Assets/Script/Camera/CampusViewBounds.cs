using UnityEngine;

namespace UITCampus.CameraControl
{
    /// <summary>
    /// Calculates and caches the combined world-space bounds of the campus from CampusVisualRoot.
    /// Scanned once on initialization to avoid per-frame allocations.
    /// </summary>
    public class CampusViewBounds : MonoBehaviour
    {
        [Header("Target")]
        [Tooltip("The root transform containing visual campus renderers.")]
        [SerializeField] private Transform campusVisualRoot;

        public Transform CampusVisualRoot
        {
            get => campusVisualRoot;
            set => campusVisualRoot = value;
        }

        public Bounds CachedBounds { get; private set; }
        public bool HasValidBounds { get; private set; }
        public float BoundingRadius { get; private set; }

        private void Awake()
        {
            CalculateBounds();
        }

        /// <summary>
        /// Scans renderers under campusVisualRoot and calculates combined world-space bounds.
        /// </summary>
        public bool CalculateBounds()
        {
            if (campusVisualRoot == null)
            {
                Debug.LogError("[CampusViewBounds] campusVisualRoot is not assigned!", this);
                HasValidBounds = false;
                return false;
            }

            var renderers = campusVisualRoot.GetComponentsInChildren<Renderer>(true);
            if (renderers == null || renderers.Length == 0)
            {
                Debug.LogError("[CampusViewBounds] No Renderers found under campusVisualRoot!", this);
                HasValidBounds = false;
                return false;
            }

            Bounds combined = renderers[0].bounds;
            for (int i = 1; i < renderers.Length; i++)
            {
                combined.Encapsulate(renderers[i].bounds);
            }

            CachedBounds = combined;
            BoundingRadius = combined.extents.magnitude;
            HasValidBounds = true;
            return true;
        }

        private void OnDrawGizmosSelected()
        {
            if (HasValidBounds)
            {
                Gizmos.color = new Color(0f, 0.8f, 1f, 0.5f);
                Gizmos.DrawWireCube(CachedBounds.center, CachedBounds.size);
            }
            else if (campusVisualRoot != null)
            {
                var renderers = campusVisualRoot.GetComponentsInChildren<Renderer>(true);
                if (renderers != null && renderers.Length > 0)
                {
                    Bounds combined = renderers[0].bounds;
                    for (int i = 1; i < renderers.Length; i++)
                    {
                        combined.Encapsulate(renderers[i].bounds);
                    }
                    Gizmos.color = new Color(0f, 0.8f, 1f, 0.3f);
                    Gizmos.DrawWireCube(combined.center, combined.size);
                }
            }
        }
    }
}
