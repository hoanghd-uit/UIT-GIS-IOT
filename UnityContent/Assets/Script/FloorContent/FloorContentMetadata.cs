using System;
using UnityEngine;

namespace UITCampus.FloorContent
{
    /// <summary>
    /// Component placed on the root of each floor wrapper prefab.
    /// Defines buildingId, floorId, contentVersion, geometry root, and coordinate frame.
    /// </summary>
    [DisallowMultipleComponent]
    public class FloorContentMetadata : MonoBehaviour
    {
        [Header("Identity")]
        [SerializeField] private string buildingId = "E";
        [SerializeField] private string floorId = "4";
        [SerializeField] private int contentVersion = 1;

        [Header("Hierarchy Reference")]
        [Tooltip("Child transform containing the visual renderers/geometry.")]
        [SerializeField] private Transform geometryRoot;

        [Header("Coordinate Frame Metadata")]
        [SerializeField] private FloorCoordinateFrame coordinateFrame;

        [Header("Camera Framing Override (Optional)")]
        [SerializeField] private bool useBoundsOverride = false;
        [SerializeField] private Bounds cameraBoundsOverride;

        public string BuildingId => buildingId;
        public string FloorId => floorId;
        public int ContentVersion => contentVersion;
        public Transform GeometryRoot => geometryRoot != null ? geometryRoot : transform;
        public FloorCoordinateFrame CoordinateFrame => coordinateFrame;
        public bool UseBoundsOverride => useBoundsOverride;
        public Bounds CameraBoundsOverride => cameraBoundsOverride;

        public void Configure(string bId, string fId, int version, Transform geom, FloorCoordinateFrame frame)
        {
            buildingId = bId;
            floorId = fId;
            contentVersion = version;
            geometryRoot = geom;
            coordinateFrame = frame;
        }

        /// <summary>
        /// Computes the combined bounds of all renderers under geometryRoot.
        /// </summary>
        public Bounds GetEffectiveBounds()
        {
            if (useBoundsOverride && cameraBoundsOverride.size != Vector3.zero)
            {
                return cameraBoundsOverride;
            }

            Transform root = GeometryRoot;
            var renderers = root.GetComponentsInChildren<Renderer>(true);
            if (renderers == null || renderers.Length == 0)
            {
                return new Bounds(transform.position, Vector3.one * 10f);
            }

            Bounds combined = renderers[0].bounds;
            for (int i = 1; i < renderers.Length; i++)
            {
                combined.Encapsulate(renderers[i].bounds);
            }
            return combined;
        }

#if UNITY_EDITOR
        private void OnDrawGizmosSelected()
        {
            // Draw visual indicator of the effective bounds
            Gizmos.color = new Color(0f, 1f, 0.8f, 0.35f);
            Bounds b = GetEffectiveBounds();
            Gizmos.DrawWireCube(b.center, b.size);

            // Draw coordinate origin
            Vector3 originLocal = coordinateFrame.originInFloorLocal;
            Vector3 originWorld = transform.TransformPoint(originLocal);
            Gizmos.color = Color.yellow;
            Gizmos.DrawSphere(originWorld, 0.2f);
        }
#endif
    }
}

