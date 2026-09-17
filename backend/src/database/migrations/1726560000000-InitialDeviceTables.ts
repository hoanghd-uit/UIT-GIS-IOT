import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDeviceTables1726560000000 implements MigrationInterface {
  name = 'InitialDeviceTables1726560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create floors table
    await queryRunner.query(`
      CREATE TABLE "floors" (
        "building_id" varchar(16) NOT NULL,
        "floor_id" varchar(16) NOT NULL,
        "display_name" varchar(64) NOT NULL,
        "is_configured" boolean NOT NULL DEFAULT false,
        "frame_id" varchar(128) NULL,
        "frame_version" int NOT NULL DEFAULT 1,
        "calibration_status" varchar(32) NOT NULL DEFAULT 'Unverified',
        "frame_metadata" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_floors" PRIMARY KEY ("building_id", "floor_id")
      );
    `);

    // 2. Seed canonical floors for Building E
    const buildingEFloors = [
      { id: 'G', name: 'Ground Floor', configured: false },
      { id: '1', name: 'Floor 1', configured: false },
      { id: '2', name: 'Floor 2', configured: false },
      { id: '3', name: 'Floor 3', configured: false },
      { id: '4', name: 'Floor 4', configured: true },
      { id: '5', name: 'Floor 5', configured: false },
      { id: '6', name: 'Floor 6', configured: true },
      { id: '7', name: 'Floor 7', configured: false },
      { id: '8', name: 'Floor 8', configured: false },
      { id: '9', name: 'Floor 9', configured: false },
      { id: '10', name: 'Floor 10', configured: false },
      { id: '11', name: 'Floor 11', configured: false },
      { id: '12', name: 'Floor 12', configured: false },
    ];

    for (const f of buildingEFloors) {
      await queryRunner.query(
        `
        INSERT INTO "floors" ("building_id", "floor_id", "display_name", "is_configured", "frame_id", "frame_version", "calibration_status")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("building_id", "floor_id") DO NOTHING;
      `,
        [
          'E',
          f.id,
          f.name,
          f.configured,
          `E/${f.id}/floor-local`,
          1,
          'Unverified',
        ],
      );
    }

    // 3. Create device_bindings table
    await queryRunner.query(`
      CREATE TABLE "device_bindings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "source_namespace" varchar(64) NOT NULL,
        "external_device_id" varchar(128) NOT NULL,
        "building_id" varchar(16) NOT NULL,
        "floor_id" varchar(16) NOT NULL,
        "name" varchar(128) NOT NULL,
        "kind" varchar(64) NOT NULL,
        "data_origin" varchar(32) NOT NULL DEFAULT 'fixture',
        "operating_status" varchar(32) NOT NULL DEFAULT 'unknown',
        "original_position" jsonb NOT NULL,
        "placement_revision" int NOT NULL DEFAULT 1,
        "source_fetched_at" timestamptz NULL,
        "ingested_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_source_device" UNIQUE ("source_namespace", "external_device_id"),
        CONSTRAINT "FK_device_floor" FOREIGN KEY ("building_id", "floor_id") 
          REFERENCES "floors" ("building_id", "floor_id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_device_building_floor" ON "device_bindings" ("building_id", "floor_id");
    `);

    // 4. Create device_display_overrides table
    await queryRunner.query(`
      CREATE TABLE "device_display_overrides" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "device_id" uuid NOT NULL UNIQUE,
        "building_id" varchar(16) NOT NULL,
        "floor_id" varchar(16) NOT NULL,
        "frame_id" varchar(128) NOT NULL,
        "frame_version" int NOT NULL DEFAULT 1,
        "local_x" double precision NOT NULL,
        "local_y" double precision NOT NULL,
        "local_z" double precision NOT NULL,
        "validity_status" varchar(32) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_override_device" FOREIGN KEY ("device_id") 
          REFERENCES "device_bindings" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_override_building_floor" ON "device_display_overrides" ("building_id", "floor_id");
    `);

    // 5. Create catalogue_sync_state table
    await queryRunner.query(`
      CREATE TABLE "catalogue_sync_state" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "source_namespace" varchar(64) NOT NULL,
        "building_id" varchar(16) NOT NULL,
        "floor_id" varchar(16) NOT NULL,
        "last_attempt_result" varchar(32) NOT NULL DEFAULT 'never',
        "last_attempt_at" timestamptz NULL,
        "last_successful_ingestion_at" timestamptz NULL,
        "last_iot_fetch_at" timestamptz NULL,
        "last_error_code" varchar(64) NULL,
        "last_error_message" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_sync_scope" UNIQUE ("source_namespace", "building_id", "floor_id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "catalogue_sync_state";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "device_display_overrides";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "device_bindings";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "floors";`);
  }
}

