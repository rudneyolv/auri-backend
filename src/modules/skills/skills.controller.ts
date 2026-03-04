import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { CurrentUser } from '../auth/decorators/current-user';
import { User } from '../user/entities/user.entity';
import { AddSkillDto } from './dto/add-user-skill.dto';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';

@Controller()
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('skills')
  findAll(@Query('category_id') categoryId?: string) {
    const parsedCategoryId =
      categoryId !== undefined ? Number.parseInt(categoryId, 10) : undefined;

    if (categoryId !== undefined && Number.isNaN(parsedCategoryId)) {
      throw new BadRequestException('category_id precisa ser um número.');
    }

    return this.skillsService.findAll(parsedCategoryId);
  }

  @Get('skills/categories')
  findAllCategories() {
    return this.skillsService.findAllCategories();
  }

  @Get('profiles/:userId/skills')
  findUserSkills(@Param('userId') userId: string) {
    return this.skillsService.findUserSkills(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profiles/me/skills')
  addUserSkill(@CurrentUser() user: User, @Body() dto: AddSkillDto) {
    return this.skillsService.addUserSkill(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profiles/me/skills/:skillId')
  findMySkillById(
    @CurrentUser() user: User,
    @Param('skillId', ParseUUIDPipe) skillId: string,
  ) {
    return this.skillsService.findUserSkillById(user.id, skillId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profiles/me/skills/:skillId')
  updateUserSkill(
    @CurrentUser() user: User,
    @Param('skillId', ParseUUIDPipe) skillId: number,
    @Body() dto: UpdateUserSkillDto,
  ) {
    return this.skillsService.updateUserSkill(user.id, skillId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profiles/me/skills/:skillId')
  removeUserSkill(
    @CurrentUser() user: User,
    @Param('skillId', ParseUUIDPipe) skillId: number,
  ) {
    return this.skillsService.removeUserSkill(user.id, skillId);
  }
}
