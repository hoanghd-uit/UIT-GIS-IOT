import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DeviceBindingEntity } from '../database/entities/device-binding.entity';
import { DeviceDisplayOverrideEntity } from '../database/entities/device-display-override.entity';
import { CatalogueSyncStateEntity } from '../database/entities/catalogue-sync-state.entity';
import { FloorEntity } from '../database/entities/floor.entity';
import {
  NormalizedCatalogueBatch,
} from '../iot/interfaces/catalogue-provider.interface';

@Injectable()
export class CatalogueImporterService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async importBatch(batch: NormalizedCatalogueBatch): Promise<{
    importedCount: number;
    updatedCount: number;
    preservedCount: number;
  }> {
    const env = this.config.get<string>('env', 'local');
    const allowFixtures = this.config.get<boolean>('fixtures.allowFixtures', false);

    if (batch.sourceKind === 'fixture') {
      if (env !== 'local' && env !== 'test') {
        throw new BadRequestException('Fixture ingestion is only allowed in local or test environment');
      }
      if (!allowFixtures) {
        throw new BadRequestException('Fixture ingestion rejected: ALLOW_FIXTURES is false');
      }
    }

    // Validate no duplicates in batch
    const seenIds = new Set<string>();
    for (const record of batch.records) {
      if (seenIds.has(record.externalDeviceId)) {
        throw new BadRequestException(
          `Batch validation failed: duplicate externalDeviceId '${record.externalDeviceId}'`,
        );
      }
      seenIds.add(record.externalDeviceId);

      // Validate coordinates
      const { x, y, z } = record.originalPosition.coordinates;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new BadRequestException(
          `Batch validation failed: invalid coordinates for device '${record.externalDeviceId}'`,
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let importedCount = 0;
    let updatedCount = 0;

    try {
      // Check floor existence for all records
      for (const record of batch.records) {
        const floor = await queryRunner.manager.findOne(FloorEntity, {
          where: { buildingId: record.buildingId, floorId: record.floorId },
        });
        if (!floor) {
          throw new BadRequestException(
            `Floor ${record.buildingId}/${record.floorId} does not exist in canonical catalogue`,
          );
        }
      }

      for (const record of batch.records) {
        let binding = await queryRunner.manager.findOne(DeviceBindingEntity, {
          where: {
            sourceNamespace: batch.sourceNamespace,
            externalDeviceId: record.externalDeviceId,
          },
          relations: ['displayOverride'],
        });

        const isFixture = batch.sourceKind === 'fixture';
        const sourceFetchedAt = isFixture ? null : new Date();

        if (!binding) {
          binding = queryRunner.manager.create(DeviceBindingEntity, {
            sourceNamespace: batch.sourceNamespace,
            externalDeviceId: record.externalDeviceId,
            buildingId: record.buildingId,
            floorId: record.floorId,
            name: record.name,
            kind: record.kind,
            dataOrigin: batch.sourceKind,
            operatingStatus: 'unknown',
            originalPosition: record.originalPosition,
            placementRevision: 1,
            sourceFetchedAt,
            ingestedAt: new Date(),
          });
          await queryRunner.manager.save(DeviceBindingEntity, binding);
          importedCount++;
        } else {
          // Check if floor or position changed
          const floorChanged =
            binding.buildingId !== record.buildingId ||
            binding.floorId !== record.floorId;

          const origPosChanged =
            binding.originalPosition.coordinates.x !== record.originalPosition.coordinates.x ||
            binding.originalPosition.coordinates.y !== record.originalPosition.coordinates.y ||
            binding.originalPosition.coordinates.z !== record.originalPosition.coordinates.z ||
            binding.originalPosition.frameVersion !== record.originalPosition.frameVersion;

          binding.buildingId = record.buildingId;
          binding.floorId = record.floorId;
          binding.name = record.name;
          binding.kind = record.kind;
          binding.originalPosition = record.originalPosition;
          binding.sourceFetchedAt = sourceFetchedAt;
          binding.ingestedAt = new Date();

          if (floorChanged && binding.displayOverride) {
            // Old override retained but flagged as needs_review
            binding.displayOverride.validityStatus = 'needs_review';
            await queryRunner.manager.save(
              DeviceDisplayOverrideEntity,
              binding.displayOverride,
            );
          }

          if (floorChanged || origPosChanged) {
            binding.placementRevision += 1;
          }

          await queryRunner.manager.save(DeviceBindingEntity, binding);
          updatedCount++;
        }
      }

      // Upsert sync state
      let syncState = await queryRunner.manager.findOne(CatalogueSyncStateEntity, {
        where: {
          sourceNamespace: batch.sourceNamespace,
          buildingId: batch.buildingId,
          floorId: batch.floorId,
        },
      });

      if (!syncState) {
        syncState = queryRunner.manager.create(CatalogueSyncStateEntity, {
          sourceNamespace: batch.sourceNamespace,
          buildingId: batch.buildingId,
          floorId: batch.floorId,
          lastAttemptResult: 'success',
          lastAttemptAt: new Date(),
          lastSuccessfulIngestionAt: new Date(),
          lastIotFetchAt: batch.sourceKind === 'fixture' ? null : new Date(),
          lastErrorCode: null,
          lastErrorMessage: null,
        });
      } else {
        syncState.lastAttemptResult = 'success';
        syncState.lastAttemptAt = new Date();
        syncState.lastSuccessfulIngestionAt = new Date();
        if (batch.sourceKind !== 'fixture') {
          syncState.lastIotFetchAt = new Date();
        }
        syncState.lastErrorCode = null;
        syncState.lastErrorMessage = null;
      }
      await queryRunner.manager.save(CatalogueSyncStateEntity, syncState);

      await queryRunner.commitTransaction();

      return {
        importedCount,
        updatedCount,
        preservedCount: batch.records.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Record failure attempt outside the rolled-back transaction
      try {
        const failureRunner = this.dataSource.createQueryRunner();
        await failureRunner.connect();
        let failState = await failureRunner.manager.findOne(CatalogueSyncStateEntity, {
          where: {
            sourceNamespace: batch.sourceNamespace,
            buildingId: batch.buildingId,
            floorId: batch.floorId,
          },
        });
        if (!failState) {
          failState = failureRunner.manager.create(CatalogueSyncStateEntity, {
            sourceNamespace: batch.sourceNamespace,
            buildingId: batch.buildingId,
            floorId: batch.floorId,
            lastAttemptResult: 'failed',
            lastAttemptAt: new Date(),
            lastSuccessfulIngestionAt: null,
            lastIotFetchAt: null,
            lastErrorCode: error instanceof Error ? error.name : 'IMPORT_FAILED',
            lastErrorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        } else {
          failState.lastAttemptResult = 'failed';
          failState.lastAttemptAt = new Date();
          failState.lastErrorCode = error instanceof Error ? error.name : 'IMPORT_FAILED';
          failState.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error';
        }
        await failureRunner.manager.save(CatalogueSyncStateEntity, failState);
        await failureRunner.release();
      } catch (logErr) {
        console.error('Failed to update sync failure status:', logErr);
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

