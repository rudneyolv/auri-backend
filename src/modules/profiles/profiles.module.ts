import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../user/entities/user.entity';
import { ProfileCategory } from '../categories/entities/profile-category.entity';
import { UserProfileCategory } from '../categories/entities/user-profile-category.entity';
import { SkillCategory } from '../skills/entities/skill-category.entity';
import { Skill } from '../skills/entities/skill.entity';
import { UserSkill } from '../skills/entities/user-skill.entity';
import { Genre } from '../genres/entities/genre.entity';
import { UserGenre } from '../genres/entities/user-genre.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      User,
      ProfileCategory,
      UserProfileCategory,
      SkillCategory,
      Skill,
      UserSkill,
      Genre,
      UserGenre,
    ]),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
