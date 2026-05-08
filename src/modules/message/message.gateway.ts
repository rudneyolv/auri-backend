import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from 'src/modules/auth/auth.service';
import { extractSocketToken } from 'src/shared/utils/extract-socket-token';
import type {
  AuthenticatedMessagesSocket,
  ClientEvents,
  ServerEvents,
} from './types/socket.types';
import { ConversationsService } from './services/conversations.service';

@WebSocketGateway({
  namespace: '/messages',
  cors: true,
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server<ClientEvents, ServerEvents>;

  constructor(
    private readonly authService: AuthService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async handleConnection(client: AuthenticatedMessagesSocket) {
    try {
      const token = extractSocketToken(client);
      const payload = await this.authService.verifyToken(token);

      if (typeof payload.sub !== 'string') {
        throw new Error('Invalid token payload: missing sub claim.');
      }

      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: AuthenticatedMessagesSocket) {}

  @SubscribeMessage('conversation:join')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedMessagesSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    try {
      await this.conversationsService.assertParticipantById({
        currentUserId: client.data.userId,
        conversationId: data.conversation_id,
      });

      await client.join(`conversation:${data.conversation_id}`);
    } catch {
      // Silenciosamente ignora joins inválidos
    }
  }

  @SubscribeMessage('conversation:leave')
  async handleLeave(
    @ConnectedSocket() client: AuthenticatedMessagesSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    await client.leave(`conversation:${data.conversation_id}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedMessagesSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    client.to(`conversation:${data.conversation_id}`).emit('typing:start', {
      conversation_id: data.conversation_id,
      from_user_id: client.data.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedMessagesSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    client.to(`conversation:${data.conversation_id}`).emit('typing:stop', {
      conversation_id: data.conversation_id,
      from_user_id: client.data.userId,
    });
  }

  emitToConversation<K extends keyof ServerEvents>({
    conversationId,
    event,
    payload,
  }: {
    conversationId: string;
    event: K;
    payload: Parameters<ServerEvents[K]>[0];
  }) {
    (
      this.server.to(`conversation:${conversationId}`).emit as (
        e: K,
        p: Parameters<ServerEvents[K]>[0],
      ) => boolean
    )(event, payload);
  }
}
