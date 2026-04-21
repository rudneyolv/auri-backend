import { Transform, Type, plainToInstance } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  PROFICIENCY_LEVELS,
  type ProficiencyLevel,
} from 'src/shared/types/proficiency-level';

export class ScopedFilterDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsIn(PROFICIENCY_LEVELS)
  proficiency_level?: ProficiencyLevel;
}

export class DiscoveryCursorDto {
  @IsDateString()
  created_at!: string;

  @IsUUID()
  id!: string;
}

function parseJsonQueryParam(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && value !== null) return [value];
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return trimmed

      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function parseJsonObjectQueryParam(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (typeof value === 'object' && value !== null) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return parsed;
  } catch {
    return value;
  }
}

export class DiscoveryFiltersDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    const parsed = parseJsonQueryParam(value);
    if (!Array.isArray(parsed)) return parsed;
    return parsed.map((item) => plainToInstance(ScopedFilterDto, item));
  })
  category_filters?: ScopedFilterDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    const parsed = parseJsonQueryParam(value);
    if (!Array.isArray(parsed)) return parsed;
    return parsed.map((item) => plainToInstance(ScopedFilterDto, item));
  })
  skill_filters?: ScopedFilterDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => parseJsonQueryParam(value))
  genre_ids?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  min_price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  max_price?: number;

  @IsOptional()
  @ValidateNested()
  @Transform(({ value }) => {
    const parsed = parseJsonObjectQueryParam(value);
    if (parsed === undefined || parsed === null) return undefined;
    if (typeof parsed !== 'object') return parsed;
    return plainToInstance(DiscoveryCursorDto, parsed);
  })
  cursor?: DiscoveryCursorDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit: number = 20;
}
