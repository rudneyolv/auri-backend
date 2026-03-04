import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Genre } from './genre.entity';

@Entity('user_genres')
@Index('idx_user_genres_user', ['user_id'])
@Index('idx_user_genres_genre', ['genre_id'])
@Index('idx_user_one_primary_genre', ['user_id'], {
  unique: true,
  where: 'is_primary = true',
})
export class UserGenre {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn('uuid')
  genre_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Genre, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'genre_id' })
  genre: Genre;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @CreateDateColumn()
  created_at: Date;
}
