import { IsString, MaxLength } from 'class-validator';

export class UpdateProfileBioDto {
  @IsString()
  @MaxLength(500)
  bio: string;
}
