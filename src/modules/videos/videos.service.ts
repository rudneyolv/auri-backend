import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ffmpeg from 'fluent-ffmpeg';
import ffprobePath from 'ffprobe-static';
import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { SupabaseClient } from '@supabase/supabase-js';
import { Repository } from 'typeorm';
import { SUPABASE_ADMIN_TOKEN } from 'src/shared/supabase/supabase.tokens';
import {
  VIDEO_BUCKET_NAME,
  VIDEO_CONSTRAINTS,
  VIDEO_MIME_TYPES,
} from './constants/video.constants';
import { UploadVideoDto } from './dto/upload-video.dto';
import { Video } from './entities/video.entity';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UploadedVideoFile } from './types/uploaded-video-file.type';
import { VideoMimeType } from './types/video-mime-type.type';

interface UploadVideoParams {
  userId: string;
  file: UploadedVideoFile;
  dto: UploadVideoDto;
}

interface UpdateVideoParams {
  userId: string;
  videoId: string;
  dto: UpdateVideoDto;
}

interface DeleteVideoParams {
  userId: string;
  videoId: string;
}

interface ReorderVideosParams {
  userId: string;
  videoIds: string[];
}

export interface SignedVideoResponse {
  id: string;
  user_id: string;
  storage_key: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  duration: number;
  file_size: number;
  mime_type: string;
  view_count: number;
  order_position: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

const VIDEO_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/mov': '.mov',
  'video/quicktime': '.mov',
};

function resolveFfprobeBinaryPath(): string {
  const ffprobeModule: unknown = ffprobePath;

  if (!ffprobeModule || typeof ffprobeModule !== 'object') {
    throw new Error('Caminho do ffprobe nao encontrado.');
  }

  const ffprobeModuleRecord = ffprobeModule as Record<string, unknown>;
  const ffprobeBinaryPath = ffprobeModuleRecord['path'];

  if (typeof ffprobeBinaryPath === 'string') {
    return ffprobeBinaryPath;
  }

  throw new Error('Caminho do ffprobe nao encontrado.');
}

ffmpeg.setFfprobePath(resolveFfprobeBinaryPath());

function toError({ reason }: { reason: unknown }) {
  if (reason instanceof Error) {
    return reason;
  }

  if (typeof reason === 'string') {
    return new Error(reason);
  }

  return new Error('Erro desconhecido.');
}

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @Inject(SUPABASE_ADMIN_TOKEN)
    private readonly supabaseAdmin: SupabaseClient,
  ) {}

  async uploadVideo({
    userId,
    file,
    dto,
  }: UploadVideoParams): Promise<SignedVideoResponse> {
    this.assertMimeTypeAllowed({ mimeType: file.mimetype });

    await this.assertUserCanUploadMoreVideos({ userId });

    const duration = await this.getVideoDurationSeconds({ file });
    this.assertDurationValid({ duration });

    const storageKey = this.buildStorageKey({
      userId,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });

    const { error: uploadError } = await this.supabaseAdmin.storage
      .from(VIDEO_BUCKET_NAME)
      .upload(storageKey, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new BadGatewayException(
        `Erro ao enviar video para o storage: ${uploadError.message}`,
      );
    }

    const orderPosition = await this.getNextOrderPosition({ userId });

    let video: Video;
    try {
      video = await this.videoRepo.save(
        this.videoRepo.create({
          user_id: userId,
          storage_key: storageKey,
          title: dto.title ?? null,
          description: dto.description ?? null,
          duration,
          file_size: String(file.size),
          mime_type: file.mimetype,
          order_position: orderPosition,
        }),
      );
    } catch {
      await this.supabaseAdmin.storage
        .from(VIDEO_BUCKET_NAME)
        .remove([storageKey]);
      throw new BadGatewayException(
        'Erro ao salvar metadados do video apos upload.',
      );
    }

    return this.mapSignedVideoResponse({ video });
  }

  async listVideosByUserId({
    userId,
  }: {
    userId: string;
  }): Promise<SignedVideoResponse[]> {
    const videos = await this.videoRepo.find({
      where: { user_id: userId, is_public: true },
      order: { order_position: 'ASC', created_at: 'ASC' },
    });

    return Promise.all(
      videos.map((video) => this.mapSignedVideoResponse({ video })),
    );
  }

  async findVideoById({
    videoId,
  }: {
    videoId: string;
  }): Promise<SignedVideoResponse> {
    const video = await this.videoRepo.findOneBy({
      id: videoId,
      is_public: true,
    });

    if (!video) {
      throw new NotFoundException('Video nao encontrado.');
    }

    return this.mapSignedVideoResponse({ video });
  }

  async updateVideo({
    userId,
    videoId,
    dto,
  }: UpdateVideoParams): Promise<SignedVideoResponse> {
    const video = await this.findOwnedVideo({ userId, videoId });

    if (dto.title !== undefined) {
      video.title = dto.title;
    }

    if (dto.description !== undefined) {
      video.description = dto.description;
    }

    const updatedVideo = await this.videoRepo.save(video);
    return this.mapSignedVideoResponse({ video: updatedVideo });
  }

  async deleteVideo({ userId, videoId }: DeleteVideoParams) {
    const video = await this.findOwnedVideo({ userId, videoId });

    const { error: deleteStorageError } = await this.supabaseAdmin.storage
      .from(VIDEO_BUCKET_NAME)
      .remove([video.storage_key]);

    if (deleteStorageError) {
      throw new BadGatewayException(
        `Erro ao remover video do storage: ${deleteStorageError.message}`,
      );
    }

    await this.videoRepo.delete({ id: video.id });

    return {
      success: true,
      message: 'Video removido com sucesso.',
    };
  }

  async reorderVideos({ userId, videoIds }: ReorderVideosParams) {
    const uniqueVideoIds = new Set(videoIds);
    if (uniqueVideoIds.size !== videoIds.length) {
      throw new ConflictException(
        'A lista de video_ids nao pode conter elementos duplicados.',
      );
    }

    const ownedVideos = await this.videoRepo.find({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
      },
    });

    const ownedVideoIds = new Set(ownedVideos.map((video) => video.id));
    const hasUnauthorizedVideo = videoIds.some(
      (videoId) => !ownedVideoIds.has(videoId),
    );
    if (hasUnauthorizedVideo) {
      throw new NotFoundException(
        'Um ou mais videos nao foram encontrados para este usuario.',
      );
    }

    await this.videoRepo.manager.transaction(async (transactionManager) => {
      for (const [index, videoId] of videoIds.entries()) {
        await transactionManager.update(
          Video,
          { id: videoId, user_id: userId },
          { order_position: index },
        );
      }
    });

    const reorderedVideos = await this.videoRepo.find({
      where: { user_id: userId },
      order: { order_position: 'ASC' },
    });

    return Promise.all(
      reorderedVideos.map((video) => this.mapSignedVideoResponse({ video })),
    );
  }

  private async assertUserCanUploadMoreVideos({ userId }: { userId: string }) {
    const totalVideos = await this.videoRepo.countBy({ user_id: userId });
    if (totalVideos >= VIDEO_CONSTRAINTS.MAX_VIDEOS_PER_USER) {
      throw new ConflictException(
        `Voce ja atingiu o limite de ${VIDEO_CONSTRAINTS.MAX_VIDEOS_PER_USER} videos.`,
      );
    }
  }

  private assertDurationValid({ duration }: { duration: number }) {
    const { MIN_DURATION_SECONDS, MAX_DURATION_SECONDS } = VIDEO_CONSTRAINTS;

    if (duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS) {
      throw new BadRequestException(
        `Video deve ter entre ${MIN_DURATION_SECONDS}s e ${MAX_DURATION_SECONDS}s.`,
      );
    }
  }

  private assertMimeTypeAllowed({ mimeType }: { mimeType: string }) {
    if (!VIDEO_MIME_TYPES.includes(mimeType as VideoMimeType)) {
      throw new BadRequestException('Formato de video invalido.');
    }
  }

  private async getVideoDurationSeconds({
    file,
  }: {
    file: UploadedVideoFile;
  }): Promise<number> {
    const extension = this.getExtensionFromMimeType({
      mimeType: file.mimetype,
    });
    const tempFilePath = join(tmpdir(), `${randomUUID()}${extension}`);

    await writeFile(tempFilePath, file.buffer);

    try {
      const duration = await new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(tempFilePath, (error, metadata) => {
          if (error) {
            reject(toError({ reason: error }));
            return;
          }

          const rawDuration = metadata.format.duration;
          if (typeof rawDuration !== 'number' || Number.isNaN(rawDuration)) {
            reject(new Error('Duracao de video invalida.'));
            return;
          }

          resolve(Math.round(rawDuration));
        });
      });

      return duration;
    } catch {
      throw new BadRequestException(
        'Nao foi possivel validar a duracao do video.',
      );
    } finally {
      await unlink(tempFilePath).catch(() => undefined);
    }
  }

  private buildStorageKey({
    userId,
    mimeType,
    originalName,
  }: {
    userId: string;
    mimeType: string;
    originalName: string;
  }) {
    const extensionFromMime = this.getExtensionFromMimeType({ mimeType });
    const originalExtension = extname(originalName).toLowerCase();
    const extension = extensionFromMime || originalExtension || '.mp4';

    return `users/${userId}/videos/${randomUUID()}${extension}`;
  }

  private getExtensionFromMimeType({ mimeType }: { mimeType: string }) {
    return VIDEO_EXTENSION_BY_MIME_TYPE[mimeType] ?? '';
  }

  private async getSignedVideoUrl({
    storageKey,
  }: {
    storageKey: string;
  }): Promise<string> {
    const { data, error } = await this.supabaseAdmin.storage
      .from(VIDEO_BUCKET_NAME)
      .createSignedUrl(storageKey, VIDEO_CONSTRAINTS.SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      throw new BadGatewayException(
        `Erro ao gerar signed URL para o video: ${error?.message ?? 'erro desconhecido'}`,
      );
    }

    return data.signedUrl;
  }

  private async mapSignedVideoResponse({
    video,
  }: {
    video: Video;
  }): Promise<SignedVideoResponse> {
    const videoUrl = await this.getSignedVideoUrl({
      storageKey: video.storage_key,
    });

    return {
      id: video.id,
      user_id: video.user_id,
      storage_key: video.storage_key,
      video_url: videoUrl,
      thumbnail_url: video.thumbnail_url ?? null,
      title: video.title ?? null,
      description: video.description ?? null,
      duration: video.duration,
      file_size: Number(video.file_size),
      mime_type: video.mime_type,
      view_count: video.view_count,
      order_position: video.order_position,
      is_public: video.is_public,
      created_at: video.created_at,
      updated_at: video.updated_at,
    };
  }

  private async findOwnedVideo({
    userId,
    videoId,
  }: {
    userId: string;
    videoId: string;
  }): Promise<Video> {
    const video = await this.videoRepo.findOneBy({
      id: videoId,
      user_id: userId,
    });

    if (!video) {
      throw new NotFoundException('Video nao encontrado.');
    }

    return video;
  }

  private async getNextOrderPosition({
    userId,
  }: {
    userId: string;
  }): Promise<number> {
    const result = await this.videoRepo
      .createQueryBuilder('video')
      .select('MAX(video.order_position)', 'maxOrderPosition')
      .where('video.user_id = :userId', { userId })
      .getRawOne<{ maxOrderPosition: string | null }>();

    if (!result?.maxOrderPosition) {
      return 0;
    }

    return Number(result.maxOrderPosition) + 1;
  }
}
