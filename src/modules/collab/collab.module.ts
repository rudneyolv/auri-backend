import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from 'src/modules/event/event.module';
import { MessagesModule } from 'src/modules/message/message.module';
import { ProfileCategory } from '../categories/entities/profile-category.entity';
import { UserProfileCategory } from '../categories/entities/user-profile-category.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../user/entities/user.entity';
import { CollabController } from './collab.controller';
import { CollabService } from './collab.service';
import { CollabRequest } from './entities/collab-request.entity';

@Module({
  imports: [
    EventsModule,
    MessagesModule,
    TypeOrmModule.forFeature([
      CollabRequest,
      User,
      Profile,
      UserProfileCategory,
      ProfileCategory,
    ]),
  ],
  controllers: [CollabController],
  providers: [CollabService],
})
export class CollabModule {}
