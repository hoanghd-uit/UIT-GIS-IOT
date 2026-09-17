import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { FloorEntity } from './floor.entity';
import { DeviceDisplayOverrideEntity } from './device-display-override.entity';

export interface Coordinate3D {
  x: number;
  y: number;
  z: number;
}

export interface OriginalPositionDescriptor {
  space: string;
  frameId: string;
  frameVersion: number;
  coordinates: Coordinate3D;
}

@Entity('device_bindings')
@Unique('UQ_source_device', ['sourceNamespace', 'externalDeviceId'])
@Index('IDX_device_building_floor', ['buildingId', 'floorId'])
export class DeviceBindingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, name: 'source_namespace' })
  sourceNamespace: string;

  @Column({ type: 'varchar', length: 128, name: 'external_device_id' })
  externalDeviceId: string;

  @Column({ type: 'varchar', length: 16, name: 'building_id' })
  buildingId: string;

  @Column({ type: 'varchar', length: 16, name: 'floor_id' })
  floorId: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  kind: string;

  @Column({ type: 'varchar', length: 32, default: 'fixture', name: 'data_origin' })
  dataOrigin: string;

  @Column({ type: 'varchar', length: 32, default: 'unknown', name: 'operating_status' })
  operatingStatus: string;

  @Column({ type: 'jsonb', name: 'original_position' })
  originalPosition: OriginalPositionDescriptor;

  @Column({ type: 'int', default: 1, name: 'placement_revision' })
  placementRevision: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'source_fetched_at' })
  sourceFetchedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'ingested_at' })
  ingestedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => FloorEntity, (floor) => floor.devices, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'building_id', referencedColumnName: 'buildingId' },
    { name: 'floor_id', referencedColumnName: 'floorId' },
  ])
  floor: FloorEntity;

  @OneToOne(() => DeviceDisplayOverrideEntity, (override) => override.device, {
    cascade: true,
  })
  displayOverride: DeviceDisplayOverrideEntity | null;
}

