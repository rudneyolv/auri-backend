import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DefaultEventsMap, Server } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedSocket, ServerEvents } from './types/socket.types';

@WebSocketGateway({
  namespace: '/events',
  cors: true,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server<DefaultEventsMap, ServerEvents>;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      const payload = await this.authService.verifyToken(token);

      if (typeof payload.sub !== 'string') {
        throw new Error('Invalid token payload: missing sub claim.');
      }

      client.data.userId = payload.sub;
      await client.join(`user:${payload.sub}`);
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

  private extractToken(client: AuthenticatedSocket): string {
    const token = client.handshake.auth?.token as string | undefined;

    if (typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Missing websocket token.');
    }

    return token;
  }
}
