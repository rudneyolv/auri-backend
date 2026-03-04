import { IsBoolean, IsIn, IsInt, IsUUID, Max, Min } from 'class-validator';

export class AddUserCategoryDto {
  @IsUUID()
  category_id: number;

  @IsInt()
  @Min(0)
  @Max(100)
  years_experience: number;

  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @IsBoolean()
  is_primary: boolean;
}
