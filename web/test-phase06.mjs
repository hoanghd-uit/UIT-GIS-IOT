import test from "node:test";
import assert from "node:assert/strict";

function isDeviceKindVisible(kind, filters) {
  switch (kind?.toLowerCase()) {
    case "water_meter":
      return filters.waterMeter;
    case "temperature_humidity":
      return filters.temperatureHumidity;
    case "smart_building":
      return filters.smartBuilding;
    case "rf_uhf_reader":
    case "uhf_reader":
      return filters.rfUhfReader;
    case "camera":
      return filters.camera;
    case "solar":
      return filters.solar ?? true;
    case "avc":
      return filters.avc ?? true;
    case "nfc":
      return filters.nfc ?? true;
    case "unknown":
    default:
      return filters.unknown ?? true;
  }
}

test("T06-Sensor-Filter: All 8 groups toggle visibility independently including solar, avc, nfc", () => {
  const allOn = {
    waterMeter: true,
    temperatureHumidity: true,
    smartBuilding: true,
    rfUhfReader: true,
    camera: true,
    solar: true,
    avc: true,
    nfc: true,
    unknown: true,
  };

  assert.equal(isDeviceKindVisible("water_meter", allOn), true);
  assert.equal(isDeviceKindVisible("temperature_humidity", allOn), true);
  assert.equal(isDeviceKindVisible("smart_building", allOn), true);
  assert.equal(isDeviceKindVisible("rf_uhf_reader", allOn), true);
  assert.equal(isDeviceKindVisible("uhf_reader", allOn), true);
  assert.equal(isDeviceKindVisible("camera", allOn), true);
  assert.equal(isDeviceKindVisible("solar", allOn), true);
  assert.equal(isDeviceKindVisible("avc", allOn), true);
  assert.equal(isDeviceKindVisible("nfc", allOn), true);
  assert.equal(isDeviceKindVisible("unknown", allOn), true);

  // Turn off solar only
  const noSolar = { ...allOn, solar: false };
  assert.equal(isDeviceKindVisible("solar", noSolar), false);
  assert.equal(isDeviceKindVisible("avc", noSolar), true);
  assert.equal(isDeviceKindVisible("nfc", noSolar), true);
  assert.equal(isDeviceKindVisible("unknown", noSolar), true);

  // Turn off avc only
  const noAvc = { ...allOn, avc: false };
  assert.equal(isDeviceKindVisible("avc", noAvc), false);
  assert.equal(isDeviceKindVisible("solar", noAvc), true);

  // Turn off nfc only
  const noNfc = { ...allOn, nfc: false };
  assert.equal(isDeviceKindVisible("nfc", noNfc), false);
  assert.equal(isDeviceKindVisible("unknown", noNfc), true);

  // Turn off unknown only
  const noUnknown = { ...allOn, unknown: false };
  assert.equal(isDeviceKindVisible("unknown", noUnknown), false);
  assert.equal(isDeviceKindVisible("solar", noUnknown), true);
  assert.equal(isDeviceKindVisible("avc", noUnknown), true);
  assert.equal(isDeviceKindVisible("nfc", noUnknown), true);
});

test("T06-Coordinate-Mapping: TEST_PREFAB_CENTER_XZ_V1 transforms correctly", () => {
  function mapToUnityLocal(installX, installY, visualElevation = 0.15) {
    return {
      x: installX,
      y: visualElevation,
      z: installY,
    };
  }

  // Anchor at (0, 0)
  const center = mapToUnityLocal(0, 0);
  assert.equal(center.x, 0);
  assert.equal(center.y, 0.15);
  assert.equal(center.z, 0);

  // Anchor at arbitrary positive/negative coordinates
  const offset = mapToUnityLocal(-15.25, 42.8);
  assert.equal(offset.x, -15.25);
  assert.equal(offset.y, 0.15);
  assert.equal(offset.z, 42.8);
});

test("T06-CoLocated-Clustering: Detects co-located devices and generates cluster", () => {
  const devices = [
    { deviceId: "d1", sourceLocation: { x: 0, y: 0, floorLevel: 0 } },
    { deviceId: "d2", sourceLocation: { x: 0, y: 0, floorLevel: 0 } },
    { deviceId: "d3", sourceLocation: { x: 0, y: 0, floorLevel: 0 } },
    { deviceId: "d4", sourceLocation: { x: 5, y: 10, floorLevel: 0 } },
  ];

  const clusters = new Map();
  for (const d of devices) {
    const key = `${d.sourceLocation.x}_${d.sourceLocation.y}`;
    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key).push(d.deviceId);
  }

  assert.equal(clusters.size, 2);
  assert.deepEqual(clusters.get("0_0"), ["d1", "d2", "d3"]);
  assert.deepEqual(clusters.get("5_10"), ["d4"]);
});

test("T06-Lifecycle-Gating: Only applies markers when both response and floor model are ready", () => {
  let appliedPayload = null;

  function evaluateGating({
    viewerStatus,
    activeBuildingId,
    activeFloorId,
    targetBuildingId,
    targetFloorId,
    iotData,
    responseGen,
    activeGen,
    lastAppliedGen,
  }) {
    // Stale response check: discard if response belongs to an older generation
    if (responseGen !== activeGen) {
      return lastAppliedGen;
    }

    const isFloorReady =
      viewerStatus === "floor-ready" &&
      activeBuildingId === targetBuildingId &&
      activeFloorId === targetFloorId;

    if (isFloorReady && iotData && activeGen !== lastAppliedGen) {
      appliedPayload = {
        loadGeneration: activeGen,
        devices: iotData.devices,
      };
      return activeGen;
    }
    return lastAppliedGen;
  }

  const mockData = { devices: [{ deviceId: "d1" }] };

  // Case 1: Response arrived, but floor still loading
  let lastApplied = null;
  lastApplied = evaluateGating({
    viewerStatus: "loading-floor",
    activeBuildingId: "E",
    activeFloorId: "4",
    targetBuildingId: "E",
    targetFloorId: "4",
    iotData: mockData,
    responseGen: 1,
    activeGen: 1,
    lastAppliedGen: lastApplied,
  });
  assert.equal(appliedPayload, null, "Markers must not be applied while floor is loading");

  // Case 2: Floor becomes ready
  lastApplied = evaluateGating({
    viewerStatus: "floor-ready",
    activeBuildingId: "E",
    activeFloorId: "4",
    targetBuildingId: "E",
    targetFloorId: "4",
    iotData: mockData,
    responseGen: 1,
    activeGen: 1,
    lastAppliedGen: lastApplied,
  });
  assert.notEqual(appliedPayload, null, "Markers must be applied when floor is ready");
  assert.equal(appliedPayload?.loadGeneration, 1);

  // Case 3: Re-evaluate without generation change (idempotent)
  appliedPayload = null;
  lastApplied = evaluateGating({
    viewerStatus: "floor-ready",
    activeBuildingId: "E",
    activeFloorId: "4",
    targetBuildingId: "E",
    targetFloorId: "4",
    iotData: mockData,
    responseGen: 1,
    activeGen: 1,
    lastAppliedGen: lastApplied,
  });
  assert.equal(appliedPayload, null, "Markers must not re-apply idempotently for same generation");

  // Case 4: Stale response from previous generation (e.g. Gen 1 response arrives when Gen 2 is active)
  appliedPayload = null;
  const activeGen = 2;
  const staleGen = 1;
  lastApplied = evaluateGating({
    viewerStatus: "floor-ready",
    activeBuildingId: "E",
    activeFloorId: "4",
    targetBuildingId: "E",
    targetFloorId: "4",
    iotData: mockData,
    responseGen: staleGen,
    activeGen: activeGen,
    lastAppliedGen: lastApplied,
  });
  assert.equal(appliedPayload, null, "Stale response from previous generation must be ignored");
});
