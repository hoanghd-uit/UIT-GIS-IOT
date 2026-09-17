import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DeviceBindingEntity } from './device-binding.entity';

@Entity('floors')
export class FloorEntity {
  @PrimaryColumn({ type: 'varchar', length: 16, name: 'building_id' })
  buildingId: string;

  @PrimaryColumn({ type: 'varchar', length: 16, name: 'floor_id' })
  floorId: string;

  @Column({ type: 'varchar', length: 64, name: 'display_name' })
  displayName: string;

  @Column({ type: 'boolean', default: false, name: 'is_configured' })
  isConfigured: boolean;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'frame_id' })
  frameId: string | null;

  @Column({ type: 'int', default: 1, name: 'frame_version' })
  frameVersion: number;

  @Column({ type: 'varchar', length: 32, default: 'Unverified', name: 'calibration_status' })
  calibrationStatus: string;

  @Column({ type: 'jsonb', nullable: true, name: 'frame_metadata' })
  frameMetadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => DeviceBindingEntity, (device) => device.floor)
  devices: DeviceBindingEntity[];
}

