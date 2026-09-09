using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEditor;
using UnityEditor.SceneManagement;
using UITCampus.Campus.Buildings;

namespace UITCampus.Editor
{
    /// <summary>
    /// Idempotent Editor setup utility for Building E Floor Hover Highlight.
    /// Configures Camera PhysicsRaycaster, FloorHover layer, HoverableBuilding on Building_E,
    /// and HoverableFloor + MeshColliders on the 13 valid Building E floors.
    /// </summary>
    public static class BuildingEFloorHoverSetupEditor
    {
        private const string FloorHoverLayerName = "FloorHover";
        private const string BuildingEName = "Building_E";

        [MenuItem("Tools/UIT Campus/Setup Building E Floor Hover")]
        public static string SetupAll()
        {
            int floorHoverLayer = LayerMask.NameToLayer(FloorHoverLayerName);
            if (floorHoverLayer < 0)
            {
                floorHoverLayer = EnsureFloorHoverLayer();
            }

            SetupCameraRaycaster(floorHoverLayer);
            var building = SetupBuildingE(floorHoverLayer);

            var activeScene = EditorSceneManager.GetActiveScene();
            EditorSceneManager.MarkSceneDirty(activeScene);
            EditorSceneManager.SaveScene(activeScene);

            string summary = $"Building E Floor Hover Setup completed! Configured {building.Floors.Count} floors.";
            Debug.Log(summary);
            return summary;
        }

        public static int EnsureFloorHoverLayer()
        {
            var tagManager = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset")[0]);
            var layers = tagManager.FindProperty("layers");

            for (int i = 6; i < 32; i++)
            {
                var slot = layers.GetArrayElementAtIndex(i);
                if (slot.stringValue == FloorHoverLayerName)
                {
                    return i;
                }
            }

            for (int i = 6; i < 32; i++)
            {
                var slot = layers.GetArrayElementAtIndex(i);
                if (string.IsNullOrEmpty(slot.stringValue))
                {
                    slot.stringValue = FloorHoverLayerName;
                    tagManager.ApplyModifiedProperties();
                    AssetDatabase.SaveAssets();
                    Debug.Log($"[BuildingEFloorHoverSetupEditor] Assigned layer {i} as '{FloorHoverLayerName}'.");
                    return i;
                }
            }

            throw new InvalidOperationException("No free layer slot found for " + FloorHoverLayerName);
        }

        public static void SetupCameraRaycaster(int floorHoverLayer)
        {
            Camera cam = Camera.main;
            if (cam == null)
            {
                cam = UnityEngine.Object.FindAnyObjectByType<Camera>();
            }

            if (cam == null)
            {
                throw new InvalidOperationException("No active Camera found in scene!");
            }

            var raycaster = cam.GetComponent<PhysicsRaycaster>();
            if (raycaster == null)
            {
                raycaster = cam.gameObject.AddComponent<PhysicsRaycaster>();
            }

            raycaster.eventMask = 1 << floorHoverLayer;
            Debug.Log($"[BuildingEFloorHoverSetupEditor] Configured PhysicsRaycaster on '{cam.name}' with eventMask for layer '{FloorHoverLayerName}' ({floorHoverLayer}).");
        }

        public static HoverableBuilding SetupBuildingE(int floorHoverLayer)
        {
            GameObject buildingEObj = GameObject.Find(BuildingEName);
            if (buildingEObj == null)
            {
                throw new InvalidOperationException($"'{BuildingEName}' GameObject not found in active scene!");
            }

            var building = buildingEObj.GetComponent<HoverableBuilding>();
            if (building == null)
            {
                building = buildingEObj.AddComponent<HoverableBuilding>();
            }

            SerializedObject buildingSo = new SerializedObject(building);
            buildingSo.FindProperty("buildingId").stringValue = "E";
            buildingSo.FindProperty("hoverTint").colorValue = new Color(1f, 0.949f, 0.651f, 1f); // #FFF2A6
            buildingSo.FindProperty("hoverBlendStrength").floatValue = 0.4f;

            var configuredFloors = new List<HoverableFloor>();

            for (int i = 0; i < buildingEObj.transform.childCount; i++)
            {
                Transform child = buildingEObj.transform.GetChild(i);
                string childName = child.name;

                if (!FloorNameParser.TryParse(childName, out string parsedBuilding, out string parsedFloor))
                {
                    // Excluded child (e.g. stairs, Mesh54)
                    continue;
                }

                var floorComp = child.GetComponent<HoverableFloor>();
                if (floorComp == null)
                {
                    floorComp = child.gameObject.AddComponent<HoverableFloor>();
                }

                var renderers = child.GetComponentsInChildren<MeshRenderer>(true);

                SerializedObject floorSo = new SerializedObject(floorComp);
                floorSo.FindProperty("buildingId").stringValue = parsedBuilding;
                floorSo.FindProperty("floorId").stringValue = parsedFloor;

                var targetRenderersProp = floorSo.FindProperty("targetRenderers");
                targetRenderersProp.ClearArray();
                for (int r = 0; r < renderers.Length; r++)
                {
                    targetRenderersProp.InsertArrayElementAtIndex(r);
                    targetRenderersProp.GetArrayElementAtIndex(r).objectReferenceValue = renderers[r];
                }
                floorSo.ApplyModifiedPropertiesWithoutUndo();

                // Setup MeshColliders on mesh children
                foreach (var mr in renderers)
                {
                    var mf = mr.GetComponent<MeshFilter>();
                    if (mf == null || mf.sharedMesh == null) continue;

                    var mc = mr.GetComponent<MeshCollider>();
                    if (mc == null)
                    {
                        mc = mr.gameObject.AddComponent<MeshCollider>();
                    }

                    mc.sharedMesh = mf.sharedMesh;
                    mc.convex = false;
                    mc.isTrigger = false;

                    mr.gameObject.layer = floorHoverLayer;
                }

                configuredFloors.Add(floorComp);
            }

            var floorsProp = buildingSo.FindProperty("floors");
            floorsProp.ClearArray();
            for (int f = 0; f < configuredFloors.Count; f++)
            {
                floorsProp.InsertArrayElementAtIndex(f);
                floorsProp.GetArrayElementAtIndex(f).objectReferenceValue = configuredFloors[f];
            }
            buildingSo.ApplyModifiedPropertiesWithoutUndo();

            building.RefreshFloorRegistry();
            Debug.Log($"[BuildingEFloorHoverSetupEditor] Configured {configuredFloors.Count} floors on '{BuildingEName}'.");
            return building;
        }
    }
}

