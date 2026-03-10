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
import { VIDEO_CONSTRAINTS } from '../constants/video.constants';

@Entity('videos')
@Index('idx_videos_user', ['user_id'])
@Index('idx_videos_created', ['created_at'])
@Index('idx_videos_public', ['is_public'], {
  where: 'is_public = true',
})
@Check(
  'CHK_videos_duration',
  `duration >= ${VIDEO_CONSTRAINTS.MIN_DURATION_SECONDS} AND duration <= ${VIDEO_CONSTRAINTS.MAX_DURATION_SECONDS}`,
)
@Check(
  'CHK_videos_file_size',
  `file_size <= ${VIDEO_CONSTRAINTS.MAX_FILE_SIZE}`,
)
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  storage_key: string;

  @Column({ type: 'text', nullable: true })
  thumbnail_url?: string | null;

  @Column({ type: 'text', nullable: true })
  title?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'bigint' })
  file_size: string;

  @Column({ type: 'text' })
  mime_type: string;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'int', default: 0 })
  order_position: number;

  @Column({ type: 'boolean', default: true })
  is_public: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
