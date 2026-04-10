import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ScopedFilterDto } from './dto/discovery-filters.dto';

interface ApplyCategoryFiltersParams {
  qb: SelectQueryBuilder<User>;
  filters: ScopedFilterDto[];
}

export function applyCategoryFilters({
  qb,
  filters,
}: ApplyCategoryFiltersParams): void {
  if (filters.length === 0) return;

  const params: ObjectLiteral = {};
  const conditions = filters.map((filter, i) => {
    params[`catId${i}`] = filter.id;
    const parts = [`cat_f.category_id = :catId${i}`];

    if (filter.proficiency_level) {
      params[`catLevel${i}`] = filter.proficiency_level;
      parts.push(`cat_f.proficiency_level = :catLevel${i}`);
    }

    return `(${parts.join(' AND ')})`;
  });

  qb.andWhere(
    `EXISTS (
      SELECT 1 FROM user_profile_categories cat_f
      WHERE cat_f.user_id = u.id
        AND (${conditions.join(' OR ')})
    )`,
    params,
  );
}

interface ApplySkillFiltersParams {
  qb: SelectQueryBuilder<User>;
  filters: ScopedFilterDto[];
}

export function applySkillFilters({
  qb,
  filters,
}: ApplySkillFiltersParams): void {
  if (filters.length === 0) return;

  const params: ObjectLiteral = {};
  const conditions = filters.map((filter, i) => {
    params[`skillId${i}`] = filter.id;
    const parts = [`skill_f.skill_id = :skillId${i}`];

    if (filter.proficiency_level) {
      params[`skillLevel${i}`] = filter.proficiency_level;
      parts.push(`skill_f.proficiency_level = :skillLevel${i}`);
    }

    return `(${parts.join(' AND ')})`;
  });

  qb.andWhere(
    `EXISTS (
      SELECT 1 FROM user_skills skill_f
      WHERE skill_f.user_id = u.id
        AND (${conditions.join(' OR ')})
    )`,
    params,
  );
}

interface ApplyGenreFiltersParams {
  qb: SelectQueryBuilder<User>;
  genreIds: string[];
}

export function applyGenreFilters({
  qb,
  genreIds,
}: ApplyGenreFiltersParams): void {
  if (genreIds.length === 0) return;

  qb.andWhere(
    `EXISTS (
      SELECT 1 FROM user_genres genre_f
      WHERE genre_f.user_id = u.id
        AND genre_f.genre_id IN (:...genreIds)
    )`,
    { genreIds },
  );
}

interface ApplyPriceFiltersParams {
  qb: SelectQueryBuilder<User>;
  minPrice?: number;
  maxPrice?: number;
}

export function applyPriceFilters({
  qb,
  minPrice,
  maxPrice,
}: ApplyPriceFiltersParams): void {
  if (minPrice !== undefined) {
    qb.andWhere('p.collab_price_min >= :minPrice', { minPrice });
  }

  if (maxPrice !== undefined) {
    qb.andWhere('p.collab_price_max <= :maxPrice', { maxPrice });
  }
}
