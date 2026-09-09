using System;
using System.IO;
using UnityEngine;
using UnityEngine.Rendering.Universal;
using UnityEditor;
using UnityEditor.SceneManagement;
using UITCampus.Core.Bootstrap;
using UITCampus.Input;
using UITCampus.Player;

namespace UITCampus.Editor
{
    /// <summary>
    /// Idempotent Editor setup script that constructs required prefabs (_InitManager, PlayerRig),
    /// generates campus ground and building colliders, and wires up TestScene.unity.
    /// </summary>
    public static class CampusMovementSetupEditor
    {
        private const string PrefabsSystemFolder = "Assets/Prefabs/System";
        private const string PrefabsPlayerFolder = "Assets/Prefabs/Player";
        private const string InitManagerPrefabPath = "Assets/Prefabs/System/_InitManager.prefab";
        private const string PlayerRigPrefabPath = "Assets/Prefabs/Player/PlayerRig.prefab";

        [MenuItem("Tools/UIT Campus/Setup Movement Scene")]
        public static string SetupAll()
        {
            EnsureFolders();
            var initPrefab = CreateOrUpdateInitManagerPrefab();
            var playerPrefab = CreateOrUpdatePlayerRigPrefab();
            WireScene(initPrefab, playerPrefab);
            return "Movement setup completed successfully!";
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
            if (!AssetDatabase.IsValidFolder(PrefabsPlayerFolder))
            {
                AssetDatabase.CreateFolder("Assets/Prefabs", "Player");
            }
            AssetDatabase.Refresh();
        }

        public static GameObject CreateOrUpdateInitManagerPrefab()
        {
            var existing = AssetDatabase.LoadAssetAtPath<GameObject>(InitManagerPrefabPath);
            if (existing != null)
            {
                return existing;
            }

            GameObject root = new GameObject("_InitManager");
            root.AddComponent<AppBootstrap>();

            GameObject inputChild = new GameObject("InputManager");
            inputChild.transform.SetParent(root.transform, false);
            inputChild.AddComponent<PlayerInputManager>();

            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, InitManagerPrefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            AssetDatabase.SaveAssets();
            return prefab;
        }

        public static GameObject CreateOrUpdatePlayerRigPrefab()
        {
            var existing = AssetDatabase.LoadAssetAtPath<GameObject>(PlayerRigPrefabPath);
            if (existing != null)
            {
                return existing;
            }

            GameObject root = new GameObject("PlayerRig");

            var cc = root.AddComponent<CharacterController>();
            cc.height = 1.8f;
            cc.radius = 0.3f;
            cc.center = new Vector3(0f, 0.9f, 0f);
            cc.stepOffset = 0.3f;
            cc.slopeLimit = 45f;
            cc.skinWidth = 0.05f;

            var spawnInit = root.AddComponent<PlayerSpawnInitializer>();
            var inputState = root.AddComponent<PlayerInputState>();
            var motor = root.AddComponent<PlayerMotor>();

            motor.CharacterController = cc;
            motor.InputState = inputState;

            // CameraPivot child
            GameObject pivot = new GameObject("CameraPivot");
            pivot.transform.SetParent(root.transform, false);
            pivot.transform.localPosition = new Vector3(0f, 1.65f, 0f);
            pivot.transform.localRotation = Quaternion.identity;
            pivot.transform.localScale = Vector3.one;

            var look = pivot.AddComponent<PlayerLook>();
            look.PlayerRoot = root.transform;
            look.CameraPivot = pivot.transform;
            look.InputState = inputState;

            // Camera child
            GameObject camObj = new GameObject("Main Camera");
            camObj.transform.SetParent(pivot.transform, false);
            camObj.transform.localPosition = Vector3.zero;
            camObj.transform.localRotation = Quaternion.identity;
            camObj.transform.localScale = Vector3.one;
            camObj.tag = "MainCamera";

            var cam = camObj.AddComponent<Camera>();
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 1000f;
            cam.fieldOfView = 60f;

            var uac = camObj.AddComponent<UniversalAdditionalCameraData>();
            uac.renderPostProcessing = false;

            camObj.AddComponent<AudioListener>();

            // Wire spawn initializer internal references
            spawnInit.CameraPivot = pivot.transform;

            SerializedObject soSpawn = new SerializedObject(spawnInit);
            soSpawn.FindProperty("characterController").objectReferenceValue = cc;
            soSpawn.FindProperty("playerMotor").objectReferenceValue = motor;
            soSpawn.ApplyModifiedPropertiesWithoutUndo();

            GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, PlayerRigPrefabPath);
            UnityEngine.Object.DestroyImmediate(root);
            AssetDatabase.SaveAssets();
            return prefab;
        }

        public static void WireScene(GameObject initPrefab, GameObject playerPrefab)
        {
            var scene = EditorSceneManager.GetActiveScene();

            // 1. CampusCollision proxies
            var campusCollision = GameObject.Find("CampusCollision");
            if (campusCollision != null)
            {
                // GroundProxy
                Transform groundProxy = campusCollision.transform.Find("GroundProxy");
                if (groundProxy == null)
                {
                    GameObject gObj = new GameObject("GroundProxy");
                    gObj.transform.SetParent(campusCollision.transform, false);
                    groundProxy = gObj.transform;
                }
                var gBox = groundProxy.GetComponent<BoxCollider>();
                if (gBox == null) gBox = groundProxy.gameObject.AddComponent<BoxCollider>();
                gBox.center = new Vector3(-16.35f, -0.5f, -7.20f);
                gBox.size = new Vector3(250f, 1.0f, 250f);

                // BuildingBlockers
                Transform buildingBlockers = campusCollision.transform.Find("BuildingBlockers");
                if (buildingBlockers == null)
                {
                    GameObject bObj = new GameObject("BuildingBlockers");
                    bObj.transform.SetParent(campusCollision.transform, false);
                    buildingBlockers = bObj.transform;
                }

                // Remove previous blocker colliders if any to ensure idempotency
                var existingColliders = buildingBlockers.GetComponents<BoxCollider>();
                foreach (var c in existingColliders)
                {
                    UnityEngine.Object.DestroyImmediate(c);
                }

                // Add 15 cluster boxes calculated from building vertices
                var clusters = new (Vector3 center, Vector3 size)[]
                {
                    (new Vector3(-44.9f, 8.9f, -28.8f), new Vector3(10f, 18f, 12f)),
                    (new Vector3(-8.6f, 6.5f, -15.9f), new Vector3(18f, 13f, 9f)),
                    (new Vector3(-30.3f, 8.6f, -34.0f), new Vector3(20f, 18f, 13f)),
                    (new Vector3(-11.5f, 2.2f, -46.4f), new Vector3(17f, 5f, 13f)),
                    (new Vector3(10.0f, 4.6f, -23.4f), new Vector3(20f, 10f, 8f)),
                    (new Vector3(10.0f, 5.0f, -16.2f), new Vector3(20f, 10f, 8f)),
                    (new Vector3(-9.9f, 6.5f, -30.0f), new Vector3(20f, 13f, 20f)),
                    (new Vector3(-30.1f, 2.0f, -46.4f), new Vector3(20f, 5f, 13f)),
                    (new Vector3(-45.0f, 2.2f, -48.2f), new Vector3(10f, 5f, 10f)),
                    (new Vector3(27.0f, 2.0f, -15.6f), new Vector3(14f, 5f, 6f)),
                    (new Vector3(28.2f, 2.0f, -27.9f), new Vector3(17f, 5f, 8f)),
                    (new Vector3(-32.7f, 2.1f, 7.1f), new Vector3(15f, 5f, 15f)),
                    (new Vector3(-31.4f, 2.4f, -9.9f), new Vector3(18f, 5f, 20f)),
                    (new Vector3(-42.2f, 2.1f, -9.9f), new Vector3(6f, 5f, 20f)),
                    (new Vector3(-41.2f, 2.1f, 1.0f), new Vector3(4f, 5f, 3f))
                };

                foreach (var cl in clusters)
                {
                    var bc = buildingBlockers.gameObject.AddComponent<BoxCollider>();
                    bc.center = cl.center;
                    bc.size = cl.size;
                }

                // Keep buildingBlockers inactive by default so coarse bounding boxes don't block open walkways/roads
                buildingBlockers.gameObject.SetActive(false);
            }

            // 2. Instantiate _InitManager in Scene root if not present
            var existingInit = GameObject.Find("_InitManager");
            if (existingInit == null && initPrefab != null)
            {
                var inst = (GameObject)PrefabUtility.InstantiatePrefab(initPrefab);
                inst.transform.position = Vector3.zero;
                inst.transform.rotation = Quaternion.identity;
                inst.transform.localScale = Vector3.one;
            }

            // 3. Instantiate PlayerRig in Scene root if not present
            var existingPlayer = GameObject.Find("PlayerRig");
            GameObject playerInst = existingPlayer;
            if (playerInst == null && playerPrefab != null)
            {
                playerInst = (GameObject)PrefabUtility.InstantiatePrefab(playerPrefab);
            }

            // Wire StartPosition_GateA to PlayerSpawnInitializer on playerInst
            var gateA = GameObject.Find("StartPosition_GateA");
            if (playerInst != null && gateA != null)
            {
                var spawnInit = playerInst.GetComponent<PlayerSpawnInitializer>();
                if (spawnInit != null)
                {
                    spawnInit.StartPosition = gateA.transform;
                    EditorUtility.SetDirty(spawnInit);
                }
            }

            // 4. Disable old standalone Main Camera if outside PlayerRig
            var rootCameras = scene.GetRootGameObjects();
            foreach (var go in rootCameras)
            {
                if (go.name == "Main Camera" && go != playerInst)
                {
                    go.SetActive(false);
                    EditorUtility.SetDirty(go);
                }
            }

            // 5. Disable ScaleReference_Player
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

