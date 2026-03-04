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
import { Skill } from './skill.entity';

@Entity('user_skills')
@Index('idx_user_skills_user', ['user_id'])
@Index('idx_user_skills_skill', ['skill_id'])
@Check(
  'CHK_user_skills_proficiency_level',
  "proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')",
)
@Check(
  'CHK_user_skills_years_experience',
  'years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 100)',
)
export class UserSkill {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn({ type: 'bigint' })
  skill_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Skill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({ type: 'text' })
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @Column({ type: 'int', nullable: true })
  years_experience?: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
