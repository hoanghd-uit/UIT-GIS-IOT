import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DeviceBindingEntity } from '../database/entities/device-binding.entity';
import { DeviceDisplayOverrideEntity } from '../database/entities/device-display-override.entity';
import { CatalogueSyncStateEntity } from '../database/entities/catalogue-sync-state.entity';
import { FloorEntity } from '../database/entities/floor.entity';
import { DeviceDto, FloorDevicesResponseDto } from './dto/device-response.dto';
import { UpdateDisplayPositionDto } from './dto/update-display-position.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceBindingEntity)
    private readonly deviceRepo: Repository<DeviceBindingEntity>,
    @InjectRepository(DeviceDisplayOverrideEntity)
    private readonly overrideRepo: Repository<DeviceDisplayOverrideEntity>,
    @InjectRepository(CatalogueSyncStateEntity)
    private readonly syncStateRepo: Repository<CatalogueSyncStateEntity>,
    @InjectRepository(FloorEntity)
    private readonly floorRepo: Repository<FloorEntity>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private getSourceMode(): 'disabled' | 'fixture' | 'iot' {
    return this.config.get<'disabled' | 'fixture' | 'iot'>('fixtures.mode', 'disabled');
  }

  private getSourceNamespace(): string {
    return this.config.get<string>('fixtures.namespace', 'phase04-fixture-v1');
  }

  async getFloorDevices(buildingId: string, floorId: string): Promise<FloorDevicesResponseDto> {
    const mode = this.getSourceMode();
    const namespace = this.getSourceNamespace();

    // Verify floor exists
    const floor = await this.floorRepo.findOne({ where: { buildingId, floorId } });
    if (!floor) {
      throw new NotFoundException(`Floor ${buildingId}/${floorId} not found`);
    }

    if (mode === 'disabled') {
      return {
        schemaVersion: 1,
        buildingId,
        floorId,
        source: {
          mode: 'disabled',
          namespace: 'none',
          sourceState: 'not_configured',
          inventoryState: 'unknown',
          lastIotFetchAt: null,
          lastSuccessfulIngestionAt: null,
        },
        devices: [],
      };
    }

    // Get sync state for scope
    const syncState = await this.syncStateRepo.findOne({
      where: { sourceNamespace: namespace, buildingId, floorId },
    });

    // Query devices in current namespace and floor
    const devices = await this.deviceRepo.find({
      where: { sourceNamespace: namespace, buildingId, floorId },
      relations: ['displayOverride'],
      order: { name: 'ASC' },
    });

    const mappedDevices = devices.map((d) => this.mapToDeviceDto(d, floor));

    const inventoryState = mappedDevices.length === 0
      ? (syncState?.lastAttemptResult === 'success' ? 'empty' : 'unknown')
      : 'ready';

    return {
      schemaVersion: 1,
      buildingId,
      floorId,
      source: {
        mode,
        namespace,
        sourceState: mode === 'fixture' ? 'fixture' : 'live',
        inventoryState,
        lastIotFetchAt: syncState?.lastIotFetchAt ? syncState.lastIotFetchAt.toISOString() : null,
        lastSuccessfulIngestionAt: syncState?.lastSuccessfulIngestionAt
          ? syncState.lastSuccessfulIngestionAt.toISOString()
          : null,
      },
      devices: mappedDevices,
    };
  }

  async getDevice(deviceId: string): Promise<DeviceDto> {
    const mode = this.getSourceMode();
    const namespace = this.getSourceNamespace();

    if (mode === 'disabled') {
      throw new NotFoundException(`Device ${deviceId} not found (source disabled)`);
    }

    const device = await this.deviceRepo.findOne({
      where: { id: deviceId, sourceNamespace: namespace },
      relations: ['displayOverride'],
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const floor = await this.floorRepo.findOne({
      where: { buildingId: device.buildingId, floorId: device.floorId },
    });

    return this.mapToDeviceDto(device, floor);
  }

  async updateDisplayPosition(
    deviceId: string,
    dto: UpdateDisplayPositionDto,
    expectedRevision: number,
  ): Promise<DeviceDto> {
    const mode = this.getSourceMode();
    const namespace = this.getSourceNamespace();

    if (mode === 'disabled') {
      throw new BadRequestException('Cannot modify display positions when source mode is disabled');
    }

    if (isNaN(expectedRevision) || expectedRevision < 1) {
      throw new BadRequestException('Valid X-Expected-Placement-Revision header is required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Pessimistic lock device row
      const device = await queryRunner.manager.findOne(DeviceBindingEntity, {
        where: { id: deviceId, sourceNamespace: namespace },
        lock: { mode: 'pessimistic_write' },
      });

      if (!device) {
        throw new NotFoundException(`Device ${deviceId} not found`);
      }

      // Concurrency check: revision must match caller expectation
      if (device.placementRevision !== expectedRevision) {
        throw new ConflictException({
          errorCode: 'POSITION_REVISION_CONFLICT',
          message: `Expected revision ${expectedRevision}, but current revision is ${device.placementRevision}`,
          currentRevision: device.placementRevision,
        });
      }

      // Context check: building, floor, and frame must match
      if (device.buildingId !== dto.buildingId || device.floorId !== dto.floorId) {
        throw new ConflictException({
          errorCode: 'POSITION_CONTEXT_CHANGED',
          message: `Device floor context changed to ${device.buildingId}/${device.floorId}`,
        });
      }

      // Validate coordinates are finite numbers
      if (
        !Number.isFinite(dto.position.x) ||
        !Number.isFinite(dto.position.y) ||
        !Number.isFinite(dto.position.z)
      ) {
        throw new BadRequestException('Coordinates must be finite numbers');
      }

      let override = await queryRunner.manager.findOne(DeviceDisplayOverrideEntity, {
        where: { deviceId: device.id },
      });
      if (!override) {
        override = queryRunner.manager.create(DeviceDisplayOverrideEntity, {
          deviceId: device.id,
          buildingId: dto.buildingId,
          floorId: dto.floorId,
          frameId: dto.frameId,
          frameVersion: dto.frameVersion,
          localX: dto.position.x,
          localY: dto.position.y,
          localZ: dto.position.z,
          validityStatus: 'active',
        });
      } else {
        override.buildingId = dto.buildingId;
        override.floorId = dto.floorId;
        override.frameId = dto.frameId;
        override.frameVersion = dto.frameVersion;
        override.localX = dto.position.x;
        override.localY = dto.position.y;
        override.localZ = dto.position.z;
        override.validityStatus = 'active';
      }

      await queryRunner.manager.save(DeviceDisplayOverrideEntity, override);

      // Increment placement revision atomically
      device.placementRevision += 1;
      await queryRunner.manager.save(DeviceBindingEntity, device);

      await queryRunner.commitTransaction();

      // Return authoritative updated record
      device.displayOverride = override;
      const floor = await this.floorRepo.findOne({
        where: { buildingId: device.buildingId, floorId: device.floorId },
      });
      return this.mapToDeviceDto(device, floor);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async resetDisplayPosition(
    deviceId: string,
    expectedRevision: number,
    context?: { buildingId?: string; floorId?: string },
  ): Promise<DeviceDto> {
    const mode = this.getSourceMode();
    const namespace = this.getSourceNamespace();

    if (mode === 'disabled') {
      throw new BadRequestException('Cannot modify display positions when source mode is disabled');
    }

    if (isNaN(expectedRevision) || expectedRevision < 1) {
      throw new BadRequestException('Valid X-Expected-Placement-Revision header is required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const device = await queryRunner.manager.findOne(DeviceBindingEntity, {
        where: { id: deviceId, sourceNamespace: namespace },
        lock: { mode: 'pessimistic_write' },
      });

      if (!device) {
        throw new NotFoundException(`Device ${deviceId} not found`);
      }

      if (device.placementRevision !== expectedRevision) {
        throw new ConflictException({
          errorCode: 'POSITION_REVISION_CONFLICT',
          message: `Expected revision ${expectedRevision}, but current revision is ${device.placementRevision}`,
          currentRevision: device.placementRevision,
        });
      }

      if (context?.buildingId && context.buildingId !== device.buildingId) {
        throw new ConflictException({
          errorCode: 'POSITION_CONTEXT_CHANGED',
          message: `Device building context mismatch`,
        });
      }

      if (context?.floorId && context.floorId !== device.floorId) {
        throw new ConflictException({
          errorCode: 'POSITION_CONTEXT_CHANGED',
          message: `Device floor context mismatch`,
        });
      }

      await queryRunner.manager.delete(DeviceDisplayOverrideEntity, {
        deviceId: device.id,
      });
      device.displayOverride = null;


      device.placementRevision += 1;
      await queryRunner.manager.save(DeviceBindingEntity, device);

      await queryRunner.commitTransaction();

      const floor = await this.floorRepo.findOne({
        where: { buildingId: device.buildingId, floorId: device.floorId },
      });
      return this.mapToDeviceDto(device, floor);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  public mapToDeviceDto(device: DeviceBindingEntity, floor: FloorEntity | null): DeviceDto {
    const override = device.displayOverride;
    const currentFloorFrameId = floor?.frameId || `E/${device.floorId}/floor-local`;
    const currentFloorFrameVersion = floor?.frameVersion ?? 1;

    let effectivePosition: DeviceDto['effectivePosition'] = null;
    let placementStatus: DeviceDto['placementStatus'] = 'unplaced';
    let overrideStatus: DeviceDto['overrideStatus'] = 'none';

    // 1. If override exists
    if (override) {
      const frameMatches =
        override.buildingId === device.buildingId &&
        override.floorId === device.floorId &&
        override.frameId === currentFloorFrameId &&
        override.frameVersion === currentFloorFrameVersion;

      if (frameMatches && override.validityStatus === 'active') {
        effectivePosition = {
          source: 'override',
          frameId: override.frameId,
          frameVersion: override.frameVersion,
          coordinates: {
            x: override.localX,
            y: override.localY,
            z: override.localZ,
          },
        };
        placementStatus = 'placed';
        overrideStatus = 'active';
      } else {
        // Stale or invalidated override -> needs review
        overrideStatus = 'needs_review';
        placementStatus = 'needs_review';
        // Fallback to original if resolvable
        if (device.originalPosition?.coordinates) {
          effectivePosition = {
            source: 'original',
            frameId: device.originalPosition.frameId,
            frameVersion: device.originalPosition.frameVersion,
            coordinates: device.originalPosition.coordinates,
          };
        }
      }
    } else if (device.originalPosition?.coordinates) {
      // 2. No override, use original mapped position
      effectivePosition = {
        source: 'original',
        frameId: device.originalPosition.frameId,
        frameVersion: device.originalPosition.frameVersion,
        coordinates: device.originalPosition.coordinates,
      };
      placementStatus = 'placed';
      overrideStatus = 'none';
    }

    return {
      id: device.id,
      externalId: device.externalDeviceId,
      name: device.name,
      kind: device.kind,
      buildingId: device.buildingId,
      floorId: device.floorId,
      dataOrigin: device.dataOrigin,
      operatingStatus: device.operatingStatus,
      telemetry: null,
      placementRevision: device.placementRevision,
      originalPosition: device.originalPosition,
      displayOverride: override
        ? {
            frameId: override.frameId,
            frameVersion: override.frameVersion,
            coordinates: {
              x: override.localX,
              y: override.localY,
              z: override.localZ,
            },
            validityStatus: override.validityStatus,
            updatedAt: override.updatedAt ? override.updatedAt.toISOString() : new Date().toISOString(),
          }
        : null,
      effectivePosition,
      placementStatus,
      overrideStatus,
      calibrationStatus: floor?.calibrationStatus || 'Unverified',
      lastIotFetchAt: device.sourceFetchedAt ? device.sourceFetchedAt.toISOString() : null,
    };
  }
}
