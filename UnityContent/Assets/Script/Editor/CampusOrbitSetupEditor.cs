using System;
using System.IO;
using UnityEngine;
using UnityEngine.Rendering.Universal;
using UnityEditor;
using UnityEditor.SceneManagement;
using UITCampus.Core.Bootstrap;
using UITCampus.Input;
using UITCampus.CameraControl;

namespace UITCampus.Editor
{
    /// <summary>
    /// Idempotent Editor setup script for UIT Smart Campus Orbit Map Camera branch.
    /// Constructs/updates required prefabs (_InitManager, CampusOrbitRig),
    /// removes walking controller instances, attaches CampusViewBounds, and wires TestScene.unity.
    /// </summary>
    public static class CampusOrbitSetupEditor
    {
        private const string PrefabsSystemFolder = "Assets/Prefabs/System";
        private const string PrefabsCameraFolder = "Assets/Prefabs/Camera";
        private const string InitManagerPrefabPath = "Assets/Prefabs/System/_InitManager.prefab";
        private const string CampusOrbitRigPrefabPath = "Assets/Prefabs/Camera/CampusOrbitRig.prefab";

        [MenuItem("Tools/UIT Campus/Setup Orbit Scene")]
        public static string SetupAll()
        {
            EnsureFolders();
            var initPrefab = CreateOrUpdateInitManagerPrefab();
            var orbitRigPrefab = CreateOrUpdateCampusOrbitRigPrefab();
            WireScene(initPrefab, orbitRigPrefab);
            return "Orbit Map Camera setup completed successfully!";
        }

        private static void EnsureFolders()
        {
            if (!AssetDatabase.IsValidFolder("Assets/Prefabs"))
            {
                AssetDatabase.CreateFolder("Assets", "Prefabs");
            }
            if (!AssetDatabase.IsValidFolder(PrefabsSystemFolder))
            {
                AssetDatabase.CreateFolder("Assets/Prefabs", "System");
            }
            if (!AssetDatabase.IsValidFolder(PrefabsCameraFolder))
            {
                AssetDatabase.CreateFolder("Assets/Prefabs", "Camera");
            }
            AssetDatabase.Refresh();
        }

        public static GameObject CreateOrUpdateInitManagerPrefab()
        {
            GameObject root = new GameObject("_InitManager");
            root.AddComponent<AppBootstrap>();

            GameObject orbitInputChild = new GameObject("OrbitInput");
            orbitInputChild.transform.SetParent(root.transform, false);
            orbitInputChild.AddComponent<OrbitCameraInputManager>();

            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, InitManagerPrefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            AssetDatabase.SaveAssets();
            return prefab;
        }

        public static GameObject CreateOrUpdateCampusOrbitRigPrefab()
        {
            GameObject root = new GameObject("CampusOrbitRig");
            var controller = root.AddComponent<CampusOrbitCameraController>();

            // Yaw Pivot
            GameObject yawObj = new GameObject("YawPivot");
            yawObj.transform.SetParent(root.transform, false);
            yawObj.transform.localPosition = Vector3.zero;
            yawObj.transform.localRotation = Quaternion.identity;
            yawObj.transform.localScale = Vector3.one;

            // Pitch Pivot
            GameObject pitchObj = new GameObject("PitchPivot");
            pitchObj.transform.SetParent(yawObj.transform, false);
            pitchObj.transform.localPosition = Vector3.zero;
            pitchObj.transform.localRotation = Quaternion.identity;
            pitchObj.transform.localScale = Vector3.one;

            // Main Camera
            GameObject camObj = new GameObject("Main Camera");
            camObj.transform.SetParent(pitchObj.transform, false);
            camObj.transform.localPosition = new Vector3(0f, 0f, -50f);
            camObj.transform.localRotation = Quaternion.identity;
            camObj.transform.localScale = Vector3.one;
            camObj.tag = "MainCamera";

            var cam = camObj.AddComponent<Camera>();
            cam.fieldOfView = 50f;
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 1000f;

            var uac = camObj.AddComponent<UniversalAdditionalCameraData>();
            uac.renderPostProcessing = false;

            camObj.AddComponent<AudioListener>();

            // Wire internal serialized references
            controller.YawPivot = yawObj.transform;
            controller.PitchPivot = pitchObj.transform;

            SerializedObject so = new SerializedObject(controller);
            so.FindProperty("targetCamera").objectReferenceValue = cam;
            so.FindProperty("yawPivot").objectReferenceValue = yawObj.transform;
            so.FindProperty("pitchPivot").objectReferenceValue = pitchObj.transform;
            so.ApplyModifiedPropertiesWithoutUndo();

            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, CampusOrbitRigPrefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            AssetDatabase.SaveAssets();
            return prefab;
        }

        public static void WireScene(GameObject initPrefab, GameObject orbitRigPrefab)
        {
            var scene = EditorSceneManager.GetActiveScene();

            // 1. Configure CampusViewBounds on CampusRoot
            var campusRoot = GameObject.Find("CampusRoot");
            CampusViewBounds viewBounds = null;
            if (campusRoot != null)
            {
                viewBounds = campusRoot.GetComponent<CampusViewBounds>();
                if (viewBounds == null)
                {
                    viewBounds = campusRoot.AddComponent<CampusViewBounds>();
                }

                var visualRoot = campusRoot.transform.Find("CampusVisualRoot");
                if (visualRoot != null)
                {
                    viewBounds.CampusVisualRoot = visualRoot;
                    viewBounds.CalculateBounds();
                    EditorUtility.SetDirty(viewBounds);
                }
                else
                {
                    Debug.LogError("[CampusOrbitSetupEditor] CampusVisualRoot not found under CampusRoot!");
                }
            }
            else
            {
                Debug.LogError("[CampusOrbitSetupEditor] CampusRoot not found in scene!");
            }

            // 2. Remove PlayerRig walking controller instance from scene if present
            var playerRig = GameObject.Find("PlayerRig");
            if (playerRig != null)
            {
                UnityEngine.Object.DestroyImmediate(playerRig);
            }

            // 3. Remove/disable old standalone Main Camera objects at root
            var rootObjects = scene.GetRootGameObjects();
            foreach (var go in rootObjects)
            {
                if (go.name == "Main Camera")
                {
                    UnityEngine.Object.DestroyImmediate(go);
                }
            }

            // 4. Instantiate or update _InitManager in scene
            var existingInit = GameObject.Find("_InitManager");
            if (existingInit != null)
            {
                UnityEngine.Object.DestroyImmediate(existingInit);
            }
            if (initPrefab != null)
            {
                var inst = (GameObject)PrefabUtility.InstantiatePrefab(initPrefab);
                inst.transform.position = Vector3.zero;
                inst.transform.rotation = Quaternion.identity;
                inst.transform.localScale = Vector3.one;
            }

            // 5. Instantiate or update CampusOrbitRig in scene
            var existingRig = GameObject.Find("CampusOrbitRig");
            if (existingRig != null)
            {
                UnityEngine.Object.DestroyImmediate(existingRig);
            }
            if (orbitRigPrefab != null)
            {
                var rigInst = (GameObject)PrefabUtility.InstantiatePrefab(orbitRigPrefab);
                rigInst.transform.position = Vector3.zero;
                rigInst.transform.rotation = Quaternion.identity;
                rigInst.transform.localScale = Vector3.one;

                var controller = rigInst.GetComponent<CampusOrbitCameraController>();
                if (controller != null && viewBounds != null)
                {
                    controller.CampusViewBounds = viewBounds;
                    SerializedObject so = new SerializedObject(controller);
                    so.FindProperty("campusViewBounds").objectReferenceValue = viewBounds;
                    so.ApplyModifiedPropertiesWithoutUndo();
                    EditorUtility.SetDirty(controller);
                }
            }

            // 6. Ensure ScaleReference_Player is inactive
            var scaleRef = GameObject.Find("ScaleReference_Player");
            if (scaleRef != null)
            {
                scaleRef.SetActive(false);
                EditorUtility.SetDirty(scaleRef);
            }

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
        }
    }
}
