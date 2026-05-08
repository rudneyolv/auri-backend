import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { MessageContentType } from '../entities/message.entity';

export class SendMessageDto {
  @IsIn(['text', 'link'])
  content_type!: MessageContentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}
