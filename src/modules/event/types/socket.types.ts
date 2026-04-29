// events/types/socket.types.ts

import { Socket } from 'socket.io';
import { CollabAcceptedPayload, MessageNotificationPayload } from '../payloads';

export interface SocketData {
  userId: string;
}

export type AuthenticatedSocket = Socket<any, any, any, SocketData>;

export interface ServerEvents {
  'notification:message': (payload: MessageNotificationPayload) => void;
  'collab:accepted': (payload: CollabAcceptedPayload) => void;
}
