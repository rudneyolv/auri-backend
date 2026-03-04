import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { ProfileCategory } from './profile-category.entity';

@Entity('user_profile_categories')
@Index('idx_user_profile_categories_user', ['user_id'])
@Index('idx_user_profile_categories_category', ['category_id'])
@Index('idx_user_one_primary_category', ['user_id'], {
  unique: true,
  where: 'is_primary = true',
})
@Check(
  'CHK_user_profile_categories_proficiency_level',
  "proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')",
)
@Check(
  'CHK_user_profile_categories_years_experience',
  'years_experience >= 0 AND years_experience <= 100',
)
export class UserProfileCategory {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn({ type: 'bigint' })
  category_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ProfileCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ProfileCategory;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ type: 'int' })
  years_experience: number;

  @Column({ type: 'text' })
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
