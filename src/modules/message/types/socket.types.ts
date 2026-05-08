import { Socket } from 'socket.io';
import {
  MessageReadPayload,
  NewMessagePayload,
  TypingPayload,
} from '../payloads';

export interface MessagesSocketData {
  userId: string;
}

export type AuthenticatedMessagesSocket = Socket<
  ClientEvents,
  ServerEvents,
  any,
  MessagesSocketData
>;

export interface ServerEvents {
  'message:new': (payload: NewMessagePayload) => void;
  'message:read': (payload: MessageReadPayload) => void;
  'typing:start': (payload: TypingPayload) => void;
  'typing:stop': (payload: TypingPayload) => void;
}

export interface ClientEvents {
  'conversation:join': (payload: { conversation_id: string }) => void;
  'conversation:leave': (payload: { conversation_id: string }) => void;
  'typing:start': (payload: { conversation_id: string }) => void;
  'typing:stop': (payload: { conversation_id: string }) => void;
}
