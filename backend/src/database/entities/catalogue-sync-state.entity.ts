import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('catalogue_sync_state')
@Unique('UQ_sync_scope', ['sourceNamespace', 'buildingId', 'floorId'])
export class CatalogueSyncStateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, name: 'source_namespace' })
  sourceNamespace: string;

  @Column({ type: 'varchar', length: 16, name: 'building_id' })
  buildingId: string;

  @Column({ type: 'varchar', length: 16, name: 'floor_id' })
  floorId: string;

  @Column({ type: 'varchar', length: 32, default: 'never', name: 'last_attempt_result' })
  lastAttemptResult: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_attempt_at' })
  lastAttemptAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_successful_ingestion_at' })
  lastSuccessfulIngestionAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_iot_fetch_at' })
  lastIotFetchAt: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'last_error_code' })
  lastErrorCode: string | null;

  @Column({ type: 'text', nullable: true, name: 'last_error_message' })
  lastErrorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

