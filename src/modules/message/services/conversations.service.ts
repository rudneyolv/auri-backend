import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizePair } from 'src/shared/utils/normalize-pair';
import { User } from 'src/modules/user/entities/user.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';

interface UnreadCountRow {
  conversation_id: string;
  count: string;
}

interface OtherUserRow {
  user_id: string;
  name: string;
  profile_picture_url: string | null;
}

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createForCollab({
    collabRequestId,
    userAId,
    userBId,
  }: {
    collabRequestId: string;
    userAId: string;
    userBId: string;
  }): Promise<Conversation> {
    const pair = normalizePair({ userIdA: userAId, userIdB: userBId });

    const conversation = await this.conversationRepo.save(
      this.conversationRepo.create({
        collab_request_id: collabRequestId,
        user_a_id: pair.user_a_id,
        user_b_id: pair.user_b_id,
      }),
    );

    return conversation;
  }

  async findById({ conversationId }: { conversationId: string }) {
    return this.conversationRepo.findOneBy({ id: conversationId });
  }

  assertParticipant({
    currentUserId,
    conversation,
  }: {
    currentUserId: string;
    conversation: Conversation;
  }) {
    if (
      conversation.user_a_id !== currentUserId &&
      conversation.user_b_id !== currentUserId
    ) {
      throw new ForbiddenException(
        'Voce nao tem permissao para acessar esta conversa.',
      );
    }
  }

  async listForUser({ currentUserId }: { currentUserId: string }) {
    const conversations = await this.conversationRepo
      .createQueryBuilder('c')
      .where(
        '(c.user_a_id = :uid AND c.archived_at_user_a IS NULL) OR (c.user_b_id = :uid AND c.archived_at_user_b IS NULL)',
        { uid: currentUserId },
      )
      .orderBy('c.last_message_at', 'DESC', 'NULLS LAST')
      .getMany();

    if (conversations.length === 0) {
      return { conversations: [] };
    }

    const conversationIds = conversations.map((c) => c.id);
    const otherUserIds = conversations.map((c) =>
      c.user_a_id === currentUserId ? c.user_b_id : c.user_a_id,
    );

    const [otherUsers, lastMessages, unreadCounts] = await Promise.all([
      this.userRepo
        .createQueryBuilder('u')
        .select('u.id', 'user_id')
        .addSelect('u.name', 'name')
        .addSelect('p.profile_picture_url', 'profile_picture_url')
        .leftJoin('profiles', 'p', 'p.user_id = u.id')
        .where('u.id IN (:...ids)', { ids: otherUserIds })
        .getRawMany<OtherUserRow>(),

      this.messageRepo
        .createQueryBuilder('m')
        .where('m.conversation_id IN (:...ids)', { ids: conversationIds })
        .andWhere(
          `m.created_at = (
            SELECT MAX(m2.created_at) FROM messages m2
            WHERE m2.conversation_id = m.conversation_id
          )`,
        )
        .getMany(),

      this.messageRepo
        .createQueryBuilder('m')
        .select('m.conversation_id', 'conversation_id')
        .addSelect('COUNT(*)', 'count')
        .where('m.conversation_id IN (:...ids)', { ids: conversationIds })
        .andWhere('m.is_read = false')
        .andWhere('m.sender_id != :uid', { uid: currentUserId })
        .groupBy('m.conversation_id')
        .getRawMany<UnreadCountRow>(),
    ]);

    const userMap = new Map(otherUsers.map((u) => [u.user_id, u]));
    const lastMsgMap = new Map(lastMessages.map((m) => [m.conversation_id, m]));
    const unreadMap = new Map(
      unreadCounts.map((r) => [r.conversation_id, Number(r.count)]),
    );

    return {
      conversations: conversations.map((c) => {
        const otherUserId =
          c.user_a_id === currentUserId ? c.user_b_id : c.user_a_id;
        const otherUser = userMap.get(otherUserId);
        const lastMsg = lastMsgMap.get(c.id);

        return {
          conversation_id: c.id,
          other_user: {
            user_id: otherUserId,
            name: otherUser?.name ?? null,
            profile_picture_url: otherUser?.profile_picture_url ?? null,
          },
          last_message: lastMsg
            ? {
                content: lastMsg.content.slice(0, 60),
                sender_id: lastMsg.sender_id,
                created_at: lastMsg.created_at,
              }
            : null,
          unread_count: unreadMap.get(c.id) ?? 0,
          last_message_at: c.last_message_at ?? null,
        };
      }),
    };
  }

  async archiveForUser({
    currentUserId,
    conversationId,
  }: {
    currentUserId: string;
    conversationId: string;
  }) {
    const conversation = await this.conversationRepo.findOneBy({
      id: conversationId,
    });

    if (!conversation) {
      throw new NotFoundException('Conversa nao encontrada.');
    }

    this.assertParticipant({ currentUserId, conversation });

    const updateField =
      conversation.user_a_id === currentUserId
        ? { archived_at_user_a: new Date() }
        : { archived_at_user_b: new Date() };

    await this.conversationRepo.update(conversationId, updateField);
  }

  async unarchiveForBoth({ conversationId }: { conversationId: string }) {
    await this.conversationRepo.update(
      {
        id: conversationId,
      },
      {
        archived_at_user_a: null,
        archived_at_user_b: null,
      },
    );
  }

  async touchLastMessageAt({
    conversationId,
    timestamp,
  }: {
    conversationId: string;
    timestamp: Date;
  }) {
    await this.conversationRepo.update(conversationId, {
      last_message_at: timestamp,
    });
  }

  async assertParticipantById({
    currentUserId,
    conversationId,
  }: {
    currentUserId: string;
    conversationId: string;
  }) {
    const conversation = await this.conversationRepo.findOneBy({
      id: conversationId,
    });

    if (!conversation) {
      throw new NotFoundException('Conversa nao encontrada.');
    }

    this.assertParticipant({ currentUserId, conversation });

    return conversation;
  }
}
