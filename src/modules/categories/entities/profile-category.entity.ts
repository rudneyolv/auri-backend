import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserProfileCategory } from './user-profile-category.entity';

@Entity('profile_categories')
export class ProfileCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true })
  icon_url?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(
    () => UserProfileCategory,
    (userProfileCategory) => userProfileCategory.category,
  )
  users?: UserProfileCategory[];
}
