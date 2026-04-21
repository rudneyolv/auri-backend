import { IsUUID } from 'class-validator';

export class SendCollabRequestDto {
  @IsUUID()
  to_user_id!: string;
}
