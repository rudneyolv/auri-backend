import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { User } from '../user/entities/user.entity';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get()
  listConversations(@CurrentUser() user: User) {
    return this.conversationsService.listForUser({ currentUserId: user.id });
  }

  @Get(':conversationId/messages')
  listMessages(
    @CurrentUser() user: User,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.messagesService.list({
      currentUserId: user.id,
      conversationId,
      limit: query.limit,
      before: query.before,
    });
  }

  @Post(':conversationId/messages')
  sendMessage(
    @CurrentUser() user: User,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.send({
      currentUserId: user.id,
      conversationId,
      dto,
    });
  }

  @Patch(':conversationId/read')
  markAsRead(
    @CurrentUser() user: User,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.messagesService.markAsRead({
      currentUserId: user.id,
      conversationId,
    });
  }

  @HttpCode(204)
  @Delete(':conversationId')
  async archiveConversation(
    @CurrentUser() user: User,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    await this.conversationsService.archiveForUser({
      currentUserId: user.id,
      conversationId,
    });
  }
}
