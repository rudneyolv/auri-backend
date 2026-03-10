import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { User } from '../user/entities/user.entity';
import {
  VIDEO_CONSTRAINTS,
  VIDEO_MIME_TYPES,
} from './constants/video.constants';
import { ReorderVideosDto } from './dto/reorder-videos.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import type { UploadedVideoFile } from './types/uploaded-video-file.type';
import { VideosService } from './videos.service';

@Controller()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({
    upload: {
      limit: 5,
      ttl: 3_600_000,
    },
  })
  @Post('videos/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadVideo(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: VIDEO_CONSTRAINTS.MAX_FILE_SIZE })
        .addFileTypeValidator({
          fileType: new RegExp(
            `(${VIDEO_MIME_TYPES.map((mimeType) => mimeType.replace('/', '\\/')).join('|')})`,
          ),
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: 400,
        }),
    )
    file: UploadedVideoFile,
    @Body() dto: UploadVideoDto,
  ) {
    return this.videosService.uploadVideo({
      userId: user.id,
      file,
      dto,
    });
  }

  @Get('profiles/:userId/videos')
  listVideosByUserId(@Param('userId') userId: string) {
    return this.videosService.listVideosByUserId({ userId });
  }

  @Get('videos/:videoId')
  findVideoById(@Param('videoId', ParseUUIDPipe) videoId: string) {
    return this.videosService.findVideoById({ videoId });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('videos/reorder')
  reorderVideos(@CurrentUser() user: User, @Body() dto: ReorderVideosDto) {
    return this.videosService.reorderVideos({
      userId: user.id,
      videoIds: dto.video_ids,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('videos/:videoId')
  updateVideo(
    @CurrentUser() user: User,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() dto: UpdateVideoDto,
  ) {
    return this.videosService.updateVideo({
      userId: user.id,
      videoId,
      dto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('videos/:videoId')
  deleteVideo(
    @CurrentUser() user: User,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.videosService.deleteVideo({
      userId: user.id,
      videoId,
    });
  }
}
