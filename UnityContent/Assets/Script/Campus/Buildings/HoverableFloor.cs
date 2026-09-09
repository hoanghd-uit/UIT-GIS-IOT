using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UITCampus.Core.Signals;

namespace UITCampus.Campus.Buildings
{
    /// <summary>
    /// Component attached to each hoverable floor (e.g., E_floor_G, E_floor_1..12).
    /// Dispatches EventSystem pointer events via FloorHoverSignals and manages MaterialPropertyBlock highlight/restore.
    /// </summary>
    [DisallowMultipleComponent]
    public class HoverableFloor : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler, IPointerClickHandler
    {
        [SerializeField] private string buildingId = string.Empty;
        [SerializeField] private string floorId = string.Empty;
        [SerializeField] private Renderer[] targetRenderers;

        private static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");
        private static readonly int ColorId = Shader.PropertyToID("_Color");

        private class MaterialSlotState
        {
            public Renderer Renderer;
            public int SlotIndex;
            public int ColorPropertyId;
            public Color OriginalColor;
            public MaterialPropertyBlock OriginalBlock;
            public bool HadOriginalBlock;
        }

        private List<MaterialSlotState> cachedSlots;
        private MaterialPropertyBlock activeHighlightBlock;
        private bool isHighlighted;
        private bool hasWarnedNoRenderer;

        public string BuildingId => buildingId;
        public string FloorId => floorId;
        public bool IsHighlighted => isHighlighted;

        private void Reset()
        {
            buildingId = string.Empty;
            floorId = string.Empty;

            if (FloorNameParser.TryParse(gameObject.name, out string parsedBuilding, out string parsedFloor))
            {
                buildingId = parsedBuilding;
                floorId = parsedFloor;
            }

            RefreshRendererCache();
        }

        [ContextMenu("Refresh Renderer Cache")]
        public void RefreshRendererCache()
        {
            targetRenderers = GetComponentsInChildren<Renderer>(true);
            cachedSlots = null;
        }

        public void OnPointerEnter(PointerEventData eventData)
        {
            FloorHoverSignals.PublishPointerEntered(this);
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            FloorHoverSignals.PublishPointerExited(this);
        }

        public void OnPointerClick(PointerEventData eventData)
        {
            if (eventData == null || (eventData.button == PointerEventData.InputButton.Left && !eventData.dragging))
            {
                OnFloorClick();
            }
        }

        /// <summary>
        /// Invoked when the user clicks this floor with the mouse.
        /// </summary>
        public virtual void OnFloorClick()
        {
            Debug.Log($"[HoverableFloor] Clicked on floor '{floorId}' of building '{buildingId}' ({gameObject.name}).", this);
            FloorHoverSignals.PublishFloorClicked(this);
        }

        /// <summary>
        /// Applies highlight tint to all cached renderers using MaterialPropertyBlock.
        /// </summary>
        public void ApplyHighlight(Color tint, float blendStrength)
        {
            EnsureCachedState();

            if (cachedSlots == null || cachedSlots.Count == 0)
            {
                return;
            }

            if (activeHighlightBlock == null)
            {
                activeHighlightBlock = new MaterialPropertyBlock();
            }

            for (int i = 0; i < cachedSlots.Count; i++)
            {
                var slot = cachedSlots[i];
                if (slot.Renderer == null) continue;

                // Start from existing property block if any
                slot.Renderer.GetPropertyBlock(activeHighlightBlock, slot.SlotIndex);

                Color tintedColor = Color.Lerp(slot.OriginalColor, tint, blendStrength);
                tintedColor.a = slot.OriginalColor.a; // Preserve source alpha

                activeHighlightBlock.SetColor(slot.ColorPropertyId, tintedColor);
                slot.Renderer.SetPropertyBlock(activeHighlightBlock, slot.SlotIndex);
            }

            isHighlighted = true;
        }

        /// <summary>
        /// Restores renderers exactly to their original state.
        /// </summary>
        public void ClearHighlight()
        {
            if (!isHighlighted || cachedSlots == null)
            {
                return;
            }

            for (int i = 0; i < cachedSlots.Count; i++)
            {
                var slot = cachedSlots[i];
                if (slot.Renderer == null) continue;

                if (slot.HadOriginalBlock)
                {
                    slot.Renderer.SetPropertyBlock(slot.OriginalBlock, slot.SlotIndex);
                }
                else
                {
                    slot.Renderer.SetPropertyBlock(null, slot.SlotIndex);
                }
            }

            isHighlighted = false;
        }

        private void EnsureCachedState()
        {
            if (cachedSlots != null)
            {
                return;
            }

            if (targetRenderers == null || targetRenderers.Length == 0)
            {
                targetRenderers = GetComponentsInChildren<Renderer>(true);
            }

            if (targetRenderers == null || targetRenderers.Length == 0)
            {
                if (!hasWarnedNoRenderer)
                {
                    Debug.LogWarning($"[HoverableFloor] No renderers found under {gameObject.name}.", this);
                    hasWarnedNoRenderer = true;
                }
                cachedSlots = new List<MaterialSlotState>(0);
                return;
            }

            cachedSlots = new List<MaterialSlotState>();
            bool hasWarnedUnsupportedShader = false;

            for (int r = 0; r < targetRenderers.Length; r++)
            {
                var rend = targetRenderers[r];
                if (rend == null) continue;

                var materials = rend.sharedMaterials;
                if (materials == null) continue;

                bool rendHasBlock = rend.HasPropertyBlock();

                for (int m = 0; m < materials.Length; m++)
                {
                    var mat = materials[m];
                    if (mat == null) continue;

                    int propId;
                    if (mat.HasProperty(BaseColorId))
                    {
                        propId = BaseColorId;
                    }
                    else if (mat.HasProperty(ColorId))
                    {
                        propId = ColorId;
                    }
                    else
                    {
                        if (!hasWarnedUnsupportedShader)
                        {
                            Debug.LogWarning($"[HoverableFloor] Material '{mat.name}' on '{rend.name}' has neither _BaseColor nor _Color. Skipping slot {m}.", rend);
                            hasWarnedUnsupportedShader = true;
                        }
                        continue;
                    }

                    MaterialPropertyBlock origBlock = null;
                    if (rendHasBlock)
                    {
                        origBlock = new MaterialPropertyBlock();
                        rend.GetPropertyBlock(origBlock, m);
                    }

                    Color origColor = mat.HasProperty(propId) ? mat.GetColor(propId) : Color.white;
                    if (origBlock != null && origBlock.HasColor(propId))
                    {
                        origColor = origBlock.GetColor(propId);
                    }

                    cachedSlots.Add(new MaterialSlotState
                    {
                        Renderer = rend,
                        SlotIndex = m,
                        ColorPropertyId = propId,
                        OriginalColor = origColor,
                        OriginalBlock = origBlock,
                        HadOriginalBlock = rendHasBlock
                    });
                }
            }
        }

        private void OnDisable()
        {
            if (isHighlighted)
            {
                ClearHighlight();
            }
        }

        private void OnDestroy()
        {
            if (isHighlighted)
            {
                ClearHighlight();
            }
        }
    }
}

