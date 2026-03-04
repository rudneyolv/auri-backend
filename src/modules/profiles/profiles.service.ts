import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../user/entities/user.entity';
import { UserProfileCategory } from '../categories/entities/user-profile-category.entity';
import { UserSkill } from '../skills/entities/user-skill.entity';
import { UserGenre } from '../genres/entities/user-genre.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfileCategory)
    private readonly userProfileCategoryRepo: Repository<UserProfileCategory>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepo: Repository<UserSkill>,
    @InjectRepository(UserGenre)
    private readonly userGenreRepo: Repository<UserGenre>,
  ) {}

  async findByUserId(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user || !user.is_active) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    const profile = await this.profileRepo.findOneBy({ user_id: userId });

    const [categories, skills, genres] = await Promise.all([
      this.userProfileCategoryRepo.find({
        where: { user_id: userId },
        relations: { category: true },
        order: { is_primary: 'DESC', created_at: 'ASC' },
      }),
      this.userSkillRepo.find({
        where: { user_id: userId },
        relations: { skill: { category: true } },
        order: { created_at: 'ASC' },
      }),
      this.userGenreRepo.find({
        where: { user_id: userId },
        relations: { genre: true },
        order: { is_primary: 'DESC', created_at: 'ASC' },
      }),
    ]);

    const formattedSkills = skills.map((item) => ({
      id: item.skill.id,
      name: item.skill.name,
      slug: item.skill.slug,

      category: item.skill.category
        ? {
            id: item.skill.category.id,
            name: item.skill.category.name,
            slug: item.skill.category.slug,
          }
        : null,

      proficiency_level: item.proficiency_level,
      years_experience: item.years_experience,
    }));

    const formattedCategories = categories.map((item) => ({
      id: item.category.id,
      name: item.category.name,
      slug: item.category.slug,
      is_primary: item.is_primary,
      proficiency_level: item.proficiency_level,
      years_experience: item.years_experience,
    }));

    const formattedGenres = genres.map((item) => ({
      id: item.genre.id,
      name: item.genre.name,
      slug: item.genre.slug,
      is_primary: item.is_primary,
    }));

    return {
      user_id: user.id,
      name: user.name,
      bio: profile?.bio ?? null,
      profile_picture_url: profile?.profile_picture_url ?? null,
      accept_messages_from_non_matches:
        profile?.accept_messages_from_non_matches ?? false,
      categories: formattedCategories,
      skills: formattedSkills,
      genres: formattedGenres,
    };
  }

  async updateBio(userId: string, bio: string) {
    const profile = await this.getOrCreateProfile(userId);
    profile.bio = bio;

    await this.profileRepo.save(profile);
    return this.findByUserId(userId);
  }

  async updatePhoto(userId: string, profilePictureUrl: string) {
    const profile = await this.getOrCreateProfile(userId);
    profile.profile_picture_url = profilePictureUrl;

    await this.profileRepo.save(profile);
    return this.findByUserId(userId);
  }

  async deleteMe(userId: string) {
    const updateResult = await this.userRepo.update(
      { id: userId, is_active: true },
      {
        is_active: false,
        deleted_at: new Date(),
      },
    );

    if (!updateResult.affected) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return {
      success: true,
      message: 'Conta desativada com sucesso.',
    };
  }

  private async getOrCreateProfile(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId, is_active: true });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    let profile = await this.profileRepo.findOneBy({ user_id: userId });

    if (!profile) {
      profile = this.profileRepo.create({ user_id: userId });
      profile = await this.profileRepo.save(profile);
    }

    return profile;
  }
}
