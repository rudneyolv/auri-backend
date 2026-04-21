import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';

export type CollabRequestStatus = 'pending' | 'accepted' | 'declined';

@Entity('collab_requests')
@Index('idx_collab_from', ['from_user_id'])
@Index('idx_collab_to', ['to_user_id'])
@Index('idx_collab_status', ['status'])
@Index('idx_collab_pair', ['user_a_id', 'user_b_id'])
@Index('uq_collab_pair', ['user_a_id', 'user_b_id'], { unique: true })
@Check(
  'CHK_collab_requests_status',
  "status IN ('pending', 'accepted', 'declined')",
)
@Check('CHK_collab_requests_no_self_request', 'from_user_id <> to_user_id')
export class CollabRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  from_user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_user_id' })
  from_user!: User;

  @Column('uuid')
  to_user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_user_id' })
  to_user!: User;

  @Column({ type: 'text', default: 'pending' })
  status!: CollabRequestStatus;

  @Column({ type: 'timestamp', nullable: true })
  declined_at?: Date | null;

  @Column('uuid')
  user_a_id!: string;

  @Column('uuid')
  user_b_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
