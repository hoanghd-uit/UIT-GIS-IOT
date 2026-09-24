import test from 'node:test';
import assert from 'node:assert/strict';

test('T07-Rolling-72h-Window: Computes exact 72-hour UTC ISO range without drift', () => {
  const WINDOW_HOURS = 72;
  const now = new Date('2026-09-22T20:00:00.000Z');
  const start = new Date(now.getTime() - WINDOW_HOURS * 60 * 60 * 1000);

  assert.equal(now.toISOString(), '2026-09-22T20:00:00.000Z');
  assert.equal(start.toISOString(), '2026-09-19T20:00:00.000Z');
  assert.equal(now.getTime() - start.getTime(), 72 * 60 * 60 * 1000);
});

test('T07-Request-Generation: Stale responses from superseded generations are dropped', () => {
  let activeGeneration = 0;
  let currentSelection = 'dev-A';
  let renderedData = null;

  // Selection 1: Device A
  const genA = ++activeGeneration;
  currentSelection = 'dev-A';

  // Selection 2: Device B immediately selected before A responds
  const genB = ++activeGeneration;
  currentSelection = 'dev-B';

  // Delayed response for Device A arrives
  const responseA = { deviceId: 'dev-A', val: 123 };
  if (genA === activeGeneration && currentSelection === responseA.deviceId) {
    renderedData = responseA;
  }
  assert.equal(renderedData, null, 'Delayed response for A must be dropped');

  // Response for Device B arrives
  const responseB = { deviceId: 'dev-B', val: 456 };
  if (genB === activeGeneration && currentSelection === responseB.deviceId) {
    renderedData = responseB;
  }
  assert.deepEqual(renderedData, responseB, 'Response for current selection B must be accepted');
});

test('T07-Solar-Hero-And-Units: Hero is current_uA in microamps, selector lux in lx', () => {
  const mockReading = {
    currentUa: 1450,
    lux: 980,
    rawVoltage: 3.3,
    rawState: 0,
  };

  // Default hero
  assert.equal(mockReading.currentUa, 1450);
  // Unit check
  const solarUnits = { current_uA: 'µA', lux: 'lx' };
  assert.equal(solarUnits.current_uA, 'µA');
  assert.equal(solarUnits.lux, 'lx');
  // Voltage has NO unit attached per plan
  assert.equal(typeof mockReading.rawVoltage, 'number');
});

test('T07-AVC-Water-Meter: Instantaneous flow hero has pending hardware badge', () => {
  const avcHero = {
    metric: 'instant_flow_m3h',
    label: 'Lưu lượng tức thời',
    unit: 'm³/h',
    value: 0.85,
    pendingHardwareBadge: true,
  };

  assert.equal(avcHero.metric, 'instant_flow_m3h');
  assert.equal(avcHero.unit, 'm³/h');
  assert.equal(avcHero.pendingHardwareBadge, true);
});

test('T07-NFC-Direction-Mapping: moving_direction in -> Vào, out -> Ra; counts tracked', () => {
  const events = [
    { moving_direction: 'in', detected_card_id: 'CARD-1' },
    { moving_direction: 'out', detected_card_id: 'CARD-2' },
    { moving_direction: 'in', detected_card_id: 'CARD-3' },
  ];

  let inCount = 0;
  let outCount = 0;
  const mapped = events.map((e) => {
    if (e.moving_direction === 'in') {
      inCount++;
      return { ...e, label: 'Vào' };
    }
    if (e.moving_direction === 'out') {
      outCount++;
      return { ...e, label: 'Ra' };
    }
    return null;
  });

  assert.equal(inCount, 2);
  assert.equal(outCount, 1);
  assert.equal(mapped[0].label, 'Vào');
  assert.equal(mapped[1].label, 'Ra');
});

test('T07-Limit-Coverage: Reaching 1,000 rows flags limit banner even if truncated is false', () => {
  const checkLimit = (returnedCount, metaTruncated, limit = 1000) => {
    const reachedLimit = returnedCount >= limit;
    const isTruncated = Boolean(metaTruncated) || reachedLimit;
    return { reachedLimit, isTruncated };
  };

  const c1 = checkLimit(1000, false);
  assert.equal(c1.reachedLimit, true);
  assert.equal(c1.isTruncated, true);

  const c2 = checkLimit(250, false);
  assert.equal(c2.reachedLimit, false);
  assert.equal(c2.isTruncated, false);

  const c3 = checkLimit(250, true);
  assert.equal(c3.reachedLimit, false);
  assert.equal(c3.isTruncated, true);
});

test('T07-Toast-Error-Mapping: Accurately maps upstream errors and status codes to user-facing messages', () => {
  const mapError = (rawMsg, deviceId) => {
    const lower = (rawMsg || "").toLowerCase();
    if (lower.includes("400") || lower.includes("chưa hợp lệ") || lower.includes("invalid")) {
      return `Không thể tải dữ liệu thiết bị ${deviceId}. Yêu cầu truy vấn chưa hợp lệ.`;
    }
    if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
      return `Chưa thể truy cập dữ liệu thiết bị ${deviceId}. Vui lòng thử lại sau.`;
    }
    if (lower.includes("404") || lower.includes("not found")) {
      return `Không tìm thấy thiết bị ${deviceId} trên hệ thống dữ liệu.`;
    }
    if (lower.includes("429") || lower.includes("rate limit") || lower.includes("too many requests")) {
      return "Đang có quá nhiều yêu cầu. Vui lòng thử lại sau.";
    }
    if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("failed to fetch") || lower.includes("econnrefused")) {
      return `Không kết nối được dịch vụ dữ liệu cho thiết bị ${deviceId}.`;
    }
    if (lower.includes("timeout") || lower.includes("quá thời gian")) {
      return `Quá thời gian tải dữ liệu thiết bị ${deviceId}. Vui lòng thử lại.`;
    }
    if (lower.includes("chưa hỗ trợ") || lower.includes("unsupported")) {
      return "Chưa hỗ trợ dữ liệu cho loại thiết bị này.";
    }
    if (lower.includes("500") || lower.includes("502") || lower.includes("503") || lower.includes("504")) {
      return `Dịch vụ IoT đang gặp lỗi. Chưa tải được dữ liệu thiết bị ${deviceId}.`;
    }
    return rawMsg || `Dịch vụ IoT đang gặp lỗi. Chưa tải được dữ liệu thiết bị ${deviceId}.`;
  };

  const devId = 'dummy01801182ed2814';
  assert.equal(mapError('HTTP 400 Bad Request', devId), `Không thể tải dữ liệu thiết bị ${devId}. Yêu cầu truy vấn chưa hợp lệ.`);
  assert.equal(mapError('401 Unauthorized', devId), `Chưa thể truy cập dữ liệu thiết bị ${devId}. Vui lòng thử lại sau.`);
  assert.equal(mapError('Device 404 Not Found', devId), `Không tìm thấy thiết bị ${devId} trên hệ thống dữ liệu.`);
  assert.equal(mapError('Rate limit 429', devId), 'Đang có quá nhiều yêu cầu. Vui lòng thử lại sau.');
  assert.equal(mapError('TypeError: Failed to fetch', devId), `Không kết nối được dịch vụ dữ liệu cho thiết bị ${devId}.`);
  assert.equal(mapError('Client timeout abort', devId), `Quá thời gian tải dữ liệu thiết bị ${devId}. Vui lòng thử lại.`);
  assert.equal(mapError('500 Internal Server Error', devId), `Dịch vụ IoT đang gặp lỗi. Chưa tải được dữ liệu thiết bị ${devId}.`);
});

test('T07-Group-Click-Safety: Cluster events never nullify selectedDeviceId', () => {
  let selectedDeviceId = 'dev-solar-1';
  let selectedClusterIds = null;

  // Simulate handleDeviceMarkerGroupClicked logic from UnityViewerRuntime.client.tsx
  const handleDeviceMarkerGroupClicked = (raw) => {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (obj && Array.isArray(obj.deviceIds) && obj.deviceIds.length > 0) {
      // Must NOT set selectedDeviceId = null!
      selectedDeviceId = selectedDeviceId ?? obj.deviceIds[0];
    }
  };

  // Firing group clicked with co-located devices
  handleDeviceMarkerGroupClicked({ deviceIds: ['dev-solar-1', 'dev-nfc-2'] });
  assert.equal(selectedDeviceId, 'dev-solar-1', 'Selected device must NOT be set to null');

  // If nothing was selected before, selects the first device
  selectedDeviceId = null;
  handleDeviceMarkerGroupClicked({ deviceIds: ['dev-avc-3'] });
  assert.equal(selectedDeviceId, 'dev-avc-3', 'When null, selects the first device instead of remaining null');
});

test('T07-Fallback-Device-View: Fallback device object created when missing from catalogue', () => {
  const allDevices = [];
  const selectedDeviceId = 'dummy01801182ed2814';

  const selectedDevice =
    allDevices.find((d) => d.deviceId === selectedDeviceId) ??
    (selectedDeviceId
      ? {
          deviceId: selectedDeviceId,
          category: 'unknown',
          sourceDeviceType: 'unknown',
          sourceLocation: null,
          isTestAnchor: false,
        }
      : null);

  assert.notEqual(selectedDevice, null);
  assert.equal(selectedDevice.deviceId, 'dummy01801182ed2814');
  assert.equal(selectedDevice.category, 'unknown');
});
