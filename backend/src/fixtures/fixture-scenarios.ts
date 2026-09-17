import { NormalizedCatalogueBatch } from '../iot/interfaces/catalogue-provider.interface';

const BASE_PILOT_RECORDS = [
  {
    externalDeviceId: 'FIXTURE-E4-TH01',
    name: 'Temp & Humidity Sensor 401',
    kind: 'temperature_humidity',
    buildingId: 'E',
    floorId: '4',
    originalPosition: {
      space: 'floor-local-fixture',
      frameId: 'E/4/floor-local',
      frameVersion: 1,
      coordinates: { x: 2.5, y: 1.2, z: -3.0 },
    },
  },
  {
    externalDeviceId: 'FIXTURE-E4-SB01',
    name: 'Smart Building Controller 401',
    kind: 'smart_building',
    buildingId: 'E',
    floorId: '4',
    originalPosition: {
      space: 'floor-local-fixture',
      frameId: 'E/4/floor-local',
      frameVersion: 1,
      coordinates: { x: -4.0, y: 1.2, z: 2.0 },
    },
  },
  {
    externalDeviceId: 'FIXTURE-E4-WM01',
    name: 'Main Water Meter Floor 4',
    kind: 'water_meter',
    buildingId: 'E',
    floorId: '4',
    originalPosition: {
      space: 'floor-local-fixture',
      frameId: 'E/4/floor-local',
      frameVersion: 1,
      coordinates: { x: 0.0, y: 0.5, z: -5.5 },
    },
  },
  {
    externalDeviceId: 'FIXTURE-E4-UHF01',
    name: 'UHF RFID Gateway 401',
    kind: 'uhf_reader',
    buildingId: 'E',
    floorId: '4',
    originalPosition: {
      space: 'floor-local-fixture',
      frameId: 'E/4/floor-local',
      frameVersion: 1,
      coordinates: { x: 6.0, y: 2.2, z: 0.0 },
    },
  },
  {
    externalDeviceId: 'FIXTURE-E4-CAM01',
    name: 'Hallway Surveillance Camera 401',
    kind: 'camera',
    buildingId: 'E',
    floorId: '4',
    originalPosition: {
      space: 'floor-local-fixture',
      frameId: 'E/4/floor-local',
      frameVersion: 1,
      coordinates: { x: -1.5, y: 2.8, z: 4.5 },
    },
  },
];

export function getFixtureScenario(scenarioName: string, namespace = 'phase04-fixture-v1'): NormalizedCatalogueBatch {
  switch (scenarioName) {
    case 'initial':
    case 'repeat-identical':
      return {
        sourceKind: 'fixture',
        sourceNamespace: namespace,
        buildingId: 'E',
        floorId: '4',
        completeness: 'full',
        records: JSON.parse(JSON.stringify(BASE_PILOT_RECORDS)),
      };

    case 'add-device':
      return {
        sourceKind: 'fixture',
        sourceNamespace: namespace,
        buildingId: 'E',
        floorId: '4',
        completeness: 'full',
        records: [
          ...JSON.parse(JSON.stringify(BASE_PILOT_RECORDS)),
          {
            externalDeviceId: 'FIXTURE-E4-TH02',
            name: 'Temp & Humidity Sensor 402',
            kind: 'temperature_humidity',
            buildingId: 'E',
            floorId: '4',
            originalPosition: {
              space: 'floor-local-fixture',
              frameId: 'E/4/floor-local',
              frameVersion: 1,
              coordinates: { x: -3.5, y: 1.2, z: -2.0 },
            },
          },
        ],
      };

    case 'move-source-position':
      const movedSource = JSON.parse(JSON.stringify(BASE_PILOT_RECORDS));
      movedSource[0].originalPosition.coordinates = { x: 3.5, y: 1.2, z: -3.0 };
      return {
        sourceKind: 'fixture',
        sourceNamespace: namespace,
        buildingId: 'E',
        floorId: '4',
        completeness: 'full',
        records: movedSource,
      };

    case 'move-floor':
      const movedFloor = JSON.parse(JSON.stringify(BASE_PILOT_RECORDS));
      movedFloor[0].floorId = '6';
      movedFloor[0].originalPosition.frameId = 'E/6/floor-local';
      return {
        sourceKind: 'fixture',
        sourceNamespace: namespace,
        buildingId: 'E',
        floorId: '4',
        completeness: 'full',
        records: movedFloor,
      };

    case 'change-frame-version':
      const frameChanged = JSON.parse(JSON.stringify(BASE_PILOT_RECORDS));
      frameChanged.forEach((r: any) => {
        r.originalPosition.frameVersion = 2;
      });
      return {
        sourceKind: 'fixture',
        sourceNamespace: namespace,
        buildingId: 'E',
        floorId: '4',
        completeness: 'full',
        records: frameChanged,
      };

    case 'partial-or-empty':
      return {
        sourceKind: 'fixture',
        sourceNamespace: namespace,
        buildingId: 'E',
        floorId: '4',
        completeness: 'empty',
        records: [],
      };

    case 'invalid-or-failed':
      return {
        sourceKind: 'fixture',
        sourceNamespace: namespace,
        buildingId: 'E',
        floorId: '4',
        completeness: 'full',
        records: [
          ...JSON.parse(JSON.stringify(BASE_PILOT_RECORDS)),
          // Duplicate external device id:
          { ...BASE_PILOT_RECORDS[0], name: 'Duplicate TH01' },
        ],
      };

    default:
      throw new Error(`Unknown fixture scenario: ${scenarioName}`);
  }
}

