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
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { User } from '../user/entities/user.entity';
import { CollabService } from './collab.service';
import { RespondCollabRequestDto } from './dto/respond-collab-request.dto';
import { SendCollabRequestDto } from './dto/send-collab-request.dto';

@Controller()
export class CollabController {
  constructor(private readonly collabService: CollabService) {}

  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({
    collab: {
      limit: 20,
      ttl: 3_600_000,
    },
  })
  @Post('collab-requests')
  sendRequest(@CurrentUser() user: User, @Body() dto: SendCollabRequestDto) {
    return this.collabService.sendRequest(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('collab-requests/received')
  findReceivedRequests(@CurrentUser() user: User) {
    return this.collabService.findReceivedRequests(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('collab-requests/sent')
  findSentRequests(@CurrentUser() user: User) {
    return this.collabService.findSentRequests(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('collab-requests/:requestId')
  respondToRequest(
    @CurrentUser() user: User,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: RespondCollabRequestDto,
  ) {
    return this.collabService.respondToRequest(user.id, requestId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Delete('collab-requests/:requestId')
  async cancelRequest(
    @CurrentUser() user: User,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    await this.collabService.cancelRequest(user.id, requestId);
  }
}
