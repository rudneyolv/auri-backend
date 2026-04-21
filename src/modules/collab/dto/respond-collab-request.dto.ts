import { IsIn } from 'class-validator';

export class RespondCollabRequestDto {
  @IsIn(['accept', 'decline'])
  action!: 'accept' | 'decline';
}
