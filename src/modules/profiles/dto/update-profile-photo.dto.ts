import { IsString } from 'class-validator';

export class UpdateProfilePhotoDto {
  @IsString()
  profile_picture_url: string;
}
