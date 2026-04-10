import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../user/entities/user.entity';
import { UserProfileCategory } from '../categories/entities/user-profile-category.entity';
import { UserSkill } from '../skills/entities/user-skill.entity';
import { UserGenre } from '../genres/entities/user-genre.entity';
import { BadRequestException } from '@nestjs/common';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let profileRepo: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let userRepo: {
    findOneBy: jest.Mock;
  };

  beforeEach(async () => {
    profileRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    userRepo = {
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: getRepositoryToken(Profile), useValue: profileRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
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

  describe('updateCollabPrefs', () => {
    it('updates the provided fields when final range is valid', async () => {
      const profile = {
        user_id: 'user-1',
        collab_price_min: 100,
        collab_price_max: 200,
      };
      const savedProfile = {
        ...profile,
        collab_price_max: 250,
      };

      userRepo.findOneBy.mockResolvedValue({ id: 'user-1', is_active: true });
      profileRepo.findOneBy.mockResolvedValue(profile);
      profileRepo.save.mockResolvedValue(savedProfile);

      await expect(
        service.updateCollabPrefs('user-1', { collab_price_max: 250 }),
      ).resolves.toEqual({
        collab_price_min: 100,
        collab_price_max: 250,
      });
    });

    it('rejects when collab_price_min is sent without a final max price', async () => {
      userRepo.findOneBy.mockResolvedValue({ id: 'user-1', is_active: true });
      profileRepo.findOneBy.mockResolvedValue({
        user_id: 'user-1',
        collab_price_min: null,
        collab_price_max: null,
      });

      await expect(
        service.updateCollabPrefs('user-1', { collab_price_min: 10 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the final max price is lower than min price', async () => {
      userRepo.findOneBy.mockResolvedValue({ id: 'user-1', is_active: true });
      profileRepo.findOneBy.mockResolvedValue({
        user_id: 'user-1',
        collab_price_min: 100,
        collab_price_max: 200,
      });

      await expect(
        service.updateCollabPrefs('user-1', { collab_price_max: 50 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
