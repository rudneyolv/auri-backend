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
import { CollabRequest } from 'src/modules/collab/entities/collab-request.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('conversations')
@Index('idx_conversation_users', ['user_a_id', 'user_b_id'])
@Index('uq_conversation_pair', ['user_a_id', 'user_b_id'], { unique: true })
@Index('uq_conversation_collab_request', ['collab_request_id'], {
  unique: true,
})
@Index('idx_conversation_last_message_at', ['last_message_at'])
@Check('CHK_conversations_no_self', 'user_a_id <> user_b_id')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  collab_request_id!: string;

  @ManyToOne(() => CollabRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collab_request_id' })
  collab_request!: CollabRequest;

  @Column('uuid')
  user_a_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_a_id' })
  user_a!: User;

  @Column('uuid')
  user_b_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_b_id' })
  user_b!: User;

  @Column({ type: 'timestamp', nullable: true })
  archived_at_user_a?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  archived_at_user_b?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at?: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
