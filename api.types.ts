export type UUID = string;
export type ISODateString = string;

export type ProficiencyLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export type GenreCategory = 'main' | 'sub' | 'fusion' | 'niche';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface ValidationError extends ApiError {
  statusCode: 400;
  message: string[];
  error: 'Bad Request';
}

export interface SuccessMessage {
  success: true;
  message: string;
}

export interface User {
  id: UUID;
  name: string;
  email: string;
  auth_id: string;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at?: ISODateString | null;
}

export interface Profile {
  user_id: UUID;
  bio?: string | null;
  profile_picture_url?: string | null;
  accept_messages_from_non_matches: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  created_at: ISODateString;
}

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  created_at: ISODateString;
}

export interface Skill {
  id: string;
  category_id?: string | null;
  category?: SkillCategory | null;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  created_at: ISODateString;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  category?: GenreCategory | null;
  search_tags?: string[] | null;
  icon_url?: string | null;
  color?: string | null;
  created_at: ISODateString;
}

export interface UserProfileCategory {
  user_id: UUID;
  category_id: string;
  is_primary: boolean;
  years_experience: number;
  proficiency_level: ProficiencyLevel;
  created_at: ISODateString;
  updated_at: ISODateString;
  category: Category;
}

export interface UserSkill {
  user_id: UUID;
  skill_id: string;
  proficiency_level: ProficiencyLevel;
  years_experience?: number | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  skill: Skill;
}

export interface UserGenre {
  user_id: UUID;
  genre_id: string;
  is_primary: boolean;
  created_at: ISODateString;
  genre: Genre;
}

export interface ProfileView {
  user_id: UUID;
  name: string;
  bio: string | null;
  profile_picture_url: string | null;
  accept_messages_from_non_matches: boolean;
  categories: UserProfileCategory[];
  skills: UserSkill[];
  genres: UserGenre[];
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileBioPayload {
  bio: string;
}

export interface UpdateProfilePhotoPayload {
  profile_picture_url: string;
}

export interface AddUserCategoryPayload {
  category_id: number;
  years_experience: number;
  proficiency_level: ProficiencyLevel;
  is_primary: boolean;
}

export interface UpdateUserCategoryPayload {
  years_experience?: number;
  proficiency_level?: ProficiencyLevel;
  is_primary?: boolean;
}

export interface AddUserSkillPayload {
  skill_id: number;
  proficiency_level: ProficiencyLevel;
  years_experience?: number;
}

export interface UpdateUserSkillPayload {
  proficiency_level?: ProficiencyLevel;
  years_experience?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// A API atual nao possui endpoints paginados.
export type NoPaginationInCurrentApi = never;

export interface ApiResponses {
  'POST /users': User;
  'GET /profiles/me': ProfileView;
  'GET /profiles/:userId': ProfileView;
  'PATCH /profiles/me/bio': ProfileView;
  'PATCH /profiles/me/photo': ProfileView;
  'DELETE /profiles/me': SuccessMessage;
  'GET /categories': Category[];
  'GET /profiles/:userId/categories': UserProfileCategory[];
  'POST /profiles/me/categories': UserProfileCategory[];
  'PATCH /profiles/me/categories/:categoryId': UserProfileCategory[];
  'DELETE /profiles/me/categories/:categoryId': SuccessMessage;
  'GET /skills': Skill[];
  'GET /skills/categories': SkillCategory[];
  'GET /profiles/:userId/skills': UserSkill[];
  'POST /profiles/me/skills': UserSkill[];
  'PATCH /profiles/me/skills/:skillId': UserSkill[];
  'DELETE /profiles/me/skills/:skillId': SuccessMessage;
}

export interface ApiPayloads {
  'POST /users': CreateUserPayload;
  'PATCH /profiles/me/bio': UpdateProfileBioPayload;
  'PATCH /profiles/me/photo': UpdateProfilePhotoPayload;
  'POST /profiles/me/categories': AddUserCategoryPayload;
  'PATCH /profiles/me/categories/:categoryId': UpdateUserCategoryPayload;
  'POST /profiles/me/skills': AddUserSkillPayload;
  'PATCH /profiles/me/skills/:skillId': UpdateUserSkillPayload;
}

export interface ApiPathParams {
  'GET /profiles/:userId': { userId: UUID };
  'GET /profiles/:userId/categories': { userId: UUID };
  'GET /profiles/:userId/skills': { userId: UUID };
  'PATCH /profiles/me/categories/:categoryId': { categoryId: number };
  'DELETE /profiles/me/categories/:categoryId': { categoryId: number };
  'PATCH /profiles/me/skills/:skillId': { skillId: number };
  'DELETE /profiles/me/skills/:skillId': { skillId: number };
}

export interface ApiQueryParams {
  'GET /skills': { category_id?: number };
}
