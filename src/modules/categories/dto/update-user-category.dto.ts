import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateUserCategoryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  years_experience?: number;

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
