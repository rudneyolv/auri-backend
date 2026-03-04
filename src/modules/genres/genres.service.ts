import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { UserGenre } from './entities/user-genre.entity';
import { AddUserGenreDto } from './dto/add-user-genre.dto';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    @InjectRepository(UserGenre)
    private readonly userGenreRepo: Repository<UserGenre>,
  ) {}

  findAll() {
    return this.genreRepo.find({
      order: { name: 'ASC' },
    });
  }

  findUserGenres(userId: string) {
    return this.userGenreRepo.find({
      where: { user_id: userId },
      relations: { genre: true },
      order: { is_primary: 'DESC', created_at: 'ASC' },
    });
  }

  async addUserGenre(userId: string, dto: AddUserGenreDto) {
    const genreId = String(dto.genre_id);

    const genre = await this.genreRepo.findOneBy({ id: genreId });
    if (!genre) {
      throw new NotFoundException('Gênero não encontrado.');
    }

    const existingLink = await this.userGenreRepo.findOneBy({
      user_id: userId,
      genre_id: genreId,
    });

    if (existingLink) {
      throw new ConflictException('Gênero já adicionado ao perfil.');
    }

    if (dto.is_primary) {
      await this.clearPrimaryGenre(userId);
    }

    await this.userGenreRepo.save(
      this.userGenreRepo.create({
        user_id: userId,
        genre_id: genreId,
        is_primary: dto.is_primary,
      }),
    );

    return this.findUserGenres(userId);
  }

  async removeUserGenre(userId: string, genreId: string) {
    const deleteResult = await this.userGenreRepo.delete({
      user_id: userId,
      genre_id: genreId,
    });

    if (!deleteResult.affected) {
      throw new NotFoundException('Gênero do usuário não encontrado.');
    }

    return {
      success: true,
      message: 'Gênero removido com sucesso.',
    };
  }

  private clearPrimaryGenre(userId: string) {
    return this.userGenreRepo.update(
      { user_id: userId, is_primary: true },
      { is_primary: false },
    );
  }
}
