import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('profiles')
@Check('CHK_profiles_bio_length', 'char_length(bio) <= 500')
@Check(
  'CHK_profiles_collab_price_min',
  'collab_price_min IS NULL OR collab_price_min >= 0',
)
@Check(
  'CHK_profiles_collab_price_max',
  'collab_price_max IS NULL OR (collab_price_min IS NOT NULL AND collab_price_max >= collab_price_min)',
)
export class Profile {
  @PrimaryColumn('uuid')
  user_id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @Column({ type: 'text', nullable: true })
  profile_picture_url?: string | null;

  @Column({ type: 'boolean', default: false })
  accept_messages_from_non_matches: boolean;

  @Column({ type: 'int', nullable: true, default: null })
  collab_price_min?: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  collab_price_max?: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
