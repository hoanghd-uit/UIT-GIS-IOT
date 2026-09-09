#if UNITY_EDITOR
using NUnit.Framework;
using UITCampus.Campus.Buildings;

namespace UITCampus.Tests.EditMode
{
    [TestFixture]
    public class FloorNameParserTests
    {
        [TestCase("E_floor_G", true, "E", "G")]
        [TestCase("E_floor_1", true, "E", "1")]
        [TestCase("E_floor_12", true, "E", "12")]
        [TestCase("E_floor_", false, "", "")]
        [TestCase("_floor_1", false, "", "")]
        [TestCase("E_stair_1", false, "", "")]
        [TestCase("Building_E", false, "", "")]
        [TestCase(null, false, "", "")]
        [TestCase("", false, "", "")]
        [TestCase("   ", false, "", "")]
        [TestCase("E_Floor_1", false, "", "")]
        [TestCase("E_floor_1_floor_2", false, "", "")]
        public void TryParse_ExpectedResults(string input, bool expectedSuccess, string expectedBuilding, string expectedFloor)
        {
            bool success = FloorNameParser.TryParse(input, out string buildingId, out string floorId);

            Assert.AreEqual(expectedSuccess, success);
            Assert.AreEqual(expectedBuilding, buildingId);
            Assert.AreEqual(expectedFloor, floorId);
        }
    }
}
#endif

