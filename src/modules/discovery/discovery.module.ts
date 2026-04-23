import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileCategory } from '../categories/entities/profile-category.entity';
import { UserProfileCategory } from '../categories/entities/user-profile-category.entity';
import { CollabRequest } from '../collab/entities/collab-request.entity';
import { Genre } from '../genres/entities/genre.entity';
import { UserGenre } from '../genres/entities/user-genre.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Skill } from '../skills/entities/skill.entity';
import { UserSkill } from '../skills/entities/user-skill.entity';
import { User } from '../user/entities/user.entity';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      ProfileCategory,
      UserProfileCategory,
      Skill,
      UserSkill,
      Genre,
      UserGenre,
      CollabRequest,
    ]),
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
