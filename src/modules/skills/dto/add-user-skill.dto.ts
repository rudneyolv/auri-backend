import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AddSkillDto {
  @IsUUID()
  skill_id: string;

  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  years_experience?: number;
}
