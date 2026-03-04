import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GenresService } from './genres.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { CurrentUser } from '../auth/decorators/current-user';
import { User } from '../user/entities/user.entity';
import { AddUserGenreDto } from './dto/add-user-genre.dto';

@Controller()
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get('genres')
  findAll() {
    return this.genresService.findAll();
  }

  @Get('profiles/:userId/genres')
  findUserGenres(@Param('userId') userId: string) {
    return this.genresService.findUserGenres(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profiles/me/genres')
  addUserGenre(@CurrentUser() user: User, @Body() dto: AddUserGenreDto) {
    return this.genresService.addUserGenre(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profiles/me/genres/:genreId')
  removeUserGenre(
    @CurrentUser() user: User,
    @Param('genreId', ParseUUIDPipe) genreId: string,
  ) {
    return this.genresService.removeUserGenre(user.id, genreId);
  }
}
