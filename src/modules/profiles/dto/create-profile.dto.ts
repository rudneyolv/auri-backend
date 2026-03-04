import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  profile_picture_url?: string;

  @IsOptional()
  @IsBoolean()
  accept_messages_from_non_matches?: boolean;
}
