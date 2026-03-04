import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateUserSkillDto {
  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  years_experience?: number;
}
