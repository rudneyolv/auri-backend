export const VIDEO_BUCKET_NAME = 'videos';

export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/mov',
  'video/quicktime',
] as const;

export const VIDEO_CONSTRAINTS = {
  MAX_FILE_SIZE: 524_288_000,
  MIN_DURATION_SECONDS: 15,
  MAX_DURATION_SECONDS: 180,
  MAX_VIDEOS_PER_USER: 10,
  SIGNED_URL_TTL_SECONDS: 3600,
} as const;
