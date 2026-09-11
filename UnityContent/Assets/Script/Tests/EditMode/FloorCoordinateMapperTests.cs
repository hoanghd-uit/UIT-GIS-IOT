#if UNITY_EDITOR
using NUnit.Framework;
using UnityEngine;
using UITCampus.FloorContent;

namespace UITCampus.Tests.EditMode
{
    [TestFixture]
    public class FloorCoordinateMapperTests
    {
        [Test]
        public void DefaultFrame_IdentityMapping()
        {
            var frame = FloorCoordinateFrame.CreateDefault("E/4/test");
            Assert.IsTrue(FloorCoordinateMapper.IsFrameValid(frame));

            Vector3 source = new Vector3(5f, 1.2f, 8f);
            Vector3 local = FloorCoordinateMapper.SourceToFloorLocal(source, frame);

            Assert.AreEqual(5f, local.x, 1e-5f);
            Assert.AreEqual(1.2f, local.y, 1e-5f);
            Assert.AreEqual(8f, local.z, 1e-5f);
        }

        [Test]
        public void PlanMathematicalExample_CentimetersToMetersWithSwappedYZ()
        {
            // From Section 5.3 of plan:
            // Source in cm: X=East (model X), Y=North (model Z), Z=Up (model Y).
            // basisX = (0.01, 0, 0)
            // basisY = (0, 0, 0.01)
            // basisZ = (0, 0.01, 0)
            // (200, 300, 150) source -> (2.0, 1.5, 3.0) local meters
            var frame = new FloorCoordinateFrame
            {
                frameId = "E/4/test-cm",
                frameVersion = 1,
                sourceUnits = "cm",
                sourceAxesDescription = "X=East, Y=North, Z=Up",
                sourceOrigin = Vector3.zero,
                originInFloorLocal = Vector3.zero,
                basisX = new Vector3(0.01f, 0f, 0f),
                basisY = new Vector3(0f, 0f, 0.01f),
                basisZ = new Vector3(0f, 0.01f, 0f),
                calibrationStatus = FloorCalibrationStatus.Unverified,
                calibrationNote = "Mathematical test frame"
            };

            Assert.IsTrue(FloorCoordinateMapper.IsFrameValid(frame));

            Vector3 sourcePos = new Vector3(200f, 300f, 150f);
            Vector3 localPos = FloorCoordinateMapper.SourceToFloorLocal(sourcePos, frame);

            Assert.AreEqual(2.0f, localPos.x, 1e-4f);
            Assert.AreEqual(1.5f, localPos.y, 1e-4f);
            Assert.AreEqual(3.0f, localPos.z, 1e-4f);
        }

        [Test]
        public void OriginOffsets_AreAppliedCorrectly()
        {
            var frame = new FloorCoordinateFrame
            {
                frameId = "E/4/test-offset",
                frameVersion = 1,
                sourceOrigin = new Vector3(100f, 0f, 200f),
                originInFloorLocal = new Vector3(5f, 0f, 10f),
                basisX = Vector3.right,
                basisY = Vector3.up,
                basisZ = Vector3.forward
            };

            Assert.IsTrue(FloorCoordinateMapper.IsFrameValid(frame));

            // Point exactly at sourceOrigin should map to originInFloorLocal
            Vector3 resultAtOrigin = FloorCoordinateMapper.SourceToFloorLocal(new Vector3(100f, 0f, 200f), frame);
            Assert.AreEqual(5f, resultAtOrigin.x, 1e-5f);
            Assert.AreEqual(0f, resultAtOrigin.y, 1e-5f);
            Assert.AreEqual(10f, resultAtOrigin.z, 1e-5f);

            // Point +2 units on X
            Vector3 resultOffset = FloorCoordinateMapper.SourceToFloorLocal(new Vector3(102f, 0f, 200f), frame);
            Assert.AreEqual(7f, resultOffset.x, 1e-5f);
        }

        [Test]
        public void DegenerateBasis_IsDetectedAsInvalid()
        {
            var frame = new FloorCoordinateFrame
            {
                basisX = Vector3.right,
                basisY = Vector3.right, // Collinear -> det = 0
                basisZ = Vector3.forward
            };

            Assert.IsFalse(FloorCoordinateMapper.IsFrameValid(frame));
        }

        [Test]
        public void InfiniteOrNaN_IsDetectedAsInvalid()
        {
            var frame = FloorCoordinateFrame.CreateDefault("test");
            frame.basisX = new Vector3(float.NaN, 0, 0);
            Assert.IsFalse(FloorCoordinateMapper.IsFrameValid(frame));

            frame = FloorCoordinateFrame.CreateDefault("test");
            frame.sourceOrigin = new Vector3(0, float.PositiveInfinity, 0);
            Assert.IsFalse(FloorCoordinateMapper.IsFrameValid(frame));
        }

        [Test]
        public void WorldTransform_TransformsLocalPoint()
        {
            var frame = FloorCoordinateFrame.CreateDefault("test");
            var go = new GameObject("FloorTest");
            try
            {
                go.transform.position = new Vector3(10f, 20f, 30f);
                go.transform.rotation = Quaternion.Euler(0f, 90f, 0f);

                Vector3 source = new Vector3(1f, 0f, 0f);
                Vector3 world = FloorCoordinateMapper.SourceToWorld(source, frame, go.transform);

                // 1 unit in X rotated 90 deg around Y becomes -Z in world
                Assert.AreEqual(10f, world.x, 1e-4f);
                Assert.AreEqual(20f, world.y, 1e-4f);
                Assert.AreEqual(29f, world.z, 1e-4f);
            }
            finally
            {
                Object.DestroyImmediate(go);
            }
        }
    }
}
#endif

