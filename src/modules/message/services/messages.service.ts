import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { EventsService } from 'src/modules/event/event.service';
import { Message } from '../entities/message.entity';
import { SendMessageDto } from '../dto/send-message.dto';
import { MessagesGateway } from '../message.gateway';
import { ConversationsService } from './conversations.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly conversationsService: ConversationsService,
    private readonly messagesGateway: MessagesGateway,
    private readonly eventsService: EventsService,
  ) {}

  async list({
    currentUserId,
    conversationId,
    limit = 50,
    before,
  }: {
    currentUserId: string;
    conversationId: string;
    limit?: number;
    before?: string;
  }) {
    await this.conversationsService.assertParticipantById({
      currentUserId,
      conversationId,
    });

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversation_id = :conversationId', { conversationId })
      .orderBy('m.created_at', 'DESC')
      .take(limit + 1);

    if (before) {
      const cursorMsg = await this.messageRepo.findOne({
        where: { id: before },
      });

      if (cursorMsg) {
        qb.andWhere('m.created_at < :cursorDate', {
          cursorDate: cursorMsg.created_at,
        });
      }
    }

    const messages = await qb.getMany();
    const hasMore = messages.length > limit;

    return {
      messages: messages.slice(0, limit),
      has_more: hasMore,
    };
  }

  async send({
    currentUserId,
    conversationId,
    dto,
  }: {
    currentUserId: string;
    conversationId: string;
    dto: SendMessageDto;
  }) {
    const conversation = await this.conversationsService.assertParticipantById({
      currentUserId,
      conversationId,
    });

    const message = await this.messageRepo.save(
      this.messageRepo.create({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content_type: dto.content_type,
        content: dto.content,
      }),
    );

    await this.conversationsService.touchLastMessageAt({
      conversationId,
      timestamp: message.created_at,
    });

    const wasArchived =
      conversation.archived_at_user_a != null ||
      conversation.archived_at_user_b != null;

    if (wasArchived) {
      await this.conversationsService.unarchiveForBoth({ conversationId });
    }

    this.messagesGateway.emitToConversation({
      conversationId,
      event: 'message:new',
      payload: {
        conversation_id: conversationId,
        message: {
          id: message.id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          content_type: message.content_type,
          content: message.content,
          is_read: message.is_read,
          created_at: message.created_at,
        },
      },
    });

    const otherUserId =
      conversation.user_a_id === currentUserId
        ? conversation.user_b_id
        : conversation.user_a_id;

    const sender = await this.userRepo.findOneBy({ id: currentUserId });

    this.eventsService.emitMessageNotification({
      userId: otherUserId,
      payload: {
        conversation_id: conversationId,
        sender_id: currentUserId,
        sender_name: sender?.name ?? '',
        preview: message.content.slice(0, 60),
        created_at: message.created_at.toISOString(),
      },
    });

    return message;
  }

  async markAsRead({
    currentUserId,
    conversationId,
  }: {
    currentUserId: string;
    conversationId: string;
  }) {
    await this.conversationsService.assertParticipantById({
      currentUserId,
      conversationId,
    });

    const result = await this.messageRepo.update(
      {
        conversation_id: conversationId,
        sender_id: Not(currentUserId),
        is_read: false,
      },
      { is_read: true },
    );

    this.messagesGateway.emitToConversation({
      conversationId,
      event: 'message:read',
      payload: {
        conversation_id: conversationId,
        read_by: currentUserId,
      },
    });

    return { updated: result.affected ?? 0 };
  }
}
