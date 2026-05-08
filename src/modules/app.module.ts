import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { CategoriesModule } from './categories/categories.module';
import { SkillsModule } from './skills/skills.module';
import { GenresModule } from './genres/genres.module';
import { VideosModule } from './videos/videos.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { CollabModule } from './collab/collab.module';
import { EventsModule } from 'src/modules/event/event.module';
import { MessagesModule } from './message/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      synchronize: true,
      autoLoadEntities: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'upload',
        ttl: 3_600_000,
        limit: 5,
      },
      {
        name: 'collab',
        ttl: 3_600_000,
        limit: 20,
      },
    ]),
    UserModule,
    AuthModule,
    ProfilesModule,
    CategoriesModule,
    SkillsModule,
    GenresModule,
    VideosModule,
    DiscoveryModule,
    CollabModule,
    EventsModule,
    MessagesModule,
  ],
  controllers: [],
})
export class AppModule {}
