#if UNITY_EDITOR
using System.Reflection;
using NUnit.Framework;
using UnityEngine;
using UITCampus.Input;

namespace UITCampus.Tests.EditMode
{
    [TestFixture]
    public class OrbitCameraInputManagerTests
    {
        private GameObject _go;
        private OrbitCameraInputManager _inputManager;

        [SetUp]
        public void SetUp()
        {
            _go = new GameObject("TestOrbitInput");
            _inputManager = _go.AddComponent<OrbitCameraInputManager>();
        }

        [TearDown]
        public void TearDown()
        {
            if (_go != null)
            {
                Object.DestroyImmediate(_go);
            }
        }

        [Test]
        public void InitialState_IsNotSuppressed()
        {
            Assert.IsFalse(_inputManager.IsDragSuppressed, "Initial drag state should not be suppressed.");
        }

        [Test]
        public void OnApplicationFocus_Lost_SetsDragSuppression()
        {
            var method = typeof(OrbitCameraInputManager).GetMethod("OnApplicationFocus", BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.IsNotNull(method, "OnApplicationFocus method should exist.");

            method.Invoke(_inputManager, new object[] { false });

            Assert.IsTrue(_inputManager.IsDragSuppressed, "Focus loss must suppress drag until buttons are released.");
        }

        [Test]
        public void OnDisable_SetsDragSuppression()
        {
            var method = typeof(OrbitCameraInputManager).GetMethod("OnDisable", BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.IsNotNull(method, "OnDisable method should exist.");

            method.Invoke(_inputManager, null);

            Assert.IsTrue(_inputManager.IsDragSuppressed, "Disabling component must suppress drag until buttons are released.");
        }
    }
}
#endif

