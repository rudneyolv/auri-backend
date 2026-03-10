import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupabaseModule } from 'src/shared/supabase/supabase.module';
import { Video } from './entities/video.entity';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Video]), SupabaseModule],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
