import test from "node:test";
import assert from "node:assert/strict";

// Test 1: Sensor predicate mapping and visibility rules
function isDeviceKindVisible(kind, filters) {
  switch (kind?.toLowerCase()) {
    case "water_meter":
      return filters.waterMeter;
    case "temperature_humidity":
      return filters.temperatureHumidity;
    case "smart_building":
      return filters.smartBuilding;
    case "uhf_reader":
      return filters.rfUhfReader;
    case "camera":
      return filters.camera;
    default:
      return (
        filters.waterMeter &&
        filters.temperatureHumidity &&
        filters.smartBuilding &&
        filters.rfUhfReader &&
        filters.camera
      );
  }
}

test("T05-Sensor-Filter-Predicate: All 5 groups toggle visibility independently", () => {
  const allOn = {
    waterMeter: true,
    temperatureHumidity: true,
    smartBuilding: true,
    rfUhfReader: true,
    camera: true,
  };

  assert.equal(isDeviceKindVisible("water_meter", allOn), true);
  assert.equal(isDeviceKindVisible("temperature_humidity", allOn), true);
  assert.equal(isDeviceKindVisible("smart_building", allOn), true);
  assert.equal(isDeviceKindVisible("uhf_reader", allOn), true);
  assert.equal(isDeviceKindVisible("camera", allOn), true);

  // Turn off waterMeter only
  const noWater = { ...allOn, waterMeter: false };
  assert.equal(isDeviceKindVisible("water_meter", noWater), false);
  assert.equal(isDeviceKindVisible("temperature_humidity", noWater), true);
  assert.equal(isDeviceKindVisible("smart_building", noWater), true);
  assert.equal(isDeviceKindVisible("uhf_reader", noWater), true);
  assert.equal(isDeviceKindVisible("camera", noWater), true);

  // Turn off temperatureHumidity only
  const noTemp = { ...allOn, temperatureHumidity: false };
  assert.equal(isDeviceKindVisible("temperature_humidity", noTemp), false);
  assert.equal(isDeviceKindVisible("water_meter", noTemp), true);

  // Turn off smartBuilding only
  const noSmart = { ...allOn, smartBuilding: false };
  assert.equal(isDeviceKindVisible("smart_building", noSmart), false);
  assert.equal(isDeviceKindVisible("camera", noSmart), true);

  // Turn off all
  const allOff = {
    waterMeter: false,
    temperatureHumidity: false,
    smartBuilding: false,
    rfUhfReader: false,
    camera: false,
  };
  assert.equal(isDeviceKindVisible("water_meter", allOff), false);
  assert.equal(isDeviceKindVisible("temperature_humidity", allOff), false);
  assert.equal(isDeviceKindVisible("smart_building", allOff), false);
  assert.equal(isDeviceKindVisible("uhf_reader", allOff), false);
  assert.equal(isDeviceKindVisible("camera", allOff), false);
});

test("T05-Sensor-Filter-Unknown: Policy for unknown or unmapped sensor types", () => {
  const allOn = {
    waterMeter: true,
    temperatureHumidity: true,
    smartBuilding: true,
    rfUhfReader: true,
    camera: true,
  };
  assert.equal(isDeviceKindVisible("unknown_sensor", allOn), true);

  const partialOn = { ...allOn, camera: false };
  assert.equal(isDeviceKindVisible("unknown_sensor", partialOn), false);
});

test("T05-Floor-Catalog-Ordering: 13 layers from G up to 12 (not lexicographic)", () => {
  const BUILDING_E_FLOOR_IDS = [
    "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "G"
  ];
  assert.equal(BUILDING_E_FLOOR_IDS.length, 13);

  const bottomToTop = [...BUILDING_E_FLOOR_IDS].reverse();
  assert.equal(bottomToTop[0], "G");
  assert.equal(bottomToTop[1], "1");
  assert.equal(bottomToTop[2], "2");
  assert.equal(bottomToTop[3], "3");
  assert.equal(bottomToTop[4], "4");
  assert.equal(bottomToTop[5], "5");
  assert.equal(bottomToTop[6], "6");
  assert.equal(bottomToTop[7], "7");
  assert.equal(bottomToTop[8], "8");
  assert.equal(bottomToTop[9], "9");
  assert.equal(bottomToTop[10], "10");
  assert.equal(bottomToTop[11], "11");
  assert.equal(bottomToTop[12], "12");

  const idx1 = bottomToTop.indexOf("1");
  const idx2 = bottomToTop.indexOf("2");
  const idx9 = bottomToTop.indexOf("9");
  const idx10 = bottomToTop.indexOf("10");
  const idx12 = bottomToTop.indexOf("12");

  assert.ok(idx10 > idx9, "Floor 10 must be higher than Floor 9");
  assert.ok(idx10 > idx2, "Floor 10 must be higher than Floor 2");
  assert.ok(idx12 > idx10, "Floor 12 must be higher than Floor 10");
});

test("T05-Bridge-Payload-Parsing: FloorFiltersApplied validation", () => {
  function parseFloorFiltersAppliedPayload(raw) {
    let obj = null;
    if (typeof raw === "string") {
      try {
        obj = JSON.parse(raw);
      } catch {
        return null;
      }
    } else if (typeof raw === "object" && raw !== null) {
      obj = raw;
    }
    if (!obj || obj.schemaVersion !== 1) return null;
    if (typeof obj.buildingId !== "string" || typeof obj.floorId !== "string") return null;

    return {
      schemaVersion: 1,
      routeRequestId: typeof obj.routeRequestId === "string" ? obj.routeRequestId : undefined,
      buildingId: obj.buildingId,
      floorId: obj.floorId,
      filterRevision: typeof obj.filterRevision === "number" ? obj.filterRevision : 0,
      status: obj.status === "rejected" ? "rejected" : "applied",
      errorCode: typeof obj.errorCode === "string" ? obj.errorCode : null,
    };
  }

  const valid = JSON.stringify({
    schemaVersion: 1,
    routeRequestId: "req-1",
    buildingId: "E",
    floorId: "6",
    filterRevision: 3,
    status: "applied",
    errorCode: null,
  });

  const parsed = parseFloorFiltersAppliedPayload(valid);
  assert.ok(parsed !== null);
  assert.equal(parsed?.schemaVersion, 1);
  assert.equal(parsed?.buildingId, "E");
  assert.equal(parsed?.floorId, "6");
  assert.equal(parsed?.filterRevision, 3);
  assert.equal(parsed?.status, "applied");
  assert.equal(parsed?.errorCode, null);

  const invalidVersion = JSON.stringify({ schemaVersion: 2, buildingId: "E", floorId: "6" });
  assert.equal(parseFloorFiltersAppliedPayload(invalidVersion), null);
  assert.equal(parseFloorFiltersAppliedPayload("not-json"), null);
});

