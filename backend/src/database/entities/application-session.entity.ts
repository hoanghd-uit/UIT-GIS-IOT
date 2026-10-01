import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApplicationUserEntity } from './application-user.entity';

@Entity('application_sessions')
@Index('IDX_sessions_expires_at', ['expiresAt'])
@Index('IDX_sessions_token_hash', ['tokenHash'], { unique: true })
export class ApplicationSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index('IDX_sessions_user_id')
  userId: string;

  @Column({ type: 'varchar', length: 64, unique: true, name: 'token_hash' })
  tokenHash: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt: Date | null;

  @ManyToOne(() => ApplicationUserEntity, (user) => user.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: ApplicationUserEntity;
}
