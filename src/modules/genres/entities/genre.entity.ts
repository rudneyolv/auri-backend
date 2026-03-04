import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserGenre } from './user-genre.entity';

@Entity('genres')
@Index('idx_genres_slug', ['slug'])
@Index('idx_genres_category', ['category'])
@Check(
  'CHK_genres_category',
  "category IN ('main', 'sub', 'fusion', 'niche') OR category IS NULL",
)
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  category?: 'main' | 'sub' | 'fusion' | 'niche' | null;

  @Column({ type: 'text', array: true, nullable: true })
  search_tags?: string[] | null;

  @Column({ type: 'text', nullable: true })
  icon_url?: string | null;

  @Column({ type: 'text', nullable: true })
  color?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => UserGenre, (userGenre) => userGenre.genre)
  users?: UserGenre[];
}
