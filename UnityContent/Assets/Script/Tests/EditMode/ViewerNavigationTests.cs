#if UNITY_EDITOR
using NUnit.Framework;
using UnityEngine;
using UITCampus.Bridge;
using UITCampus.Navigation;

namespace UITCampus.Tests.EditMode
{
    [TestFixture]
    public class ViewerNavigationTests
    {
        [TestCase("G", true)]
        [TestCase("1", true)]
        [TestCase("7", true)]
        [TestCase("12", true)]
        [TestCase("0", false)]
        [TestCase("07", false)]
        [TestCase("13", false)]
        [TestCase("", false)]
        [TestCase(null, false)]
        [TestCase("random", false)]
        public void WebViewerBridge_FloorIdValidation(string floorId, bool expectedValid)
        {
            Assert.AreEqual(expectedValid, WebViewerBridge.IsValidFloorId(floorId));
        }

        [Test]
        public void ViewerRouteRequest_CampusPayload_ParsesSuccessfully()
        {
            string json = "{\"schemaVersion\":1,\"view\":\"campus\"}";
            var request = JsonUtility.FromJson<ViewerSceneFlowController.ViewerRouteRequest>(json);

            Assert.IsNotNull(request);
            Assert.AreEqual(1, request.schemaVersion);
            Assert.AreEqual("campus", request.view);
        }

        [Test]
        public void ViewerRouteRequest_FloorDetailPayload_ParsesSuccessfully()
        {
            string json = "{\"schemaVersion\":1,\"view\":\"floor-detail\",\"buildingId\":\"E\",\"floorId\":\"7\"}";
            var request = JsonUtility.FromJson<ViewerSceneFlowController.ViewerRouteRequest>(json);

            Assert.IsNotNull(request);
            Assert.AreEqual(1, request.schemaVersion);
            Assert.AreEqual("floor-detail", request.view);
            Assert.AreEqual("E", request.buildingId);
            Assert.AreEqual("7", request.floorId);
            Assert.IsTrue(WebViewerBridge.IsValidFloorId(request.floorId));
        }

        [Test]
        public void ViewerRouteRequest_WithRequestId_ParsesSuccessfully()
        {
            string json = "{\"schemaVersion\":1,\"requestId\":\"viewer-test:1\",\"view\":\"floor-detail\",\"buildingId\":\"E\",\"floorId\":\"4\"}";
            var request = JsonUtility.FromJson<ViewerSceneFlowController.ViewerRouteRequest>(json);

            Assert.IsNotNull(request);
            Assert.AreEqual(1, request.schemaVersion);
            Assert.AreEqual("viewer-test:1", request.requestId);
            Assert.AreEqual("floor-detail", request.view);
            Assert.AreEqual("E", request.buildingId);
            Assert.AreEqual("4", request.floorId);
        }

        [Test]
        public void ViewerRouteRequest_InvalidJson_ThrowsOrProducesNull()
        {
            string json = "not a valid json";
            bool threw = false;
            try
            {
                var request = JsonUtility.FromJson<ViewerSceneFlowController.ViewerRouteRequest>(json);
                if (request != null && request.schemaVersion == 0)
                {
                    // JsonUtility produces empty object on invalid structure
                    threw = true;
                }
            }
            catch
            {
                threw = true;
            }

            Assert.IsTrue(threw, "Malformed json should not produce valid request");
        }
    }
}
#endif

