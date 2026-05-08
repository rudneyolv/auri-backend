import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ProfileCategory } from '../categories/entities/profile-category.entity';
import { UserProfileCategory } from '../categories/entities/user-profile-category.entity';
import { EventsService } from '../event/event.service';
import { ConversationsService } from '../message/services/conversations.service';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../user/entities/user.entity';
import {
  COLLAB_PAIR_UNIQUE_CONSTRAINT,
  DECLINED_COOLDOWN_IN_MS,
  POSTGRES_UNIQUE_VIOLATION_ERROR_CODE,
} from './collab.constants';
import { RespondCollabRequestDto } from './dto/respond-collab-request.dto';
import { SendCollabRequestDto } from './dto/send-collab-request.dto';
import {
  CollabRequest,
  type CollabRequestStatus,
} from './entities/collab-request.entity';
import { normalizePair } from 'src/shared/utils/normalize-pair';

interface CollabListRow {
  request_id: string;
  status?: CollabRequestStatus;
  created_at: Date;
  accepted_at?: Date | null;
  updated_at?: Date;
  from_user_id?: string;
  from_user_name?: string;
  to_user_id?: string;
  to_user_name?: string;
  profile_picture_url: string | null;
  primary_category_name: string | null;
  proficiency_level: string | null;
  years_experience: string | null;
}

@Injectable()
export class CollabService {
  constructor(
    @InjectRepository(CollabRequest)
    private readonly collabRequestRepo: Repository<CollabRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,

    private readonly conversationsService: ConversationsService,
    private readonly eventsService: EventsService,
  ) {}

  async sendRequest(currentUserId: string, dto: SendCollabRequestDto) {
    if (dto.to_user_id === currentUserId) {
      throw new BadRequestException(
        'Voce nao pode enviar uma solicitacao de collab para si mesmo.',
      );
    }

    const targetUser = await this.userRepo.findOneBy({
      id: dto.to_user_id,
      is_active: true,
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    const now = new Date();
    const declinedCooldownCutoff = new Date(
      now.getTime() - DECLINED_COOLDOWN_IN_MS,
    );

    const pair = normalizePair({
      userIdA: currentUserId,
      userIdB: dto.to_user_id,
    });

    const existingRequest = await this.collabRequestRepo.findOneBy({
      user_a_id: pair.user_a_id,
      user_b_id: pair.user_b_id,
    });

    if (existingRequest) {
      this.assertRequestCanBeRecreated({
        request: existingRequest,
        declinedCooldownCutoff,
      });

      await this.collabRequestRepo.delete({ id: existingRequest.id });
    }

    try {
      const collabRequest = await this.collabRequestRepo.save(
        this.collabRequestRepo.create({
          from_user_id: currentUserId,
          to_user_id: dto.to_user_id,
          status: 'pending',
          declined_at: null,
          user_a_id: pair.user_a_id,
          user_b_id: pair.user_b_id,
        }),
      );

      return {
        request_id: collabRequest.id,
        status: collabRequest.status,
        created_at: collabRequest.created_at,
      };
    } catch (error) {
      // Prevent concorrent requests
      if (this.isUniquePairViolation(error)) {
        throw new ConflictException(
          'Ja existe uma solicitacao de collab entre esses usuarios.',
        );
      }

      throw error;
    }
  }

  async findReceivedRequests(currentUserId: string) {
    const rows = await this.collabRequestRepo
      .createQueryBuilder('cr')
      .innerJoin(User, 'u', 'u.id = cr.from_user_id')
      .leftJoin(Profile, 'p', 'p.user_id = u.id')
      .leftJoin(
        UserProfileCategory,
        'upc',
        'upc.user_id = u.id AND upc.is_primary = true',
      )
      .leftJoin(ProfileCategory, 'pc', 'pc.id = upc.category_id')
      .select([
        'cr.id AS request_id',
        'cr.created_at AS created_at',
        'u.id AS from_user_id',
        'u.name AS from_user_name',
        'p.profile_picture_url AS profile_picture_url',
        'pc.name AS primary_category_name',
        'upc.proficiency_level AS proficiency_level',
        'upc.years_experience AS years_experience',
      ])
      .where('cr.to_user_id = :currentUserId', { currentUserId })
      .andWhere('cr.status = :status', { status: 'pending' })
      .andWhere('u.is_active = true')
      .orderBy('cr.created_at', 'DESC')
      .getRawMany<CollabListRow>();

    return rows.map((row) => ({
      request_id: row.request_id,
      created_at: row.created_at,
      from_user: {
        user_id: row.from_user_id,
        name: row.from_user_name,
        profile_picture_url: row.profile_picture_url ?? null,
        primary_category_name: row.primary_category_name ?? null,
        proficiency_level: row.proficiency_level ?? null,
        years_experience:
          row.years_experience !== null ? Number(row.years_experience) : null,
      },
    }));
  }

  async findSentRequests(currentUserId: string) {
    const rows = await this.collabRequestRepo
      .createQueryBuilder('cr')
      .innerJoin(User, 'u', 'u.id = cr.to_user_id')
      .leftJoin(Profile, 'p', 'p.user_id = u.id')
      .leftJoin(
        UserProfileCategory,
        'upc',
        'upc.user_id = u.id AND upc.is_primary = true',
      )
      .leftJoin(ProfileCategory, 'pc', 'pc.id = upc.category_id')
      .select([
        'cr.id AS request_id',
        'cr.status AS status',
        'cr.created_at AS created_at',
        'cr.updated_at AS updated_at',
        "CASE WHEN cr.status = 'accepted' THEN cr.updated_at ELSE NULL END AS accepted_at",
        'u.id AS to_user_id',
        'u.name AS to_user_name',
        'p.profile_picture_url AS profile_picture_url',
        'pc.name AS primary_category_name',
        'upc.proficiency_level AS proficiency_level',
        'upc.years_experience AS years_experience',
      ])
      .where('cr.from_user_id = :currentUserId', { currentUserId })
      .andWhere('cr.status IN (:...statuses)', {
        statuses: ['pending', 'accepted'],
      })
      .andWhere('u.is_active = true')
      .orderBy('cr.created_at', 'DESC')
      .getRawMany<CollabListRow>();

    return rows.map((row) => ({
      request_id: row.request_id,
      status: row.status,
      created_at: row.created_at,
      accepted_at: row.accepted_at ?? null,
      to_user: {
        user_id: row.to_user_id,
        name: row.to_user_name,
        profile_picture_url: row.profile_picture_url ?? null,
        primary_category_name: row.primary_category_name ?? null,
        proficiency_level: row.proficiency_level ?? null,
        years_experience:
          row.years_experience !== null ? Number(row.years_experience) : null,
      },
    }));
  }

  async respondToRequest(
    currentUserId: string,
    requestId: string,
    dto: RespondCollabRequestDto,
  ) {
    const collabRequest = await this.collabRequestRepo.findOneBy({
      id: requestId,
      to_user_id: currentUserId,
      status: 'pending',
    });

    if (!collabRequest) {
      throw new NotFoundException('Solicitacao de collab nao encontrada.');
    }

    if (dto.action === 'accept') {
      collabRequest.status = 'accepted';
      collabRequest.declined_at = null;

      const updatedRequest = await this.collabRequestRepo.save(collabRequest);

      const conversation = await this.conversationsService.createForCollab({
        collabRequestId: updatedRequest.id,
        userAId: updatedRequest.user_a_id,
        userBId: updatedRequest.user_b_id,
      });

      const [acceptingUser, acceptingProfile] = await Promise.all([
        this.userRepo.findOneBy({ id: currentUserId }),
        this.profileRepo.findOneBy({ user_id: currentUserId }),
      ]);

      this.eventsService.emitCollabAccepted({
        userId: updatedRequest.from_user_id,
        payload: {
          conversation_id: conversation.id,
          from_user: {
            user_id: currentUserId,
            name: acceptingUser?.name ?? '',
            profile_picture_url: acceptingProfile?.profile_picture_url ?? null,
          },
        },
      });

      return {
        request_id: updatedRequest.id,
        status: updatedRequest.status,
        updated_at: updatedRequest.updated_at,
        conversation_id: conversation.id,
      };
    }

    collabRequest.status = 'declined';
    collabRequest.declined_at = new Date();

    const updatedRequest = await this.collabRequestRepo.save(collabRequest);

    return {
      request_id: updatedRequest.id,
      status: updatedRequest.status,
      declined_at: updatedRequest.declined_at,
      updated_at: updatedRequest.updated_at,
    };
  }

  async cancelRequest(currentUserId: string, requestId: string) {
    const collabRequest = await this.collabRequestRepo.findOneBy({
      id: requestId,
      from_user_id: currentUserId,
      status: 'pending',
    });

    if (!collabRequest) {
      throw new NotFoundException('Solicitacao de collab nao encontrada.');
    }

    await this.collabRequestRepo.delete({ id: collabRequest.id });
  }

  private assertRequestCanBeRecreated({
    request,
    declinedCooldownCutoff,
  }: {
    request: CollabRequest;
    declinedCooldownCutoff: Date;
  }) {
    if (request.status === 'pending') {
      throw new ConflictException(
        'Voce ja tem uma solicitacao de collab pendente com este usuario.',
      );
    }

    if (request.status === 'accepted') {
      throw new ConflictException(
        'Voce ja tem uma solicitacao de collab aceita com este usuario.',
      );
    }

    if (request.declined_at && request.declined_at > declinedCooldownCutoff) {
      throw new ConflictException(
        'Voce ja tem uma solicitacao de collab recusada recentemente com este usuario.',
      );
    }
  }

  private isUniquePairViolation(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as
      | { code?: string; constraint?: string }
      | undefined;

    return (
      driverError?.code === POSTGRES_UNIQUE_VIOLATION_ERROR_CODE &&
      driverError.constraint === COLLAB_PAIR_UNIQUE_CONSTRAINT
    );
  }
}
