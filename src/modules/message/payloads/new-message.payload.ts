import type { MessageContentType } from '../entities/message.entity';

export interface NewMessagePayload {
  conversation_id: string;
  message: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content_type: MessageContentType;
    content: string;
    is_read: boolean;
    created_at: Date;
  };
}
