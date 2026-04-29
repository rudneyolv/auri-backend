import { Injectable } from '@nestjs/common';
import { EventsGateway } from './event.gateway';
import { CollabAcceptedPayload, MessageNotificationPayload } from './payloads';

@Injectable()
export class EventsService {
  constructor(private readonly eventGateway: EventsGateway) {}

  emitMessageNotification({
    userId,
    payload,
  }: {
    userId: string;
    payload: MessageNotificationPayload;
  }) {
    this.eventGateway.emit({
      userId,
      event: 'notification:message',
      payload,
    });
  }

  emitCollabAccepted({
    userId,
    payload,
  }: {
    userId: string;
    payload: CollabAcceptedPayload;
  }) {
    this.eventGateway.emit({
      userId,
      event: 'collab:accepted',
      payload,
    });
  }
}
