import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../event/event.module';
import { User } from '../user/entities/user.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessagesController } from './message.controller';
import { MessagesGateway } from './message.gateway';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';

@Module({
  imports: [
    AuthModule,
    EventsModule,
    TypeOrmModule.forFeature([Conversation, Message, User]),
  ],
  controllers: [MessagesController],
  providers: [ConversationsService, MessagesService, MessagesGateway],
  exports: [ConversationsService],
})
export class MessagesModule {}
