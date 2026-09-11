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

        [Header("Initialization")]
        [Tooltip("Whether to calculate bounds immediately in Awake (true for static scenes like Campus, false for dynamic scenes like FloorDetail).")]
        [SerializeField] private bool calculateOnAwake = true;

        public Transform CampusVisualRoot
        {
            get => campusVisualRoot;
            set
            {
                if (campusVisualRoot != value)
                {
                    campusVisualRoot = value;
                    InvalidateBounds();
                }
            }
        }

        public bool CalculateOnAwake
        {
            get => calculateOnAwake;
            set => calculateOnAwake = value;
        }

        public Bounds CachedBounds { get; private set; }
        public bool HasValidBounds { get; private set; }
        public float BoundingRadius { get; private set; }

        private void Awake()
        {
            if (calculateOnAwake)
            {
                CalculateBounds();
            }
        }

        public void InvalidateBounds()
        {
            HasValidBounds = false;
            CachedBounds = default;
            BoundingRadius = 0f;
        }

        /// <summary>
        /// Scans renderers under campusVisualRoot and calculates combined world-space bounds.
        /// </summary>
        public bool CalculateBounds()
        {
            if (campusVisualRoot == null)
            {
                InvalidateBounds();
                return false;
            }

            var renderers = campusVisualRoot.GetComponentsInChildren<Renderer>(true);
            if (renderers == null || renderers.Length == 0)
            {
                InvalidateBounds();
                return false;
            }

            Bounds combined = renderers[0].bounds;
            for (int i = 1; i < renderers.Length; i++)
            {
                combined.Encapsulate(renderers[i].bounds);
            }

            if (!float.IsFinite(combined.center.x) || !float.IsFinite(combined.center.y) || !float.IsFinite(combined.center.z) ||
                !float.IsFinite(combined.extents.x) || !float.IsFinite(combined.extents.y) || !float.IsFinite(combined.extents.z))
            {
                InvalidateBounds();
                return false;
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
