using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace UITCampus.Devices
{
    /// <summary>
    /// UI overlay marker item rendered in Screen Space on top of the 3D scene.
    /// Follows Section 5 of web/doc/phase_06_updating.md.
    /// </summary>
    [DisallowMultipleComponent]
    [RequireComponent(typeof(RectTransform))]
    public class DeviceMarkerItem : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler, IPointerClickHandler
    {
        [Header("Identity")]
        [SerializeField] private string deviceId;
        [SerializeField] private string deviceName;
        [SerializeField] private string sourceDeviceType;
        [SerializeField] private string category;
        [SerializeField] private string buildingId;
        [SerializeField] private string floorId;
        [SerializeField] private bool isGroup;
        [SerializeField] private int deviceCount = 1;
        [SerializeField] private bool isTestAnchor;

        public string DeviceId => deviceId;
        public string DeviceName => deviceName;
        public string SourceDeviceType => sourceDeviceType;
        public string Category => category;
        public string BuildingId => buildingId;
        public string FloorId => floorId;
        public bool IsGroup => isGroup;
        public int DeviceCount => deviceCount;
        public bool IsTestAnchor => isTestAnchor;

        public Vector3 DisplayAnchorLocal { get; set; }

        private readonly List<string> _groupedIds = new List<string>();
        public IReadOnlyList<string> GroupedIds => _groupedIds;

        private Action<DeviceMarkerItem> _onClickCallback;
        private RectTransform _rectTransform;
        private Image _bgImage;
        private Image _ringImage;
        private Image _glyphImage;
        private Text _countText;
        private bool _isSelected;
        private bool _isHovered;

        private static Sprite _circleSprite;

        public static Sprite GetCircleSprite()
        {
            if (_circleSprite != null) return _circleSprite;
            int size = 64;
            Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            float center = size / 2f;
            float radius = (size / 2f) - 1.5f;
            Color transparent = new Color(0, 0, 0, 0);

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dist = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), new Vector2(center, center));
                    if (dist <= radius - 1f)
                    {
                        tex.SetPixel(x, y, Color.white);
                    }
                    else if (dist <= radius)
                    {
                        float alpha = Mathf.Clamp01(radius - dist);
                        tex.SetPixel(x, y, new Color(1f, 1f, 1f, alpha));
                    }
                    else
                    {
                        tex.SetPixel(x, y, transparent);
                    }
                }
            }
            tex.Apply();
            _circleSprite = Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
            return _circleSprite;
        }

        private void Awake()
        {
            _rectTransform = GetComponent<RectTransform>();
            _rectTransform.sizeDelta = new Vector2(36f, 36f);
            _rectTransform.pivot = new Vector2(0.5f, 0.5f);
        }

        public void InitializeSingle(
            string id,
            string rawType,
            string cat,
            string bId,
            string fId,
            Vector3 anchorLocal,
            bool isTest,
            Action<DeviceMarkerItem> onClick)
        {
            deviceId = id;
            deviceName = $"{cat} ({id})";
            sourceDeviceType = rawType;
            category = cat;
            buildingId = bId;
            floorId = fId;
            DisplayAnchorLocal = anchorLocal;
            isTestAnchor = isTest;
            isGroup = false;
            deviceCount = 1;
            _groupedIds.Clear();
            _groupedIds.Add(id);
            _onClickCallback = onClick;

            BuildUIHierarchy();
            UpdateVisuals();
        }

        public void InitializeGroup(
            List<string> ids,
            string bId,
            string fId,
            Vector3 anchorLocal,
            Action<DeviceMarkerItem> onClick)
        {
            deviceId = ids != null && ids.Count > 0 ? ids[0] : "";
            deviceName = $"Cluster ({ids?.Count ?? 0} devices)";
            sourceDeviceType = "cluster";
            category = "group";
            buildingId = bId;
            floorId = fId;
            DisplayAnchorLocal = anchorLocal;
            isTestAnchor = false;
            isGroup = true;
            deviceCount = ids != null ? ids.Count : 0;
            _groupedIds.Clear();
            if (ids != null) _groupedIds.AddRange(ids);
            _onClickCallback = onClick;

            BuildUIHierarchy();
            UpdateVisuals();
        }

        private void BuildUIHierarchy()
        {
            if (_rectTransform == null) _rectTransform = GetComponent<RectTransform>();

            // 1. Selection / Hover Ring (behind main badge)
            if (_ringImage == null)
            {
                var ringGo = new GameObject("Ring");
                ringGo.transform.SetParent(transform, false);
                var ringRect = ringGo.AddComponent<RectTransform>();
                ringRect.sizeDelta = new Vector2(46f, 46f);
                ringRect.anchoredPosition = Vector2.zero;

                _ringImage = ringGo.AddComponent<Image>();
                _ringImage.sprite = GetCircleSprite();
                _ringImage.color = new Color(0.22f, 0.74f, 0.97f, 0.9f); // sky blue glow
                _ringImage.raycastTarget = false;
                ringGo.SetActive(false);
            }

            // 2. Main Circle Background
            if (_bgImage == null)
            {
                var bgGo = new GameObject("Background");
                bgGo.transform.SetParent(transform, false);
                var bgRect = bgGo.AddComponent<RectTransform>();
                bgRect.sizeDelta = new Vector2(34f, 34f);
                bgRect.anchoredPosition = Vector2.zero;

                _bgImage = bgGo.AddComponent<Image>();
                _bgImage.sprite = GetCircleSprite();
                _bgImage.color = GetColorForCategory(category);
                _bgImage.raycastTarget = true;
            }

            // 3. Glyph Image
            if (_glyphImage == null)
            {
                var glyphGo = new GameObject("Glyph");
                glyphGo.transform.SetParent(transform, false);
                var glyphRect = glyphGo.AddComponent<RectTransform>();
                glyphRect.sizeDelta = new Vector2(20f, 20f);
                glyphRect.anchoredPosition = Vector2.zero;

                _glyphImage = glyphGo.AddComponent<Image>();
                _glyphImage.color = Color.white;
                _glyphImage.raycastTarget = false;
            }

            // 4. Cluster Count Badge Text (if group)
            if (isGroup && _countText == null)
            {
                var countGo = new GameObject("CountText");
                countGo.transform.SetParent(transform, false);
                var countRect = countGo.AddComponent<RectTransform>();
                countRect.sizeDelta = new Vector2(34f, 34f);
                countRect.anchoredPosition = Vector2.zero;

                _countText = countGo.AddComponent<Text>();
                _countText.alignment = TextAnchor.MiddleCenter;
                _countText.fontSize = 13;
                _countText.fontStyle = FontStyle.Bold;
                _countText.color = Color.white;
                _countText.text = deviceCount.ToString();
                _countText.raycastTarget = false;
            }
        }

        private void UpdateVisuals()
        {
            if (_bgImage != null)
            {
                _bgImage.color = GetColorForCategory(category);
            }

            if (_glyphImage != null)
            {
                string iconResourceName = GetResourceNameForCategory(category, isGroup);
                var loadedSprite = Resources.Load<Sprite>(iconResourceName);
                if (loadedSprite != null)
                {
                    _glyphImage.sprite = loadedSprite;
                    _glyphImage.enabled = true;
                }
                else
                {
                    _glyphImage.enabled = false;
                }
            }

            if (_countText != null && isGroup)
            {
                _countText.text = deviceCount.ToString();
            }
        }

        public void SetSelected(bool selected)
        {
            _isSelected = selected;
            UpdateHighlight();
        }

        public void OnPointerEnter(PointerEventData eventData)
        {
            _isHovered = true;
            UpdateHighlight();
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            _isHovered = false;
            UpdateHighlight();
        }

        public void OnPointerClick(PointerEventData eventData)
        {
            _onClickCallback?.Invoke(this);
        }

        private void UpdateHighlight()
        {
            if (_ringImage != null)
            {
                _ringImage.gameObject.SetActive(_isSelected || _isHovered);
                _ringImage.color = _isSelected
                    ? new Color(0.99f, 0.84f, 0.28f, 0.95f) // Golden yellow highlight
                    : new Color(0.22f, 0.74f, 0.97f, 0.75f); // Sky blue hover
            }

            if (_rectTransform != null)
            {
                _rectTransform.localScale = (_isSelected || _isHovered) ? Vector3.one * 1.18f : Vector3.one;
            }
        }

        public void SetScreenPosition(Vector2 anchoredPos)
        {
            if (_rectTransform == null) _rectTransform = GetComponent<RectTransform>();
            _rectTransform.anchoredPosition = anchoredPos;
        }

        private static string GetResourceNameForCategory(string cat, bool group)
        {
            if (group) return "Icons/icon_group";
            switch (cat?.ToLowerInvariant())
            {
                case "water_meter": return "Icons/icon_water_meter";
                case "temperature_humidity": return "Icons/icon_temperature_humidity";
                case "smart_building": return "Icons/icon_smart_building";
                case "rf_uhf_reader":
                case "uhf_reader": return "Icons/icon_rf_uhf_reader";
                case "camera": return "Icons/icon_camera";
                case "solar": return "Icons/icon_solar";
                case "avc": return "Icons/icon_avc";
                case "nfc": return "Icons/icon_nfc";
                case "unknown":
                default: return "Icons/icon_unknown";
            }
        }

        public static Color GetColorForCategory(string cat)
        {
            switch (cat?.ToLowerInvariant())
            {
                case "water_meter":
                    return new Color(0.14f, 0.44f, 0.95f); // #2563EB
                case "temperature_humidity":
                    return new Color(0.02f, 0.71f, 0.83f); // #06B6D4
                case "smart_building":
                    return new Color(0.96f, 0.62f, 0.07f); // #F59E0B
                case "rf_uhf_reader":
                case "uhf_reader":
                    return new Color(0.06f, 0.73f, 0.51f); // #10B981
                case "camera":
                    return new Color(0.66f, 0.33f, 0.97f); // #A855F7
                case "solar":
                    return new Color(0.92f, 0.70f, 0.03f); // #EAB308 - Yellow sun
                case "avc":
                    return new Color(0.44f, 0.44f, 0.48f); // #71717A - Grey box
                case "nfc":
                    return new Color(0.39f, 0.40f, 0.95f); // #6366F1 - Indigo NFC
                case "group":
                    return new Color(0.95f, 0.45f, 0.15f); // Amber group
                case "unknown":
                default:
                    return new Color(0.39f, 0.46f, 0.55f); // #64748B
            }
        }
    }
}
