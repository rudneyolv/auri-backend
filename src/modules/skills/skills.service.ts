import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillCategory } from './entities/skill-category.entity';
import { Skill } from './entities/skill.entity';
import { UserSkill } from './entities/user-skill.entity';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';
import { AddSkillDto } from './dto/add-user-skill.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(SkillCategory)
    private readonly skillCategoryRepo: Repository<SkillCategory>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepo: Repository<UserSkill>,
  ) {}

  findAll(categoryId?: number) {
    const where = categoryId ? { category_id: String(categoryId) } : {};

    return this.skillRepo.find({
      where,
      relations: { category: true },
      order: { name: 'ASC' },
    });
  }

  findAllCategories() {
    return this.skillCategoryRepo.find({
      order: { name: 'ASC' },
    });
  }

  findUserSkills(userId: string) {
    return this.userSkillRepo.find({
      where: { user_id: userId },
      relations: { skill: { category: true } },
      order: { created_at: 'ASC' },
    });
  }

  async findUserSkillById(userId: string, skillId: string) {
    const userSkill = await this.userSkillRepo.findOne({
      where: { user_id: userId, skill_id: skillId },
      relations: { skill: { category: true } },
    });

    if (!userSkill) {
      throw new NotFoundException('Skill do usuário não encontrada.');
    }

    const formattedSkill = {
      id: userSkill.skill.id,
      name: userSkill.skill.name,
      category: userSkill.skill.category,
      proficiency_level: userSkill.proficiency_level,
      years_experience: userSkill.years_experience,
    };

    return formattedSkill;
  }

  async addUserSkill(userId: string, dto: AddSkillDto) {
    const skillId = String(dto.skill_id);

    const skill = await this.skillRepo.findOneBy({ id: skillId });
    if (!skill) {
      throw new NotFoundException('Skill não encontrada.');
    }

    const existingLink = await this.userSkillRepo.findOneBy({
      user_id: userId,
      skill_id: skillId,
    });

    if (existingLink) {
      throw new ConflictException('Skill já adicionada ao perfil.');
    }

    await this.userSkillRepo.save(
      this.userSkillRepo.create({
        user_id: userId,
        skill_id: skillId,
        proficiency_level: dto.proficiency_level,
        years_experience: dto.years_experience,
      }),
    );

    return this.findUserSkills(userId);
  }

  async updateUserSkill(
    userId: string,
    skillId: number,
    dto: UpdateUserSkillDto,
  ) {
    const targetSkillId = String(skillId);

    const userSkill = await this.userSkillRepo.findOneBy({
      user_id: userId,
      skill_id: targetSkillId,
    });

    if (!userSkill) {
      throw new NotFoundException('Skill do usuário não encontrada.');
    }

    Object.assign(userSkill, dto);
    await this.userSkillRepo.save(userSkill);

    return this.findUserSkills(userId);
  }

  async removeUserSkill(userId: string, skillId: number) {
    const deleteResult = await this.userSkillRepo.delete({
      user_id: userId,
      skill_id: String(skillId),
    });

    if (!deleteResult.affected) {
      throw new NotFoundException('Skill do usuário não encontrada.');
    }

    return {
      success: true,
      message: 'Skill removida com sucesso.',
    };
  }
}
