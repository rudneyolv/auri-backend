import { IsBoolean, IsUUID } from 'class-validator';

export class AddUserGenreDto {
  @IsUUID()
  genre_id: string;

  @IsBoolean()
  is_primary: boolean;
}
