import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { CurrentUser } from '../auth/decorators/current-user';
import { User } from '../user/entities/user.entity';
import { AddUserCategoryDto } from './dto/add-user-category.dto';
import { UpdateUserCategoryDto } from './dto/update-user-category.dto';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('categories')
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('profiles/:userId/categories')
  findUserCategories(@Param('userId') userId: string) {
    return this.categoriesService.findUserCategories(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profiles/me/categories')
  addUserCategory(
    @CurrentUser() user: User,
    @Body() addUserCategoryDto: AddUserCategoryDto,
  ) {
    return this.categoriesService.addUserCategory(user.id, addUserCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profiles/me/categories/:categoryId')
  findMyCategoryById(
    @CurrentUser() user: User,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.findUserCategoryById(user.id, categoryId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profiles/me/categories/:categoryId')
  updateUserCategory(
    @CurrentUser() user: User,
    @Param('categoryId', ParseUUIDPipe) categoryId: number,
    @Body() updateUserCategoryDto: UpdateUserCategoryDto,
  ) {
    return this.categoriesService.updateUserCategory(
      user.id,
      categoryId,
      updateUserCategoryDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profiles/me/categories/:categoryId')
  removeUserCategory(
    @CurrentUser() user: User,
    @Param('categoryId', ParseUUIDPipe) categoryId: number,
  ) {
    return this.categoriesService.removeUserCategory(user.id, categoryId);
  }
}
