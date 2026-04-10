import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

function normalizeNullableNumber(value: unknown) {
  if (value === null) {
    return 0;
  }

  return value;
}

export class UpdateCollabPrefsDto {
  @IsOptional()
  @Transform(({ value }) => normalizeNullableNumber(value))
  @Type(() => Number)
  @IsInt()
  @Min(0)
  collab_price_min?: number;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableNumber(value))
  @Type(() => Number)
  @IsInt()
  @Min(0)
  collab_price_max?: number;
}
