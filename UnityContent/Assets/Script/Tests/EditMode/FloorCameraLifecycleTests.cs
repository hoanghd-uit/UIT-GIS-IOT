#if UNITY_EDITOR
using NUnit.Framework;
using UnityEngine;
using UITCampus.CameraControl;

namespace UITCampus.Tests.EditMode
{
    [TestFixture]
    public class FloorCameraLifecycleTests
    {
        private GameObject _holder;

        [SetUp]
        public void SetUp()
        {
            _holder = new GameObject("TestHolder");
        }

        [TearDown]
        public void TearDown()
        {
            if (_holder != null)
            {
                Object.DestroyImmediate(_holder);
            }
        }

        [Test]
        public void A1_StaticCampus_CalculatesValidBoundsWhenRenderersPresent()
        {
            var visualRoot = new GameObject("VisualRoot");
            visualRoot.transform.SetParent(_holder.transform);

            var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.transform.SetParent(visualRoot.transform);
            cube.transform.position = new Vector3(10f, 0f, 20f);

            var viewBounds = _holder.AddComponent<CampusViewBounds>();
            viewBounds.CalculateOnAwake = true;
            viewBounds.CampusVisualRoot = visualRoot.transform;

            bool ok = viewBounds.CalculateBounds();
            Assert.IsTrue(ok);
            Assert.IsTrue(viewBounds.HasValidBounds);
            Assert.AreEqual(10f, viewBounds.CachedBounds.center.x, 1e-3f);
            Assert.Greater(viewBounds.BoundingRadius, 0f);
        }

        [Test]
        public void A2_DynamicEmpty_DoesNotThrowAndHasInvalidBounds()
        {
            var viewBounds = _holder.AddComponent<CampusViewBounds>();
            viewBounds.CalculateOnAwake = false;
            viewBounds.CampusVisualRoot = null;

            Assert.IsFalse(viewBounds.HasValidBounds);

            bool ok = viewBounds.CalculateBounds();
            Assert.IsFalse(ok);
            Assert.IsFalse(viewBounds.HasValidBounds);
        }

        [Test]
        public void A3_TryInitializeFromBounds_SucceedsAfterGeometryAdded()
        {
            var visualRoot = new GameObject("DynamicVisualRoot");
            visualRoot.transform.SetParent(_holder.transform);

            var viewBounds = _holder.AddComponent<CampusViewBounds>();
            viewBounds.CalculateOnAwake = false;
            viewBounds.CampusVisualRoot = visualRoot.transform;

            var rigGo = new GameObject("CameraRig");
            rigGo.transform.SetParent(_holder.transform);
            var camGo = new GameObject("MainCamera");
            camGo.transform.SetParent(rigGo.transform);
            var cam = camGo.AddComponent<Camera>();

            var controller = rigGo.AddComponent<CampusOrbitCameraController>();
            controller.InitializeOnStart = false;
            controller.CampusViewBounds = viewBounds;

            Assert.IsFalse(controller.IsInitialized);

            // Bounds empty initially -> init returns false
            bool initEmpty = controller.TryInitializeFromBounds();
            Assert.IsFalse(initEmpty);
            Assert.IsFalse(controller.IsInitialized);

            // Add renderer
            var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.transform.SetParent(visualRoot.transform);
            cube.transform.position = new Vector3(5f, 2f, 5f);

            // Now initialize succeeds
            bool initOk = controller.TryInitializeFromBounds(immediate: true);
            Assert.IsTrue(initOk);
            Assert.IsTrue(controller.IsInitialized);
            Assert.IsTrue(controller.enabled);
        }

        [Test]
        public void A4_WorldSpaceInstance_BoundsMatchRendererWorldPosition()
        {
            var visualRoot = new GameObject("InstanceVisualRoot");
            visualRoot.transform.SetParent(_holder.transform);

            var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.transform.SetParent(visualRoot.transform);
            cube.transform.position = new Vector3(15f, 3f, -8f);

            var viewBounds = _holder.AddComponent<CampusViewBounds>();
            viewBounds.CalculateOnAwake = false;
            viewBounds.CampusVisualRoot = visualRoot.transform;

            bool ok = viewBounds.CalculateBounds();
            Assert.IsTrue(ok);
            Assert.AreEqual(15f, viewBounds.CachedBounds.center.x, 1e-3f);
            Assert.AreEqual(3f, viewBounds.CachedBounds.center.y, 1e-3f);
            Assert.AreEqual(-8f, viewBounds.CachedBounds.center.z, 1e-3f);
        }

        [Test]
        public void A5_InvalidateBounds_ClearsCache()
        {
            var visualRoot = new GameObject("Root");
            visualRoot.transform.SetParent(_holder.transform);
            var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.transform.SetParent(visualRoot.transform);

            var viewBounds = _holder.AddComponent<CampusViewBounds>();
            viewBounds.CampusVisualRoot = visualRoot.transform;
            viewBounds.CalculateBounds();

            Assert.IsTrue(viewBounds.HasValidBounds);

            viewBounds.InvalidateBounds();
            Assert.IsFalse(viewBounds.HasValidBounds);
            Assert.AreEqual(0f, viewBounds.BoundingRadius);
        }
    }
}
#endif

