#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.AddressableAssets;
using UnityEditor.AddressableAssets;
using UnityEditor.AddressableAssets.Build;
using UnityEditor.AddressableAssets.Settings;
using UnityEditor.AddressableAssets.Settings.GroupSchemas;
using UITCampus.FloorContent;
using UITCampus.CameraControl;
using UITCampus.Navigation;

namespace UIT.Viewer.Editor
{
    /// <summary>
    /// Automation utility for Phase 03 setup, validation, and content building.
    /// Implements Tasks T1–T7 described in Section 9.3 of phase_03_floor_prefab_loading_plan.md.
    /// Fully wrapped in #if UNITY_EDITOR for safe compilation.
    /// </summary>
    public static class Phase03AutomationEditor
    {
        public const string SourceFloor4Path = "Assets/Prefabs/Floor/Floor_E_04.prefab";
        public const string SourceFloor6Path = "Assets/Prefabs/Floor/Floor_E_06.prefab";

        public const string WrapperFolder = "Assets/Content/Floors/E";
        public const string WrapperFloor4Path = "Assets/Content/Floors/E/Floor_E_04.prefab";
        public const string WrapperFloor6Path = "Assets/Content/Floors/E/Floor_E_06.prefab";

        public const string ConfigFolder = "Assets/Content/Config";
        public const string RegistryAssetPath = "Assets/Content/Config/FloorContentRegistry.asset";
        public const string ResourcesFolder = "Assets/Resources";
        public const string ResourcesRegistryPath = "Assets/Resources/FloorContentRegistry.asset";

        public const string InitManagerPrefabPath = "Assets/Prefabs/System/_InitManager.prefab";
        public const string FloorDetailScenePath = "Assets/Scene/FloorDetail.unity";

        public const string FloorPrefabsGroupName = "FloorPrefabs";
        public const string ContentReleaseVersion = "p03-r001";

        [MenuItem("Tools/UIT Campus/Phase 03 Setup/Apply All and Validate", priority = 10)]
        public static void ApplyAndValidate()
        {
            Debug.Log("[Phase03Automation] >>> Starting Small Phase 03 Automated Setup...");

            EnsureDirectories();
            SetupWrappers();
            var registry = SetupRegistry();
            ConfigureAddressables();
            SetupInitManager(registry);
            SetupFloorDetailScene();
            bool valid = ValidateSetup();

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log(valid
                ? "[Phase03Automation] >>> Small Phase 03 Automated Setup COMPLETED SUCCESSFULLY!"
                : "[Phase03Automation] >>> Setup completed with validation warnings. Check console output.");
        }

        [MenuItem("Tools/UIT Campus/Phase 03 Setup/1. Setup Floor Wrappers", priority = 20)]
        public static void SetupWrappersMenu()
        {
            EnsureDirectories();
            SetupWrappers();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        [MenuItem("Tools/UIT Campus/Phase 03 Setup/2. Setup Registry", priority = 21)]
        public static void SetupRegistryMenu()
        {
            EnsureDirectories();
            SetupRegistry();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        [MenuItem("Tools/UIT Campus/Phase 03 Setup/3. Configure Addressables", priority = 22)]
        public static void ConfigureAddressablesMenu()
        {
            EnsureDirectories();
            ConfigureAddressables();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        [MenuItem("Tools/UIT Campus/Phase 03 Setup/4. Setup InitManager and Scene", priority = 23)]
        public static void SetupInitManagerAndSceneMenu()
        {
            EnsureDirectories();
            var registry = AssetDatabase.LoadAssetAtPath<FloorContentRegistry>(RegistryAssetPath);
            SetupInitManager(registry);
            SetupFloorDetailScene();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        [MenuItem("Tools/UIT Campus/Phase 03 Setup/4b. Wire FloorDetail Scene Only", priority = 23)]
        public static void WireFloorDetailSceneMenu()
        {
            SetupFloorDetailScene();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        [MenuItem("Tools/UIT Campus/Phase 03 Setup/5. Validate Setup", priority = 24)]
        public static void ValidateSetupMenu()
        {
            ValidateSetup();
        }

        [MenuItem("Tools/UIT Campus/Phase 03 Setup/6. Build Addressables Content (WebGL)", priority = 25)]
        public static void BuildAddressablesContentMenu()
        {
            Debug.Log("[Phase03Automation] Building Addressables content for active build target...");
            var settings = AddressableAssetSettingsDefaultObject.Settings;
            if (settings == null)
            {
                Debug.LogError("[Phase03Automation] AddressableAssetSettings not found!");
                return;
            }

            AddressableAssetSettings.BuildPlayerContent(out AddressablesPlayerBuildResult result);
            if (!string.IsNullOrEmpty(result.Error))
            {
                Debug.LogError($"[Phase03Automation] Addressables build failed: {result.Error}");
            }
            else
            {
                Debug.Log($"[Phase03Automation] Addressables build succeeded! Output path: {result.OutputPath}");
                CopyAddressablesOutputMenu();
            }
        }

        [MenuItem("Tools/UIT Campus/Phase 03 Setup/7. Copy Addressables Output to Web", priority = 26)]
        public static void CopyAddressablesOutputMenu()
        {
            string serverDataFolder = Path.Combine(Directory.GetCurrentDirectory(), "ServerData", ContentReleaseVersion, "WebGL");
            if (!Directory.Exists(serverDataFolder))
            {
                string fallbackFolder = Path.Combine(Directory.GetCurrentDirectory(), "ServerData", "WebGL");
                if (Directory.Exists(fallbackFolder))
                {
                    serverDataFolder = fallbackFolder;
                }
            }

            if (!Directory.Exists(serverDataFolder))
            {
                Debug.LogWarning($"[Phase03Automation] ServerData folder not found at '{serverDataFolder}'. Did you build Addressables content first?");
                return;
            }

            string[] webDests = new string[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "..", "web", "public", "unity", "content", ContentReleaseVersion, "WebGL"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "web", "public", "unity", "content", "ContentRelease", "WebGL")
            };

            foreach (var webPublicDest in webDests)
            {
                Directory.CreateDirectory(webPublicDest);
                foreach (var file in Directory.GetFiles(serverDataFolder))
                {
                    string fileName = Path.GetFileName(file);
                    string destFile = Path.Combine(webPublicDest, fileName);
                    File.Copy(file, destFile, true);
                    Debug.Log($"[Phase03Automation] Copied: {fileName} -> {destFile}");
                }
            }
            Debug.Log("[Phase03Automation] Finished copying Addressables output to web directories.");
        }

        private static void EnsureDirectories()
        {
            if (!AssetDatabase.IsValidFolder("Assets/Content"))
                AssetDatabase.CreateFolder("Assets", "Content");
            if (!AssetDatabase.IsValidFolder("Assets/Content/Floors"))
                AssetDatabase.CreateFolder("Assets/Content", "Floors");
            if (!AssetDatabase.IsValidFolder("Assets/Content/Floors/E"))
                AssetDatabase.CreateFolder("Assets/Content/Floors", "E");
            if (!AssetDatabase.IsValidFolder("Assets/Content/Config"))
                AssetDatabase.CreateFolder("Assets/Content", "Config");
            if (!AssetDatabase.IsValidFolder("Assets/Resources"))
                AssetDatabase.CreateFolder("Assets", "Resources");
        }

        private static void SetupWrappers()
        {
            CreateOrUpdateWrapper("4", SourceFloor4Path, WrapperFloor4Path);
            CreateOrUpdateWrapper("6", SourceFloor6Path, WrapperFloor6Path);
        }

        private static void CreateOrUpdateWrapper(string floorId, string sourcePrefabPath, string wrapperPrefabPath)
        {
            var sourcePrefab = AssetDatabase.LoadAssetAtPath<GameObject>(sourcePrefabPath);
            if (sourcePrefab == null)
            {
                Debug.LogError($"[Phase03Automation] Source floor prefab not found at '{sourcePrefabPath}'!");
                return;
            }

            GameObject rootGo = new GameObject($"Floor_E_{floorId}");
            rootGo.transform.position = Vector3.zero;
            rootGo.transform.rotation = Quaternion.identity;
            rootGo.transform.localScale = Vector3.one;

            var metadata = rootGo.AddComponent<FloorContentMetadata>();

            GameObject geometryGo = new GameObject("Geometry");
            geometryGo.transform.SetParent(rootGo.transform, false);
            geometryGo.transform.localPosition = Vector3.zero;
            geometryGo.transform.localRotation = Quaternion.identity;
            geometryGo.transform.localScale = Vector3.one;

            // Instantiate source prefab under Geometry
            GameObject sourceInstance = (GameObject)PrefabUtility.InstantiatePrefab(sourcePrefab, geometryGo.transform);
            sourceInstance.transform.localPosition = Vector3.zero;
            sourceInstance.transform.localRotation = Quaternion.identity;
            sourceInstance.transform.localScale = Vector3.one;

            // Strip redundant cameras, listeners, or InitManagers if present in source
            var redundantCameras = sourceInstance.GetComponentsInChildren<Camera>(true);
            foreach (var cam in redundantCameras)
            {
                Debug.LogWarning($"[Phase03Automation] Removing redundant Camera from source floor prefab on '{cam.name}'");
                UnityEngine.Object.DestroyImmediate(cam);
            }
            var redundantListeners = sourceInstance.GetComponentsInChildren<AudioListener>(true);
            foreach (var lis in redundantListeners)
            {
                UnityEngine.Object.DestroyImmediate(lis);
            }

            var frame = FloorCoordinateFrame.CreateDefault($"E/{floorId}/floor-local");
            metadata.Configure("E", floorId, 1, geometryGo.transform, frame);

            // Save wrapper as prefab
            PrefabUtility.SaveAsPrefabAsset(rootGo, wrapperPrefabPath);
            UnityEngine.Object.DestroyImmediate(rootGo);

            Debug.Log($"[Phase03Automation] Created/updated wrapper prefab at '{wrapperPrefabPath}' with metadata for Floor {floorId}.");
        }

        private static FloorContentRegistry SetupRegistry()
        {
            var registry = AssetDatabase.LoadAssetAtPath<FloorContentRegistry>(RegistryAssetPath);
            if (registry == null)
            {
                registry = ScriptableObject.CreateInstance<FloorContentRegistry>();
                AssetDatabase.CreateAsset(registry, RegistryAssetPath);
            }

            string[] allFloors = new string[] { "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "G" };
            var entries = new List<FloorContentRegistry.Entry>();

            string floor4Guid = AssetDatabase.AssetPathToGUID(WrapperFloor4Path);
            string floor6Guid = AssetDatabase.AssetPathToGUID(WrapperFloor6Path);

            foreach (var fid in allFloors)
            {
                var entry = new FloorContentRegistry.Entry
                {
                    buildingId = "E",
                    floorId = fid,
                    isConfigured = false,
                    prefab = null
                };

                if (fid == "4" && !string.IsNullOrEmpty(floor4Guid))
                {
                    entry.isConfigured = true;
                    entry.prefab = new AssetReferenceGameObject(floor4Guid);
                }
                else if (fid == "6" && !string.IsNullOrEmpty(floor6Guid))
                {
                    entry.isConfigured = true;
                    entry.prefab = new AssetReferenceGameObject(floor6Guid);
                }

                entries.Add(entry);
            }

            registry.SetEntries(entries);
            EditorUtility.SetDirty(registry);

            // Also ensure copy in Resources for robust runtime fallback
            AssetDatabase.CopyAsset(RegistryAssetPath, ResourcesRegistryPath);

            Debug.Log($"[Phase03Automation] Saved FloorContentRegistry with {entries.Count} entries (Floor 4 and 6 configured).");
            return registry;
        }

        private static void ConfigureAddressables()
        {
            var settings = AddressableAssetSettingsDefaultObject.GetSettings(true);
            if (settings == null)
            {
                Debug.LogError("[Phase03Automation] Failed to get or create AddressableAssetSettings!");
                return;
            }

            // Configure Profile: ContentRelease, Remote paths
            var profileSettings = settings.profileSettings;
            string profileId = profileSettings.GetProfileId("Default");
            if (string.IsNullOrEmpty(profileId))
            {
                profileId = profileSettings.AddProfile("Default", profileSettings.GetProfileId("Default"));
            }
            settings.activeProfileId = profileId;

            // Ensure profile variable ContentRelease = p03-r001
            if (!profileSettings.GetVariableNames().Contains("ContentRelease"))
            {
                profileSettings.CreateValue("ContentRelease", ContentReleaseVersion);
            }
            profileSettings.SetValue(profileId, "ContentRelease", ContentReleaseVersion);

            // Remote load path uses dynamic FloorContentAddress helper with explicit release version
            string remoteLoadPathVal = $"{{UIT.Viewer.FloorContentAddress.Origin}}/unity/content/{ContentReleaseVersion}/[BuildTarget]";
            profileSettings.SetValue(profileId, AddressableAssetSettings.kRemoteLoadPath, remoteLoadPathVal);

            // Enable Remote Catalog
            settings.BuildRemoteCatalog = true;

            // Find or create FloorPrefabs group
            var group = settings.FindGroup(FloorPrefabsGroupName);
            if (group == null)
            {
                group = settings.CreateGroup(FloorPrefabsGroupName, false, false, true, null,
                    typeof(BundledAssetGroupSchema), typeof(ContentUpdateGroupSchema));
            }

            var bundledSchema = group.GetSchema<BundledAssetGroupSchema>();
            if (bundledSchema != null)
            {
                bundledSchema.BundleMode = BundledAssetGroupSchema.BundlePackingMode.PackSeparately;
                bundledSchema.Compression = BundledAssetGroupSchema.BundleCompressionMode.LZ4;
                bundledSchema.BuildPath.SetVariableByName(settings, AddressableAssetSettings.kRemoteBuildPath);
                bundledSchema.LoadPath.SetVariableByName(settings, AddressableAssetSettings.kRemoteLoadPath);
                bundledSchema.IncludeInBuild = true;
            }

            // Add entries for Floor 4 and Floor 6 wrappers
            AddOrUpdateAddressableEntry(settings, group, WrapperFloor4Path, "floors/E/4");
            AddOrUpdateAddressableEntry(settings, group, WrapperFloor6Path, "floors/E/6");

            EditorUtility.SetDirty(settings);
            Debug.Log("[Phase03Automation] Addressables settings, profiles, and FloorPrefabs group configured.");
        }

        private static void AddOrUpdateAddressableEntry(AddressableAssetSettings settings, AddressableAssetGroup group, string assetPath, string address)
        {
            string guid = AssetDatabase.AssetPathToGUID(assetPath);
            if (string.IsNullOrEmpty(guid))
            {
                Debug.LogError($"[Phase03Automation] Could not get GUID for asset '{assetPath}'!");
                return;
            }

            var entry = settings.CreateOrMoveEntry(guid, group);
            if (entry != null)
            {
                entry.address = address;
                entry.SetLabel("floor-content", true, true);
                Debug.Log($"[Phase03Automation] Registered Addressable entry: {address} -> {assetPath}");
            }
        }

        private static void SetupInitManager(FloorContentRegistry registry)
        {
            var initManagerPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(InitManagerPrefabPath);
            if (initManagerPrefab == null)
            {
                Debug.LogError($"[Phase03Automation] _InitManager prefab not found at '{InitManagerPrefabPath}'!");
                return;
            }

            GameObject contents = PrefabUtility.LoadPrefabContents(InitManagerPrefabPath);
            try
            {
                var loader = contents.GetComponent<FloorContentLoader>();
                if (loader == null)
                {
                    loader = contents.AddComponent<FloorContentLoader>();
                }

                loader.Registry = registry != null ? registry : AssetDatabase.LoadAssetAtPath<FloorContentRegistry>(RegistryAssetPath);

                PrefabUtility.SaveAsPrefabAsset(contents, InitManagerPrefabPath);
                Debug.Log("[Phase03Automation] Attached FloorContentLoader with registry reference to _InitManager.prefab.");
            }
            finally
            {
                PrefabUtility.UnloadPrefabContents(contents);
            }
        }

        private static void SetupFloorDetailScene()
        {
            var activeScene = EditorSceneManager.GetActiveScene();
            bool needRestore = false;
            string prevScenePath = activeScene.path;

            if (activeScene.path != FloorDetailScenePath)
            {
                needRestore = true;
                EditorSceneManager.OpenScene(FloorDetailScenePath, OpenSceneMode.Single);
            }

            try
            {
                var host = UnityEngine.Object.FindAnyObjectByType<FloorDetailContentHost>();
                if (host == null)
                {
                    var hostGo = new GameObject("FloorDetailContentHost");
                    host = hostGo.AddComponent<FloorDetailContentHost>();
                }

                // Ensure ContentRoot child
                Transform contentRoot = host.transform.Find("ContentRoot");
                if (contentRoot == null)
                {
                    var crGo = new GameObject("ContentRoot");
                    crGo.transform.SetParent(host.transform, false);
                    crGo.transform.localPosition = Vector3.zero;
                    crGo.transform.localRotation = Quaternion.identity;
                    crGo.transform.localScale = Vector3.one;
                    contentRoot = crGo.transform;
                }

                // Connect scene Camera rig references within FloorDetail scene
                CampusViewBounds bounds = null;
                foreach (var cvb in UnityEngine.Object.FindObjectsByType<CampusViewBounds>(FindObjectsSortMode.None))
                {
                    if (cvb.gameObject.scene == host.gameObject.scene)
                    {
                        bounds = cvb;
                        break;
                    }
                }

                CampusOrbitCameraController orbit = null;
                foreach (var occ in UnityEngine.Object.FindObjectsByType<CampusOrbitCameraController>(FindObjectsSortMode.None))
                {
                    if (occ.gameObject.scene == host.gameObject.scene)
                    {
                        orbit = occ;
                        break;
                    }
                }

                // Configure scene-local bounds for dynamic mode (calculateOnAwake = false)
                if (bounds != null)
                {
                    var boundsSo = new SerializedObject(bounds);
                    var calcAwakeProp = boundsSo.FindProperty("calculateOnAwake");
                    if (calcAwakeProp != null) calcAwakeProp.boolValue = false;
                    var visRootProp = boundsSo.FindProperty("campusVisualRoot");
                    if (visRootProp != null) visRootProp.objectReferenceValue = contentRoot;
                    boundsSo.ApplyModifiedProperties();
                    EditorUtility.SetDirty(bounds);
                }

                // Configure scene-local orbit controller for dynamic mode (initializeOnStart = false)
                if (orbit != null)
                {
                    var orbitSo = new SerializedObject(orbit);
                    var initStartProp = orbitSo.FindProperty("initializeOnStart");
                    if (initStartProp != null) initStartProp.boolValue = false;
                    var viewBoundsProp = orbitSo.FindProperty("campusViewBounds");
                    if (viewBoundsProp != null && bounds != null) viewBoundsProp.objectReferenceValue = bounds;
                    orbitSo.ApplyModifiedProperties();
                    EditorUtility.SetDirty(orbit);
                }

                // Serialize host references
                var hostSo = new SerializedObject(host);
                var crProp = hostSo.FindProperty("contentRoot");
                if (crProp != null) crProp.objectReferenceValue = contentRoot;
                var bProp = hostSo.FindProperty("campusViewBounds");
                if (bProp != null && bounds != null) bProp.objectReferenceValue = bounds;
                var oProp = hostSo.FindProperty("orbitCameraController");
                if (oProp != null && orbit != null) oProp.objectReferenceValue = orbit;
                hostSo.ApplyModifiedProperties();
                EditorUtility.SetDirty(host);

                EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());
                EditorSceneManager.SaveScene(EditorSceneManager.GetActiveScene());
                Debug.Log("[Phase03Automation] Configured and saved FloorDetail.unity with serialized host and dynamic camera policy.");
            }
            finally
            {
                if (needRestore && !string.IsNullOrEmpty(prevScenePath))
                {
                    EditorSceneManager.OpenScene(prevScenePath, OpenSceneMode.Single);
                }
            }
        }

        private static bool ValidateSetup()
        {
            bool allPassed = true;

            // 1. Check wrappers exist
            if (!File.Exists(WrapperFloor4Path))
            {
                Debug.LogError($"[Validation] Missing wrapper prefab: {WrapperFloor4Path}");
                allPassed = false;
            }
            if (!File.Exists(WrapperFloor6Path))
            {
                Debug.LogError($"[Validation] Missing wrapper prefab: {WrapperFloor6Path}");
                allPassed = false;
            }

            // 2. Check registry
            var registry = AssetDatabase.LoadAssetAtPath<FloorContentRegistry>(RegistryAssetPath);
            if (registry == null)
            {
                Debug.LogError($"[Validation] Missing FloorContentRegistry asset at {RegistryAssetPath}");
                allPassed = false;
            }
            else
            {
                if (!registry.TryGetEntry("E", "4", out var e4) || !e4.isConfigured || e4.prefab == null || !e4.prefab.RuntimeKeyIsValid())
                {
                    Debug.LogError("[Validation] Floor 4 is not properly configured in FloorContentRegistry.");
                    allPassed = false;
                }
                if (!registry.TryGetEntry("E", "6", out var e6) || !e6.isConfigured || e6.prefab == null || !e6.prefab.RuntimeKeyIsValid())
                {
                    Debug.LogError("[Validation] Floor 6 is not properly configured in FloorContentRegistry.");
                    allPassed = false;
                }
                if (registry.TryGetEntry("E", "7", out var e7) && e7.isConfigured)
                {
                    Debug.LogError("[Validation] Floor 7 should NOT be marked as configured yet.");
                    allPassed = false;
                }
            }

            // 3. Check Addressables
            var settings = AddressableAssetSettingsDefaultObject.GetSettings(false);
            if (settings == null)
            {
                Debug.LogError("[Validation] AddressableAssetSettings is null.");
                allPassed = false;
            }
            else
            {
                var group = settings.FindGroup(FloorPrefabsGroupName);
                if (group == null)
                {
                    Debug.LogError($"[Validation] Addressable group '{FloorPrefabsGroupName}' not found.");
                    allPassed = false;
                }
            }

            // 4. Check FloorDetail.unity scene wiring
            string currScene = EditorSceneManager.GetActiveScene().path;
            bool restoredScene = false;
            if (currScene != FloorDetailScenePath)
            {
                restoredScene = true;
                EditorSceneManager.OpenScene(FloorDetailScenePath, OpenSceneMode.Single);
            }

            try
            {
                var host = UnityEngine.Object.FindAnyObjectByType<FloorDetailContentHost>();
                if (host == null)
                {
                    Debug.LogError("[Validation] FloorDetailContentHost not found in FloorDetail.unity.");
                    allPassed = false;
                }
                else
                {
                    var hostSo = new SerializedObject(host);
                    var cr = hostSo.FindProperty("contentRoot").objectReferenceValue as Transform;
                    var vb = hostSo.FindProperty("campusViewBounds").objectReferenceValue as CampusViewBounds;
                    var oc = hostSo.FindProperty("orbitCameraController").objectReferenceValue as CampusOrbitCameraController;

                    if (cr == null || cr.parent != host.transform)
                    {
                        Debug.LogError("[Validation] FloorDetailContentHost.contentRoot is not properly serialized or not a child of host.");
                        allPassed = false;
                    }

                    if (vb == null || vb.CalculateOnAwake)
                    {
                        Debug.LogError("[Validation] CampusViewBounds in FloorDetail must have calculateOnAwake = false.");
                        allPassed = false;
                    }

                    if (oc == null || oc.InitializeOnStart)
                    {
                        Debug.LogError("[Validation] CampusOrbitCameraController in FloorDetail must have initializeOnStart = false.");
                        allPassed = false;
                    }

                    if (oc != null && oc.CampusViewBounds != vb)
                    {
                        Debug.LogError("[Validation] CampusOrbitCameraController.campusViewBounds must point to FloorDetail's CampusViewBounds.");
                        allPassed = false;
                    }
                }
            }
            finally
            {
                if (restoredScene && !string.IsNullOrEmpty(currScene))
                {
                    EditorSceneManager.OpenScene(currScene, OpenSceneMode.Single);
                }
            }

            Debug.Log($"[Phase03Automation] Validation result: {(allPassed ? "PASSED" : "FAILED")}");
            return allPassed;
        }
    }
}
#endif
