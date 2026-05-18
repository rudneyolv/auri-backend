import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DefaultEventsMap, Server } from 'socket.io';
import { extractSocketToken } from 'src/shared/utils/extract-socket-token';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { AuthenticatedSocket, ServerEvents } from './types/socket.types';

@WebSocketGateway({
  namespace: '/events',
  cors: true,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server<DefaultEventsMap, ServerEvents>;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = extractSocketToken(client);
      const payload = await this.authService.verifyToken(token);

      if (typeof payload.sub !== 'string') {
        throw new Error('Invalid token payload: missing sub claim.');
      }

      // O 'sub' do JWT do Supabase é o auth_id. A identidade canônica
      // no resto do backend (conversations.user_a_id, etc.) é User.id.
      // Resolver aqui mantém a sala do socket consistente com os emits.
      const user = await this.userService.findOneByOrFail({ auth_id: payload.sub });

      client.data.userId = user.id;
      await client.join(`user:${user.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {}

  emit<K extends keyof ServerEvents>({
    userId,
    event,
    payload,
  }: {
    userId: string;
    event: K;
    payload: Parameters<ServerEvents[K]>[0];
  }) {
    (
      this.server.to(`user:${userId}`).emit as (
        e: K,
        p: Parameters<ServerEvents[K]>[0],
      ) => boolean
    )(event, payload);
  }
}
