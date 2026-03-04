import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../user/entities/user.entity';
import { UserProfileCategory } from '../categories/entities/user-profile-category.entity';
import { UserSkill } from '../skills/entities/user-skill.entity';
import { UserGenre } from '../genres/entities/user-genre.entity';

describe('ProfilesService', () => {
  let service: ProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: getRepositoryToken(Profile), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(UserProfileCategory), useValue: {} },
        { provide: getRepositoryToken(UserSkill), useValue: {} },
        { provide: getRepositoryToken(UserGenre), useValue: {} },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
