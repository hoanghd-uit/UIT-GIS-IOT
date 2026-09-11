using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using UITCampus.Core.Bootstrap;
using UITCampus.Input;
using UITCampus.CameraControl;

namespace UITCampus.Editor
{
    /// <summary>
    /// Safe, idempotent Editor setup and verification utility for integrating the Orbit Map Camera into FloorDetail.unity.
    /// Reuses existing _InitManager and CampusOrbitRig prefabs without modification.
    /// </summary>
    public static class FloorDetailOrbitSetupEditor
    {
        public const string TargetScenePath = "Assets/Scene/FloorDetail.unity";
        public const string InitManagerPrefabPath = "Assets/Prefabs/System/_InitManager.prefab";
        public const string CampusOrbitRigPrefabPath = "Assets/Prefabs/Camera/CampusOrbitRig.prefab";
        public const string DefaultInputActionsGuid = "ca9f5fa95ffab41fb9a615ab714db018";

        [MenuItem("Tools/UIT Campus/Setup FloorDetail Orbit Scene")]
        public static void SetupFromMenu()
        {
            var activeScene = EditorSceneManager.GetActiveScene();
            if (activeScene.path != TargetScenePath)
            {
                EditorUtility.DisplayDialog("FloorDetail Setup",
                    $"Active scene must be '{TargetScenePath}', but was '{activeScene.path}'.\nPlease open FloorDetail scene first.", "OK");
                return;
            }

            bool success = SetupFloorDetailScene(saveScene: true);
            if (success)
            {
                VerifyFloorDetailScene();
                EditorUtility.DisplayDialog("FloorDetail Setup", "FloorDetail Orbit Camera setup completed successfully!", "OK");
            }
            else
            {
                EditorUtility.DisplayDialog("FloorDetail Setup", "Setup encountered errors. Please check the Console.", "OK");
            }
        }

        [MenuItem("Tools/UIT Campus/Verify FloorDetail Orbit Scene")]
        public static void VerifyFromMenu()
        {
            var activeScene = EditorSceneManager.GetActiveScene();
            if (activeScene.path != TargetScenePath)
            {
                EditorUtility.DisplayDialog("FloorDetail Verify",
                    $"Active scene must be '{TargetScenePath}', but was '{activeScene.path}'.", "OK");
                return;
            }

            bool ok = VerifyFloorDetailScene();
            EditorUtility.DisplayDialog("FloorDetail Verify",
                ok ? "Verification succeeded! All assertions passed." : "Verification failed. Check Console for details.", "OK");
        }

        /// <summary>
        /// Entry point for headless batch mode setup and verification.
        /// </summary>
        public static void SetupAndVerifyBatch()
        {
            try
            {
                Debug.Log("[FloorDetailOrbitSetupEditor] Opening FloorDetail scene for batch execution...");
                var scene = EditorSceneManager.OpenScene(TargetScenePath, OpenSceneMode.Single);
                if (!scene.IsValid())
                {
                    Debug.LogError($"[FloorDetailOrbitSetupEditor] Failed to open scene at '{TargetScenePath}'!");
                    EditorApplication.Exit(1);
                    return;
                }

                bool setupOk = SetupFloorDetailScene(saveScene: true);
                if (!setupOk)
                {
                    Debug.LogError("[FloorDetailOrbitSetupEditor] SetupFloorDetailScene failed!");
                    EditorApplication.Exit(1);
                    return;
                }

                // Reload scene from disk to verify serialization persistence
                Debug.Log("[FloorDetailOrbitSetupEditor] Reloading scene to verify serialized persistence...");
                var reloadedScene = EditorSceneManager.OpenScene(TargetScenePath, OpenSceneMode.Single);
                if (!reloadedScene.IsValid())
                {
                    Debug.LogError("[FloorDetailOrbitSetupEditor] Failed to reload scene for verification!");
                    EditorApplication.Exit(1);
                    return;
                }

                bool verifyOk = VerifyFloorDetailScene();
                if (!verifyOk)
                {
                    Debug.LogError("[FloorDetailOrbitSetupEditor] Verification failed after scene reload!");
                    EditorApplication.Exit(1);
                    return;
                }

                Debug.Log("[FloorDetailOrbitSetupEditor] BATCH SETUP AND VERIFICATION SUCCESSFUL");
                EditorApplication.Exit(0);
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
                EditorApplication.Exit(1);
            }
        }

        /// <summary>
        /// Performs the complete ordered scene integration.
        /// </summary>
        public static bool SetupFloorDetailScene(bool saveScene)
        {
            var scene = EditorSceneManager.GetActiveScene();
            if (scene.path != TargetScenePath)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Active scene path '{scene.path}' does not match '{TargetScenePath}'!");
                return false;
            }

            // 1. Validate required prefab assets exist before modifying anything
            var initPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(InitManagerPrefabPath);
            if (initPrefab == null)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Required prefab missing: {InitManagerPrefabPath}!");
                return false;
            }

            var orbitRigPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(CampusOrbitRigPrefabPath);
            if (orbitRigPrefab == null)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Required prefab missing: {CampusOrbitRigPrefabPath}!");
                return false;
            }

            // 2. Validate MainOffice root exists (confirmed default bounds scope)
            var mainOffice = GameObject.Find("MainOffice");
            if (mainOffice == null)
            {
                Debug.LogError("[FloorDetailOrbitSetupEditor] MainOffice root GameObject not found in scene!");
                return false;
            }

            // 3. Create or find FloorDetailCameraContext with CampusViewBounds
            var contextGo = GameObject.Find("FloorDetailCameraContext");
            if (contextGo == null)
            {
                contextGo = new GameObject("FloorDetailCameraContext");
                Undo.RegisterCreatedObjectUndo(contextGo, "Create FloorDetailCameraContext");
                contextGo.transform.position = Vector3.zero;
                contextGo.transform.rotation = Quaternion.identity;
                contextGo.transform.localScale = Vector3.one;
            }

            var viewBounds = contextGo.GetComponent<CampusViewBounds>();
            if (viewBounds == null)
            {
                viewBounds = Undo.AddComponent<CampusViewBounds>(contextGo);
            }

            viewBounds.CampusVisualRoot = mainOffice.transform;
            bool boundsCalculated = viewBounds.CalculateBounds();
            if (!boundsCalculated || !viewBounds.HasValidBounds)
            {
                Debug.LogError("[FloorDetailOrbitSetupEditor] Failed to calculate valid bounds on MainOffice!");
                return false;
            }
            EditorUtility.SetDirty(viewBounds);
            Debug.Log($"[FloorDetailOrbitSetupEditor] Cached MainOffice bounds: Center={viewBounds.CachedBounds.center}, Size={viewBounds.CachedBounds.size}, Extents={viewBounds.CachedBounds.extents}, BoundingRadius={viewBounds.BoundingRadius}");

            // 4. Detach EventSystem from MainOffice to root and migrate to InputSystemUIInputModule
            var eventSystem = UnityEngine.Object.FindAnyObjectByType<EventSystem>();
            if (eventSystem != null)
            {
                var esGo = eventSystem.gameObject;
                if (esGo.transform.parent != null)
                {
                    Undo.SetTransformParent(esGo.transform, null, "Detach EventSystem to root");
                    esGo.transform.localPosition = Vector3.zero;
                    esGo.transform.localRotation = Quaternion.identity;
                    esGo.transform.localScale = Vector3.one;
                }

                // Remove legacy StandaloneInputModule
                var standalone = esGo.GetComponent<StandaloneInputModule>();
                if (standalone != null)
                {
                    Undo.DestroyObjectImmediate(standalone);
                }

                // Add or configure InputSystemUIInputModule
                var inputSystemModule = esGo.GetComponent<InputSystemUIInputModule>();
                if (inputSystemModule == null)
                {
                    inputSystemModule = Undo.AddComponent<InputSystemUIInputModule>(esGo);
                }

                // Assign DefaultInputActions asset if available
                var actionsPath = AssetDatabase.GUIDToAssetPath(DefaultInputActionsGuid);
                if (!string.IsNullOrEmpty(actionsPath))
                {
                    var actionsAsset = AssetDatabase.LoadAssetAtPath<InputActionAsset>(actionsPath);
                    if (actionsAsset != null)
                    {
                        inputSystemModule.actionsAsset = actionsAsset;
                    }
                }
                inputSystemModule.AssignDefaultActions();
                EditorUtility.SetDirty(esGo);
                EditorUtility.SetDirty(inputSystemModule);
            }
            else
            {
                var esGo = new GameObject("EventSystem");
                Undo.RegisterCreatedObjectUndo(esGo, "Create EventSystem");
                esGo.AddComponent<EventSystem>();
                var inputSystemModule = esGo.AddComponent<InputSystemUIInputModule>();
                var actionsPath = AssetDatabase.GUIDToAssetPath(DefaultInputActionsGuid);
                if (!string.IsNullOrEmpty(actionsPath))
                {
                    var actionsAsset = AssetDatabase.LoadAssetAtPath<InputActionAsset>(actionsPath);
                    if (actionsAsset != null)
                    {
                        inputSystemModule.actionsAsset = actionsAsset;
                    }
                }
                inputSystemModule.AssignDefaultActions();
                EditorUtility.SetDirty(esGo);
            }

            // 5. Instantiate or find _InitManager prefab instance
            var initManagerGo = GameObject.Find("_InitManager");
            if (initManagerGo == null)
            {
                initManagerGo = (GameObject)PrefabUtility.InstantiatePrefab(initPrefab);
                Undo.RegisterCreatedObjectUndo(initManagerGo, "Instantiate _InitManager");
                initManagerGo.transform.position = Vector3.zero;
                initManagerGo.transform.rotation = Quaternion.identity;
                initManagerGo.transform.localScale = Vector3.one;
                EditorUtility.SetDirty(initManagerGo);
            }

            // 6. Instantiate or find CampusOrbitRig prefab instance (scene-local)
            var rigGo = GameObject.Find("CampusOrbitRig");
            if (rigGo == null)
            {
                rigGo = (GameObject)PrefabUtility.InstantiatePrefab(orbitRigPrefab);
                Undo.RegisterCreatedObjectUndo(rigGo, "Instantiate CampusOrbitRig");
                rigGo.transform.position = Vector3.zero;
                rigGo.transform.rotation = Quaternion.identity;
                rigGo.transform.localScale = Vector3.one;
            }

            var controller = rigGo.GetComponent<CampusOrbitCameraController>();
            if (controller == null)
            {
                Debug.LogError("[FloorDetailOrbitSetupEditor] CampusOrbitCameraController missing on CampusOrbitRig!");
                return false;
            }

            // Apply FloorDetail instance serialized overrides
            SerializedObject so = new SerializedObject(controller);
            so.Update();
            so.FindProperty("campusViewBounds").objectReferenceValue = viewBounds;
            so.FindProperty("initialYaw").floatValue = 150f;
            so.FindProperty("initialPitch").floatValue = 54f;
            so.FindProperty("useCustomInitialDistance").boolValue = false;
            so.FindProperty("framingMargin").floatValue = 1.15f;
            so.FindProperty("minPitch").floatValue = 20f;
            so.FindProperty("maxPitch").floatValue = 80f;
            so.FindProperty("orbitSensitivity").floatValue = 0.2f;
            so.FindProperty("panSensitivity").floatValue = 1.0f;
            so.FindProperty("panBoundsMarginPercent").floatValue = 0.10f;
            so.FindProperty("invertPan").boolValue = false;
            so.FindProperty("zoomSensitivity").floatValue = 0.15f;
            so.FindProperty("minDistanceMultiplier").floatValue = 0.05f;
            so.FindProperty("maxDistanceMultiplier").floatValue = 3.0f;
            so.FindProperty("absoluteMinDistance").floatValue = 1.0f;
            so.FindProperty("dampingTime").floatValue = 0.15f;
            so.FindProperty("ignoreInputOverUI").boolValue = true;
            so.ApplyModifiedProperties();
            EditorUtility.SetDirty(controller);

            // 7. Validate new camera exists and is enabled before removing old camera
            var rigCamera = rigGo.GetComponentInChildren<Camera>();
            if (rigCamera == null || !rigCamera.enabled)
            {
                Debug.LogError("[FloorDetailOrbitSetupEditor] Rig camera is missing or disabled! Aborting old camera cleanup.");
                return false;
            }

            // 8. Find and destroy old standalone root Main Camera
            var rootObjects = scene.GetRootGameObjects();
            foreach (var go in rootObjects)
            {
                if (go.name == "Main Camera" && go != rigGo && go.transform.parent == null)
                {
                    Undo.DestroyObjectImmediate(go);
                    Debug.Log("[FloorDetailOrbitSetupEditor] Successfully removed old standalone root Main Camera.");
                }
            }

            if (saveScene)
            {
                EditorSceneManager.MarkSceneDirty(scene);
                bool saved = EditorSceneManager.SaveScene(scene);
                if (!saved)
                {
                    Debug.LogError("[FloorDetailOrbitSetupEditor] Failed to save scene!");
                    return false;
                }
                Debug.Log("[FloorDetailOrbitSetupEditor] Scene saved successfully.");
            }

            return true;
        }

        /// <summary>
        /// Validates all scene invariants and acceptance criteria on the active scene.
        /// </summary>
        public static bool VerifyFloorDetailScene()
        {
            var scene = EditorSceneManager.GetActiveScene();
            if (scene.path != TargetScenePath)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Verification failed: Active scene '{scene.path}' is not '{TargetScenePath}'!");
                return false;
            }

            bool allPassed = true;

            // 1. Camera check: exactly 1 active Camera, tagged MainCamera
            var cameras = UnityEngine.Object.FindObjectsByType<Camera>(FindObjectsSortMode.None);
            int activeCameras = 0;
            Camera activeCam = null;
            foreach (var cam in cameras)
            {
                if (cam.isActiveAndEnabled)
                {
                    activeCameras++;
                    activeCam = cam;
                }
            }

            if (activeCameras != 1)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Invariant violation: Expected exactly 1 active Camera, found {activeCameras}!");
                allPassed = false;
            }
            else if (!activeCam.CompareTag("MainCamera"))
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Invariant violation: Active Camera '{activeCam.name}' is not tagged 'MainCamera'!");
                allPassed = false;
            }
            else
            {
                Debug.Log($"[FloorDetailOrbitSetupEditor] [PASS] Sole active Camera: '{activeCam.name}' on '{activeCam.transform.parent?.parent?.parent?.name}'.");
            }

            // 2. AudioListener check: exactly 1 active AudioListener
            var listeners = UnityEngine.Object.FindObjectsByType<AudioListener>(FindObjectsSortMode.None);
            int activeListeners = 0;
            foreach (var l in listeners)
            {
                if (l.isActiveAndEnabled) activeListeners++;
            }

            if (activeListeners != 1)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Invariant violation: Expected exactly 1 active AudioListener, found {activeListeners}!");
                allPassed = false;
            }
            else
            {
                Debug.Log("[FloorDetailOrbitSetupEditor] [PASS] Exactly 1 active AudioListener.");
            }

            // 3. EventSystem and UI Input Module checks
            var eventSystems = UnityEngine.Object.FindObjectsByType<EventSystem>(FindObjectsSortMode.None);
            int activeEventSystems = 0;
            foreach (var es in eventSystems)
            {
                if (es.isActiveAndEnabled) activeEventSystems++;
            }

            if (activeEventSystems != 1)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Invariant violation: Expected exactly 1 active EventSystem, found {activeEventSystems}!");
                allPassed = false;
            }
            else
            {
                Debug.Log("[FloorDetailOrbitSetupEditor] [PASS] Exactly 1 active EventSystem.");
            }

            var standaloneModules = UnityEngine.Object.FindObjectsByType<StandaloneInputModule>(FindObjectsSortMode.None);
            if (standaloneModules.Length > 0)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Invariant violation: Found {standaloneModules.Length} incompatible StandaloneInputModule components!");
                allPassed = false;
            }
            else
            {
                Debug.Log("[FloorDetailOrbitSetupEditor] [PASS] Zero StandaloneInputModule components.");
            }

            var inputSystemModules = UnityEngine.Object.FindObjectsByType<InputSystemUIInputModule>(FindObjectsSortMode.None);
            int activeInputModules = 0;
            foreach (var m in inputSystemModules)
            {
                if (m.isActiveAndEnabled) activeInputModules++;
            }

            if (activeInputModules != 1)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Invariant violation: Expected exactly 1 active InputSystemUIInputModule, found {activeInputModules}!");
                allPassed = false;
            }
            else
            {
                Debug.Log("[FloorDetailOrbitSetupEditor] [PASS] Exactly 1 active InputSystemUIInputModule.");
            }

            // 4. CampusOrbitCameraController check
            var controllers = UnityEngine.Object.FindObjectsByType<CampusOrbitCameraController>(FindObjectsSortMode.None);
            if (controllers.Length != 1)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Invariant violation: Expected exactly 1 CampusOrbitCameraController, found {controllers.Length}!");
                allPassed = false;
            }
            else
            {
                var ctrl = controllers[0];
                var so = new SerializedObject(ctrl);
                var boundsProp = so.FindProperty("campusViewBounds").objectReferenceValue as CampusViewBounds;
                if (boundsProp == null)
                {
                    Debug.LogError("[FloorDetailOrbitSetupEditor] Invariant violation: campusViewBounds reference on CampusOrbitCameraController is null!");
                    allPassed = false;
                }
                else
                {
                    Debug.Log("[FloorDetailOrbitSetupEditor] [PASS] CampusOrbitCameraController has valid serialized CampusViewBounds reference.");
                }
            }

            // 5. OrbitCameraInputManager check
            var inputManagers = UnityEngine.Object.FindObjectsByType<OrbitCameraInputManager>(FindObjectsSortMode.None);
            if (inputManagers.Length != 1)
            {
                Debug.LogError($"[FloorDetailOrbitSetupEditor] Invariant violation: Expected exactly 1 OrbitCameraInputManager, found {inputManagers.Length}!");
                allPassed = false;
            }
            else
            {
                Debug.Log("[FloorDetailOrbitSetupEditor] [PASS] Exactly 1 OrbitCameraInputManager.");
            }

            // 6. ViewBounds target check
            var dynamicHost = UnityEngine.Object.FindAnyObjectByType<UITCampus.FloorContent.FloorDetailContentHost>();
            if (dynamicHost != null)
            {
                Debug.Log("[FloorDetailOrbitSetupEditor] [PASS] Phase 03 FloorDetailContentHost detected; bounds are dynamically managed.");
            }
            else
            {
                var contextGo = GameObject.Find("FloorDetailCameraContext");
                if (contextGo == null)
                {
                    Debug.LogError("[FloorDetailOrbitSetupEditor] Invariant violation: 'FloorDetailCameraContext' root object not found!");
                    allPassed = false;
                }
                else
                {
                    var vb = contextGo.GetComponent<CampusViewBounds>();
                    if (vb == null || vb.CampusVisualRoot == null || vb.CampusVisualRoot.name != "MainOffice")
                    {
                        Debug.LogError("[FloorDetailOrbitSetupEditor] Invariant violation: CampusViewBounds is not targeting 'MainOffice'!");
                        allPassed = false;
                    }
                    else
                    {
                        Debug.Log($"[FloorDetailOrbitSetupEditor] [PASS] CampusViewBounds targets '{vb.CampusVisualRoot.name}' at {vb.CampusVisualRoot.position}.");
                    }
                }
            }

            // 7. Check preserved root objects
            var homeOffice = GameObject.Find("HomeOffice");
            if (homeOffice == null || homeOffice.transform.parent != null)
            {
                Debug.LogError("[FloorDetailOrbitSetupEditor] Invariant violation: HomeOffice is missing or was reparented!");
                allPassed = false;
            }
            else
            {
                Debug.Log($"[FloorDetailOrbitSetupEditor] [PASS] HomeOffice preserved at position {homeOffice.transform.position}.");
            }

            // 8. Verify OrbitCameraInputManager focus-loss suppression behavior
            if (!TestInputManagerFocusLoss())
            {
                allPassed = false;
            }

            if (allPassed)
            {
                Debug.Log("[FloorDetailOrbitSetupEditor] *** ALL INVARIANTS AND ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY ***");
            }

            return allPassed;
        }

        public static bool TestInputManagerFocusLoss()
        {
            var testGo = new GameObject("TestOrbitInputManager");
            try
            {
                var inputManager = testGo.AddComponent<OrbitCameraInputManager>();
                if (inputManager.IsDragSuppressed)
                {
                    Debug.LogError("[TestInputManagerFocusLoss] Failed: Initial state should not be suppressed!");
                    return false;
                }

                var method = typeof(OrbitCameraInputManager).GetMethod("OnApplicationFocus", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
                if (method == null)
                {
                    Debug.LogError("[TestInputManagerFocusLoss] Failed: OnApplicationFocus method not found!");
                    return false;
                }

                method.Invoke(inputManager, new object[] { false });
                if (!inputManager.IsDragSuppressed)
                {
                    Debug.LogError("[TestInputManagerFocusLoss] Failed: Focus loss did not trigger suppression!");
                    return false;
                }

                var disableMethod = typeof(OrbitCameraInputManager).GetMethod("OnDisable", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
                if (disableMethod == null)
                {
                    Debug.LogError("[TestInputManagerFocusLoss] Failed: OnDisable method not found!");
                    return false;
                }
                disableMethod.Invoke(inputManager, null);
                if (!inputManager.IsDragSuppressed)
                {
                    Debug.LogError("[TestInputManagerFocusLoss] Failed: OnDisable did not trigger suppression!");
                    return false;
                }

                Debug.Log("[FloorDetailOrbitSetupEditor] [PASS] OrbitCameraInputManager focus loss and disable suppression verified.");
                return true;
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(testGo);
            }
        }
    }
}
