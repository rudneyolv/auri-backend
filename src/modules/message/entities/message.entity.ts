import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Conversation } from './conversation.entity';

export type MessageContentType = 'text' | 'link';

@Entity('messages')
@Index('idx_messages_conversation_created', ['conversation_id', 'created_at'])
@Index('idx_messages_unread', ['conversation_id', 'is_read', 'sender_id'])
@Check('CHK_messages_content_type', "content_type IN ('text', 'link')")
@Check('CHK_messages_content_not_empty', 'length(content) > 0')
@Check(
  'CHK_messages_text_max_length',
  "content_type <> 'text' OR length(content) <= 2000",
)
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  conversation_id!: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @Column('uuid')
  sender_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ type: 'text', default: 'text' })
  content_type!: MessageContentType;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
