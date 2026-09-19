using System;
using UnityEngine;

namespace UITCampus.Devices
{
    [DisallowMultipleComponent]
    public class DeviceMarkerItem : MonoBehaviour
    {
        [Header("Identity")]
        [SerializeField] private string deviceId;
        [SerializeField] private string externalId;
        [SerializeField] private string deviceName;
        [SerializeField] private string kind;
        [SerializeField] private string buildingId;
        [SerializeField] private string floorId;

        public string DeviceId => deviceId;
        public string ExternalId => externalId;
        public string DeviceName => deviceName;
        public string Kind => kind;
        public string BuildingId => buildingId;
        public string FloorId => floorId;

        private Action<DeviceMarkerItem> _onClickCallback;
        private Renderer _renderer;
        private MaterialPropertyBlock _propBlock;
        private Color _baseColor;
        private bool _isSelected;

        public void Initialize(
            string id,
            string extId,
            string name,
            string deviceKind,
            string bId,
            string fId,
            Action<DeviceMarkerItem> onClick)
        {
            deviceId = id;
            externalId = extId;
            deviceName = name;
            kind = deviceKind;
            buildingId = bId;
            floorId = fId;
            _onClickCallback = onClick;

            _baseColor = GetColorForKind(kind);
            _propBlock = new MaterialPropertyBlock();

            EnsureVisuals();
            UpdateVisualColor();
        }

        private void EnsureVisuals()
        {
            _renderer = GetComponent<Renderer>();
            if (_renderer == null)
            {
                // Visual child sphere if not on root
                var sphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                sphere.name = "MarkerSphere";
                sphere.transform.SetParent(transform, false);
                sphere.transform.localScale = Vector3.one * 0.4f;

                _renderer = sphere.GetComponent<Renderer>();

                // Ensure collider on child forwards click or move collider to parent
                var childCollider = sphere.GetComponent<Collider>();
                if (childCollider != null)
                {
                    DestroyImmediate(childCollider);
                }
            }

            // SphereCollider on root for reliable raycasting
            var col = GetComponent<SphereCollider>();
            if (col == null)
            {
                col = gameObject.AddComponent<SphereCollider>();
                col.radius = 0.35f;
            }
        }

        private void UpdateVisualColor()
        {
            if (_renderer == null) return;

            if (_propBlock == null)
            {
                _propBlock = new MaterialPropertyBlock();
            }

            Color displayColor = _isSelected ? Color.yellow : _baseColor;
            _propBlock.SetColor("_Color", displayColor);
            _propBlock.SetColor("_BaseColor", displayColor);
            _renderer.SetPropertyBlock(_propBlock);

            transform.localScale = _isSelected ? Vector3.one * 1.3f : Vector3.one;
        }

        public void SetSelected(bool selected)
        {
            _isSelected = selected;
            UpdateVisualColor();
        }

        public void SetFloorLocalPosition(Vector3 localPosition)
        {
            transform.localPosition = localPosition;
        }

        private void OnMouseDown()
        {
            _onClickCallback?.Invoke(this);
        }

        private static Color GetColorForKind(string kind)
        {
            switch (kind?.ToLowerInvariant())
            {
                case "temperature_humidity":
                    return new Color(0.0f, 0.85f, 0.95f); // Cyan
                case "smart_building":
                    return new Color(1.0f, 0.60f, 0.10f); // Orange
                case "water_meter":
                    return new Color(0.2f, 0.50f, 1.00f); // Blue
                case "uhf_reader":
                    return new Color(0.2f, 0.90f, 0.30f); // Green
                case "camera":
                    return new Color(0.9f, 0.20f, 0.80f); // Magenta
                default:
                    return new Color(0.8f, 0.80f, 0.80f); // Grey
            }
        }
    }
}

