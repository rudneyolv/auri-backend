import { Socket } from 'socket.io';

export function extractSocketToken(client: Socket<any, any, any, any>): string {
  const token = client.handshake.auth?.token as string | undefined;

  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('Missing websocket token.');
  }

  return token;
}
