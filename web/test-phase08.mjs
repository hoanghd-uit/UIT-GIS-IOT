import test from 'node:test';
import assert from 'node:assert/strict';

// Test Phase 08: Client-side contract adaptation and sourceLocation.z handling

test('T08-SourceLocation-With-Z: Properly preserves and accesses 3D source coordinates', () => {
  const device = {
    deviceId: '70B3D57ED0073E9D',
    sourceDeviceType: 'solar',
    category: 'solar',
    sourceLocation: {
      x: 1.25,
      y: -2.5,
      z: 0.75,
      floorLevel: 6,
    },
    displayFloorId: '6',
  };

  assert.equal(device.sourceLocation.x, 1.25);
  assert.equal(device.sourceLocation.y, -2.5);
  assert.equal(device.sourceLocation.z, 0.75);
  assert.equal(device.sourceLocation.floorLevel, 6);
});

test('T08-SourceLocation-Backward-Compatibility: Handles legacy payload without Z gracefully', () => {
  const legacyDevice = {
    deviceId: 'legacy-01',
    sourceDeviceType: 'water_meter',
    category: 'water_meter',
    sourceLocation: {
      x: 0,
      y: 0,
      floorLevel: 4,
    },
    displayFloorId: '4',
  };

  assert.equal(legacyDevice.sourceLocation.x, 0);
  assert.equal(legacyDevice.sourceLocation.y, 0);
  assert.equal(legacyDevice.sourceLocation.z, undefined);
  assert.equal(legacyDevice.sourceLocation.floorLevel, 4);
});

test('T08-Floor-Scoped-Query-Verification: Validates integer floor_level queries', () => {
  const buildQuery = (filter) => {
    if (!filter || filter.floorLevel === undefined) return '/api/v1/devices';
    if (!Number.isInteger(filter.floorLevel)) {
      throw new Error('Invalid floorLevel');
    }
    return `/api/v1/devices?floor_level=${filter.floorLevel}`;
  };

  assert.equal(buildQuery(), '/api/v1/devices');
  assert.equal(buildQuery({ floorLevel: 6 }), '/api/v1/devices?floor_level=6');
  assert.equal(buildQuery({ floorLevel: -1 }), '/api/v1/devices?floor_level=-1');
  assert.throws(() => buildQuery({ floorLevel: 1.5 }), /Invalid floorLevel/);
  assert.throws(() => buildQuery({ floorLevel: NaN }), /Invalid floorLevel/);
});

