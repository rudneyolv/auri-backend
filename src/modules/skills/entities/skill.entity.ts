import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SkillCategory } from './skill-category.entity';
import { UserSkill } from './user-skill.entity';

@Entity('skills')
@Index('idx_skills_category', ['category_id'])
@Index('idx_skills_slug', ['slug'])
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', nullable: true })
  category_id?: string | null;

  @ManyToOne(() => SkillCategory, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: SkillCategory | null;

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

  @OneToMany(() => UserSkill, (userSkill) => userSkill.skill)
  users?: UserSkill[];
}
