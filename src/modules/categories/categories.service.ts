import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileCategory } from './entities/profile-category.entity';
import { UserProfileCategory } from './entities/user-profile-category.entity';
import { AddUserCategoryDto } from './dto/add-user-category.dto';
import { UpdateUserCategoryDto } from './dto/update-user-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(ProfileCategory)
    private readonly profileCategoryRepo: Repository<ProfileCategory>,
    @InjectRepository(UserProfileCategory)
    private readonly userProfileCategoryRepo: Repository<UserProfileCategory>,
  ) {}

  findAll() {
    return this.profileCategoryRepo.find({
      order: { name: 'ASC' },
    });
  }

  findUserCategories(userId: string) {
    return this.userProfileCategoryRepo.find({
      where: { user_id: userId },
      relations: { category: true },
      order: { is_primary: 'DESC', created_at: 'ASC' },
    });
  }

  async findUserCategoryById(userId: string, categoryId: string) {
    const userCategory = await this.userProfileCategoryRepo.findOne({
      where: { user_id: userId, category_id: categoryId },
      relations: { category: true },
    });

    if (!userCategory) {
      throw new NotFoundException('Categoria do usuário não encontrada.');
    }

    return {
      id: userCategory.category.id,
      name: userCategory.category.name,
      slug: userCategory.category.slug,
      description: userCategory.category.description,
      icon_url: userCategory.category.icon_url,
      is_primary: userCategory.is_primary,
      proficiency_level: userCategory.proficiency_level,
      years_experience: userCategory.years_experience,
    };
  }

  async addUserCategory(userId: string, dto: AddUserCategoryDto) {
    const categoryId = String(dto.category_id);

    const category = await this.profileCategoryRepo.findOneBy({
      id: categoryId,
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    const existingLink = await this.userProfileCategoryRepo.findOneBy({
      user_id: userId,
      category_id: categoryId,
    });

    if (existingLink) {
      throw new ConflictException('Categoria já adicionada ao perfil.');
    }

    if (dto.is_primary) {
      await this.clearPrimaryCategory(userId);
    }

    await this.userProfileCategoryRepo.save(
      this.userProfileCategoryRepo.create({
        user_id: userId,
        category_id: categoryId,
        years_experience: dto.years_experience,
        proficiency_level: dto.proficiency_level,
        is_primary: dto.is_primary,
      }),
    );

    return this.findUserCategories(userId);
  }

  async updateUserCategory(
    userId: string,
    categoryId: number,
    dto: UpdateUserCategoryDto,
  ) {
    const targetCategoryId = String(categoryId);

    const userCategory = await this.userProfileCategoryRepo.findOneBy({
      user_id: userId,
      category_id: targetCategoryId,
    });

    if (!userCategory) {
      throw new NotFoundException('Categoria do usuário não encontrada.');
    }

    if (dto.is_primary === true) {
      await this.clearPrimaryCategory(userId);
    }

    Object.assign(userCategory, dto);
    await this.userProfileCategoryRepo.save(userCategory);

    return this.findUserCategories(userId);
  }

  async removeUserCategory(userId: string, categoryId: number) {
    const totalCategories = await this.userProfileCategoryRepo.countBy({
      user_id: userId,
    });

    if (totalCategories <= 1) {
      throw new BadRequestException(
        'Não é possível remover a única categoria do perfil.',
      );
    }

    const deleteResult = await this.userProfileCategoryRepo.delete({
      user_id: userId,
      category_id: String(categoryId),
    });

    if (!deleteResult.affected) {
      throw new NotFoundException('Categoria do usuário não encontrada.');
    }

    return {
      success: true,
      message: 'Categoria removida com sucesso.',
    };
  }

  private clearPrimaryCategory(userId: string) {
    return this.userProfileCategoryRepo.update(
      { user_id: userId, is_primary: true },
      { is_primary: false },
    );
  }
}
