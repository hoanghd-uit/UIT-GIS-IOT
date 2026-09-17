import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DeviceBindingEntity } from './device-binding.entity';

@Entity('device_display_overrides')
@Index('IDX_override_building_floor', ['buildingId', 'floorId'])
export class DeviceDisplayOverrideEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, name: 'device_id' })
  deviceId: string;

  @Column({ type: 'varchar', length: 16, name: 'building_id' })
  buildingId: string;

  @Column({ type: 'varchar', length: 16, name: 'floor_id' })
  floorId: string;

  @Column({ type: 'varchar', length: 128, name: 'frame_id' })
  frameId: string;

  @Column({ type: 'int', default: 1, name: 'frame_version' })
  frameVersion: number;

  @Column({ type: 'double precision', name: 'local_x' })
  localX: number;

  @Column({ type: 'double precision', name: 'local_y' })
  localY: number;

  @Column({ type: 'double precision', name: 'local_z' })
  localZ: number;

  @Column({ type: 'varchar', length: 32, default: 'active', name: 'validity_status' })
  validityStatus: 'active' | 'needs_review';

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => DeviceBindingEntity, (device) => device.displayOverride, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device: DeviceBindingEntity;
}

