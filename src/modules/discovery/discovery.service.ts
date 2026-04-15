import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileCategory } from '../categories/entities/profile-category.entity';
import { UserProfileCategory } from '../categories/entities/user-profile-category.entity';
import { Genre } from '../genres/entities/genre.entity';
import { UserGenre } from '../genres/entities/user-genre.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Skill } from '../skills/entities/skill.entity';
import { UserSkill } from '../skills/entities/user-skill.entity';
import { User } from '../user/entities/user.entity';
import {
  applyCategoryFilters,
  applyGenreFilters,
  applyPriceFilters,
  applySkillFilters,
} from './discovery.query-builder';
import { DiscoveryFiltersDto } from './dto/discovery-filters.dto';

interface DiscoveryRawRow {
  user_id: string;
  name: string;
  profile_picture_url: string | null;
  collab_price_min: string | null;
  collab_price_max: string | null;
  primary_category_name: string;
  primary_category_proficiency_level: string;
  primary_category_years_experience: string;
}

interface DiscoverySkillRow {
  user_id: string;
  name: string;
  proficiency_level: string;
  years_experience: string | null;
}

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepo: Repository<UserSkill>,
    @InjectRepository(UserGenre)
    private readonly userGenreRepo: Repository<UserGenre>,
  ) {}

  async findProfiles(currentUserId: string, dto: DiscoveryFiltersDto) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .innerJoin(Profile, 'p', 'p.user_id = u.id')
      .innerJoin(
        UserProfileCategory,
        'upc',
        'upc.user_id = u.id AND upc.is_primary = true',
      )
      .innerJoin(ProfileCategory, 'pc', 'pc.id = upc.category_id')
      .where('u.is_active = true')
      .andWhere('u.id != :currentUserId', { currentUserId });

    applyCategoryFilters({
      qb,
      filters: dto.category_filters ?? [],
    });

    applySkillFilters({
      qb,
      filters: dto.skill_filters ?? [],
    });

    applyGenreFilters({
      qb,
      genreIds: dto.genre_ids ?? [],
    });

    applyPriceFilters({
      qb,
      minPrice: dto.min_price,
      maxPrice: dto.max_price,
    });

    const total = await qb.clone().getCount();

    const rawRows = await qb
      .select([
        'u.id AS user_id',
        'u.name AS name',
        'p.profile_picture_url AS profile_picture_url',
        'p.collab_price_min AS collab_price_min',
        'p.collab_price_max AS collab_price_max',
        'pc.name AS primary_category_name',
        'upc.proficiency_level AS primary_category_proficiency_level',
        'upc.years_experience AS primary_category_years_experience',
      ])
      .orderBy('u.created_at', 'DESC')
      .limit(dto.limit)
      .offset((dto.page - 1) * dto.limit)
      .getRawMany<DiscoveryRawRow>();

    const userIds = rawRows.map((row) => row.user_id);
    const [genresByUserId, skillsByUserId] = await Promise.all([
      this.findGenresByUserIds(userIds),
      this.findSkillsByUserIds(userIds),
    ]);

    return {
      data: rawRows.map((row) => ({
        user_id: row.user_id,
        name: row.name,
        profile_picture_url: row.profile_picture_url ?? null,
        primary_category: {
          name: row.primary_category_name,
          proficiency_level: row.primary_category_proficiency_level,
          years_experience: Number(row.primary_category_years_experience),
        },
        genres: genresByUserId.get(row.user_id) ?? [],
        skills: skillsByUserId.get(row.user_id) ?? [],
        collab_price_min:
          row.collab_price_min !== null ? Number(row.collab_price_min) : null,
        collab_price_max:
          row.collab_price_max !== null ? Number(row.collab_price_max) : null,
        collab_request_status: null,
      })),
      meta: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / dto.limit) : 0,
      },
    };
  }

  private async findGenresByUserIds(userIds: string[]) {
    const genresByUserId = new Map<string, { name: string }[]>();
    if (userIds.length === 0) return genresByUserId;

    const rows = await this.userGenreRepo
      .createQueryBuilder('ug')
      .innerJoin(Genre, 'g', 'g.id = ug.genre_id')
      .select(['ug.user_id AS user_id', 'g.name AS name'])
      .where('ug.user_id IN (:...userIds)', { userIds })
      .orderBy('ug.user_id', 'ASC')
      .addOrderBy('ug.created_at', 'ASC')
      .getRawMany<{ user_id: string; name: string }>();

    for (const row of rows) {
      const genres = genresByUserId.get(row.user_id) ?? [];
      genres.push({ name: row.name });
      genresByUserId.set(row.user_id, genres);
    }

    return genresByUserId;
  }

  private async findSkillsByUserIds(userIds: string[]) {
    const skillsByUserId = new Map<
      string,
      {
        name: string;
        proficiency_level: string;
        years_experience: number | null;
      }[]
    >();
    if (userIds.length === 0) return skillsByUserId;

    const rows = await this.userSkillRepo
      .createQueryBuilder('us')
      .innerJoin(Skill, 's', 's.id = us.skill_id')
      .select([
        'us.user_id AS user_id',
        's.name AS name',
        'us.proficiency_level AS proficiency_level',
        'us.years_experience AS years_experience',
      ])
      .where('us.user_id IN (:...userIds)', { userIds })
      .orderBy('us.user_id', 'ASC')
      .addOrderBy('us.created_at', 'ASC')
      .getRawMany<DiscoverySkillRow>();

    for (const row of rows) {
      const skills = skillsByUserId.get(row.user_id) ?? [];
      skills.push({
        name: row.name,
        proficiency_level: row.proficiency_level,
        years_experience:
          row.years_experience !== null ? Number(row.years_experience) : null,
      });
      skillsByUserId.set(row.user_id, skills);
    }

    return skillsByUserId;
  }
}
