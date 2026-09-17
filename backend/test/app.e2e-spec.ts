import * as dotenv from 'dotenv';
import * as path from 'path';

// Load local environment configuration
dotenv.config({ path: path.resolve(__dirname, '../../.env.phase04.local') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { CatalogueImporterService } from '../src/fixtures/catalogue-importer.service';
import { getFixtureScenario } from '../src/fixtures/fixture-scenarios';
import { DataSource } from 'typeorm';

describe('GIS-UIT Small Phase 04 - E2E Test Suite (Real PostgreSQL)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let importer: CatalogueImporterService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    importer = moduleFixture.get<CatalogueImporterService>(CatalogueImporterService);

    // Ensure clean state before running tests
    await dataSource.query(`DELETE FROM device_bindings WHERE source_namespace = 'phase04-fixture-v1';`);
  });


  afterAll(async () => {
    await app.close();
  });

  // T04-01: Health Endpoints
  describe('T04-01: Health Endpoints', () => {
    it('/health/live returns ok and process uptime', async () => {
      const res = await request(app.getHttpServer()).get('/health/live').expect(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
    });

    it('/health/ready verifies DB connectivity and migrations applied', async () => {
      const res = await request(app.getHttpServer()).get('/health/ready').expect(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.database).toBe('connected');
      expect(res.body.migrations).toBe('applied');
    });
  });

  // T04-05: Initial Fixture Ingestion
  describe('T04-05: Fixture Ingestion', () => {
    it('imports initial fixture scenario into PostgreSQL', async () => {
      const initialBatch = getFixtureScenario('initial');
      const result = await importer.importBatch(initialBatch);

      expect(result.preservedCount).toBe(5);
      expect(result.importedCount + result.updatedCount).toBe(5);
    });
  });

  // T04-06: Catalogue & Device Reads
  describe('T04-06: Device Catalogue and Detail Read', () => {
    let testDeviceId: string;

    it('reads devices catalogue for Floor E/4', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/buildings/E/floors/4/devices')
        .expect(200);

      expect(res.body.schemaVersion).toBe(1);
      expect(res.body.buildingId).toBe('E');
      expect(res.body.floorId).toBe('4');
      expect(res.body.source.mode).toBe('fixture');
      expect(res.body.source.lastIotFetchAt).toBeNull();
      expect(res.body.devices.length).toBe(5);

      const device = res.body.devices[0];
      testDeviceId = device.id;
      expect(device.placementRevision).toBe(1);
      expect(device.displayOverride).toBeNull();
      expect(device.effectivePosition.source).toBe('original');
      expect(device.lastIotFetchAt).toBeNull();
    });

    it('reads individual device detail by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/devices/${testDeviceId}`)
        .expect(200);

      expect(res.body.id).toBe(testDeviceId);
      expect(res.body.externalId).toBeDefined();
      expect(res.body.lastIotFetchAt).toBeNull();
    });

    it('returns 404 for non-existent device id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/devices/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  // T04-07 & T04-10: Display Position Override Save & Timestamp Separation
  describe('T04-07 & T04-10: Save Override and Timestamp Integrity', () => {
    it('saves a custom display position override and increments revision', async () => {
      // 1. Get current device
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/buildings/E/floors/4/devices')
        .expect(200);

      const device = listRes.body.devices[0];
      const initialRevision = device.placementRevision;

      // 2. PUT display position override with matching expected revision
      const putRes = await request(app.getHttpServer())
        .put(`/api/v1/devices/${device.id}/display-position`)
        .set('X-Expected-Placement-Revision', String(initialRevision))
        .send({
          buildingId: 'E',
          floorId: '4',
          frameId: 'E/4/floor-local',
          frameVersion: 1,
          position: { x: 5.5, y: 1.0, z: -3.2 },
        })
        .expect(200);

      expect(putRes.body.placementRevision).toBe(initialRevision + 1);
      expect(putRes.body.overrideStatus).toBe('active');
      expect(putRes.body.displayOverride).not.toBeNull();
      expect(putRes.body.displayOverride.coordinates).toEqual({ x: 5.5, y: 1.0, z: -3.2 });
      expect(putRes.body.effectivePosition.source).toBe('override');
      expect(putRes.body.effectivePosition.coordinates).toEqual({ x: 5.5, y: 1.0, z: -3.2 });
      // T04-10: Timestamps
      expect(putRes.body.lastIotFetchAt).toBeNull();

      // 3. Verify position persists on a fresh GET
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/devices/${device.id}`)
        .expect(200);

      expect(getRes.body.placementRevision).toBe(initialRevision + 1);
      expect(getRes.body.effectivePosition.source).toBe('override');
      expect(getRes.body.effectivePosition.coordinates).toEqual({ x: 5.5, y: 1.0, z: -3.2 });
    });
  });

  // T04-08: Cancel Preview and Reject Invalid Input
  describe('T04-08: Reject Invalid Inputs', () => {
    it('rejects update with missing or invalid revision header', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/buildings/E/floors/4/devices')
        .expect(200);
      const device = listRes.body.devices[0];

      await request(app.getHttpServer())
        .put(`/api/v1/devices/${device.id}/display-position`)
        .send({
          buildingId: 'E',
          floorId: '4',
          frameId: 'E/4/floor-local',
          frameVersion: 1,
          position: { x: 1.0, y: 1.0, z: 1.0 },
        })
        .expect(400);
    });

    it('rejects update with non-finite coordinates', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/buildings/E/floors/4/devices')
        .expect(200);
      const device = listRes.body.devices[0];

      await request(app.getHttpServer())
        .put(`/api/v1/devices/${device.id}/display-position`)
        .set('X-Expected-Placement-Revision', String(device.placementRevision))
        .send({
          buildingId: 'E',
          floorId: '4',
          frameId: 'E/4/floor-local',
          frameVersion: 1,
          position: { x: 'invalid', y: 1.0, z: 1.0 },
        })
        .expect(400);
    });
  });

  // T04-11: Concurrency Conflict on Stale Revision
  describe('T04-11: Concurrency Conflict Protection', () => {
    it('returns 409 conflict when saving with a stale revision', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/buildings/E/floors/4/devices')
        .expect(200);
      const device = listRes.body.devices[0];

      // Send update with stale revision (e.g. 1 when current is > 1)
      const res = await request(app.getHttpServer())
        .put(`/api/v1/devices/${device.id}/display-position`)
        .set('X-Expected-Placement-Revision', '1')
        .send({
          buildingId: 'E',
          floorId: '4',
          frameId: 'E/4/floor-local',
          frameVersion: 1,
          position: { x: 10.0, y: 0.0, z: 0.0 },
        })
        .expect(409);

      expect(res.body.errorCode).toBe('POSITION_REVISION_CONFLICT');
    });
  });

  // T04-09: Reset Display Position Override
  describe('T04-09: Reset Display Position Override', () => {
    it('resets the override back to original position and increments revision', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/buildings/E/floors/4/devices')
        .expect(200);
      const device = listRes.body.devices[0];
      expect(device.displayOverride).not.toBeNull();

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/devices/${device.id}/display-position`)
        .set('X-Expected-Placement-Revision', String(device.placementRevision))
        .query({ buildingId: 'E', floorId: '4' })
        .expect(200);

      expect(deleteRes.body.placementRevision).toBe(device.placementRevision + 1);
      expect(deleteRes.body.displayOverride).toBeNull();
      expect(deleteRes.body.effectivePosition.source).toBe('original');
      expect(deleteRes.body.overrideStatus).toBe('none');
    });
  });

  // T04-13 & T04-14: Fixture Re-import and Add-Device
  describe('T04-13 & T04-14: Idempotent Re-import & Add Device', () => {
    it('re-importing repeat-identical preserves existing devices without duplicates', async () => {
      const batch = getFixtureScenario('repeat-identical');
      const result = await importer.importBatch(batch);
      expect(result.preservedCount).toBe(5);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/buildings/E/floors/4/devices')
        .expect(200);
      expect(listRes.body.devices.length).toBe(5);
    });

    it('importing add-device scenario adds the new device without wiping existing data', async () => {
      const batch = getFixtureScenario('add-device');
      const result = await importer.importBatch(batch);
      expect(result.preservedCount).toBe(6);
      expect(result.importedCount).toBe(1);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/buildings/E/floors/4/devices')
        .expect(200);
      expect(listRes.body.devices.length).toBe(6);
    });
  });

  // T04-16: Reject Malformed Batch with Duplicate IDs Atomically
  describe('T04-16: Reject Invalid Batch Atomically', () => {
    it('rejects batch with duplicate externalDeviceId without modifying database', async () => {
      const invalidBatch = getFixtureScenario('invalid-or-failed');
      await expect(importer.importBatch(invalidBatch)).rejects.toThrow();

      // Verify catalogue count remains unchanged
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/buildings/E/floors/4/devices')
        .expect(200);
      expect(listRes.body.devices.length).toBe(6);
    });
  });
});
