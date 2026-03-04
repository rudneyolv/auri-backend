import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { ProfileCategory } from './entities/profile-category.entity';
import { UserProfileCategory } from './entities/user-profile-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileCategory, UserProfileCategory])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
