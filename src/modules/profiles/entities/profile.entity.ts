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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
